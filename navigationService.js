// navigationService.js
import { createNavigationContainerRef } from '@react-navigation/native';
import VPNService from './services/VPNService';

export const navigationRef = createNavigationContainerRef();

export async function navigate(name, params) {
  try {
    if (navigationRef.isReady() && name) {
      // بررسی VPN قبل از ناوبری
      const isBlocked = await VPNService.checkAndBlockVPN();
      if (isBlocked) return;

      // تغییر مسیر Login → LoginScreen
      const screenName = name === 'Login' ? 'LoginScreen' : name;
      navigationRef.navigate(screenName, params);
    }
  } catch (error) {
    console.warn('⚠️ Navigation warning:', error.message);
  }
}

export function reset(routes) {
  try {
    if (navigationRef.isReady()) {
      navigationRef.reset(routes);
    }
  } catch (error) {
    console.warn('⚠️ Navigation reset warning:', error.message);
  }
}

// 🔥 اضافه کردن تابع getCurrentRoute برای استفاده در App.js
export function getCurrentRoute() {
  try {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Get current route warning:', error.message);
    return null;
  }
}

// 🔥 اضافه کردن تابع getRootState برای استفاده در App.js
export function getRootState() {
  try {
    if (navigationRef.isReady()) {
      return navigationRef.getRootState();
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Get root state warning:', error.message);
    return null;
  }
}

// 🔥 اضافه کردن تابع goBack برای بازگشت
export function goBack() {
  try {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  } catch (error) {
    console.warn('⚠️ Go back warning:', error.message);
  }
}