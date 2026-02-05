// services/buyerLocationService.js
import {
  checkBuyerLocationStatus,
  registerBuyerLocation
} from '../api';
import {
  getCurrentPosition,
  requestLocationPermission
} from './locationService';

// --- بررسی و ثبت لوکیشن مشتری ---
export const checkAndSendBuyerLocation = async (buyerCode, buyerName = '') => {
  try {


    // اول بررسی می‌کنیم که مشتری قبلاً لوکیشن دارد یا نه
    const locationStatus = await checkBuyerLocationStatus(buyerCode);
    
    if (locationStatus.hasLocation) {
      throw new Error('LOCATION_ALREADY_EXISTS');
    }


    // بررسی دسترسی موقعیت
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('PERMISSION_DENIED');
    }

    // دریافت موقعیت فعلی
    const location = await getCurrentPosition();
    const { latitude, longitude } = location.coords;
    // ارسال به سرور
    const result = await registerBuyerLocation(buyerCode, latitude, longitude);
  
    
    // برگرداندن نتیجه به همراه مختصات
    return {
      ...result,
      coordinates: { latitude, longitude },
      message: 'لوکیشن با موفقیت ثبت شد'
    };
    
  } catch (error) {
    console.error('❌ خطا در ثبت لوکیشن مشتری:', error);
    throw error;
  }
};

// --- فقط بررسی وضعیت لوکیشن (بدون ثبت) ---
export const getBuyerLocationStatus = async (buyerCode) => {
  try {
    return await checkBuyerLocationStatus(buyerCode);
  } catch (error) {
    console.error('❌ خطا در بررسی وضعیت لوکیشن:', error);
    throw error;
  }
};