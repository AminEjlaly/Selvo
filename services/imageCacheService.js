import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}product_images/`;
const IMAGE_MAP_KEY = 'image_cache_map';

// اطمینان از وجود پوشه کش
const ensureCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
};

// دریافت نام فایل از URL
const getFilenameFromUrl = (url) => {
  return url.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '_');
};

// دریافت مسیر کش شده یا دانلود
export const getCachedImageUri = async (imageUrl) => {
  if (!imageUrl) return null;

  try {
    await ensureCacheDir();

    // چک کن آیا قبلاً کش شده
    const mapStr = await AsyncStorage.getItem(IMAGE_MAP_KEY);
    const imageMap = mapStr ? JSON.parse(mapStr) : {};

    if (imageMap[imageUrl]) {
      const fileInfo = await FileSystem.getInfoAsync(imageMap[imageUrl]);
      if (fileInfo.exists) {
        return imageMap[imageUrl]; // از کش برگردون
      }
    }

    // دانلود و ذخیره
    const filename = getFilenameFromUrl(imageUrl);
    const localPath = `${IMAGE_CACHE_DIR}${filename}`;

    await FileSystem.downloadAsync(imageUrl, localPath);

    // ذخیره در map
    imageMap[imageUrl] = localPath;
    await AsyncStorage.setItem(IMAGE_MAP_KEY, JSON.stringify(imageMap));

    console.log(`✅ عکس کش شد: ${filename}`);
    return localPath;

  } catch (error) {
    console.log('❌ خطا در کش عکس:', error.message);
    return imageUrl; // fallback به URL اصلی
  }
};

// پاک کردن کش عکس‌ها
export const clearImageCache = async () => {
  try {
    await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    await AsyncStorage.removeItem(IMAGE_MAP_KEY);
    console.log('✅ کش عکس‌ها پاک شد');
  } catch (error) {
    console.log('❌ خطا در پاک کردن کش عکس‌ها:', error);
  }
};