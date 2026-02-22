// api.js - فایل کامل با قابلیت چت
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from './config';
const REQUEST_TIMEOUT = 15000; // 15 seconds

let imageUrlCache = {};
let imageUrlCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  } catch (error) {
    return {
      'Content-Type': 'application/json',
    };
  }
};
// --- بررسی پاسخ سرور ---
const handleResponse = async (res) => {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('پاسخ سرور نامعتبر است');
  }

  if (!res.ok || !data.success) {
    if (
      data.message?.toLowerCase().includes('توکن معتبر نیست') ||
      data.message?.toLowerCase().includes('توکن منقضی') ||
      data.message?.toLowerCase().includes('token')
    ) {
      await AsyncStorage.multiRemove(['token', 'user']);
      throw new Error('توکن منقضی شده است، لطفاً دوباره وارد شوید');
    }
    throw new Error(data.message || 'خطا در دریافت اطلاعات');
  }

  return data.data || [];
};

// --- ساخت درخواست با timeout ---
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('زمان درخواست به پایان رسید');
    }
    throw error;
  }
};

// --- لاگین ---
export const login = async (username, password) => {
  try {
    console.log('🔐 ======= شروع فرآیند لاگین =======');
    console.log('👤 اطلاعات ورود:', { 
      username, 
      password: password ? '***' : 'undefined' 
    });

    // دریافت آدرس سرور
    const baseUrl = await getServerUrl();
    console.log('🌐 آدرس سرور:', baseUrl);

    const url = `${baseUrl}/api/login`;
    console.log('📡 URL درخواست:', url);

    // ایجاد درخواست
    console.log('📤 ارسال درخواست به سرور...');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('📥 پاسخ سرور دریافت شد:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      type: res.type
    });

    // خواندن پاسخ
    let responseText;
    try {
      responseText = await res.text();
      console.log('📄 متن پاسخ خام:', responseText);
    } catch (textError) {
      console.log('❌ خطا در خواندن متن پاسخ:', textError);
      throw new Error('پاسخ سرور قابل خواندن نیست');
    }

    // پارس JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
      console.log('📊 داده‌های پارس شده:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('❌ خطا در پارس JSON:', parseError);
      console.log('📄 متن مشکل‌دار:', responseText);
      throw new Error('پاسخ سرور معتبر نیست');
    }

    // بررسی وضعیت HTTP
    if (!res.ok) {
      console.log('❌ خطای HTTP:', {
        status: res.status,
        message: data.message || 'بدون پیام خطا',
        data: data
      });
      
      if (res.status === 401) {
        throw new Error(data.message || 'نام کاربری یا رمز عبور اشتباه است');
      } else if (res.status === 500) {
        throw new Error(data.message || 'خطای داخلی سرور');
      } else if (res.status === 404) {
        throw new Error('آدرس API یافت نشد');
      } else if (res.status === 400) {
        throw new Error(data.message || 'داده‌های ارسالی نامعتبر است');
      } else {
        throw new Error(data.message || `خطای سرور: ${res.status}`);
      }
    }

    // بررسی موفقیت منطقی
    if (!data.success) {
      console.log('❌ خطای منطقی از سرور:', data.message);
      throw new Error(data.message || 'لاگین ناموفق بود');
    }

    console.log('✅ لاگین موفقیت‌آمیز:', {
      token: data.token ? '✅ دارد' : '❌ ندارد',
      userData: data.data ? '✅ دارد' : '❌ ندارد',
      message: data.message || 'بدون پیام'
    });

    // ذخیره توکن
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
      console.log('💾 توکن در AsyncStorage ذخیره شد');
    } else {
      console.log('⚠️ هشدار: توکن در پاسخ وجود ندارد');
    }

    // ذخیره اطلاعات کاربر
    if (data.data) {
      await AsyncStorage.setItem('user', JSON.stringify(data.data));
      console.log('💾 اطلاعات کاربر ذخیره شد:', {
        name: data.data.NameF || data.data.name,
        id: data.data.NOF || data.data.id,
        role: data.data.role || data.data.UserType
      });
    } else {
      console.log('⚠️ هشدار: اطلاعات کاربر در پاسخ وجود ندارد');
    }

    // ✨ دریافت وضعیت manfi بعد از لاگین موفق
    try {
      const manfiResponse = await getManfiStatus();
      if (manfiResponse.success) {
        console.log('✅ وضعیت manfi کاربر دریافت شد:', manfiResponse.data.hasManfiAccess);
        
        // ذخیره وضعیت manfi در AsyncStorage
        await AsyncStorage.setItem('manfiAccess', JSON.stringify(manfiResponse.data.hasManfiAccess));
        
        // اضافه کردن وضعیت manfi به پاسخ
        data.manfiAccess = manfiResponse.data.hasManfiAccess;
      }
    } catch (manfiError) {
      console.log('⚠️ خطا در دریافت وضعیت manfi:', manfiError);
      // این خطا نباید فرآیند لاگین را مختل کند
      data.manfiAccess = false;
    }

    console.log('🎉 ======= لاگین با موفقیت انجام شد =======');
    return data;

  } catch (err) {
    console.log('💥 ======= خطای کامل در لاگین =======');
    console.log('❌ نوع خطا:', err.name);
    console.log('❌ پیام خطا:', err.message);
    console.log('❌ stack:', err.stack);

    if (err.message === 'Network request failed') {
      console.log('🌐 مشکل شبکه: ارتباط با سرور برقرار نشد');
      throw new Error('ارتباط با سرور برقرار نشد. لطفاً اینترنت خود را بررسی کنید');
    }
    
    if (err.message.includes('JSON')) {
      console.log('📄 مشکل در فرمت پاسخ سرور');
      throw new Error('پاسخ سرور معتبر نیست');
    }
    
    if (err.message.includes('timeout')) {
      console.log('⏰ timeout در درخواست');
      throw new Error('پاسخ سرور طولانی شد. لطفاً دوباره تلاش کنید');
    }

    // پرتاب خطای اصلی
    throw err;
  }
};

// --- گرفتن گروه کالاها (مسیر قدیمی - برای compatibility) ---
export const getKalaGroups = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/kala/kalagroup`, { headers });
    const groups = await handleResponse(res);

    return groups.map(g => ({
      ...g,
      CodeGroup: String(g.CodeGroup),
      NameGroup: g.NameGroup || '-',
    }));
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// ==================== API گروه‌های کالا ====================

// --- گرفتن همه گروه‌های کالا (سلسله مراتبی) ---
export const getGroups = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/kala/group`, { headers });
    const groups = await handleResponse(res);

    return groups.map(g => ({
      CodeGroup: String(g.CodeGroup),
      NameGroup: g.NameGroup || '-',
      TopCode: g.TopCode ? String(g.TopCode) : null,
      IsMainGroup: g.IsMainGroup === 1
    }));
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن فقط سرگروه‌های کالا ---
export const getMainGroups = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/kala/group/main`, { headers });
    const groups = await handleResponse(res);

    return groups.map(g => ({
      CodeGroup: String(g.CodeGroup),
      NameGroup: g.NameGroup || '-'
    }));
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن زیرگروه‌های یک سرگروه خاص ---
export const getSubGroups = async (mainGroupCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/kala/group/sub/${mainGroupCode}`, { headers });
    const groups = await handleResponse(res);

    return groups.map(g => ({
      CodeGroup: String(g.CodeGroup),
      NameGroup: g.NameGroup || '-',
      TopCode: String(g.TopCode)
    }));
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// ==================== API کالاها با قیمت مشتری ====================

// --- گرفتن کالاها (با فیلتر اختیاری گروه و buyerCode) ---
export const getProducts = async (mainGroup = null, subGroup = null, buyerCode = null) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/kala`;
    const params = [];
    
    if (mainGroup) params.push(`mainGroup=${mainGroup}`);
    if (subGroup) params.push(`subGroup=${subGroup}`);
    if (buyerCode) params.push(`buyerCode=${buyerCode}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const res = await fetch(url, { headers });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'خطا در دریافت اطلاعات کالاها');
    }

    const products = result.data || [];
    const images = await getProductImages();

    return {
      products: products.map(p => ({
        ...p,
        imageUrl: images[p.Code] || null,
        Price: p.CustomerPrice || p.PriceF1, // استفاده از CustomerPrice
        PriceF1: p.PriceF1,
        PriceF2: p.PriceF2,
        PriceF3: p.PriceF3,
        PriceF4: p.PriceF4,
        PriceF5: p.PriceF5,
        PriceF6: p.PriceF6,
        Mbna: p.Mbna,
        MainUnit: p.MainUnit,
        SlaveUnit: p.SlaveUnit,
        MainGroupCode: p.MainGroupCode,
        SubGroupCode: p.SubGroupCode
      })),
      pricing: result.pricing || {
        buyerCode: buyerCode || null,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      }
    };
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن کالاهای یک سرگروه با قیمت مشتری ---
export const getProductsByMainGroup = async (mainGroupCode, buyerCode = null) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/kala/by-main-group/${mainGroupCode}`;
    if (buyerCode) {
      url += `?buyerCode=${buyerCode}`;
    }
    
    const res = await fetch(url, { headers });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'خطا در دریافت اطلاعات کالاها');
    }

    const products = result.data || [];
    const images = await getProductImages();

    return {
      products: products.map(p => ({
        ...p,
        imageUrl: images[p.Code] || null,
        Price: p.CustomerPrice || p.PriceF1,
        PriceF1: p.PriceF1,
        PriceF2: p.PriceF2,
        PriceF3: p.PriceF3,
        PriceF4: p.PriceF4,
        PriceF5: p.PriceF5,
        PriceF6: p.PriceF6,
        Mbna: p.Mbna,
        MainUnit: p.MainUnit,
        SlaveUnit: p.SlaveUnit,
        MainGroupCode: p.MainGroupCode,
        SubGroupCode: p.SubGroupCode
      })),
      pricing: result.pricing || {
        buyerCode: buyerCode || null,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      }
    };
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن کالاهای یک زیرگروه با قیمت مشتری ---
export const getProductsBySubGroup = async (subGroupCode, buyerCode = null) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/kala/by-sub-group/${subGroupCode}`;
    if (buyerCode) {
      url += `?buyerCode=${buyerCode}`;
    }
    
    const res = await fetch(url, { headers });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'خطا در دریافت اطلاعات کالاها');
    }

    const products = result.data || [];
    const images = await getProductImages();

    return {
      products: products.map(p => ({
        ...p,
        imageUrl: images[p.Code] || null,
        Price: p.CustomerPrice || p.PriceF1,
        PriceF1: p.PriceF1,
        PriceF2: p.PriceF2,
        PriceF3: p.PriceF3,
        PriceF4: p.PriceF4,
        PriceF5: p.PriceF5,
        PriceF6: p.PriceF6,
        Mbna: p.Mbna,
        MainUnit: p.MainUnit,
        SlaveUnit: p.SlaveUnit,
        MainGroupCode: p.MainGroupCode,
        SubGroupCode: p.SubGroupCode
      })),
      pricing: result.pricing || {
        buyerCode: buyerCode || null,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      }
    };
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن قیمت یک کالا برای مشتری خاص ---
export const getProductPrice = async (productCode, buyerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/kala/price/${productCode}/${buyerCode}`, { headers });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'خطا در دریافت قیمت کالا');
    }

    return result.data;
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن URL عکس‌های کالاها ---
export const getProductImages = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/kala/gallery`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن لیست مشتری‌های روزانه ---
export const getDailyBuyers = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/rozmasir`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- گرفتن مشتری‌های Map ---
export const getMapBuyers = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/rozmasir/map`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- ثبت موقعیت مشتری ---
export const registerBuyerLocation = async (buyerCode, latitude, longitude) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/buyer/location`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        buyerCode: buyerCode,
        latitude: latitude,
        longitude: longitude
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت لوکیشن');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- بررسی اینکه آیا مشتری لوکیشن دارد یا نه ---
export const checkBuyerLocationStatus = async (buyerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/rozmasir/map`, { headers });
    const mapBuyers = await handleResponse(res);

    const buyerWithLocation = mapBuyers.find(b => String(b.code) === String(buyerCode));
    
    return {
      hasLocation: !!buyerWithLocation,
      buyerData: buyerWithLocation || null
    };
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

export const getLastFactorNumber = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/factor/last-number`, { 
      headers,
    });
    


    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در دریافت شماره:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok) {
      console.log('❌ خطای HTTP در دریافت شماره:', data);
      throw new Error(data.message || `خطای سرور: ${res.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در دریافت شماره:', data);
      throw new Error(data.message || 'خطا در دریافت شماره فاکتور');
    }

    console.log('✅ آخرین شماره فاکتور دریافت شد:', data.data);
    return data.data;

  } catch (err) {
    console.log('❌ خطای کامل در دریافت شماره فاکتور:', err);
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ثبت فاکتور جدید ---
export const saveFactor = async (factorData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📤 ارسال فاکتور به سرور:', factorData);

    const res = await fetch(`${baseUrl}/api/factor/save`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(factorData),
    });

    console.log('📥 پاسخ ثبت فاکتور:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });

    let data;
    try {
      const text = await res.text();
      console.log('📄 متن پاسخ ثبت فاکتور:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در ثبت فاکتور:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok) {
      console.log('❌ خطای HTTP در ثبت فاکتور:', data);
      
      if (res.status === 401 || res.status === 403) {
        await AsyncStorage.multiRemove(['token', 'user']);
        throw new Error('احراز هویت نامعتبر، لطفاً دوباره وارد شوید');
      }
      
      if (res.status === 400) {
        throw new Error(data.message || 'داده‌های ارسالی نامعتبر است');
      }
      
      if (res.status === 500) {
        throw new Error('خطای داخلی سرور');
      }
      
      throw new Error(data.message || `خطای سرور: ${res.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در ثبت فاکتور:', data);
      
      if (data.message?.includes('تکراری')) {
        throw new Error('شماره فاکتور تکراری است');
      }
      
      if (data.message?.includes('مشتری')) {
        throw new Error('مشتری یافت نشد');
      }
      
      throw new Error(data.message || 'خطا در ثبت فاکتور');
    }

    console.log('✅ فاکتور با موفقیت ثبت شد:', data.data);
    return data;

  } catch (err) {
    console.log('❌ خطای کامل در ثبت فاکتور:', err);
    
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    
    if (err.message.includes('توکن') || err.message.includes('token')) {
      await AsyncStorage.multiRemove(['token', 'user']);
      throw new Error('احراز هویت نامعتبر، لطفاً دوباره وارد شوید');
    }
    
    throw err;
  }
};

// --- تست اتصال به سرور ---
export const testServerConnection = async () => {
  try {
    const baseUrl = await getServerUrl();
    console.log('🔗 تست اتصال به:', baseUrl);
    
    const token = await AsyncStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(`${baseUrl}/api/kala?limit=1`, { 
      headers,
      method: 'GET'
    });
    
    console.log('🔗 نتیجه تست اتصال:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });

    const isConnected = res.status !== 0 && res.status !== 500;
    
    return { 
      success: isConnected,
      status: res.status,
      message: isConnected ? 
        (res.ok ? 'اتصال موفق' : `سرور پاسخ داد (کد: ${res.status})`) 
        : 'اتصال ناموفق'
    };
  } catch (error) {
    console.log('❌ خطای تست اتصال:', error);
    
    let errorMessage = 'اتصال ناموفق';
    if (error.message === 'Network request failed') {
      errorMessage = 'سرور در دسترس نیست';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'پاسخ سرور طولانی شد';
    }
    
    return {
      success: false,
      status: 0,
      message: errorMessage
    };
  }
};

// --- گرفتن فاکتورهای بازه‌ای ---
export const getFactorReport = async (moen, startDate, endDate) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();

    const res = await fetch(`${baseUrl}/api/factor/report`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ moen, startDate, endDate }),
    });

    const data = await handleResponse(res);

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- دریافت لیست شهرها ---
export const getCities = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/cities`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- دریافت لیست مسیرها ---
export const getMasir = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/masir`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- دریافت لیست صنف‌ها ---
export const getSanf = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/sanf`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- تولید کد مشتری جدید ---
export const getNewBuyerCode = async (cityCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/buyer/new-code?cityCode=${cityCode}`, { headers });
    return await handleResponse(res);
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- ثبت مشتری در جدول Buyer ---
export const createBuyer = async (customerData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/buyer/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(customerData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت مشتری');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ثبت مشتری در جدول Tafzily ---
export const createTafzily = async (customerData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const tafzilyData = {
      tafzily: customerData.buyerCode,
      tafzilySharh: customerData.name,
      tafzilyAdd: customerData.addB
    };

    const res = await fetch(`${baseUrl}/api/tafzily/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(tafzilyData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت مشتری در سیستم تفضیلی');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ثبت مشتری در جدول BuyerFCode ---
export const createBuyerFCode = async (customerData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const buyerFCodeData = {
      buyerCode: customerData.buyerCode,
      moen: customerData.cityCode,
      moenName: customerData.cityName,
      tafzilyName: customerData.name
    };

    const res = await fetch(`${baseUrl}/api/buyerfcode/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(buyerFCodeData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت مشتری در سیستم کدگذاری');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ثبت مشتری در جدول RozMasir ---
export const createRozMasir = async (customerData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const rozMasirData = {
      code: customerData.buyerCode,
      name: customerData.name,
      masirCode: customerData.masirCode,
      masirName: customerData.masirName,
      tel: customerData.tel
    };

    const res = await fetch(`${baseUrl}/api/rozmasir/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(rozMasirData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (res.status === 500 && data.error?.includes('IDENTITY_INSERT')) {
      return { 
        success: true, 
        message: 'مشتری ثبت شد'
      };
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت مشتری در برنامه روزانه');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ثبت کامل مشتری در همه جدول‌ها ---
export const createCompleteCustomer = async (customerData) => {
  try {
    await createBuyer(customerData);
    await createTafzily(customerData);
    await createBuyerFCode(customerData);

    try {
      await createRozMasir(customerData);
    } catch (rozMasirError) {
      // خطای RozMasir نادیده گرفته می‌شود
    }

    return { 
      success: true, 
      message: 'مشتری با موفقیت در سیستم ثبت شد'
    };

  } catch (err) {
    throw err;
  }
};

// --- بررسی تکراری بودن مشتری ---
export const checkDuplicateCustomer = async (customerData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const checkData = {
      name: customerData.name,
      tel: customerData.tel,
      mobile: customerData.mobile,
      addB: customerData.addB,
      cityCode: customerData.cityCode
    };

    const res = await fetch(`${baseUrl}/api/buyer/check-duplicate`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(checkData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok) {
      throw new Error(data.message || 'خطا در بررسی تکراری بودن');
    }

    return data;

  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};
// --- لاگین مشتری ---
export const loginCustomer = async (buyerCode, password) => {
  try {
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerCode, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'کد مشتری یا رمز عبور اشتباه است');
    }

    if (data.token) await AsyncStorage.setItem('token', data.token);
    
    const userData = {
      NOF: data.data.customerId,
      NameF: data.data.name,
      mob: data.data.mobile,
      role: 'customer',
      UserType: 'customer',
      address: data.data.address,
      city: data.data.city,
      buyerCode: data.data.buyerCode || data.data.customerId // اضافه کردن buyerCode
    };
    
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    // ✨ دریافت وضعیت manfi برای مشتری بعد از لاگین موفق
    try {
      const manfiResponse = await getManfiStatus();
      if (manfiResponse.success) {
        console.log('✅ وضعیت manfi مشتری دریافت شد:', manfiResponse.data.hasManfiAccess);
        
        await AsyncStorage.setItem('manfiAccess', JSON.stringify(manfiResponse.data.hasManfiAccess));
        
        data.manfiAccess = manfiResponse.data.hasManfiAccess;
      }
    } catch (manfiError) {
      console.log('⚠️ خطا در دریافت وضعیت manfi مشتری:', manfiError);
      data.manfiAccess = false;
    }

    return { ...data, data: userData };
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- بررسی مشتری با BuyerCode ---
export const checkCustomer = async (buyerCode) => {
  try {
    // اعتبارسنجی: buyerCode باید عددی باشد
    const parsedBuyerCode = parseInt(buyerCode);
    if (isNaN(parsedBuyerCode)) {
      throw new Error('کد مشتری باید عددی باشد');
    }

    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/customer/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerCode: parsedBuyerCode }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در بررسی مشتری');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- ایجاد پسورد برای مشتری با BuyerCode ---
export const createCustomerPassword = async (buyerCode, password) => {
  try {
    // اعتبارسنجی: buyerCode باید عددی باشد
    const parsedBuyerCode = parseInt(buyerCode);
    if (isNaN(parsedBuyerCode)) {
      throw new Error('کد مشتری باید عددی باشد');
    }

    if (!password || password.length < 4) {
      throw new Error('رمز عبور باید حداقل ۴ کاراکتر باشد');
    }

    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/customer/create-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerCode: parsedBuyerCode, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ایجاد رمز عبور');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- تغییر پسورد مشتری با BuyerCode ---
export const changeCustomerPassword = async (buyerCode, oldPassword, newPassword) => {
  try {
    // اعتبارسنجی: buyerCode باید عددی باشد
    const parsedBuyerCode = parseInt(buyerCode);
    if (isNaN(parsedBuyerCode)) {
      throw new Error('کد مشتری باید عددی باشد');
    }

    if (!newPassword || newPassword.length < 4) {
      throw new Error('رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
    }

    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/customer/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        buyerCode: parsedBuyerCode, 
        oldPassword, 
        newPassword 
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در تغییر رمز عبور');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- فرآیند کامل ورود/ثبت نام مشتری با BuyerCode ---
export const customerLoginOrRegister = async (buyerCode, password) => {
  try {
    // اعتبارسنجی: buyerCode باید عددی باشد
    const parsedBuyerCode = parseInt(buyerCode);
    if (isNaN(parsedBuyerCode)) {
      throw new Error('کد مشتری باید عددی باشد');
    }

    // اول بررسی کن مشتری وجود دارد یا نه
    const checkResult = await checkCustomer(parsedBuyerCode);
    
    if (!checkResult.customerExists) {
      throw new Error('مشتری با این کد یافت نشد');
    }

    if (checkResult.hasPassword) {
      // اگر پسورد دارد، لاگین کن
      return await loginCustomer(parsedBuyerCode, password);
    } else {
      // اگر پسورد ندارد، ایجاد کن و سپس لاگین کن
      await createCustomerPassword(parsedBuyerCode, password);
      return await loginCustomer(parsedBuyerCode, password);
    }
  } catch (err) {
    throw err;
  }
};

// --- لاگین هوشمند (تشخیص خودکار نوع کاربر) ---
export const smartLogin = async (username, password) => {
  try {
    // اگر username عددی است، مشتری در نظر بگیر
    const parsedUsername = parseInt(username);
    const isCustomer = !isNaN(parsedUsername);
    
    if (isCustomer) {
      return await loginCustomer(parsedUsername, password);
    } else {
      // ابتدا سعی کن با سیستم اصلی لاگین کنی
      try {
        return await login(username, password);
      } catch (loginError) {
        // اگر خطا داد، شاید تحویل‌دار باشد
        // فعلاً فقط سیستم اصلی را برگردان
        throw loginError;
      }
    }
  } catch (err) {
    throw err;
  }
};
// 🔥 تابع جدید: دریافت اطلاعات فروشنده مشتری
export const getCustomerSellerInfo = async (customerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('👤 دریافت اطلاعات فروشنده برای مشتری:', customerCode);
    
    // استفاده از مسیر موجود check customer که الان اصلاح شده
    const url = `${baseUrl}/api/customer/check`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ buyerCode: customerCode }),
    });

    console.log('📥 پاسخ اطلاعات فروشنده:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ اطلاعات فروشنده:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در اطلاعات فروشنده:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در اطلاعات فروشنده:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در اطلاعات فروشنده:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات فروشنده');
    }

    console.log('✅ اطلاعات فروشنده دریافت شد:', {
      sellerCode: data.data?.sellerInfo?.sellerCode,
      sellerName: data.data?.sellerInfo?.sellerName
    });

    return {
      success: true,
      sellerInfo: data.data.sellerInfo || {
        sellerCode: 1, // پیش‌فرض
        sellerName: 'فروشنده پیش‌فرض'
      },
      customerInfo: data.data
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت اطلاعات فروشنده:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    
    // در صورت خطا، مقادیر پیش‌فرض برگردان
    return {
      success: false,
      sellerInfo: {
        sellerCode: 1,
        sellerName: 'فروشنده پیش‌فرض'
      },
      error: error.message
    };
  }
};
// --- بازیابی کد مشتری با موبایل ---
export const recoverBuyerCode = async (mobile) => {
  try {
    const baseUrl = await getServerUrl();
    const res = await fetch(`${baseUrl}/api/customer/recover-buyercode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در بازیابی کد مشتری');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- گرفتن اطلاعات کاربر از AsyncStorage ---

const getUserInfo = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    if (!userString) {
      return null;
    }
    
    const user = JSON.parse(userString);

    
    // 🔍 پیدا کردن ID کاربر با بررسی همه فیلدهای ممکن
    let userId = user.NOF || 
                 user.id || 
                 user.UserID || 
                 user.userId || 
                 user.Code ||
                 user.por || // برای تحویل‌دار
                 user.buyerCode; // برای مشتری
    
    // 🔍 پیدا کردن نام کاربر
    let userName = user.NameF || 
                   user.name || 
                   user.FullName ||
                   user.username;
    
    // 🔍 تشخیص نقش کاربر
    let userRole = user.role || user.UserType || 'seller';
    
    // 🔍 buyerCode برای مشتری‌ها
    let buyerCode = user.buyerCode || (userRole === 'customer' ? userId : undefined);
    
    // 🔍 موبایل
    let mobile = user.mobile || user.mob || user.phone;

    
    return {
      id: userId,
      name: userName,
      role: userRole,
      userType: user.UserType,
      buyerCode: buyerCode,
      mobile: mobile,
      // ذخیره کل داده برای debug
      _raw: user
    };
  } catch (error) {
    console.log('❌ خطا در دریافت اطلاعات کاربر:', error);
    return null;
  }
};
export const isDelivery = async () => {
  const role = await getUserRole();
  return role === 'delivery';
};

// --- بررسی نقش کاربر ---
export const getUserRole = async () => {
  const userInfo = await getUserInfo();
  return userInfo?.role || 'seller';
};

// --- بررسی اینکه آیا کاربر فروشنده است ---
export const isSeller = async () => {
  const role = await getUserRole();
  return role === 'seller';
};

// --- بررسی اینکه آیا کاربر مشتری است ---
export const isCustomer = async () => {
  const role = await getUserRole();
  return role === 'customer';
};

// --- دریافت کد مشتری کاربر فعلی ---
export const getCurrentBuyerCode = async () => {
  const userInfo = await getUserInfo();
  return userInfo?.buyerCode || null;
};
// ============================================
// 💬 Chat API Functions
// ============================================

/**
 * تبدیل پیام‌های دریافتی از API به فرمت استاندارد
 */
const formatChatMessage = (msg) => {
  return {
    id: msg.id || msg.Id || msg._id || `msg_${Date.now()}_${Math.random()}`,
    senderId: msg.senderId || msg.SenderId || msg.sender_id,
    senderName: msg.senderName || msg.SenderName || msg.sender_name || 'کاربر',
    text: msg.text || msg.Text || msg.message || '',
    timestamp: msg.timestamp || msg.Time || msg.createdAt || new Date().toISOString(),
    groupId: msg.groupId || msg.GroupId || msg.group_id
  };
};

/**
 * دریافت پیام‌های قبلی یک گروه
 */
export const fetchGroupMessages = async (groupId) => {
  try {
    console.log('📡 Fetching messages for group:', groupId);
    
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    // سعی اول: با پارامترهای صفحه‌بندی
    let url = `${baseUrl}/api/chat/${groupId}?limit=100`;
    
    console.log('📡 Request URL:', url);
    
    let response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/json'
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    // اگر خطای 500 بود، از endpoint جایگزین استفاده کن
    if (!response.ok && response.status === 500) {
      console.log('⚠️ Server error 500, trying alternative endpoint...');
      
      const alternativeUrl = `${baseUrl}/api/chat/messages/${groupId}`;
      console.log('📡 Trying alternative URL:', alternativeUrl);
      
      response = await fetchWithTimeout(alternativeUrl, {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      
      // برای خطای 500، پیام خالی برگردان
      if (response.status === 500) {
        console.log('⚠️ Returning empty messages due to server error');
        return [];
      }
      
      throw new Error(`خطای سرور: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📦 API response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'دریافت پیام‌ها ناموفق بود');
    }
    
    if (!result.data) {
      console.warn('⚠️ No messages data in response');
      return [];
    }
    
    // اگر data آرایه است
    if (Array.isArray(result.data)) {
      const messages = result.data.map(formatChatMessage);
      console.log('✅ Successfully fetched messages:', messages.length);
      return messages;
    }
    
    console.warn('⚠️ Unexpected data format');
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * ارسال پیام به سرور (HTTP fallback)
 */
export const sendMessageHTTP = async (messageData) => {
  try {
    console.log('📤 Sending message via HTTP:', messageData);
    
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/send`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      throw new Error(`خطای ارسال: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Message sent successfully:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت اطلاعات گروه
 */
export const fetchGroupInfo = async (groupId) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/groups/${groupId}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`خطای دریافت اطلاعات گروه: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
    
  } catch (error) {
    console.error('❌ Error fetching group info:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * علامت‌گذاری پیام‌ها به عنوان خوانده شده
 */
export const markMessagesAsRead = async (groupId, messageIds) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/read`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ groupId, messageIds })
    });
    
    if (!response.ok) {
      throw new Error('خطا در علامت‌گذاری پیام‌ها');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    // Don't throw - this is not critical
    return null;
  }
};

/**
 * حذف پیام
 */
export const deleteMessage = async (messageId) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/messages/${messageId}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error('خطا در حذف پیام');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * ویرایش پیام
 */
export const editMessage = async (messageId, newText) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/messages/${messageId}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ text: newText })
    });
    
    if (!response.ok) {
      throw new Error('خطا در ویرایش پیام');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('❌ Error editing message:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * جستجو در پیام‌ها
 */
export const searchMessages = async (groupId, query) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/search?groupId=${groupId}&q=${encodeURIComponent(query)}`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error('خطا در جستجو');
    }
    
    const result = await response.json();
    return (result.data || []).map(formatChatMessage);
    
  } catch (error) {
    console.error('❌ Error searching messages:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * بررسی سلامت سرور چت
 */
export const checkChatServerHealth = async () => {
  try {
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/status`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, 5000); // 5 second timeout for health check
    
    return response.ok;
    
  } catch (error) {
    console.error('❌ Server health check failed:', error);
    return false;
  }
};

/**
 * دریافت لیست گروه‌های چت کاربر
 */
export const getUserChatGroups = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/groups`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error('خطا در دریافت لیست گروه‌ها');
    }
    
    const result = await response.json();
    return result.data || [];
    
  } catch (error) {
    console.error('❌ Error fetching chat groups:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * ایجاد گروه چت جدید
 */
export const createChatGroup = async (groupData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/groups`;
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(groupData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`خطا در ایجاد گروه: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Group created successfully:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating chat group:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت آمار چت
 */
export const getChatStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/chat/stats`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error('خطا در دریافت آمار چت');
    }
    
    const result = await response.json();
    return result.data || {};
    
  } catch (error) {
    console.error('❌ Error fetching chat stats:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت تعداد پیام‌های خوانده نشده
 */
export const getUnreadMessagesCount = async (groupId, lastReadTime) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    let url = `${baseUrl}/api/chat/${groupId}/unread-count`;
    
    if (lastReadTime) {
      url += `?lastReadTime=${encodeURIComponent(lastReadTime)}`;
    }
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const result = await response.json();
    return result.count || 0;
    
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return 0;
  }
};

// تابع اصلاح شده برای دریافت عملکرد فروشنده‌ها
export const getSellerPerformance = async (month, year) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📊 دریافت عملکرد فروشنده‌ها:', { 
      month, 
      year 
    });
    
    const response = await fetch(`${baseUrl}/api/seller/performance`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ 
        month: month, 
        year: year  // حالا سال شمسی می‌فرستیم
      }),
    });

    console.log('📥 پاسخ عملکرد فروشنده‌ها:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ عملکرد فروشنده‌ها:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در عملکرد فروشنده‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در عملکرد فروشنده‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در عملکرد فروشنده‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات عملکرد');
    }

    console.log('✅ اطلاعات عملکرد فروشنده‌ها دریافت شد:', data.data?.length || 0, 'رکورد');
    return data.data || [];

  } catch (error) {
    console.log('❌ خطای کامل در دریافت عملکرد فروشنده‌ها:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت سفارشات مشتری
 */
export const getCustomerOrders = async (buyerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📦 دریافت سفارشات مشتری:', buyerCode);
    
    const response = await fetchWithTimeout(`${baseUrl}/api/orders/${buyerCode}`, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ سفارشات:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ سفارشات:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در سفارشات:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در سفارشات:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در سفارشات:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات سفارشات');
    }

    console.log('✅ سفارشات دریافت شد:', {
      orders: data.orders?.length || 0,
      returns: data.returns?.length || 0
    });

    return {
      orders: data.orders || [],
      returns: data.returns || []
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت سفارشات:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت سفارشات مشتری (فقط سفارشات)
 */
export const getOrders = async (buyerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📦 دریافت لیست سفارشات:', buyerCode);
    
    const response = await fetchWithTimeout(`${baseUrl}/api/orders/${buyerCode}`, {
      method: 'GET',
      headers
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'خطا در دریافت اطلاعات سفارشات');
    }

    console.log('✅ سفارشات دریافت شد:', data.orders?.length || 0, 'سفارش');
    return data.orders || [];

  } catch (error) {
    console.log('❌ خطا در دریافت سفارشات:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت برگشتی‌های مشتری (فقط برگشتی‌ها)
 */
export const getCustomerReturns = async (buyerCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('🔄 دریافت برگشتی‌های مشتری:', buyerCode);
    
    const response = await fetchWithTimeout(`${baseUrl}/api/returns/${buyerCode}`, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ برگشتی‌ها:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ برگشتی‌ها:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در برگشتی‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در برگشتی‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در برگشتی‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات برگشتی‌ها');
    }

    console.log('✅ برگشتی‌ها دریافت شد:', data.returns?.length || 0, 'برگشتی');
    return data.returns || [];

  } catch (error) {
    console.log('❌ خطای کامل در دریافت برگشتی‌ها:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت جزیات سفارش یا برگشتی
 */
export const getOrderDetails = async (orderNumber, type) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📋 دریافت جزیات:', { orderNumber, type });
    
    const response = await fetchWithTimeout(`${baseUrl}/api/order-details/${orderNumber}/${type}`, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ جزیات:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ جزیات:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در جزیات:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در جزیات:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در جزیات:', data);
      throw new Error(data.message || 'خطا در دریافت جزیات');
    }

    console.log('✅ جزیات دریافت شد:', data.details?.length || 0, 'آیتم');
    return {
      orderNumber: data.orderNumber,
      type: data.type,
      details: data.details || []
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت جزیات:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت مانده حساب و پرداخت‌های مشتری
 */
export const getCustomerBalance = async (tafzilyCode) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('💰 دریافت مانده حساب مشتری:', tafzilyCode);
    
    const response = await fetchWithTimeout(`${baseUrl}/api/balance/${tafzilyCode}`, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ مانده حساب:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ مانده حساب:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در مانده حساب:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در مانده حساب:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در مانده حساب:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات مانده حساب');
    }

    console.log('✅ مانده حساب دریافت شد:', {
      balance: data.balance,
      transactions: data.data?.length || 0
    });

    return data;

  } catch (error) {
    console.log('❌ خطای کامل در دریافت مانده حساب:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};
// ==================== API درخواست‌های مشتری (نظرات و واریزی‌ها) ====================

// --- ایجاد درخواست جدید (نظر یا واریزی) ---
export const createCustomerRequest = async (requestData) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📤 ارسال درخواست مشتری:', requestData);

    const res = await fetch(`${baseUrl}/api/customer/request`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در ثبت درخواست');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- دریافت تاریخچه درخواست‌های مشتری ---
export const getCustomerRequests = async (type = 'all', page = 1, limit = 10) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/customer/requests?page=${page}&limit=${limit}`;
    if (type !== 'all') {
      url += `&type=${type}`;
    }

    const res = await fetch(url, { headers });
    const data = await handleResponse(res);

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- دریافت جزئیات یک درخواست خاص ---
export const getCustomerRequestDetails = async (requestId) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/customer/request/${requestId}`, { headers });
    const data = await handleResponse(res);

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- آپلود فایل برای درخواست ---
export const uploadRequestFile = async (requestId, filePath) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/customer/request/${requestId}/file`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({ filePath }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در آپلود فایل');
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};

// --- دریافت آمار درخواست‌های مشتری ---
export const getCustomerRequestsStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/customer/requests-stats`, { headers });
    const data = await handleResponse(res);

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- دریافت پروفایل مشتری ---
export const getCustomerProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const res = await fetch(`${baseUrl}/api/customer/profile`, { headers });
    const data = await handleResponse(res);

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};


// 🔥 تابع اصلاح شده برای دریافت فاکتورهای ارسال شده با فیلتر نقش کاربر
export const getSentInvoices = async (startDate, endDate) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();

    // دریافت اطلاعات کاربر
    const userInfo = await getUserInfo();
    console.log('👤 اطلاعات کاربر برای فیلتر فاکتورها:', userInfo);

    const url = `${baseUrl}/api/seller/sent-invoices`;
    
    const requestBody = {
      startDate,
      endDate,
      userInfo: {
        role: userInfo?.role || 'seller',
        userId: userInfo?.id,
        buyerCode: userInfo?.buyerCode,
        userType: userInfo?.userType
      }
    };

    console.log('📤 درخواست فاکتورهای ارسال شده:', requestBody);

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await handleResponse(response);
  
    console.log('✅ فاکتورهای دریافت شده:', {
      total: data.data?.length || data?.length || 0,
      role: userInfo?.role,
      buyerCode: userInfo?.buyerCode
    });

    // 🔥 اصلاح: داده مستقیم در data هست نه data.data
    return {
      invoices: data.data || data || [],  // پشتیبانی از هر دو فرمت
      summary: data.summary || {},
      userRole: userInfo?.role
    };

  } catch (error) {
    console.log('❌ خطا در دریافت فاکتورهای ارسال شده:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};
// ==================== API خروجی‌های تحویل‌دار ====================

/**
 * دریافت لیست خروجی‌های تحویل‌دار
 * @param {string} date - تاریخ اختیاری (فرمت: 1404/05/02)
 * @returns {Promise<Object>} - لیست خروجی‌ها گروه‌بندی شده بر اساس تاریخ
 */
// در فایل api.js - اصلاح تابع getDeliveryOrders
export const getDeliveryOrders = async (exitCode = null) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/delivery/delivery-orders`;
    
    // 🔥 اصلاح: ارسال exitCode به عنوان query parameter
    if (exitCode) {
      url += `?exitCode=${encodeURIComponent(exitCode)}`;
    }
    
    console.log('📤 URL درخواست:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در خروجی‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در خروجی‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در خروجی‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات خروجی‌ها');
    }

    console.log('✅ اطلاعات خروجی دریافت شد:', {
      exitCodeRequested: exitCode,
      exitCodeInResponse: data.data?.selectedExit?.exitCode,
      totalExits: data.data?.totalExits
    });

    return {
      success: true,
      data: data.data || {
        deliveryId: null,
        deliveryName: '',
        totalExits: 0,
        dates: []
      },
      message: data.message || 'دریافت اطلاعات با موفقیت انجام شد'
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت خروجی‌ها:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * دریافت پروفایل تحویل‌دار
 * @returns {Promise<Object>} - اطلاعات تحویل‌دار
 */
export const getDeliveryDates = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/delivery/delivery-dates`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });


    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در تاریخ‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در تاریخ‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در تاریخ‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت لیست تاریخ‌ها');
    }

    console.log('✅ لیست تاریخ‌ها دریافت شد:', data.data?.dates?.length || 0);

    // 🔥 اصلاح: برگرداندن کل پاسخ سرور
    return {
      success: true,
      dates: data.data?.dates || [],
      message: data.message || 'دریافت تاریخ‌ها با موفقیت انجام شد'
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت تاریخ‌ها:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};

/**
 * بررسی وضعیت تحویل‌دار
 * @returns {Promise<boolean>} - آیا کاربر تحویل‌دار است؟
 */

// 🔥 تابع جدید: دریافت لیست خروجی‌های تحویل‌دار (برای فیلتر)
export const getDeliveryExits = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('📋 دریافت لیست خروجی‌ها برای فیلتر...');
    
    const url = `${baseUrl}/api/delivery/delivery-exits`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ لیست خروجی‌ها:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در لیست خروجی‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در لیست خروجی‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در لیست خروجی‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت لیست خروجی‌ها');
    }

    console.log('✅ لیست خروجی‌ها دریافت شد:', data.data?.exits?.length || 0);

    return {
      success: true,
      data: data.data,
      message: data.message || 'دریافت لیست خروجی‌ها با موفقیت انجام شد'
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت لیست خروجی‌ها:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};
export const isDeliveryPerson = async () => {
  try {
    const userInfo = await getUserInfo();
    return userInfo?.role === 'delivery' || userInfo?.UserType === 'delivery';
  } catch (error) {
    console.log('❌ خطا در بررسی نقش تحویل‌دار:', error);
    return false;
  }
};
export const deliveryLogin = async (name, mobile) => {
  try {
    const baseUrl = await getServerUrl();
    const url = `${baseUrl}/api/delivery/delivery-login`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, mobile }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'اطلاعات ورود نامعتبر است');
    }

    // ذخیره توکن و اطلاعات کاربر
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    if (data.data) {
      await AsyncStorage.setItem('user', JSON.stringify(data.data));
    }

    // ✨ دریافت وضعیت manfi برای تحویل‌دار بعد از لاگین موفق
    try {
      const manfiResponse = await getManfiStatus();
      if (manfiResponse.success) {
        console.log('✅ وضعیت manfi تحویل‌دار دریافت شد:', manfiResponse.data.hasManfiAccess);
        
        await AsyncStorage.setItem('manfiAccess', JSON.stringify(manfiResponse.data.hasManfiAccess));
        
        data.manfiAccess = manfiResponse.data.hasManfiAccess;
      }
    } catch (manfiError) {
      console.log('⚠️ خطا در دریافت وضعیت manfi تحویل‌دار:', manfiError);
      data.manfiAccess = false;
    }

    return data;
  } catch (err) {
    if (err.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw err;
  }
};
// 📋 دریافت اقلام فاکتور
export const getInvoiceItems = async (invoiceNumber) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    const url = `${baseUrl}/api/delivery/invoice-items/${invoiceNumber}`;
    
    console.log('📋 دریافت اقلام فاکتور:', invoiceNumber);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers
    });

    console.log('📥 پاسخ اقلام فاکتور:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در اقلام فاکتور:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در اقلام فاکتور:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در اقلام فاکتور:', data);
      throw new Error(data.message || 'خطا در دریافت اطلاعات اقلام فاکتور');
    }

    console.log('✅ اقلام فاکتور دریافت شد:', {
      itemCount: data.data?.items?.length || 0,
      totalAmount: data.data?.summary?.totalAmount
    });

    return {
      success: true,
      data: data.data,
      message: data.message || 'دریافت اقلام فاکتور با موفقیت انجام شد'
    };

  } catch (error) {
    console.log('❌ خطای کامل در دریافت اقلام فاکتور:', error);
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    throw error;
  }
};
// 🔥 تابع جدید: دریافت مسیر بهینه
export const getOptimizedRoute = async (locations, userLat, userLng) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const baseUrl = await getServerUrl();
    
    const url = `${baseUrl}/api/delivery/optimize-route`;

    console.log('🗺️ درخواست مسیر بهینه:', { 
      totalLocations: locations.length,
      userLocation: { lat: userLat, lng: userLng }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: locations,
        startLat: userLat,
        startLng: userLng
      })
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در مسیر بهینه:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در مسیر بهینه:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در مسیر بهینه:', data);
      throw new Error(data.message || 'خطا در محاسبه مسیر بهینه');
    }

    console.log('✅ مسیر بهینه دریافت شد:', {
      totalStops: data.data?.totalStops,
      totalDistance: data.data?.totalDistanceKm + ' کیلومتر'
    });

    return {
      success: true,
      data: data.data,
      message: data.message || 'مسیر بهینه محاسبه شد'
    };

  } catch (error) {
    console.error('❌ Error in getOptimizedRoute:', error);
    
    return {
      success: false,
      data: null,
      message: error.message || 'خطا در محاسبه مسیر بهینه'
    };
  }
};
// 🔍 دریافت وضعیت manfi کاربر
export const getManfiStatus = async () => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();
    
    console.log('🔍 دریافت وضعیت manfi کاربر...');
    
    const url = `${baseUrl}/api/manfi-status`;
    console.log('📡 URL درخواست:', url);

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/json'
      }
    });

    console.log('📥 پاسخ وضعیت manfi:', {
      status: response.status,
      statusText: response.statusText
    });

    let data;
    try {
      const text = await response.text();
      console.log('📄 متن پاسخ وضعیت manfi:', text);
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در وضعیت manfi:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در وضعیت manfi:', data);
      
      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.multiRemove(['token', 'user']);
        throw new Error('احراز هویت نامعتبر، لطفاً دوباره وارد شوید');
      }
      
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در وضعیت manfi:', data);
      throw new Error(data.message || 'خطا در دریافت وضعیت دسترسی');
    }


    return data;

  } catch (error) {
    console.log('❌ خطای کامل در دریافت وضعیت manfi:', error);
    
    if (error.message === 'Network request failed') {
      throw new Error('ارتباط با سرور برقرار نشد');
    }
    
    if (error.message.includes('توکن') || error.message.includes('token')) {
      await AsyncStorage.multiRemove(['token', 'user']);
      throw new Error('احراز هویت نامعتبر، لطفاً دوباره وارد شوید');
    }
    
    throw error;
  }
};

// 🔥 اصلاح getDeliveryLocations با فیلتر تاریخ
export const getDeliveryLocations = async (date = null) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const baseUrl = await getServerUrl();
    
    let url = `${baseUrl}/api/delivery/delivery-locations`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }

    console.log('📍 API Call - getDeliveryLocations:', { url, date });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.log('❌ خطای پارس در لوکیشن‌ها:', parseError);
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!response.ok) {
      console.log('❌ خطای HTTP در لوکیشن‌ها:', data);
      throw new Error(data.message || `خطای سرور: ${response.status}`);
    }

    if (!data.success) {
      console.log('❌ خطای منطقی در لوکیشن‌ها:', data);
      throw new Error(data.message || 'خطا در دریافت لوکیشن‌ها');
    }



    return {
      success: true,
      data: data.data,
      message: data.message || 'دریافت لوکیشن‌ها با موفقیت انجام شد'
    };

  } catch (error) {
    console.error('❌ Error in getDeliveryLocations:', error);
    
    return {
      success: false,
      data: { locations: [] },
      message: error.message || 'خطا در ارتباط با سرور'
    };
  }
};
// 🔍 بررسی وضعیت manfi از AsyncStorage
export const getStoredManfiStatus = async () => {
  try {
    const manfiString = await AsyncStorage.getItem('manfiAccess');
    if (manfiString) {
      const hasManfiAccess = JSON.parse(manfiString);
      return hasManfiAccess;
    }
    return false;
  } catch (error) {
    console.log('❌ خطا در خواندن وضعیت manfi از حافظه:', error);
    return false;
  }
};
export const refreshManfiStatus = async () => {
  try {
    const manfiResponse = await getManfiStatus();
    if (manfiResponse.success) {
      await AsyncStorage.setItem('manfiAccess', JSON.stringify(manfiResponse.data.hasManfiAccess));
      return manfiResponse.data.hasManfiAccess;
    }
    return false;
  } catch (error) {
    console.log('❌ خطا در بروزرسانی وضعیت manfi:', error);
    return false;
  }
}