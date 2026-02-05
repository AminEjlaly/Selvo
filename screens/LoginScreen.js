import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomerPasswordModal from '../components/CustomerPasswordModal';
import { APP_CONFIG } from '../config';
import {
  saveVisitorInfo,
  startAutoSendLocation,
  stopAutoSendLocation
} from '../services/locationService';
import mandatoryLocationService from '../services/mandatoryLocationService';
import { loginStyles } from "../styles/LoginScreen.styles";

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("ip");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // حالت‌های بیومتریک
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [biometricPrompted, setBiometricPrompted] = useState(false);

  // تشخیص شبیه‌ساز
  const [isSimulator, setIsSimulator] = useState(false);

  // 🔥 جلوگیری از کلیک‌های متعدد
  const loginAttemptRef = useRef(false);
  const loginTimeoutRef = useRef(null);

  // دریافت ورژن اپ
  const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
  const APP_BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

  useEffect(() => {
    checkIfSimulator();
    initializeApp();
    return () => {
      stopAutoSendLocation();
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  const checkIfSimulator = async () => {
    try {
      if (Platform.OS === "ios") {
        const isSim = Platform.isPad || !Platform.constants?.Model;
        setIsSimulator(isSim);
        console.log('📱 iOS Simulator detected:', isSim);
      } else if (Platform.OS === "android") {
        const model = Platform.constants?.Model;
        const isEmulator =
          !model ||
          model.includes("sdk") ||
          model.includes("Emulator") ||
          model.includes("Android SDK");
        setIsSimulator(isEmulator);
        console.log('📱 Android Emulator detected:', isEmulator);
      }
    } catch (error) {
      console.log("❌ Simulator check error:", error);
      setIsSimulator(true);
    }
  };

  const initializeApp = async () => {
    const storedIp = await AsyncStorage.getItem("server_ip");
    const storedPort = await AsyncStorage.getItem("server_port");
    const storedUrl = await AsyncStorage.getItem("server_url");
    const storedTab = await AsyncStorage.getItem("connection_type");

    if (storedIp) setIp(storedIp);
    if (storedPort) setPort(storedPort);
    if (storedUrl) setCustomUrl(storedUrl);
    if (storedTab) setActiveTab(storedTab);

    await checkBiometricSupport();
    await loadSavedCredentials();
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (isSimulator) {
        setBiometricAvailable(false);
        return;
      }

      if (compatible && enrolled) {
        setBiometricAvailable(true);

        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("face");
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("fingerprint");
        } else {
          setBiometricType("biometric");
        }
      } else {
        console.log('❌ Biometric not available:', { compatible, enrolled });
        setBiometricAvailable(false);
      }
    } catch (error) {
      console.log("❌ Biometric check error:", error);
      setBiometricAvailable(false);
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem("saved_credentials");
      if (saved) {
        const credentials = JSON.parse(saved);
        setSavedCredentials(credentials);
        setUsername(credentials.username);
      }
    } catch (error) {
      console.log("❌ Load credentials error:", error);
    }
  };

  const promptBiometricLogin = async () => {
    if (biometricPrompted || loading) {
      console.log('⚠️ Biometric already prompted or loading, skipping...');
      return;
    }

    setBiometricPrompted(true);

    if (isSimulator) {
      console.log('🎭 Simulator mode: Showing biometric demo');
      Alert.alert(
        "حالت نمایشی بیومتریک",
        "در شبیه‌ساز می‌توانید با دکمه زیر با اطلاعات ذخیره شده وارد شوید.",
        [
          {
            text: "لغو",
            style: "cancel",
            onPress: () => setBiometricPrompted(false)
          },
          {
            text: "ورود با اطلاعات ذخیره شده",
            onPress: async () => {
              if (savedCredentials) {
                await loginWithSavedCredentials();
              } else {
                Alert.alert("خطا", "اطلاعات ورودی ذخیره شده‌ای وجود ندارد");
                setBiometricPrompted(false);
              }
            }
          }
        ]
      );
      return;
    }

    try {
      console.log('🔐 Starting biometric authentication...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricType === "face"
          ? "برای ورود چهره خود را اسکن کنید"
          : "برای ورود اثر انگشت خود را اسکن کنید",
        fallbackLabel: "استفاده از رمز عبور",
        cancelLabel: "لغو",
        disableDeviceFallback: false,
      });

      console.log('📋 Biometric result:', result);

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        await loginWithSavedCredentials();
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        setBiometricPrompted(false);
      }
    } catch (error) {
      console.log("❌ Biometric auth error:", error);
      Alert.alert("خطا", "در احراز هویت بیومتریک مشکلی پیش آمد");
      setBiometricPrompted(false);
    }
  };

  const startLocationServiceForSeller = async (sellerInfo) => {
    try {
      console.log('📍 Starting location service for seller...');

      const visitorInfo = {
        VisitorCode: sellerInfo.NOF || sellerInfo.UserID,
        VisitorName: sellerInfo.NameF || sellerInfo.FullName,
      };

      await saveVisitorInfo(visitorInfo);
      await startAutoSendLocation(visitorInfo, {
        intervalMs: 5 * 60 * 1000
      });

      console.log('✅ Location service started successfully for seller');

    } catch (error) {
      console.log('❌ Error starting location service:', error);

      if (error.message === 'PERMISSION_DENIED') {
        setTimeout(() => {
          Alert.alert(
            "دسترسی به موقعیت مکانی",
            "برای ارسال موقعیت مکانی، لطفاً دسترسی موقعیت مکانی را فعال کنید.",
            [{ text: "متوجه شدم" }]
          );
        }, 1000);
      }
    }
  };

  const loginWithSavedCredentials = async () => {
    if (!savedCredentials) return;
    
    setLoading(true);
    
    try {
      await mandatoryLocationService.requireLocationForLogin();
    } catch (locationError) {
      setLoading(false);
      mandatoryLocationService.showMandatoryLocationAlert(locationError, () => {
        loginWithSavedCredentials();
      });
      return;
    }

    setUsername(savedCredentials.username);
    setPassword(savedCredentials.password);

    setTimeout(() => {
      handleLogin(savedCredentials.username, savedCredentials.password);
    }, 300);
  };

  const getServerUrl = () => {
    if (activeTab === "url") {
      return customUrl;
    } else {
      if (!ip || !port) return null;
      return `http://${ip}:${port}`;
    }
  };

  const getConnectionStatus = () => {
    if (activeTab === "url") {
      return customUrl ? customUrl : "سرور تنظیم نشده";
    } else {
      return ip && port ? `${ip}:${port}` : "سرور تنظیم نشده";
    }
  };

  // تابع جدید برای هندل کردن آپدیت اپ
  const handleAppUpdate = (errorData) => {
    Alert.alert(
      "بروزرسانی برنامه",
      errorData.message || "نسخه برنامه شما قدیمی است. لطفاً برنامه را بروزرسانی کنید.",
      [
        {
          text: "بروزرسانی",
          onPress: () => {
            if (errorData.updateUrl) {
              Linking.openURL(errorData.updateUrl).catch(() => {
                Alert.alert("خطا", "نمی‌توان لینک بروزرسانی را باز کرد");
              });
            }
          }
        },
        {
          text: "خروج",
          style: "cancel",
          onPress: () => {
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            }
          }
        }
      ]
    );
  };

  const showSaveCredentialsDialog = async (user) => {
    const askedBefore = await AsyncStorage.getItem("credentials_save_asked");
    if (askedBefore === "true") {
     // 🔥 فقط اگر فعال باشد location را استارت کن
    if (APP_CONFIG.LOCATION_TRACKING_ENABLED && 
        (user.UserType === 'seller' || user.role === 'seller')) {
      await startLocationServiceForSeller(user);
    }
      onLoginSuccess(user);
      return;
    }

    Alert.alert(
      "💾 ذخیره اطلاعات ورود",
      "آیا می‌خواهید نام کاربری و رمز عبور خود را برای ورود سریع‌تر ذخیره کنید؟",
      [
        {
          text: "خیر",
          style: "cancel",
          onPress: async () => {
            await AsyncStorage.setItem("credentials_save_asked", "true");
            if (user.UserType === 'seller' || user.role === 'seller') {
              await startLocationServiceForSeller(user);
            }
            onLoginSuccess(user);
          },
        },
        {
          text: "بله",
          onPress: async () => {
            await saveCredentials();
            await AsyncStorage.setItem("credentials_save_asked", "true");

            if (user.UserType === 'seller' || user.role === 'seller') {
              await startLocationServiceForSeller(user);
            }

            if (biometricAvailable && !isSimulator) {
              showEnableBiometricDialog(user);
            } else {
              onLoginSuccess(user);
            }
          },
        },
      ]
    );
  };

  const showEnableBiometricDialog = (user) => {
    const biometricName = biometricType === "face" ? "تشخیص چهره" : "اثر انگشت";

    Alert.alert(
      `🔐 فعال‌سازی ${biometricName}`,
      `آیا می‌خواهید برای ورود سریع‌تر از ${biometricName} استفاده کنید؟`,
      [
        {
          text: "بعداً",
          style: "cancel",
          onPress: () => {
            if (user.UserType === 'seller' || user.role === 'seller') {
              startLocationServiceForSeller(user);
            }
            onLoginSuccess(user);
          },
        },
        {
          text: "فعال کردن",
          onPress: async () => {
            await AsyncStorage.setItem("biometric_enabled", "true");

            /*
if (user.UserType === 'seller' || user.role === 'seller') {
  await startLocationServiceForSeller(user);
}
*/

            Alert.alert(
              "✅ فعال شد",
              `${biometricName} با موفقیت فعال شد.`,
              [{ text: "متوجه شدم", onPress: () => onLoginSuccess(user) }]
            );
          },
        },
      ]
    );
  };

  const saveCredentials = async () => {
    try {
      const credentials = {
        username,
        password,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        "saved_credentials",
        JSON.stringify(credentials)
      );
      setSavedCredentials(credentials);
      console.log('💾 Credentials saved successfully');
    } catch (error) {
      console.log("❌ Save credentials error:", error);
    }
  };

  const convertPersianToEnglishNumbers = (text) => {
    if (!text) return text;

    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let result = text.toString();

    persianNumbers.forEach((persianNum, index) => {
      result = result.replace(new RegExp(persianNum, 'g'), index.toString());
    });

    arabicNumbers.forEach((arabicNum, index) => {
      result = result.replace(new RegExp(arabicNum, 'g'), index.toString());
    });

    return result;
  };

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const normalizePersianText = (text) => {
    if (!text) return text;
    
    let result = text.toString();
    result = result.replace(/[\u200B-\u200D\uFEFF]/g, '');
    result = result
      .replace(/ی/g, 'ي')
      .replace(/ک/g, 'ك');
    result = result.replace(/\s+/g, ' ');
    result = result.trim();
    
    return result;
  };

  const handleDeliveryLogin = async (name, mobile) => {
    try {
      const normalizedName = normalizePersianText(name);
      const normalizedMobile = convertPersianToEnglishNumbers(mobile).trim();
      
      const serverUrl = getServerUrl();
      if (!serverUrl) {
        throw new Error("لطفاً سرور را تنظیم کنید");
      }

      const response = await fetch(`${serverUrl}/api/delivery/delivery-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "App-Version": APP_VERSION,
        },
        body: JSON.stringify({ 
          name: normalizedName, 
          mobile: normalizedMobile 
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error('پاسخ سرور معتبر نیست');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "نام تحویل‌دار یا شماره موبایل صحیح نیست");
      }
      
      const token = data.data?.token;
      const userInfo = data.data?.user;
      
      if (!token) {
        throw new Error('توکن در پاسخ وجود ندارد');
      }

      if (!userInfo) {
        throw new Error('اطلاعات کاربر در پاسخ وجود ندارد');
      }

      await AsyncStorage.setItem('token', token);
      
      const userData = {
        id: userInfo.id,
        name: userInfo.name,
        mobile: userInfo.mobile,
        role: 'delivery',
        UserType: 'delivery',
        por: userInfo.por
      };
      
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      
      return userData;
      
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (loginUsername, loginPassword) => {
    if (loginAttemptRef.current || loading) {
      console.log('⚠️ Login already in progress, ignoring click');
      return;
    }

if (APP_CONFIG.MANDATORY_LOCATION_ON_LOGIN) {
    try {
      await mandatoryLocationService.requireLocationForLogin();
    } catch (locationError) {
      setLoading(false);
      mandatoryLocationService.showMandatoryLocationAlert(locationError, () => {
        handleLogin(loginUsername, loginPassword);
      });
      return;
    }
  }

    const user = convertPersianToEnglishNumbers(loginUsername || username);
    const pass = convertPersianToEnglishNumbers(loginPassword || password);

    if (!user || !pass) {
      Alert.alert("خطا", "کد کاربری و رمز عبور الزامی است");
      return;
    }

    // 🔥 تشخیص هوشمند نوع کاربر
    let loginType = 'seller';
    let loginEndpoint = '/api/login';
    let loginData = { username: user, password: pass };

    if (!isNaN(user)) {
      if (user.length === 8) {
        loginType = 'customer';
        loginEndpoint = '/api/customer/login';
        loginData = { buyerCode: user, password: pass };
      }
      else if (user.length < 7) {
        loginType = 'seller';
        loginEndpoint = '/api/login';
        loginData = { username: user, password: pass };
      }
      else {
        Alert.alert("خطا", "کد مشتری باید 5 رقمی باشد");
        return;
      }
    }
    else if (/[a-zA-Zآ-ی]/.test(user)) {
      loginType = 'delivery';
      loginData = { name: user, mobile: pass };
    }

    if (user === "test" || user === "Test" || pass === "test" || pass === "Test") {
      const demoUser = {
        NOF: "DEMO001",
        NameF: "کاربر نمایشی",
        UserType: "demo",
        isDemo: true,
      };
      await AsyncStorage.setItem("token", "test");
      await AsyncStorage.setItem("user", JSON.stringify(demoUser));
      await AsyncStorage.setItem("is_demo_mode", "true");

      Alert.alert(
        "حالت نمایشی",
        "شما در حالت نمایشی وارد شده‌اید.",
        [{ text: "متوجه شدم", onPress: () => onLoginSuccess(demoUser) }]
      );
      return;
    }

    const serverUrl = getServerUrl();
    if (!serverUrl) {
      Alert.alert("خطا", "لطفاً سرور را تنظیم کنید");
      return;
    }

    if (activeTab === "url" && !validateUrl(serverUrl)) {
      Alert.alert("خطا", "لینک سرور نامعتبر است. از http یا https استفاده کنید");
      return;
    }

    loginAttemptRef.current = true;
    setLoading(true);

    const minimumLoadingTime = setTimeout(() => {
      setLoading(false);
      loginAttemptRef.current = false;
    }, 30000);

    loginTimeoutRef.current = setTimeout(() => {
      clearTimeout(minimumLoadingTime);
      setLoading(false);
      loginAttemptRef.current = false;
      Alert.alert("خطا", "زمان اتصال به سرور تمام شد. لطفاً دوباره تلاش کنید.");
    }, 20000);

    try {
      let response;
      let data;

      if (loginType === 'delivery') {
        const userData = await handleDeliveryLogin(user, pass);
        
        if (loginTimeoutRef.current) {
          clearTimeout(loginTimeoutRef.current);
        }
        clearTimeout(minimumLoadingTime);
        setLoading(false);
        loginAttemptRef.current = false;

        if (userData) {
          await AsyncStorage.setItem("connection_type", activeTab);
          await AsyncStorage.setItem("is_demo_mode", "false");

          if (activeTab === "ip") {
            await AsyncStorage.setItem("server_ip", ip);
            await AsyncStorage.setItem("server_port", port);
          } else {
            await AsyncStorage.setItem("server_url", customUrl);
          }

          showSaveCredentialsDialog(userData);
        }
        return;
      } else {
        const loginUrl = `${serverUrl}${loginEndpoint}`;
        response = await fetch(loginUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "App-Version": APP_VERSION,
            "X-App-Version": APP_VERSION,
            "X-App-Build": APP_BUILD_NUMBER,
            "X-Platform": Platform.OS,
            "X-Device-Model": Platform.OS === 'ios' ? Platform.constants?.model : Platform.constants?.Model || 'Unknown'
          },
          body: JSON.stringify(loginData),
        });
      }

      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }

      if (!response.ok) {
        clearTimeout(minimumLoadingTime);
        setLoading(false);
        loginAttemptRef.current = false;

        if (response.status === 401 || response.status === 403) {
          Alert.alert("خطا", "کد کاربری یا رمز عبور اشتباه است");
          return;
        } else if (response.status === 426) {
          try {
            const errorData = await response.json();
            clearTimeout(minimumLoadingTime);
            setLoading(false);
            loginAttemptRef.current = false;
            
            handleAppUpdate(errorData);
          } catch {
            clearTimeout(minimumLoadingTime);
            setLoading(false);
            loginAttemptRef.current = false;
            Alert.alert(
              "بروزرسانی برنامه",
              "لطفاً برنامه را به آخرین نسخه بروزرسانی کنید",
              [
                {
                  text: "متوجه شدم",
                  onPress: () => {
                    if (Platform.OS === 'android') {
                      BackHandler.exitApp();
                    }
                  }
                }
              ]
            );
          }
          return;
        } else if (response.status >= 500) {
          Alert.alert("خطا", "خطای سرور، بعداً تلاش کنید");
          return;
        } else {
          Alert.alert("خطا", "مشکلی در ورود پیش آمد");
          return;
        }
      }

      data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("connection_type", activeTab);
        await AsyncStorage.setItem("is_demo_mode", "false");

        if (activeTab === "ip") {
          await AsyncStorage.setItem("server_ip", ip);
          await AsyncStorage.setItem("server_port", port);
        } else {
          await AsyncStorage.setItem("server_url", customUrl);
        }

        if (data.token) await AsyncStorage.setItem("token", data.token);

        let userData;
        if (loginType === 'customer') {
          userData = {
            NOF: data.data.customerId,
            NameF: data.data.name,
            mob: data.data.mobile,
            role: 'customer',
            UserType: 'customer',
            address: data.data.address,
            city: data.data.city,
            buyerCode: data.data.buyerCode || data.data.customerId
          };
        } else {
          userData = {
            ...data.data,
            role: 'seller',
            UserType: 'seller'
          };
        }
        await AsyncStorage.setItem("user", JSON.stringify(userData));

        showSaveCredentialsDialog(userData);

      } else {
        clearTimeout(minimumLoadingTime);
        setLoading(false);
        loginAttemptRef.current = false;
        Alert.alert("خطا", data.message || "کد کاربری یا رمز عبور اشتباه است");
      }
    
    } catch (error) {
      console.error('❌ خطای لاگین:', error);

      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
      clearTimeout(minimumLoadingTime);
      setLoading(false);
      loginAttemptRef.current = false;

      let errorMessage = error.message || "ارتباط با سرور برقرار نشد";
      
      if (error.message.includes("Network request failed")) {
        errorMessage = "سرور یافت نشد. لطفاً تنظیمات را بررسی کنید";
      }
      
      if (loginType === 'delivery') {
        if (error.message.includes("نام تحویل‌دار") || 
            error.message.includes("شماره موبایل")) {
          errorMessage = error.message;
        } else if (error.message.includes("اطلاعات ورود نامعتبر")) {
          errorMessage = "نام تحویل‌دار یا شماره موبایل صحیح نیست\nلطفاً اطلاعات را بررسی کنید";
        }
      }
      else {
        if (error.message.includes("اطلاعات ورود نامعتبر") || 
            error.message.includes("کد کاربری") || 
            error.message.includes("رمز عبور")) {
          errorMessage = "کد کاربری یا رمز عبور صحیح نیست\nلطفاً اطلاعات را بررسی کنید";
        }
      }

      Alert.alert("خطا در ورود", errorMessage);
    }
  };

  const getBiometricIcon = () => {
    if (biometricType === "face") return "😊";
    if (biometricType === "fingerprint") return "👆";
    return "🔐";
  };

  return (
    <View style={loginStyles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent
      />

      {isSimulator && (
        <View style={loginStyles.simulatorIndicator}>
          <Text style={loginStyles.simulatorIndicatorText}>
            🛠️ حالت توسعه
          </Text>
        </View>
      )}

      <SafeAreaView style={loginStyles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={loginStyles.keyboardView}
        >
          <ScrollView
            style={loginStyles.scrollView}
            contentContainerStyle={loginStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={loginStyles.header}>
              <View style={loginStyles.logoContainer}>
                <View style={loginStyles.logoWrapper}>
                  <View style={loginStyles.logo}>
                    <Text style={loginStyles.logoText}>
                      <FontAwesome name="sign-in" size={40} color="#fdfdfdff" />
                    </Text>
                  </View>
                </View>
                <Text style={loginStyles.title}>ورود به سیستم</Text>
                <Text style={loginStyles.subtitle}>
                  خوش آمدید! لطفاً وارد شوید
                </Text>
              </View>
            </View>

            <View style={loginStyles.formContainer}>
              {biometricAvailable && savedCredentials && (
                <View style={loginStyles.biometricContainer}>
                  <TouchableOpacity
                    style={[
                      loginStyles.biometricButton,
                      (loading || biometricPrompted) && loginStyles.buttonDisabled
                    ]}
                    onPress={promptBiometricLogin}
                    activeOpacity={0.7}
                    disabled={loading || biometricPrompted}
                  >
                    <Text style={loginStyles.biometricIcon}>
                      {getBiometricIcon()}
                    </Text>
                    <Text style={loginStyles.biometricText}>
                      {biometricPrompted ? "در حال احراز هویت..." : `ورود با ${biometricType === "face" ? "تشخیص چهره" : "اثر انگشت"}`}
                    </Text>
                    {(loading || biometricPrompted) && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>

                  <View style={loginStyles.divider}>
                    <View style={loginStyles.dividerLine} />
                    <View style={loginStyles.dividerLine} />
                  </View>
                </View>
              )}

              <View style={loginStyles.inputContainer}>
                <View style={loginStyles.inputWrapper}>
                  <TextInput
                    style={[
                      loginStyles.input,
                      loading && loginStyles.inputDisabled
                    ]}
                    placeholder="کد کاربری"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={(text) => setUsername(convertPersianToEnglishNumbers(text))}
                    textAlign="right"
                    editable={!loading}
                  />
                  <View style={loginStyles.inputIcon}>
                    <Text style={loginStyles.iconText}>
                      <FontAwesome name="user" size={24} color="#a6a9b2ff" />
                    </Text>
                  </View>
                </View>

                <View style={loginStyles.inputWrapper}>
                  <TextInput
                    style={[
                      loginStyles.input,
                      loading && loginStyles.inputDisabled
                    ]}
                    placeholder="رمز عبور"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => setPassword(convertPersianToEnglishNumbers(text))}
                    textAlign="right"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={loginStyles.inputIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <Text style={loginStyles.iconText}>
                      {showPassword ? (
                        "👁️"
                      ) : (
                        <FontAwesome name="lock" size={24} color="#a6a9b2ff" />
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={loginStyles.createPasswordLink}
                  onPress={() => setShowPasswordModal(true)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={loginStyles.createPasswordText}>
                    ایجاد رمز عبور برای مشتریان
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  loginStyles.loginButton,
                  (loading || loginAttemptRef.current) && loginStyles.buttonDisabled,
                ]}
                onPress={() => handleLogin()}
                disabled={loading || loginAttemptRef.current}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={loginStyles.loginButtonText}>در حال ورود...</Text>
                  </View>
                ) : (
                  <Text style={loginStyles.loginButtonText}>ورود</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  loginStyles.settingsButton,
                  loading && loginStyles.buttonDisabled
                ]}
                onPress={() => setSettingsVisible(true)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={loginStyles.settingsIcon}>
                  <FontAwesome name="gear" size={24} color="#a6a9b2ff" />
                </Text>
                <Text style={loginStyles.settingsButtonText}>تنظیمات سرور</Text>
              </TouchableOpacity>

              <View style={loginStyles.connectionStatus}>
                <View
                  style={[
                    loginStyles.statusDot,
                    {
                      backgroundColor:
                        activeTab === "url"
                          ? customUrl
                            ? "#10b981"
                            : "#ef4444"
                          : ip && port
                            ? "#10b981"
                            : "#ef4444",
                    },
                  ]}
                />
                <Text style={loginStyles.statusText}>
                  متصل به: {getConnectionStatus()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={loginStyles.modalBackground}>
            <View style={loginStyles.modalContainer}>
              <View style={loginStyles.modalHeader}>
                <Text style={loginStyles.modalTitle}>تنظیمات سرور</Text>
                <TouchableOpacity
                  style={loginStyles.closeButton}
                  onPress={() => setSettingsVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={loginStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={loginStyles.tabContainer}>
                <TouchableOpacity
                  style={[
                    loginStyles.tab,
                    activeTab === "ip" && loginStyles.tabActive,
                  ]}
                  onPress={() => setActiveTab("ip")}
                >
                  <Text
                    style={[
                      loginStyles.tabText,
                      activeTab === "ip" && loginStyles.tabTextActive,
                    ]}
                  >
                    IP و پورت
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    loginStyles.tab,
                    activeTab === "url" && loginStyles.tabActive,
                  ]}
                  onPress={() => setActiveTab("url")}
                >
                  <Text
                    style={[
                      loginStyles.tabText,
                      activeTab === "url" && loginStyles.tabTextActive,
                    ]}
                  >
                    لینک سفارشی
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={loginStyles.modalContent}>
                {activeTab === "ip" ? (
                  <>
                    <View style={loginStyles.inputWrapper}>
                      <TextInput
                        style={loginStyles.input}
                        placeholder="آی‌پی سرور (مثال: 192.168.1.1)"
                        placeholderTextColor="#94a3b8"
                        value={ip}
                        onChangeText={setIp}
                        textAlign="right"
                      />
                      <View style={loginStyles.inputIcon}>
                        <Text style={loginStyles.iconText}>🌐</Text>
                      </View>
                    </View>

                    <View style={loginStyles.inputWrapper}>
                      <TextInput
                        style={loginStyles.input}
                        placeholder="پورت (مثال: 3000)"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={port}
                        onChangeText={setPort}
                        textAlign="right"
                      />
                      <View style={loginStyles.inputIcon}>
                        <Text style={loginStyles.iconText}>🔌</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={loginStyles.inputWrapper}>
                    <TextInput
                      style={loginStyles.input}
                      placeholder="لینک سرور (مثال: https://api.example.com)"
                      placeholderTextColor="#94a3b8"
                      value={customUrl}
                      onChangeText={setCustomUrl}
                      textAlign="right"
                    />
                    <View style={loginStyles.inputIcon}>
                      <Text style={loginStyles.iconText}>🔗</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={loginStyles.saveButton}
                  onPress={() => setSettingsVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={loginStyles.saveButtonText}>تایید و ذخیره</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <CustomerPasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(buyerCode, password) => {
            setUsername(buyerCode);
            setPassword(password);
            setShowPasswordModal(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}