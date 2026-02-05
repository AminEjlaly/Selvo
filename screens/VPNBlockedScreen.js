// screens/VPNBlockedScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import VPNService from '../services/VPNService';

export default function VPNBlockedScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const recheckVPN = async () => {
    setLoading(true);
    const isBlocked = await VPNService.checkAndBlockVPN();
    setLoading(false);
    if (!isBlocked) navigation.goBack(); // برگرد به صفحه قبل اگر VPN خاموش شد
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>اتصال VPN شناسایی شد</Text>
      <Text style={styles.desc}>
        برای استفاده از این برنامه، لطفاً VPN خود را خاموش کنید و دوباره تلاش کنید.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.btn} onPress={recheckVPN}>
          <Text style={styles.btnText}>🔄 بررسی مجدد</Text>
        </TouchableOpacity>
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#e53935', marginBottom: 8 },
  desc: { fontSize: 15, color: '#333', textAlign: 'center', lineHeight: 22 },
  btn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 25
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
