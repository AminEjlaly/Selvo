import { FontAwesome } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Text, TouchableOpacity, View } from 'react-native';
import {
    checkMockEnvironment,
    DEVELOPER_OPTIONS_ERROR
} from '../services/locationService';

// چک هر چند ثانیه یک‌بار وقتی اپ باز است
const POLL_INTERVAL_MS = 5000;

export default function MockLocationGate({ children }) {
  const [threat, setThreat] = useState(null); // null = بدون تهدید | {code, message}
  const [checking, setChecking] = useState(true);
  const intervalRef = useRef(null);

  const runCheck = useCallback(async () => {
    try {
      const result = await checkMockEnvironment();
      if (result.isThreat) {
        setThreat({ code: result.code, message: result.message });
      } else {
        setThreat(null);
      }
    } catch (e) {
      console.log('⚠️ MockLocationGate check error:', e.message);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
    intervalRef.current = setInterval(runCheck, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') runCheck();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [runCheck]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#010b35ff' }}>
        <ActivityIndicator size="large" color="#4f7eff" />
      </View>
    );
  }

  if (threat) {
    const isDevOptions = threat.code === DEVELOPER_OPTIONS_ERROR;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2b0000', padding: 32 }}>
        <View style={{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'rgba(220,53,69,0.2)',
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 28,
          borderWidth: 1, borderColor: 'rgba(220,53,69,0.5)',
        }}>
          <FontAwesome name="ban" size={48} color="#ff4d4d" />
        </View>

        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'IRANYekan-Bold', textAlign: 'center', marginBottom: 14 }}>
          {isDevOptions ? 'گزینه‌های توسعه‌دهنده فعال است' : 'موقعیت مکانی جعلی شناسایی شد'}
        </Text>

        <Text style={{ color: '#ffb3b3', fontSize: 14, fontFamily: 'IRANYekan', textAlign: 'center', lineHeight: 26, marginBottom: 32 }}>
          {threat.message}
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{
            backgroundColor: '#a30000', paddingVertical: 16,
            borderRadius: 14, width: '100%', alignItems: 'center',
            marginBottom: 14,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'IRANYekan-Bold' }}>
            رفتن به تنظیمات
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={runCheck} activeOpacity={0.7} style={{ padding: 8 }}>
          <Text style={{ color: '#ff8080', fontSize: 13, fontFamily: 'IRANYekan' }}>
            بررسی مجدد
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
}