import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.7;

const compressNative = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

// 🔥 خروجی وب حالا یه آبجکت با blob واقعیه، نه data URI base64
const compressWeb = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
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
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          blob,
          previewUri: URL.createObjectURL(blob), // فقط برای نمایش تو <Image>
          name: (file.name || 'photo.jpg').replace(/\.\w+$/, '.jpg'),
        });
      }, 'image/jpeg', COMPRESS_QUALITY);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
};

// نیتیو: خروجی یه uri رشته‌ای ساده‌ست (مثل قبل)
export const compressImage = async (uri) => {
  try {
    return await compressNative(uri);
  } catch (error) {
    console.warn('⚠️ خطا در فشرده‌سازی عکس نیتیو:', error.message);
    return uri;
  }
};

// وب: ورودی File واقعیه (نه uri)، خروجی {blob, previewUri, name}
export const compressWebFile = async (file) => {
  try {
    return await compressWeb(file);
  } catch (error) {
    console.warn('⚠️ خطا در فشرده‌سازی عکس وب:', error.message);
    return { blob: file, previewUri: URL.createObjectURL(file), name: file.name };
  }
};

export const compressImages = async (uris) => {
  return Promise.all(uris.map((uri) => compressImage(uri)));
};