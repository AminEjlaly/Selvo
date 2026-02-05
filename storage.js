// api.js
import { getToken } from './storage';
import { getServerUrl } from './config';

const getAuthHeaders = async () => {
  const token = await getToken();
  if (!token) throw new Error('توکن معتبر نیست، لطفاً وارد شوید');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const login = async (username, password) => {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطا در لاگین');
  return data;
};

export const getDailyBuyers = async () => {
  const headers = await getAuthHeaders();
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/rozmasir`, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطا در دریافت مشتری‌ها');
  return data.data;
};

export const getProducts = async () => {
  const headers = await getAuthHeaders();
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/kala`, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطا در دریافت کالاها');
  return data.data;
};
