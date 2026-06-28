// factorPishApi.js
// توابع API مربوط به پیش‌فاکتور و تبدیل به فاکتور
// اضافه کنید به انتهای فایل api.js پروژه

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getServerUrl } from '../config';

const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

// --- دریافت لیست پیش‌فاکتورهای فاکتور نشده ---
export const getPendingFactorPish = async (page = 1, pageSize = 20, search = '') => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();

    let url = `${baseUrl}/api/factor-pish/pending?page=${page}&pageSize=${pageSize}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const res = await fetch(url, { headers });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در دریافت لیست پیش‌فاکتورها');
    }

    return {
      items: data.data || [],
      pagination: data.pagination || { page, pageSize },
    };
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- دریافت جزئیات یک پیش‌فاکتور به همراه کالاهایش ---
export const getFactorPishDetail = async (number) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();

    const res = await fetch(`${baseUrl}/api/factor-pish/${number}`, { headers });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در دریافت اطلاعات پیش‌فاکتور');
    }

    return data.data; // { header, items }
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};

// --- تبدیل پیش‌فاکتور به فاکتور فروش (با امکان اعمال تخفیف سطری) ---
// discounts: آرایه‌ای اختیاری از { code, tf } یا { code, mtf }
// برای هر ردیف کالا فقط یکی از دو فیلد tf (درصد) یا mtf (مبلغ) فرستاده می‌شود
export const convertFactorPishToFactor = async (number, discounts = []) => {
  try {
    const headers = await getAuthHeaders();
    const baseUrl = await getServerUrl();

    const res = await fetch(`${baseUrl}/api/factor-pish/${number}/convert`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ discounts }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('پاسخ سرور نامعتبر است');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'خطا در تبدیل پیش‌فاکتور به فاکتور');
    }

    return data.data; // { factorNumber, sourcePishNumber, itemCount, factorDate, price, priceB, priceP }
  } catch (err) {
    if (err.message === 'Network request failed') throw new Error('ارتباط با سرور برقرار نشد');
    throw err;
  }
};