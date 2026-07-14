// screens/MockLocationBlockedScreen.js
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentPositionSecure, MOCK_LOCATION_ERROR } from '../services/locationService';

export default function MockLocationBlockedScreen({ onCleared }) {
  const [loading, setLoading] = useState(false);

  const recheck = async () => {
    setLoading(true);
    try {
      await getCurrentPositionSecure();
      // اگر خطا نداد یعنی دیگه Mock فعال نیست
      onCleared && onCleared();
    } catch (error) {
      if (error.code !== MOCK_LOCATION_ERROR) {
        // خطای دیگری بود (مثلاً دسترسی)، بازم بذار کاربر دوباره تلاش کنه
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeveloperSettings = () => {
    if (Platform.OS === 'android') {
      // این Intent مستقیم صفحه دولوپر آپشن رو باز می‌کنه
      Linking.sendIntent
        ? Linking.sendIntent('android.settings.APPLICATION_DEVELOPMENT_SETTINGS')
        : Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚫</Text>
      <Text style={styles.title}>لوکیشن جعلی شناسایی شد</Text>
      <Text style={styles.desc}>
        دستگاه شما در حالت "موقعیت مکانی مجازی (Mock Location)" است.{"\n\n"}
        برای استفاده از این برنامه، لطفاً به تنظیمات برنامه‌نویس (Developer Options) بروید،
        گزینه‌ی "Select mock location app" را باز کرده و آن را روی "None" قرار دهید،
        سپس برنامه شبیه‌ساز موقعیت مکانی را حذف یا غیرفعال کنید.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#e53935" style={{ marginTop: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.btn} onPress={openDeveloperSettings}>
            <Text style={styles.btnText}>رفتن به تنظیمات برنامه‌نویس</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={recheck}>
            <Text style={styles.btnText}>🔄 بررسی مجدد</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25
  },
  icon: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e53935', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  btn: {
    backgroundColor: '#0622a3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    alignItems: 'center'
  },
  btnSecondary: {
    backgroundColor: '#007AFF',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});