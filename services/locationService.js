// locationService.js - نسخه کامل
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import jalaali from 'jalaali-js';
import { APP_CONFIG, getServerUrl } from '../config';

const VISITOR_INFO_KEY = 'visitor_info';
const LOCATION_PERMISSION_KEY = 'location_permission_granted';

// --- مدیریت ارسال خودکار ---
let locationIntervalId = null;
let statusIntervalId = null; // برای لاگ وضعیت
let lastSent = 0;
let isRunning = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// --- درخواست اجازه لوکیشن ---
export const requestLocationPermission = async () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('📍 درخواست دسترسی موقعیت...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    const isGranted = status === 'granted';
    
    console.log(`📍 وضعیت دسترسی: ${status}`);
    
    if (isGranted) {
      await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
    }
    
    return isGranted;
  } catch (err) {
    console.log('❌ خطا در درخواست دسترسی:', err);
    return false;
  }
};

// --- بررسی وضعیت واقعی permission ---
export const checkActualPermissionStatus = async () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('❌ خطا در بررسی وضعیت دسترسی:', error);
    return false;
  }
};

// --- دریافت موقعیت جدید ---
export const getCurrentPosition = async (options = {}) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('📍 بررسی دسترسی موقعیت...');
    const hasPermission = await checkActualPermissionStatus();
    
    if (!hasPermission) {
      console.log('❌ دسترسی موقعیت داده نشده است');
      throw new Error('PERMISSION_DENIED');
    }

    const locationOptions = {
      accuracy: Location.Accuracy.Balanced,
      timeout: 15000,
      maximumAge: 0, // همیشه موقعیت جدید
      ...options
    };

    console.log('📍 در حال دریافت موقعیت جدید...');
    const startTime = Date.now();
    const location = await Location.getCurrentPositionAsync(locationOptions);
    const endTime = Date.now();
    
    console.log(`✅ موقعیت جدید دریافت شد (${endTime - startTime}ms)`);
    console.log(`📍 مختصات: ${location.coords.latitude}, ${location.coords.longitude}`);
    return location;
  } catch (error) {
    console.log('❌ خطا در دریافت موقعیت:', error.message);
    console.log('❌ کد خطا:', error.code || 'نامشخص');
    throw error;
  }
};

// --- ارسال لوکیشن ویزیتور به سرور ---
export const sendVisitorLocation = async ({ VisitorCode, VisitorName, Lat, Lng }) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('📍 آماده‌سازی ارسال لوکیشن...');
    console.log('📍 اطلاعات:', { VisitorCode, VisitorName, Lat, Lng });
    
    const baseUrl = await getServerUrl();
    console.log('📍 آدرس سرور:', baseUrl);
    
    const now = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const date = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const body = { 
      VisitorCode, 
      VisitorName, 
      Lat, 
      Lng, 
      date, 
      time,
      timestamp: now.toISOString()
    };

    console.log('📍 ارسال درخواست به:', `${baseUrl}/api/visitor/location`);
    
    const res = await fetch(`${baseUrl}/api/visitor/location`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
    });

    console.log(`📍 وضعیت پاسخ: ${res.status} ${res.statusText}`);
    
    const responseText = await res.text();
    console.log('📍 متن پاسخ:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ خطا در پارس کردن JSON:', e.message);
      data = null;
    }

    if (!res.ok) {
      const errorMsg = data?.message || `خطا در ارسال لوکیشن (کد: ${res.status})`;
      console.log('❌ خطای سرور:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!data || !data.success) {
      const errorMsg = data?.message || 'پاسخ نامعتبر از سرور';
      console.log('❌ پاسخ ناموفق:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ لوکیشن با موفقیت ارسال شد');
    return data;
  } catch (err) {
    console.log('❌ خطا در ارسال لوکیشن:', err.message);
    throw err;
  }
};

// --- ارسال تکی لوکیشن ---
export const sendSingleLocation = async (visitorInfo) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('📍 شروع ارسال تکی لوکیشن...');
    const pos = await getCurrentPosition();
    const { latitude: Lat, longitude: Lng } = pos.coords;
    
    console.log(`📍 ارسال لوکیشن: ${Lat}, ${Lng}`);
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    
    console.log('✅ ارسال تکی موفقیت‌آمیز بود');
    return true;
  } catch (error) {
    console.log('❌ خطا در ارسال تکی:', error.message);
    throw error;
  }
};

// --- ارسال سریع لوکیشن (برای کلیک روی منوها) ---
export const sendQuickLocation = async (visitorInfo) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('📍 درخواست ارسال سریع لوکیشن...');
    
    // بررسی دسترسی
    const hasPermission = await checkActualPermissionStatus();
    if (!hasPermission) {
      console.log('⚠️ دسترسی موقعیت وجود ندارد');
      return false;
    }
    
    // تنظیمات سریع
    const quickOptions = {
      accuracy: Location.Accuracy.Lowest,
      timeout: 8000,
      maximumAge: 0,
    };
    
    console.log('📍 دریافت موقعیت سریع...');
    const startTime = Date.now();
    const pos = await Location.getCurrentPositionAsync(quickOptions);
    const endTime = Date.now();
    
    const { latitude: Lat, longitude: Lng } = pos.coords;
    console.log(`✅ موقعیت سریع دریافت شد (${endTime - startTime}ms): ${Lat}, ${Lng}`);
    
    // ارسال به سرور
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    lastSent = Date.now();
    
    console.log('✅ ارسال سریع لوکیشن موفق بود');
    return true;
    
  } catch (error) {
    console.log('❌ خطا در ارسال سریع:', error.message);
    return false;
  }
};

// --- مدیریت ارسال خودکار ---
export const startAutoSendLocation = async (visitorInfo, options = {}) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  console.log('📍 شروع ارسال خودکار لوکیشن...');
  console.log('📍 اطلاعات ویزیتور:', visitorInfo);
  console.log('📍 تنظیمات:', options);
  
  // تنظیمات پیش‌فرض
  const config = {
    intervalMs: 60 * 1000, // 1 دقیقه
    minInterval: 10000, // حداقل 10 ثانیه فاصله
    maxRetries: 3,
    ...options
  };

  if (!visitorInfo || !visitorInfo.VisitorCode) {
    console.log('❌ اطلاعات ویزیتور نامعتبر است');
    return null;
  }

  // متوقف کردن interval قبلی
  stopAutoSendLocation();

  // بررسی دسترسی
  const hasActualPermission = await checkActualPermissionStatus();
  console.log(`📍 وضعیت دسترسی فعلی: ${hasActualPermission}`);

  if (!hasActualPermission) {
    console.log('📍 درخواست دسترسی جدید...');
    const permissionGranted = await requestLocationPermission();
    console.log(`📍 نتیجه درخواست دسترسی: ${permissionGranted}`);
    
    if (!permissionGranted) {
      console.log('❌ دسترسی موقعیت رد شد');
      throw new Error('PERMISSION_DENIED');
    }
  }

  // ارسال اولیه
  try {
    console.log('📍 دریافت موقعیت اولیه...');
    const pos = await getCurrentPosition();
    const { latitude: Lat, longitude: Lng } = pos.coords;
    
    console.log(`📍 ارسال موقعیت اولیه: ${Lat}, ${Lng}`);
    await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
    
    lastSent = Date.now();
    console.log('✅ ارسال اولیه موفقیت‌آمیز بود');
  } catch (error) {
    console.log('❌ خطا در ارسال اولیه:', error.message);
    if (error.message === 'PERMISSION_DENIED') {
      throw new Error('PERMISSION_DENIED');
    }
    // خطاهای دیگر را نادیده می‌گیریم و ادامه می‌دهیم
  }

  // شروع interval اصلی
  console.log(`📍 راه‌اندازی interval هر ${config.intervalMs}ms`);
  
  isRunning = true;
  retryCount = 0;
  
  locationIntervalId = setInterval(async () => {
    if (!isRunning) {
      console.log('📍 interval متوقف شده است');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastSent = now - lastSent;
    
    console.log(`📍 اجرای interval (${timeSinceLastSent}ms از آخرین ارسال)`);
    
    try {
      // جلوگیری از ارسال‌های مکرر
      if (timeSinceLastSent < config.minInterval) {
        console.log(`📍 خیلی زود است، ${config.minInterval - timeSinceLastSent}ms صبر می‌کنیم`);
        return;
      }
      
      // بررسی مجدد دسترسی
      const hasPermission = await checkActualPermissionStatus();
      if (!hasPermission) {
        console.log('❌ دسترسی از دست رفته، متوقف کردن...');
        stopAutoSendLocation();
        return;
      }
      
      console.log('📍 دریافت موقعیت جدید برای interval...');
      const pos = await getCurrentPosition();
      const { latitude: Lat, longitude: Lng } = pos.coords;
      
      console.log(`📍 ارسال موقعیت: ${Lat}, ${Lng}`);
      await sendVisitorLocation({ ...visitorInfo, Lat, Lng });
      
      lastSent = Date.now();
      retryCount = 0; // ریست کنتر بازنشانی
      console.log(`✅ ارسال موفق (آخرین: ${new Date(lastSent).toLocaleTimeString()})`);
      
    } catch (error) {
      console.log('❌ خطا در ارسال interval:', error.message);
      retryCount++;
      
      if (retryCount >= config.maxRetries) {
        console.log(`❌ بیش از ${config.maxRetries} بار خطا، متوقف کردن...`);
        stopAutoSendLocation();
      }
    }
  }, config.intervalMs);

  // لاگ وضعیت هر 30 ثانیه
  statusIntervalId = setInterval(() => {
    if (!isRunning) {
      clearInterval(statusIntervalId);
      return;
    }
    const timeSince = Date.now() - lastSent;
    console.log(`📍 وضعیت: ${isRunning ? 'در حال اجرا' : 'متوقف'}, آخرین ارسال: ${Math.floor(timeSince / 1000)} ثانیه پیش`);
  }, 30000);

  console.log('✅ ارسال خودکار لوکیشن شروع شد');
  return locationIntervalId;
};

// --- توقف ارسال خودکار ---
export const stopAutoSendLocation = () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  console.log('📍 توقف ارسال خودکار لوکیشن...');
  
  isRunning = false;
  
  if (locationIntervalId) {
    clearInterval(locationIntervalId);
    locationIntervalId = null;
    console.log('✅ interval اصلی متوقف شد');
  }
  
  if (statusIntervalId) {
    clearInterval(statusIntervalId);
    statusIntervalId = null;
    console.log('✅ interval وضعیت متوقف شد');
  }
};

// --- بررسی وضعیت اجرا ---
export const isAutoSendRunning = () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  const running = isRunning && locationIntervalId !== null;
  console.log(`📍 بررسی وضعیت اجرا: ${running ? 'در حال اجرا' : 'متوقف'}`);
  return running;
};

// --- گرفتن زمان آخرین ارسال ---
export const getLastSentTime = () => {
  console.log(`📍 زمان آخرین ارسال: ${lastSent > 0 ? new Date(lastSent).toLocaleTimeString() : 'هنوز ارسالی نداشته'}`);
  return lastSent;
};

// --- دریافت اطلاعات لوکیشن ---
export const getLocationInfo = () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  return {
    isRunning,
    lastSent,
    lastSentFormatted: lastSent > 0 ? new Date(lastSent).toLocaleString('fa-IR') : 'ندارد',
    intervalId: locationIntervalId,
    statusIntervalId: statusIntervalId,
    retryCount
  };
};

// پاک کردن وضعیت ذخیره شده
export const resetLocationPermission = async () => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    await AsyncStorage.removeItem(LOCATION_PERMISSION_KEY);
    console.log('✅ وضعیت دسترسی پاک شد');
  } catch (error) {
    console.log('❌ خطا در پاک کردن وضعیت دسترسی:', error);
  }
};

// --- تابع تست ---
export const testLocationService = async (visitorInfo) => {
   if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled in config');
    return false;
  }
  try {
    console.log('🧪 شروع تست سرویس لوکیشن...');
    
    if (!visitorInfo || !visitorInfo.VisitorCode) {
      throw new Error('اطلاعات ویزیتور نامعتبر است');
    }

    // تست دریافت موقعیت
    console.log('🧪 تست دریافت موقعیت...');
    const pos = await getCurrentPosition();
    console.log(`🧪 موقعیت دریافت شد: ${pos.coords.latitude}, ${pos.coords.longitude}`);
    
    // تست ارسال
    console.log('🧪 تست ارسال به سرور...');
    const result = await sendVisitorLocation({ 
      ...visitorInfo, 
      Lat: pos.coords.latitude, 
      Lng: pos.coords.longitude 
    });
    
    console.log('🧪 تست موفقیت‌آمیز بود:', result);
    return result;
  } catch (error) {
    console.log('🧪 تست ناموفق:', error.message);
    throw error;
  }
};