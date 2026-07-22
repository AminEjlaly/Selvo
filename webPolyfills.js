// webPolyfills.js
import { Alert, Linking, Platform } from 'react-native';

if (Platform.OS === 'web') {
  if (typeof Linking.openSettings !== 'function') {
    Linking.openSettings = async () => {
      console.warn('⚠️ Linking.openSettings() is not supported on web — ignored.');
      return null;
    };
  }

  // پلی‌فیل Alert.alert برای وب
  const originalAlert = Alert.alert;
  Alert.alert = (title, message, buttons) => {
    const fullMessage = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length === 0) {
      window.alert(fullMessage);
      return;
    }

    if (buttons.length === 1) {
      window.alert(fullMessage);
      buttons[0].onPress?.();
      return;
    }

    // برای چند دکمه، از confirm استفاده کن (فقط OK/Cancel پشتیبانی می‌شه)
    const confirmed = window.confirm(fullMessage);
    const okButton = buttons.find(b => b.style !== 'cancel');
    const cancelButton = buttons.find(b => b.style === 'cancel');

    if (confirmed) {
      okButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  };
}