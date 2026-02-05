import AsyncStorage from "@react-native-async-storage/async-storage";

// آی‌پی و پورت پیش‌فرض
const DEFAULT_IP = "192.168.1.50";
const DEFAULT_PORT = "5000";
// گرفتن URL سرور به صورت پویا
export const getServerUrl = async () => {
  const ip = await AsyncStorage.getItem("server_ip") || DEFAULT_IP;
  const port = await AsyncStorage.getItem("server_port")||DEFAULT_PORT ;
  if (!ip || !port) return null; // اگه ست نشده باشه، null برمیگردونه
  return `http://${ip}:${port}`;
};

// ذخیره آی‌پی و پورت
export const setServerConfig = async (ip, port) => {
  await AsyncStorage.setItem("server_ip", ip);
  await AsyncStorage.setItem("server_port", port);
};

// تست اتصال به سرور
export const testServerConnection = async (ip, port) => {
  try {
    const res = await fetch(`http://${ip}:${port}/api/ping`); // endpoint ساده برای تست
    return res.ok;
  } catch {
    return false;
  }
};
export const APP_CONFIG = {
  // 🔥 فلگ اصلی برای فعال/غیرفعال کردن GPS
  LOCATION_TRACKING_ENABLED: false, // true = فعال، false = غیرفعال
  
  // تنظیمات اضافی
  LOCATION_INTERVAL_MS: 5 * 60 * 1000, // 5 دقیقه
  MANDATORY_LOCATION_ON_LOGIN: false, // اجباری بودن GPS هنگام ورود
};
