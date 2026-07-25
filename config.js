import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// آی‌پی و پورت پیش‌فرض (فقط برای اپ نیتیو استفاده میشه)
const DEFAULT_IP = "192.168.1.50";
const DEFAULT_PORT = "5000";

// گرفتن URL سرور به صورت پویا
export const getServerUrl = async () => {
  // 🔥 روی وب همیشه از همون origin صفحه استفاده کن (https, پشت نگینکس)
  //    چون نگینکس مسیرهای /api/ و /socket.io/ و ... رو پراکسی می‌کنه
  if (Platform.OS === "web") {
    return window.location.origin; // مثلا: https://selvo.avapanel.lol
  }

  // برای اپ نیتیو (اندروید/iOS): بر اساس نوع اتصال انتخاب‌شده تصمیم بگیر
  const connectionType = await AsyncStorage.getItem("connection_type");

  if (connectionType === "url") {
    const url = await AsyncStorage.getItem("server_url");
    return url || null;
  }

  const ip = (await AsyncStorage.getItem("server_ip")) || DEFAULT_IP;
  const port = (await AsyncStorage.getItem("server_port")) || DEFAULT_PORT;
  if (!ip || !port) return null;
  return `http://${ip}:${port}`;
};

// ذخیره آی‌پی و پورت
export const setServerConfig = async (ip, port) => {
  await AsyncStorage.setItem("server_ip", ip);
  await AsyncStorage.setItem("server_port", port);
  await AsyncStorage.setItem("connection_type", "ip");
};

// ذخیره لینک سفارشی (مثلا https://selvo.avapanel.lol)
export const setServerUrlConfig = async (url) => {
  await AsyncStorage.setItem("server_url", url);
  await AsyncStorage.setItem("connection_type", "url");
};

// تست اتصال به سرور
export const testServerConnection = async (ip, port) => {
  try {
    const baseUrl =
      Platform.OS === "web" ? window.location.origin : `http://${ip}:${port}`;
    const res = await fetch(`${baseUrl}/api/ping`); // endpoint ساده برای تست
    return res.ok;
  } catch {
    return false;
  }
};

export const APP_CONFIG = {
  // 🔥 فلگ اصلی برای فعال/غیرفعال کردن GPS
  LOCATION_TRACKING_ENABLED: true, // true = فعال، false = غیرفعال

  // تنظیمات اضافی
  LOCATION_INTERVAL_MS: 5 * 60 * 1000, // 5 دقیقه
  MANDATORY_LOCATION_ON_LOGIN: true, // اجباری بودن GPS هنگام ورود
};