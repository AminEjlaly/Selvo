// services/VPNService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, BackHandler, Platform } from 'react-native';

class VPNService {
  constructor() {
    this.isSimulator = this.detectSimulator();
    this.lastCheck = null;
    this.checkCache = null;
    
    // نمایش وضعیت شبیه‌ساز هنگام initialize
    if (this.isSimulator) {
      console.log('🛠️ Running in SIMULATOR - VPN checks are DISABLED');
    }
  }

  // تشخیص شبیه‌ساز (سریع و سبک)
  detectSimulator() {
    if (Platform.OS === 'ios') {
      // iOS Simulator
      const isSimulator = Platform.isPad || !Platform.constants?.Model;
      if (isSimulator) {
        console.log('📱 iOS Simulator detected');
      }
      return isSimulator;
    }
    
    // Android Emulator
    const model = Platform.constants?.Model || '';
    const brand = Platform.constants?.Brand || '';
    
    const isEmulator = (
      !model ||
      model.toLowerCase().includes('sdk') ||
      model.toLowerCase().includes('emulator') ||
      brand.toLowerCase() === 'generic' ||
      model.toLowerCase().includes('android sdk')
    );
    
    if (isEmulator) {
      console.log('🤖 Android Emulator detected');
    }
    
    return isEmulator;
  }

  // بررسی ساده و سریع VPN (فقط 2 تست اصلی)
  async checkVPNStatus() {
    // 🔴 VPN CHECK DISABLED - همیشه false برمیگردونه
    console.log('🛠️ VPN check is DISABLED');
    return false;
  }

  // ذخیره نتیجه در cache
  updateCache(result) {
    this.checkCache = result;
    this.lastCheck = Date.now();
    AsyncStorage.setItem('vpn_detected', result ? 'true' : 'false');
  }

  // نمایش هشدار VPN
  showVPNWarning() {
    Alert.alert(
      "⚠️ اتصال VPN شناسایی شد",
      "برای استفاده از این برنامه، لطفاً VPN یا پراکسی خود را خاموش کنید.",
      [
        {
          text: "خروج",
          style: "destructive",
          onPress: () => BackHandler.exitApp(),
        },
        {
          text: "بررسی مجدد",
          onPress: async () => {
            // پاک کردن cache برای بررسی مجدد
            this.checkCache = null;
            const stillBlocked = await this.checkAndBlockVPN();
            if (!stillBlocked) {
              Alert.alert("✅ موفق", "می‌توانید ادامه دهید.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  }

  // بررسی و بلاک در صورت VPN
  async checkAndBlockVPN() {
    // 🔴 VPN CHECK DISABLED - هیچ بلاکی انجام نمیشه
    console.log('🛠️ VPN block is DISABLED');
    return false;
  }

  // بررسی دوره‌ای (فقط در صورت نیاز فعال شود)
  async startPeriodicCheck(intervalMinutes = 10) {
    // 🔴 VPN CHECK DISABLED - بررسی دوره‌ای غیرفعال
    console.log('🛠️ Periodic VPN check is DISABLED');
    return null;
  }

  // متوقف کردن بررسی دوره‌ای
  stopPeriodicCheck(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('⏹️ Periodic check stopped');
    }
  }

  // دریافت وضعیت از cache
  async getLastCheckResult() {
    // 🔴 VPN CHECK DISABLED - همیشه clean برمیگردونه
    return 'clean';
  }

  // پاک کردن cache (برای force check)
  clearCache() {
    this.checkCache = null;
    this.lastCheck = null;
  }

  // چک کردن اینکه آیا در شبیه‌ساز هستیم
  isRunningInSimulator() {
    return this.isSimulator;
  }
}

export default new VPNService();