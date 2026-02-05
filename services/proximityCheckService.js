import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import { getServerUrl } from '../config';
import { checkActualPermissionStatus, getCachedPosition, requestLocationPermission } from './locationService';

// کش کردن تنظیمات proximity
let proximitySettingsCache = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_DURATION = 30 * 1000; // 30 ثانیه

/**
 * دریافت تنظیمات proximity_check از سرور
 */
const getProximitySettings = async () => {
  const now = Date.now();
  
  // اگر کش معتبر است، از کش استفاده کن
  if (proximitySettingsCache && (now - settingsCacheTime) < SETTINGS_CACHE_DURATION) {
    console.log('📋 استفاده از تنظیمات proximity کش شده:', proximitySettingsCache);
    return proximitySettingsCache;
  }

  try {
    console.log('🌐 دریافت تنظیمات proximity از سرور...');
    
    const token = await AsyncStorage.getItem('token');
    const baseUrl = await getServerUrl();
    
    const response = await fetch(`${baseUrl}/api/proximity-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('⚠️ خطا در دریافت تنظیمات proximity، استفاده از مقادیر پیش‌فرض');
      // پیش‌فرض: فعال
      return { proximityCheckEnabled: true, maxDistance: 50 };
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      proximitySettingsCache = {
        proximityCheckEnabled: data.data.proximityCheckEnabled,
        maxDistance: data.data.maxDistance || 50
      };
      settingsCacheTime = now;
      
      console.log('✅ تنظیمات proximity دریافت شد:', proximitySettingsCache);
      return proximitySettingsCache;
    } else {
      console.log('⚠️ پاسخ نامعتبر از سرور، استفاده از مقادیر پیش‌فرض');
      return { proximityCheckEnabled: true, maxDistance: 50 };
    }
    
  } catch (error) {
    console.error('❌ خطا در دریافت تنظیمات proximity:', error);
    
    // اگر کش قدیمی داریم، از اون استفاده کن
    if (proximitySettingsCache) {
      console.log('⚠️ استفاده از کش قدیمی');
      return proximitySettingsCache;
    }
    
    // در غیر این صورت، پیش‌فرض: فعال
    console.log('⚠️ استفاده از مقادیر پیش‌فرض (فعال)');
    return { proximityCheckEnabled: true, maxDistance: 50 };
  }
};

/**
 * پاک کردن کش تنظیمات (برای استفاده بعد از logout یا تغییرات)
 */
export const clearProximitySettingsCache = () => {
  proximitySettingsCache = null;
  settingsCacheTime = 0;
  console.log('🗑️ کش تنظیمات proximity پاک شد');
};

/**
 * محاسبه فاصله بین دو نقطه جغرافیایی (فرمول Haversine)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // شعاع زمین به متر
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // فاصله به متر
};

// جلوگیری از درخواست‌های تکراری همزمان
let proximityCheckInProgress = false;

/**
 * بررسی نزدیکی ویزیتور به مشتری (نسخه سریع با کش)
 */
export const checkVisitorProximity = async (buyer, maxDistance = 50) => {
  // اگر چک در حال انجام است، صبر کن
  if (proximityCheckInProgress) {
    console.log('⏳ چک نزدیکی در حال انجام است، صبر کنید...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  proximityCheckInProgress = true;
  
  try {
    console.log('📍 شروع بررسی نزدیکی...');
    
    // 🔥 اول از همه، از سرور بپرس که آیا این چک باید انجام بشه یا نه
    const settings = await getProximitySettings();
    
    console.log('🔍 تنظیمات proximity:', {
      enabled: settings.proximityCheckEnabled,
      maxDistance: settings.maxDistance
    });
    
    // در فایل proximityCheckService.js، تابع checkVisitorProximity را پیدا کنید
    if (!settings.proximityCheckEnabled) {
      console.log('✅ چک نزدیکی غیرفعال است - همه درخواست‌ها مجاز');
      proximityCheckInProgress = false;
      
      // 🔥 این قسمت را اصلاح کنید:
      const defaultLocation = {
        latitude: 0,
        longitude: 0
      };
      
      return {
        isNearby: true,
        distance: 0,
        maxDistance: effectiveMaxDistance,
        proximityCheckDisabled: true,
        // 🔥 همیشه مقادیر را برگردان
        buyerLocation: buyer ? {
          latitude: parseFloat(buyer.Lat || 0),
          longitude: parseFloat(buyer.Lng || 0)
        } : defaultLocation,
        visitorLocation: defaultLocation,
        message: 'چک نزدیکی غیرفعال است'
      };
    }
    
    // اگر رسید اینجا یعنی چک فعاله، ادامه بده...
    console.log('🔍 چک نزدیکی فعال است، شروع بررسی...');
    
    // استفاده از maxDistance از سرور
    const effectiveMaxDistance = settings.maxDistance || maxDistance;
    console.log(`📏 حداکثر فاصله مجاز: ${effectiveMaxDistance} متر`);
    
    // بررسی وجود لوکیشن مشتری
    if (!buyer || !buyer.Lat || !buyer.Lng) {
      throw new Error('BUYER_LOCATION_NOT_FOUND');
    }

    console.log('📍 بررسی دسترسی موقعیت...');
    
    // ابتدا وضعیت فعلی permission رو چک کن
    const hasActualPermission = await checkActualPermissionStatus();
    if (!hasActualPermission) {
      // اگر permission نداریم، درخواست بده
      console.log('📍 درخواست دسترسی موقعیت...');
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        throw new Error('PERMISSION_DENIED');
      }
    }

    console.log('📍 دریافت موقعیت ویزیتور (با کش)...');
    
    // دریافت موقعیت فعلی ویزیتور (با استفاده از کش)
    const location = await getCachedPosition();
    const { latitude: visitorLat, longitude: visitorLng } = location.coords;

    console.log('📍 محاسبه فاصله...');
    
    // محاسبه فاصله
    const distance = calculateDistance(
      visitorLat,
      visitorLng,
      parseFloat(buyer.Lat),
      parseFloat(buyer.Lng)
    );

    const isNearby = distance <= effectiveMaxDistance;

    console.log(`📍 فاصله محاسبه شده: ${Math.round(distance)} متر (حد مجاز: ${effectiveMaxDistance} متر)`);

    return {
      isNearby,
      distance: Math.round(distance),
      maxDistance: effectiveMaxDistance,
      visitorLocation: {
        latitude: visitorLat,
        longitude: visitorLng
      },
      buyerLocation: {
        latitude: parseFloat(buyer.Lat),
        longitude: parseFloat(buyer.Lng)
      },
      proximityCheckDisabled: false
    };
  } catch (error) {
    console.error('❌ خطا در بررسی نزدیکی:', error);
    throw error;
  } finally {
    proximityCheckInProgress = false;
  }
};

/**
 * بررسی نزدیکی و نمایش پیام مناسب
 */
export const checkProximityWithAlert = async (
  buyer,
  maxDistance = 50,
  onSuccess,
  onFailure
) => {
  try {
    console.log('🔄 شروع فرآیند بررسی نزدیکی...');
    const result = await checkVisitorProximity(buyer, maxDistance);

    // اگر چک غیرفعال بود، موفق بازگردون
    if (result.proximityCheckDisabled) {
      console.log('✅ چک نزدیکی غیرفعال - مجاز');
      if (onSuccess) onSuccess(result);
      return true;
    }

    if (result.isNearby) {
      console.log(`✅ فاصله: ${result.distance} متر - مجاز`);
      if (onSuccess) onSuccess(result);
      return true;
    } else {
      console.log(`⚠️ فاصله: ${result.distance} متر - خارج از محدوده`);
      
      const effectiveMaxDistance = result.maxDistance || maxDistance;
      
      Alert.alert(
        '⚠️ خارج از محدوده',
        `شما در فاصله ${result.distance} متری از مشتری هستید.\n\n` +
        `برای ثبت سفارش باید حداکثر ${effectiveMaxDistance} متر از مشتری فاصله داشته باشید.\n\n` +
        `لطفاً به نزدیکی مشتری بروید.`,
        [{ text: 'متوجه شدم', style: 'default' }]
      );
      
      if (onFailure) onFailure(result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in proximity check:', error);
    
    // مدیریت خطاها
    if (error.message === 'BUYER_LOCATION_NOT_FOUND') {
      Alert.alert(
        '❌ خطا',
        'لوکیشن مشتری ثبت نشده است.\n\nابتدا لوکیشن مشتری را ثبت کنید.',
        [{ text: 'متوجه شدم' }]
      );
    } else if (error.message === 'PERMISSION_DENIED') {
      Alert.alert(
        'دسترسی موقعیت مکانی',
        'برای ثبت سفارش، دسترسی به موقعیت مکانی الزامی است.',
        [
          { text: 'انصراف', style: 'cancel' },
          { 
            text: 'تنظیمات', 
            onPress: () => Linking.openSettings()
          }
        ]
      );
    } else {
      Alert.alert(
        'خطا',
        'خطا در دریافت موقعیت مکانی.\n\nلطفاً مجدداً تلاش کنید.',
        [{ text: 'باشه' }]
      );
    }
    
    if (onFailure) onFailure(error);
    return false;
  }
};

// توابع دیگر بدون تغییر...
export const isVisitorNearby = async (buyer, maxDistance = 50) => {
  try {
    const result = await checkVisitorProximity(buyer, maxDistance);
    return result.isNearby;
  } catch (error) {
    console.error('❌ Error checking proximity:', error);
    return false;
  }
};

// در فایل proximityCheckService.js، تابع checkProximityForBuyer را پیدا کنید

export const checkProximityForBuyer = async (buyer, mapBuyers, maxDistance = 50) => {
  console.log('🔍 بررسی لوکیشن مشتری...');
  
  const buyerWithLocation = mapBuyers.find(
    b => String(b.code) === String(buyer.code)
  );

  if (!buyerWithLocation) {
    console.log('❌ مشتری لوکیشن ندارد');
    return {
      hasLocation: false,
      canProceed: false,
      error: 'NO_LOCATION'
    };
  }

  console.log('✅ لوکیشن مشتری پیدا شد');

  const buyerData = {
    ...buyer,
    Lat: buyerWithLocation.Lat,
    Lng: buyerWithLocation.Lng
  };

  try {
    const result = await checkVisitorProximity(buyerData, maxDistance);
    
    // 🔥 این قسمت را اصلاح کنید:
    // اگر چک غیرفعال بود، همیشه موفق
    if (result.proximityCheckDisabled) {
      console.log('✅ چک نزدیکی غیرفعال - همیشه مجاز');
      return {
        hasLocation: true,
        canProceed: true,
        distance: 0,
        isNearby: true,
        proximityCheckDisabled: true,
        // 🔥 اصلاح: همیشه buyerLocation را برگردان
        buyerLocation: {
          latitude: parseFloat(buyerData.Lat || 0),
          longitude: parseFloat(buyerData.Lng || 0)
        },
        // 🔥 همچنین visitorLocation را هم برگردان
        visitorLocation: result.visitorLocation || { latitude: 0, longitude: 0 },
        maxDistance: result.maxDistance || maxDistance
      };
    }
    
    console.log(`📍 نتیجه نهایی: ${result.isNearby ? 'مجاز' : 'غیرمجاز'} (${result.distance} متر)`);
    
    return {
      hasLocation: true,
      canProceed: result.isNearby,
      distance: result.distance,
      maxDistance: result.maxDistance,
      isNearby: result.isNearby,
      // 🔥 اصلاح: همیشه مقادیر را برگردان
      buyerLocation: result.buyerLocation || {
        latitude: parseFloat(buyerData.Lat || 0),
        longitude: parseFloat(buyerData.Lng || 0)
      },
      visitorLocation: result.visitorLocation || { latitude: 0, longitude: 0 },
      proximityCheckDisabled: false
    };
  } catch (error) {
    console.log('❌ خطا در بررسی نزدیکی:', error);
    return {
      hasLocation: true,
      canProceed: false,
      error: error.message,
      // 🔥 حتی در خطا هم location برگردان
      buyerLocation: {
        latitude: parseFloat(buyerData.Lat || 0),
        longitude: parseFloat(buyerData.Lng || 0)
      }
    };
  }
};