// services/imageCompression.js
// 🔥 فشرده‌سازی عکس قبل از آپلود - برای جلوگیری از تایم‌اوت Cloudflare (524)
// وقتی عکس‌های خام دوربین (۳-۸ مگابایت) مستقیم آپلود میشن، رو نت موبایل
// آپلود می‌تونه چند دقیقه طول بکشه و Cloudflare بعد از ۱۰۰ ثانیه قطعش می‌کنه.
// این تابع قبل از ارسال، عکس رو resize و compress می‌کنه.

import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

const MAX_DIMENSION = 1600; // حداکثر عرض/ارتفاع بعد از resize
const COMPRESS_QUALITY = 0.7; // کیفیت JPEG بعد از فشرده‌سازی (۰ تا ۱)

/**
 * فشرده‌سازی یک عکس (اندروید/iOS از طریق expo-image-manipulator)
 * @param {string} uri - آدرس عکس (از ImagePicker یا دوربین)
 * @returns {Promise<{uri: string, width: number, height: number}>}
 */
const compressNative = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result;
};

/**
 * فشرده‌سازی یک عکس رو وب (با canvas، چون expo-image-manipulator رو وب پشتیبانی محدودی داره)
 * @param {string} uri - می‌تونه blob:, data:, یا http(s): باشه
 * @returns {Promise<string>} - data URI جدید (فشرده‌شده)
 */
const compressWeb = (uri) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      // نسبت تصویر رو حفظ کن، فقط بزرگ‌ترین بعد رو به MAX_DIMENSION محدود کن
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY);
      resolve(dataUrl);
    };
    img.onerror = (err) => reject(err);
    img.src = uri;
  });
};

/**
 * تابع اصلی - پلتفرم رو تشخیص میده و فشرده‌سازی مناسب رو انجام میده
 * @param {string} uri - آدرس عکس اصلی
 * @returns {Promise<string>} - آدرس عکس فشرده‌شده (uri جدید برای نیتیو، data URI برای وب)
 */
export const compressImage = async (uri) => {
  try {
    if (Platform.OS === 'web') {
      return await compressWeb(uri);
    } else {
      const result = await compressNative(uri);
      return result.uri;
    }
  } catch (error) {
    console.warn('⚠️ خطا در فشرده‌سازی عکس، از عکس اصلی استفاده میشه:', error.message);
    return uri; // اگه فشرده‌سازی خطا داد، عکس اصلی رو برگردون (بهتر از هیچی)
  }
};

/**
 * فشرده‌سازی چندتا عکس با هم (موازی)
 * @param {string[]} uris - آرایه‌ای از آدرس‌های عکس
 * @returns {Promise<string[]>}
 */
export const compressImages = async (uris) => {
  return Promise.all(uris.map((uri) => compressImage(uri)));
};