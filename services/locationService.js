// locationService.secure.js - نسخه ضد تقلب کامل
// این فایل جایگزین locationService.js قبلی شما شود
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import jalaali from 'jalaali-js';
import { APP_CONFIG, getServerUrl } from '../config';


// اگر از ماژول نیتیو یا کتابخانه آماده استفاده می‌کنید
// import { isMockingLocation } from 'react-native-turbo-mock-location-detector';

const VISITOR_INFO_KEY = 'visitor_info';
const LOCATION_PERMISSION_KEY = 'location_permission_granted';
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

let isStarting = false;
let locationIntervalId = null;
let statusIntervalId = null;
let lastSent = 0;
let isRunning = false;
let retryCount = 0;
let currentSessionId = 0;

// --- Constants for Anti-Mock ---
export const MOCK_LOCATION_ERROR = 'MOCK_LOCATION_DETECTED';
export const DEVELOPER_OPTIONS_ERROR = 'DEVELOPER_OPTIONS_ENABLED';
export const MOCK_APP_INSTALLED_ERROR = 'MOCK_APP_INSTALLED';

const KNOWN_FAKE_GPS_PACKAGES = [
  'com.lexa.fakegps',
  'com.incorporateapps.fakegps',
  'com.blogspot.newapphorizons.fakegps',
  'com.fakegps.mock',
  'com.gsmartstudio.fakegps',
  'com.lkr.fakegps',
  'com.theappninjas.fakegps',
  'com.just4funtools.fakegps',
  'org.hola.gpslocation',
  'com.locationchanger',
  'com.fly.gps',
];

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
  return;
});

// ──────────────────────────────────────────────
// 🔍 تشخیص لوکیشن فیک - هسته اصلی
// ──────────────────────────────────────────────

/**
 * مهم: در اندروید 6 به بالا، ALLOW_MOCK_LOCATION سراسری همیشه 0 است.
 * شما نمی‌توانید *قبل* از گرفتن لوکیشن بفهمید کدام اپ به عنوان Mock انتخاب شده.
 * فقط بعد از گرفتن لوکیشن می‌توانید بفهمید آن لوکیشن فیک است یا نه.
 * 
 * اما می‌توانید 2 چیز را قبل از درخواست لوکیشن چک کنید:
 * 1. آیا Developer Options روشن است؟
 * 2. آیا اپ فیک روی گوشی نصب است؟ (نیاز به Dev Build دارد)
 */
export const isLocationMocked = (locationResult) => {
  if (!locationResult) return false;
  
  // expo-location از SDK 50 به بعد این فیلد را می‌دهد
  // در Dev Build / Release Build مقدار درست دارد، در Expo Go ممکن است undefined باشد
  if (locationResult.mocked === true) return true;
  if (locationResult.coords?.mocked === true) return true;
  
  // برای ماژول نیتیو خام
  // @ts-ignore
  if (locationResult.mocked === 1) return true;

  // Heuristic اضافی: بعضی اپ‌های فیک accuracy را 0 یا 1 می‌گذارند
  // این را با احتیاط استفاده کنید
  // if (locationResult.coords?.accuracy === 0) return true;

  return false;
};
// جایگزین بی‌خطر — چون تشخیص Mock Location native دیگر استفاده نمی‌شود
export const checkMockEnvironment = async () => {
  return { isThreat: false };
};
// export const checkDeveloperOptions = async () => {
//   try {
//     return await MockLocationDetector.isDeveloperOptionsEnabled();
//   } catch (e) {
//     console.log('checkDeveloperOptions error:', e.message);
//     return false;
//   }
// };

// export const hasActiveMockApp = async () => {
//   try {
//     return await MockLocationDetector.hasMockLocationApp();
//   } catch (e) {
//     console.log('hasActiveMockApp error:', e.message);
//     return false;
//   }
// };
// // بررسی کامل محیط قبل از شروع
// export const checkMockEnvironment = async () => {
//   // فقط اندروید
//   if (Platform.OS !== 'android') {
//     return { isThreat: false };
//   }

//   // 1. چک Developer Options
//   const devEnabled = await checkDeveloperOptions();
//   if (devEnabled) {
//     console.warn('⚠️ Developer Options روشن است');
//     return {
//       isThreat: true,
//       code: DEVELOPER_OPTIONS_ERROR,
//       message: 'گزینه‌های توسعه‌دهنده (Developer Options) روی دستگاه شما فعال است. لطفا آن را از تنظیمات خاموش کنید.'
//     };
//   }

//   // 2. چک وجود اپ Mock فعال (نیاز به نیتیو)
//   const mockAppActive = await hasActiveMockApp();
//   if (mockAppActive) {
//     return { 
//       isThreat: true, 
//       code: MOCK_LOCATION_ERROR, 
//       message: 'اپلیکیشن تغییر لوکیشن فعال شناسایی شد. لطفا آن را غیرفعال کنید.' 
//     };
//   }

//   return { isThreat: false };
// };


// ──────────────────────────────────────────────
// 🔐 مجوزها
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
      foreground: true, background: false
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
  // --- مرحله ضد تقلب قبل از درخواست مجوز ---
  const envCheck = await checkMockEnvironment();
  if (envCheck.isThreat) {
    const err = new Error(envCheck.message);
    err.code = envCheck.code;
    throw err;
  }
  const result = await requestAllPermissions();
  return result?.foreground ?? false;
};

export const checkActualPermissionStatus = async () => {
  const result = await checkPermissionsStatus();
  return result?.foreground ?? false;
};

// ──────────────────────────────────────────────
// 📡 ارسال و دریافت لوکیشن امن
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

// نسخه امن - این را به جای getCurrentPosition در همه جا استفاده کنید
export const getCurrentPositionSecure = async (options = {}) => {
  // چک محیط قبل از گرفتن لوکیشن
  const envCheck = await checkMockEnvironment();
  if (envCheck.isThreat) {
    const err = new Error(envCheck.message);
    err.code = envCheck.code;
    throw err;
  }

  const location = await getCurrentPosition(options);

  // --- تشخیص اصلی mock ---
  if (isLocationMocked(location)) {
    console.warn('⛔ لوکیشن فیک شناسایی شد!', location);
    const err = new Error('لوکیشن جعلی شناسایی شد. لطفا اپلیکیشن های Fake GPS را ببندید و Mock Location را از Developer Options غیرفعال کنید.');
    err.code = MOCK_LOCATION_ERROR;
    throw err;
  }

  return location;
};

export const sendVisitorLocation = async ({ VisitorCode, VisitorName, Lat, Lng, IsMockCheckPassed = true }) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;
  if (!VisitorCode || VisitorCode === 'unknown') {
    console.log('⛔ ارسال لوکیشن لغو شد — VisitorCode نامعتبر است');
    return false;
  }
  try {
    const baseUrl = await getServerUrl();
    const now = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const date = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const res = await fetch(`${baseUrl}/api/visitor/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ VisitorCode, VisitorName, Lat, Lng, date, time, timestamp: now.toISOString(), isMockCheckPassed: IsMockCheckPassed }),
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
// 🔄 ارسال خودکار (فقط Foreground — هر دقیقه)
// ──────────────────────────────────────────────
export const stopBackgroundLocationTask = async () => {
  try {
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('✅ Background task قدیمی پیدا و متوقف شد');
    }
  } catch (err) {
    console.log('❌ خطا در توقف background task:', err.message);
  }
};

export const startAutoSendLocation = async (visitorInfo, options = {}) => {
  if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return false;
  if (isStarting) {
    console.log('⏭ startAutoSendLocation در حال اجراست — نادیده گرفته شد');
    return null;
  }
  isStarting = true;

  const config = {
    intervalMs: 60 * 1000,
    minInterval: 55 * 1000,
    maxRetries: 3,
    ...options
  };
  if (!visitorInfo?.VisitorCode || visitorInfo.VisitorCode === 'unknown') {
    console.log('❌ اطلاعات ویزیتور نامعتبر — ارسال شروع نشد');
    isStarting = false;
    return null;
  }

  const mySession = ++currentSessionId;
  if (locationIntervalId) {
    clearInterval(locationIntervalId);
    locationIntervalId = null;
  }
  isRunning = false;

  await stopBackgroundLocationTask().catch(() => {});
  await AsyncStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(visitorInfo));

  const { foreground } = await checkPermissionsStatus();
  if (!foreground) {
    isStarting = false;
    throw new Error('PERMISSION_DENIED');
  }

  if (mySession !== currentSessionId) {
    isStarting = false;
    return null;
  }

  try {
    const pos = await getCurrentPositionSecure(); // <-- استفاده از نسخه امن
    const { latitude: Lat, longitude: Lng } = pos.coords;
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    console.log('✅ ارسال اولیه موفق');
  } catch (error) {
    console.log('❌ خطا در ارسال اولیه:', error.message);
    isStarting = false;
    if (error.code === MOCK_LOCATION_ERROR || error.code === DEVELOPER_OPTIONS_ERROR) {
      throw error; // بگذار UI آن را نمایش دهد
    }
    if (error.message === 'PERMISSION_DENIED') throw error;
  }

  if (mySession !== currentSessionId) {
    isStarting = false;
    return null;
  }

  isRunning = true;
  retryCount = 0;

  const myIntervalId = setInterval(async () => {
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

      const pos = await getCurrentPositionSecure(); // <-- نسخه امن
      const { latitude: Lat, longitude: Lng } = pos.coords;
      await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
      lastSent = Date.now();
      retryCount = 0;
    } catch (error) {
      console.log('❌ خطا در ارسال interval:', error.message);
      if (error.code === MOCK_LOCATION_ERROR) {
        // اگر فیک بود، کل سیستم را متوقف کن و به کاربر اطلاع بده
        console.log('⛔ توقف خودکار به دلیل لوکیشن فیک');
        stopAutoSendLocation();
        // می‌توانید یک event emitter بفرستید تا UI هشدار دهد
        return;
      }
      retryCount++;
      if (retryCount >= config.maxRetries) stopAutoSendLocation();
    }
  }, config.intervalMs);

  locationIntervalId = myIntervalId;
  isStarting = false;
  return myIntervalId;
};

export const stopAutoSendLocation = () => {
  currentSessionId++;
  isRunning = false;
  if (locationIntervalId) { clearInterval(locationIntervalId); locationIntervalId = null; }
  if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
  stopBackgroundLocationTask();
};

export const sendSingleLocation = async (visitorInfo) => {
  const pos = await getCurrentPositionSecure();
  const { latitude: Lat, longitude: Lng } = pos.coords;
  await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
  lastSent = Date.now();
  return true;
};

export const sendQuickLocation = async (visitorInfo) => {
  const now = Date.now();
  if (now - lastSent < 60 * 1000) {
    console.log(`⏭ sendQuickLocation رد شد — ${Math.round((60000 - (now - lastSent)) / 1000)}s مانده`);
    return false;
  }
  try {
    const { foreground } = await checkPermissionsStatus();
    if (!foreground) return false;
    const pos = await getCurrentPositionSecure({
      accuracy: Location.Accuracy.Lowest, timeout: 8000, maximumAge: 0
    });
    const { latitude: Lat, longitude: Lng } = pos.coords;
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    return true;
  } catch (error) {
    console.log('❌ خطا در ارسال سریع:', error.message);
    if (error.code === MOCK_LOCATION_ERROR) throw error;
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
  const position = await getCurrentPositionSecure();
  cachedPosition = position;
  cacheTime = now;
  return position;
};

// این تابع برای سرور شماست
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
