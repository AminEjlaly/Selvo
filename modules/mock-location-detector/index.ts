import { requireNativeModule } from 'expo-modules-core';

const MockLocationDetector = requireNativeModule('MockLocationDetector');

export const isMockLocationActive = (): boolean => {
  try {
    return MockLocationDetector.isMockLocationActive();
  } catch (e) {
    console.log('❌ خطا در بررسی native mock:', e);
    return false;
  }
};