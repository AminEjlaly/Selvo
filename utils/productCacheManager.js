// utils/productCacheManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'product_cache_';
const CACHE_EXPIRY_HOURS = 24; // کش 24 ساعت معتبر است

/**
 * ذخیره اطلاعات محصولات در کش (بدون قیمت)
 */
export const cacheProducts = async (products, groupKey) => {
  try {
    const productsWithoutPrices = products.map(product => ({
      Code: product.Code,
      Name: product.Name,
      Mbna: product.Mbna,
      MainGroupCode: product.MainGroupCode,
      SubGroupCode: product.SubGroupCode,
      imageUrl: product.imageUrl,
      MainUnit: product.MainUnit,
      SlaveUnit: product.SlaveUnit,
      Mojoodi: product.Mojoodi,
      MoenName: product.MoenName,
      // قیمت‌ها را ذخیره نمی‌کنیم
    }));

    const cacheData = {
      products: productsWithoutPrices,
      timestamp: Date.now(),
      groupKey: groupKey
    };

    await AsyncStorage.setItem(
      `${CACHE_KEY_PREFIX}${groupKey}`,
      JSON.stringify(cacheData)
    );

    console.log(`✅ کش محصولات ذخیره شد: ${groupKey} (${products.length} محصول)`);
    return true;
  } catch (error) {
    console.log('❌ خطا در ذخیره کش:', error);
    return false;
  }
};

/**
 * دریافت محصولات از کش
 */
export const getCachedProducts = async (groupKey) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${groupKey}`);
    
    if (!cached) {
      console.log(`ℹ️ کش موجود نیست: ${groupKey}`);
      return null;
    }

    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    if (age > maxAge) {
      console.log(`⏰ کش منقضی شده: ${groupKey} (${Math.floor(age / 3600000)} ساعت)`);
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${groupKey}`);
      return null;
    }

    console.log(`✅ کش بارگذاری شد: ${groupKey} (${cacheData.products.length} محصول)`);
    return cacheData.products;
  } catch (error) {
    console.log('❌ خطا در خواندن کش:', error);
    return null;
  }
};

/**
 * ترکیب داده‌های کش شده با قیمت‌های جدید
 */
export const mergeCachedWithPrices = (cachedProducts, priceData) => {
  if (!cachedProducts || !priceData || !priceData.products) {
    return null;
  }

  // ایجاد Map از قیمت‌های جدید برای سرعت بیشتر
  const priceMap = new Map();
  priceData.products.forEach(product => {
    priceMap.set(product.Code, {
      Price: product.Price,
      PriceF1: product.PriceF1,
      PriceF2: product.PriceF2,
      PriceF3: product.PriceF3,
      PriceF4: product.PriceF4,
      PriceF5: product.PriceF5,
      PriceF6: product.PriceF6,
      CustomerPrice: product.CustomerPrice,
      DisplayPrice: product.DisplayPrice
    });
  });

  // ترکیب داده‌ها
  const mergedProducts = cachedProducts.map(cachedProduct => {
    const prices = priceMap.get(cachedProduct.Code) || {};
    return {
      ...cachedProduct,
      ...prices
    };
  });

  console.log(`✅ داده‌های کش با قیمت‌های جدید ترکیب شدند (${mergedProducts.length} محصول)`);
  return mergedProducts;
};

/**
 * پاک کردن تمام کش‌های محصولات
 */
export const clearAllProductCache = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`✅ ${cacheKeys.length} کش پاک شد`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ خطا در پاک کردن کش:', error);
    return false;
  }
};

/**
 * پاک کردن کش‌های قدیمی‌تر از یک مدت مشخص
 */
export const cleanOldCache = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    let cleanedCount = 0;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;
        
        if (age > maxAge) {
          await AsyncStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} کش قدیمی پاک شد`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.log('❌ خطا در پاک‌سازی کش:', error);
    return 0;
  }
};

/**
 * دریافت آمار کش
 */
export const getCacheStats = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    let totalProducts = 0;
    let oldestCache = null;
    let newestCache = null;
    
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const cacheData = JSON.parse(cached);
        totalProducts += cacheData.products.length;
        
        if (!oldestCache || cacheData.timestamp < oldestCache) {
          oldestCache = cacheData.timestamp;
        }
        if (!newestCache || cacheData.timestamp > newestCache) {
          newestCache = cacheData.timestamp;
        }
      }
    }
    
    return {
      totalCaches: cacheKeys.length,
      totalProducts,
      oldestCacheAge: oldestCache ? Date.now() - oldestCache : 0,
      newestCacheAge: newestCache ? Date.now() - newestCache : 0
    };
  } catch (error) {
    console.log('❌ خطا در دریافت آمار کش:', error);
    return null;
  }
};