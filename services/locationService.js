// locationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import jalaali from 'jalaali-js';
import { APP_CONFIG, getServerUrl } from '../config';

const VISITOR_INFO_KEY = 'visitor_info';
const LOCATION_PERMISSION_KEY = 'location_permission_granted';
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
let isStarting = false; // ← lock جدید
let locationIntervalId = null;
let statusIntervalId = null;
let lastSent = 0;
let isRunning = false;
let retryCount = 0;

// ─── شماره نسخه جلسه ارسال — برای حذف race condition بین فراخوانی‌های هم‌زمان ───
let currentSessionId = 0;

// ──────────────────────────────────────────────
// ⛔️ Background Task — غیرفعال شد
// این تسک دیگه هیچ‌جا start نمیشه و هیچ ارسالی انجام نمیده.
// تعریفش فقط برای این نگه داشته شده که اگه روی دستگاهی از نسخه‌های
// قبلی برنامه از قبل توی سیستم‌عامل ثبت شده باشه، بتونیم با
// stopBackgroundLocationTask() پیداش کنیم و متوقفش کنیم.
// ──────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
  return; // عمداً خالی — دیگه چیزی ارسال نمی‌کند
});

// ──────────────────────────────────────────────
// 🔐 درخواست مجوز
// ──────────────────────────────────────────────
export const requestAllPermissions = async () => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;

  try {
    console.log('📍 درخواست مجوز foreground...');
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();

    if (fgStatus !== 'granted') {
      console.log('❌ مجوز foreground رد شد');
      return { foreground: false, background: false };
    }

    console.log('✅ مجوز foreground تأیید شد');

    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
      foreground: true,
      background: false
    }));

    return { foreground: true, background: false };
  } catch (err) {
    console.log('❌ خطا در درخواست مجوز:', err.message);
    return { foreground: false, background: false };
  }
};

export const checkPermissionsStatus = async () => {
  try {
    const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    return { foreground: fgStatus === 'granted', background: false };
  } catch (error) {
    console.log('❌ خطا در بررسی مجوز:', error.message);
    return { foreground: false, background: false };
  }
};

export const requestLocationPermission = async () => {
  const result = await requestAllPermissions();
  return result?.foreground ?? false;
};

export const checkActualPermissionStatus = async () => {
  const result = await checkPermissionsStatus();
  return result?.foreground ?? false;
};

// ──────────────────────────────────────────────
// 📡 ارسال لوکیشن به سرور
// ──────────────────────────────────────────────
export const sendVisitorLocation = async ({ VisitorCode, VisitorName, Lat, Lng }) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;

  if (!VisitorCode || VisitorCode === 'unknown') {
    console.log('⛔ ارسال لوکیشن لغو شد — VisitorCode نامعتبر است');
    return false;
  }

  try {
    const baseUrl = await getServerUrl();
    const now = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(
      now.getFullYear(), now.getMonth() + 1, now.getDate()
    );
    const date = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const res = await fetch(`${baseUrl}/api/visitor/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ VisitorCode, VisitorName, Lat, Lng, date, time, timestamp: now.toISOString() }),
    });

    const responseText = await res.text();
    let data;
    try { data = JSON.parse(responseText); } catch (e) { data = null; }

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `خطای سرور: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.log('❌ خطا در ارسال لوکیشن:', err.message);
    throw err;
  }
};

// ──────────────────────────────────────────────
// ⏹ توقف/پاکسازی Background Task قدیمی
// ──────────────────────────────────────────────
export const stopBackgroundLocationTask = async () => {
  try {
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .catch(() => false);

    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('✅ Background task قدیمی پیدا و متوقف شد');
    }
  } catch (err) {
    console.log('❌ خطا در توقف background task:', err.message);
  }
};

// ──────────────────────────────────────────────
// 🔄 ارسال خودکار (فقط Foreground — هر دقیقه)
// ──────────────────────────────────────────────
export const getCurrentPosition = async (options = {}) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return null;
  try {
    const { foreground } = await checkPermissionsStatus();
    if (!foreground) throw new Error('PERMISSION_DENIED');

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 15000,
      maximumAge: 0,
      ...options
    });
  } catch (error) {
    console.log('❌ خطا در دریافت موقعیت:', error.message);
    throw error;
  }
};

export const startAutoSendLocation = async (visitorInfo, options = {}) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;

  // ← اگه در حال شروع هستیم، درخواست جدید رو نادیده بگیر
  if (isStarting) {
    console.log('⏭ startAutoSendLocation در حال اجراست — نادیده گرفته شد');
    return null;
  }
  isStarting = true;

  const config = {
    intervalMs: 60 * 1000,
    minInterval: 55 * 1000,  // ← باید نزدیک به intervalMs باشه، نه 10 ثانیه
    maxRetries: 3,
    ...options
  };
  if (!visitorInfo?.VisitorCode || visitorInfo.VisitorCode === 'unknown') {
    console.log('❌ اطلاعات ویزیتور نامعتبر — ارسال شروع نشد');
    return null;
  }

  // ─── نسخه جدید این جلسه ارسال ───
  // هر فراخوانی، حتی اگه با فراخوانی قبلی race بشه، این عدد رو افزایش
  // می‌دهد. هر تایمر قدیمی توی تیک بعدی خودش چک می‌کند که آیا هنوز
  // session فعال هست یا نه و اگه نبود خودش را پاک می‌کند.
  const mySession = ++currentSessionId;

  // پاکسازی فوری (synchronous) تایمر فعلی - قبل از هر await
  if (locationIntervalId) {
    clearInterval(locationIntervalId);
    locationIntervalId = null;
  }
  isRunning = false;

  await stopBackgroundLocationTask().catch(() => {});

  await AsyncStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(visitorInfo));

  const { foreground } = await checkPermissionsStatus();
  if (!foreground) throw new Error('PERMISSION_DENIED');

  // اگه در همین فاصله یه فراخوانی جدیدتر شروع شده، این یکی رو لغو کن
  if (mySession !== currentSessionId) {
    console.log('⏭ session جدیدتری شروع شده — این فراخوانی نادیده گرفته شد');
    return null;
  }

  // ارسال اولیه
  try {
    const pos = await getCurrentPosition();
    const { latitude: Lat, longitude: Lng } = pos.coords;
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    console.log('✅ ارسال اولیه موفق');
  } catch (error) {
    console.log('❌ خطا در ارسال اولیه:', error.message);
    if (error.message === 'PERMISSION_DENIED') throw error;
  }

  if (mySession !== currentSessionId) return null;

  isRunning = true;
  retryCount = 0;

  const myIntervalId = setInterval(async () => {
    // ─── اگه session عوض شده (یه startAutoSendLocation جدید اومده) خودشو پاک کن ───
    if (mySession !== currentSessionId) {
      clearInterval(myIntervalId);
      return;
    }
    if (!isRunning) return;

    const now = Date.now();
    if (now - lastSent < config.minInterval) return;

    try {
      const { foreground } = await checkPermissionsStatus();
      if (!foreground) { stopAutoSendLocation(); return; }

      const pos = await getCurrentPosition();
      const { latitude: Lat, longitude: Lng } = pos.coords;
      await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
      lastSent = Date.now();
      retryCount = 0;
    } catch (error) {
      console.log('❌ خطا در ارسال interval:', error.message);
      retryCount++;
      if (retryCount >= config.maxRetries) stopAutoSendLocation();
    }
  }, config.intervalMs);

  locationIntervalId = myIntervalId;
   isStarting = false;
  return myIntervalId;
};

export const stopAutoSendLocation = () => {
  // ─── باطل کردن هر session فعال - تایمرهای قدیمی خودشون پاک میشن ───
  currentSessionId++;
  isRunning = false;
  if (locationIntervalId) { clearInterval(locationIntervalId); locationIntervalId = null; }
  if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
  stopBackgroundLocationTask();
};

export const sendSingleLocation = async (visitorInfo) => {
  const pos = await getCurrentPosition();
  const { latitude: Lat, longitude: Lng } = pos.coords;
  await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
  lastSent = Date.now();
  return true;
};

// جدید — با throttle 60 ثانیه
export const sendQuickLocation = async (visitorInfo) => {
  const now = Date.now();
  if (now - lastSent < 60 * 1000) {
    console.log(`⏭ sendQuickLocation رد شد — ${Math.round((60000 - (now - lastSent)) / 1000)}s مانده`);
    return false;
  }
  try {
    const { foreground } = await checkPermissionsStatus();
    if (!foreground) return false;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest, timeout: 8000, maximumAge: 0
    });
    const { latitude: Lat, longitude: Lng } = pos.coords;
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    return true;
  } catch (error) {
    console.log('❌ خطا در ارسال سریع:', error.message);
    return false;
  }
};

export const isAutoSendRunning = () => isRunning && locationIntervalId !== null;
export const getLastSentTime = () => lastSent;
export const getLocationInfo = () => ({ isRunning, lastSent, intervalId: locationIntervalId, retryCount });
export const resetLocationPermission = async () => {
  await AsyncStorage.removeItem(LOCATION_PERMISSION_KEY);
};

let cachedPosition = null;
let cacheTime = 0;
const CACHE_DURATION = 30000;
export const getCachedPosition = async () => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return null;
  const now = Date.now();
  if (cachedPosition && (now - cacheTime) < CACHE_DURATION) return cachedPosition;
  const position = await getCurrentPosition();
  cachedPosition = position;
  cacheTime = now;
  return position;
};
export const checkTrackingEnabled = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) return true;

    const connectionType = await AsyncStorage.getItem('connection_type');
    let serverUrl = '';

    if (connectionType === 'url') {
      serverUrl = await AsyncStorage.getItem('server_url') || '';
    } else {
      const ip   = await AsyncStorage.getItem('server_ip')   || '';
      const port = await AsyncStorage.getItem('server_port') || '';
      serverUrl = ip && port ? `http://${ip}:${port}` : '';
    }

    if (!serverUrl) return true;

    const response = await fetch(`${serverUrl}/api/location-tracking/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return true;

    const data = await response.json();
    return data?.data?.locationTrackingEnabled !== false;

  } catch {
    return true;
  }
};