// modules/mock-location-detector/android/src/MockLocationDetectorModule.ts
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

let NativeModule = null;

if (Platform.OS === 'android') {
  try {
    NativeModule = requireNativeModule('MockLocationDetector');
  } catch (e) {
   
  }
}

// روی iOS و web این یک fallback بی‌خطر است
const fallback = {
  isDeveloperOptionsEnabled: async () => false,
  hasMockLocationApp: async () => false,
};

export default NativeModule || fallback;