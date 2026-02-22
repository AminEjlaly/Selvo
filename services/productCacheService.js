import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'products_cache';
const CACHE_EXPIRY_KEY = 'products_cache_expiry';
const STATIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعت برای اطلاعات ثابت
const PRICE_CACHE_DURATION = 30 * 60 * 1000; // 30 دقیقه برای قیمت‌ها

const PRICE_FIELDS = [
  'Price', 'PriceF1', 'PriceF2', 'PriceF3',
  'PriceF4', 'PriceF5', 'PriceF6',
  'CustomerPrice', 'DisplayPrice', 'Mojoodi'
];

// ذخیره کامل محصولات (هم اطلاعات ثابت هم قیمت)
export const saveProductsCache = async (products, groupKey = 'all') => {
  try {
    const cacheData = {};
    products.forEach(product => {
      cacheData[String(product.Code)] = product;
    });

    await AsyncStorage.setItem(`${CACHE_KEY}_${groupKey}`, JSON.stringify(cacheData));
    await AsyncStorage.setItem(`${CACHE_EXPIRY_KEY}_${groupKey}`, String(Date.now() + STATIC_CACHE_DURATION));
    await AsyncStorage.setItem(`${CACHE_KEY}_price_${groupKey}`, JSON.stringify(cacheData));
    await AsyncStorage.setItem(`${CACHE_EXPIRY_KEY}_price_${groupKey}`, String(Date.now() + PRICE_CACHE_DURATION));

    console.log(`✅ کش کامل ذخیره شد: ${Object.keys(cacheData).length} کالا`);
  } catch (error) {
    console.log('❌ خطا در ذخیره کش:', error);
  }
};

export const getProductsCache = async (groupKey = 'all', rawMode = false) => {
  try {
    const expiry = await AsyncStorage.getItem(`${CACHE_EXPIRY_KEY}_${groupKey}`);
    if (!rawMode && (!expiry || Date.now() > Number(expiry))) {
      return null;
    }
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${groupKey}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
};

// دریافت قیمت‌های کش شده (30 دقیقه اعتبار)
const getPriceCacheValid = async (groupKey) => {
  try {
    const expiry = await AsyncStorage.getItem(`${CACHE_EXPIRY_KEY}_price_${groupKey}`);
    if (!expiry || Date.now() > Number(expiry)) return null;
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}_price_${groupKey}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const getProductsWithCache = async (fetchFn, groupKey = 'all') => {
  // اول کش رو چک کن
  const priceCache = await getPriceCacheValid(groupKey);
  if (priceCache) {
    console.log('💰 استفاده از کش (قیمت‌ها معتبرند) - بدون درخواست سرور');
    return {
      products: Object.values(priceCache),
      pricing: { priceColumn: 'PriceF1', ghk: 0 },
      _fromCache: false // معتبره، پیام نشون نده
    };
  }

  // کش نداشت یا منقضی شد، از سرور بگیر
  try {
    console.log('🌐 کش منقضی شده، دریافت از سرور...');
    const freshResult = await fetchFn();
    const freshProducts = freshResult.products || [];
    await saveProductsCache(freshProducts, groupKey);
    return freshResult;

  } catch (serverError) {
    console.log('⚠️ سرور در دسترس نیست، بررسی کش قدیمی...');

    const staticCache = await getProductsCache(groupKey, true);
    if (staticCache) {
      return {
        products: Object.values(staticCache),
        pricing: { priceColumn: 'PriceF1', ghk: 0 },
        _fromCache: true,
        _pricesStale: true
      };
    }

    throw serverError;
  }
};

export const clearProductsCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k =>
      k.startsWith(CACHE_KEY) || k.startsWith(CACHE_EXPIRY_KEY)
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('✅ کش پاک شد');
  } catch (error) {
    console.log('❌ خطا در پاک کردن کش:', error);
  }
};

export const getCacheStatus = async (groupKey = 'all') => {
  try {
    const expiry = await AsyncStorage.getItem(`${CACHE_EXPIRY_KEY}_${groupKey}`);
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${groupKey}`);
    const priceExpiry = await AsyncStorage.getItem(`${CACHE_EXPIRY_KEY}_price_${groupKey}`);

    if (!cached || !expiry) return { exists: false };

    const expiryTime = Number(expiry);
    const priceExpiryTime = Number(priceExpiry || 0);
    const count = Object.keys(JSON.parse(cached)).length;

    return {
      exists: true,
      isValid: Date.now() < expiryTime,
      isPriceValid: Date.now() < priceExpiryTime,
      count,
      expiresIn: Math.round((expiryTime - Date.now()) / 60000),
      priceExpiresIn: Math.round((priceExpiryTime - Date.now()) / 60000)
    };
  } catch {
    return { exists: false };
  }
};