// locationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import jalaali from 'jalaali-js';
import { APP_CONFIG, getServerUrl } from '../config';

const VISITOR_INFO_KEY = 'visitor_info';
const LOCATION_PERMISSION_KEY = 'location_permission_granted';
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

let locationIntervalId = null;
let statusIntervalId = null;
let lastSent = 0;
let isRunning = false;
let retryCount = 0;

// ──────────────────────────────────────────────
// 🔵 تعریف Background Task (باید بیرون از کامپوننت باشد)
// ──────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log('❌ Background task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (!location) return;

    try {
      const visitorInfoRaw = await AsyncStorage.getItem(VISITOR_INFO_KEY);
      if (!visitorInfoRaw) {
        console.log('⚠️ Background: اطلاعات ویزیتور یافت نشد');
        return;
      }

      const visitorInfo = JSON.parse(visitorInfoRaw);
      const { latitude: Lat, longitude: Lng } = location.coords;

      console.log(`📍 Background: ارسال موقعیت ${Lat}, ${Lng}`);

      await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
      console.log('✅ Background: ارسال موفق');
    } catch (err) {
      console.log('❌ Background: خطا در ارسال:', err.message);
    }
  }
});

// ──────────────────────────────────────────────
// 🔐 درخواست همه مجوزهای لازم
// ──────────────────────────────────────────────
export const requestAllPermissions = async () => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;

  try {
    // مرحله ۱: مجوز Foreground
    console.log('📍 درخواست مجوز foreground...');
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();

    if (fgStatus !== 'granted') {
      console.log('❌ مجوز foreground رد شد');
      return { foreground: false, background: false };
    }

    console.log('✅ مجوز foreground تأیید شد');

    // مرحله ۲: مجوز Background
    console.log('📍 درخواست مجوز background...');
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    const bgGranted = bgStatus === 'granted';

    console.log(`📍 مجوز background: ${bgStatus}`);

    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, JSON.stringify({
      foreground: true,
      background: bgGranted
    }));

    return { foreground: true, background: bgGranted };
  } catch (err) {
    console.log('❌ خطا در درخواست مجوز:', err.message);
    return { foreground: false, background: false };
  }
};

// ──────────────────────────────────────────────
// 🔍 بررسی وضعیت فعلی مجوزها
// ──────────────────────────────────────────────
export const checkPermissionsStatus = async () => {
  try {
    const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();

    return {
      foreground: fgStatus === 'granted',
      background: bgStatus === 'granted'
    };
  } catch (error) {
    console.log('❌ خطا در بررسی مجوز:', error.message);
    return { foreground: false, background: false };
  }
};

// backward-compat برای کدهای قدیمی
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
// 🚀 شروع Background Location Task
// ──────────────────────────────────────────────
export const startBackgroundLocationTask = async (visitorInfo) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;

  try {
    // ذخیره اطلاعات ویزیتور برای استفاده در background task
    await AsyncStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(visitorInfo));

    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .catch(() => false);

    if (isTaskRunning) {
      console.log('📍 Background task از قبل در حال اجراست');
      return true;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000,        // هر ۶۰ ثانیه
      distanceInterval: 50,        // یا هر ۵۰ متر
      deferredUpdatesInterval: 60000,
      deferredUpdatesDistance: 50,
      showsBackgroundLocationIndicator: true,  // iOS: نشانگر آبی بالا
      foregroundService: {          // Android: notification پس‌زمینه
        notificationTitle: 'ردیابی موقعیت',
        notificationBody: 'موقعیت شما در حال ارسال است',
        notificationColor: '#0622a3',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });

    console.log('✅ Background location task شروع شد');
    return true;
  } catch (err) {
    console.log('❌ خطا در شروع background task:', err.message);
    return false;
  }
};

// ──────────────────────────────────────────────
// ⏹ توقف Background Task
// ──────────────────────────────────────────────
export const stopBackgroundLocationTask = async () => {
  try {
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
      .catch(() => false);

    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('✅ Background task متوقف شد');
    }
  } catch (err) {
    console.log('❌ خطا در توقف background task:', err.message);
  }
};

// ──────────────────────────────────────────────
// 🔄 ارسال خودکار (Foreground)
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

  const config = {
    intervalMs: 60 * 1000,
    minInterval: 10000,
    maxRetries: 3,
    ...options
  };

  if (!visitorInfo?.VisitorCode) {
    console.log('❌ اطلاعات ویزیتور نامعتبر');
    return null;
  }

  stopAutoSendLocation();

  // ذخیره اطلاعات ویزیتور
  await AsyncStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(visitorInfo));

  const { foreground } = await checkPermissionsStatus();
  if (!foreground) throw new Error('PERMISSION_DENIED');

  // شروع background task
  const { background } = await checkPermissionsStatus();
  if (background) {
    await startBackgroundLocationTask(visitorInfo);
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

  isRunning = true;
  retryCount = 0;

  locationIntervalId = setInterval(async () => {
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

  return locationIntervalId;
};

export const stopAutoSendLocation = () => {
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

export const sendQuickLocation = async (visitorInfo) => {
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

    // ── آدرس سرور رو مثل بقیه جاها بساز ──
    const connectionType = await AsyncStorage.getItem('connection_type');
    let serverUrl = '';

    if (connectionType === 'url') {
      serverUrl = await AsyncStorage.getItem('server_url') || '';
    } else {
      const ip   = await AsyncStorage.getItem('server_ip')   || '';
      const port = await AsyncStorage.getItem('server_port') || '';
      serverUrl = ip && port ? `http://${ip}:${port}` : '';
    }

    if (!serverUrl) return true; // سرور تنظیم نشده → فعال بمون

    const response = await fetch(`${serverUrl}/api/location-tracking/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return true;

    const data = await response.json();
    return data?.data?.locationTrackingEnabled !== false;

  } catch {
    return true; // fail-safe
  }
};