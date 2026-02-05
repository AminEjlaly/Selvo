import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { APP_CONFIG } from '../config';
import {
  checkActualPermissionStatus,
  getCurrentPosition,
  requestLocationPermission
} from './locationService';
class MandatoryLocationService {
  constructor() {
    this.isLocationEnabled = false;
  }

  // 🔥 تابع اصلی برای بررسی اجباری Location
  requireLocationForLogin = async () => {
      if (!APP_CONFIG.MANDATORY_LOCATION_ON_LOGIN) {
      console.log('📍 Mandatory location disabled in config');
      return {
        success: true,
        message: 'Location check skipped (disabled in config)'
      };
    }
    try {
      console.log('📍 Starting mandatory location check...');
      
      // 1. بررسی سرویس‌های Location دستگاه
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.log('❌ Location services disabled');
        throw new Error('LOCATION_SERVICES_DISABLED');
      }

      // 2. بررسی و درخواست مجوز
      let hasPermission = await checkActualPermissionStatus();
      
      if (!hasPermission) {
        console.log('📍 Requesting location permission...');
        hasPermission = await requestLocationPermission();
      }

      // 3. اگر کاربر مجوز نداد، نمی‌تواند وارد شود
      if (!hasPermission) {
        console.log('❌ Location permission denied by user');
        throw new Error('LOCATION_PERMISSION_REQUIRED');
      }

      // 4. دریافت موقعیت فعلی برای اطمینان
      console.log('📍 Getting current location...');
      const location = await getCurrentPosition();

      console.log('✅ Location check passed successfully');
      this.isLocationEnabled = true;
      
      return {
        success: true,
        location: location.coords,
        message: 'Location activated successfully'
      };
      
    } catch (error) {
      console.log('❌ Location requirement failed:', error);
      this.isLocationEnabled = false;
      
      // مدیریت خطاهای مختلف
      let errorMessage = 'خطا در فعال‌سازی موقعیت مکانی';
      let showSettingsButton = false;

      switch (error.message) {
        case 'LOCATION_SERVICES_DISABLED':
          errorMessage = 'سرویس موقعیت‌یابی دستگاه غیرفعال است';
          showSettingsButton = true;
          break;
        case 'LOCATION_PERMISSION_REQUIRED':
        case 'PERMISSION_DENIED':
          errorMessage = 'دسترسی به موقعیت مکانی ضروری است';
          showSettingsButton = true;
          break;
        case 'LOCATION_ERROR':
          errorMessage = 'خطا در دریافت موقعیت مکانی';
          showSettingsButton = false;
          break;
        default:
          errorMessage = 'خطا در دریافت موقعیت مکانی';
          showSettingsButton = false;
      }

      throw {
        ...error,
        userMessage: errorMessage,
        showSettingsButton: showSettingsButton
      };
    }
  };

  // 🔥 نمایش آلرت اجباری
  showMandatoryLocationAlert = (error, onRetry = null) => {
    const buttons = [];
    
    if (error.showSettingsButton) {
      buttons.push({
        text: "رفتن به تنظیمات",
        onPress: () => this.openLocationSettings(),
        style: "default"
      });
    }
    
    buttons.push({
      text: "تلاش مجدد",
      onPress: onRetry,
      style: "cancel"
    });

    Alert.alert(
      "📍 فعال‌سازی موقعیت مکانی اجباری",
      error.userMessage + "\n\nبرای استفاده از برنامه باید موقعیت مکانی را فعال کنید.",
      buttons,
      { cancelable: false }
    );
  };

  // 🔥 باز کردن تنظیمات Location
  openLocationSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.log('❌ Error opening settings:', error);
      Alert.alert('خطا', 'امکان باز کردن تنظیمات وجود ندارد');
    }
  };

  // 🔥 بررسی سریع وضعیت Location (برای چک اولیه)
  quickLocationCheck = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const permissionGranted = await checkActualPermissionStatus();
      
      return {
        servicesEnabled,
        permissionGranted,
        isReady: servicesEnabled && permissionGranted
      };
    } catch (error) {
      console.log('❌ Quick location check failed:', error);
      return {
        servicesEnabled: false,
        permissionGranted: false,
        isReady: false
      };
    }
  };
}

export default new MandatoryLocationService();