// App.js
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Linking,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CartProvider } from "./CartContext";
import { getCurrentRoute, navigationRef } from "./navigationService";
import { checkTrackingEnabled, startAutoSendLocation, stopAutoSendLocation } from './services/locationService';
import { initSocket } from "./socket";
// صفحات
import SideMenu from "./components/MenuItems";
import MockLocationGate from './components/MockLocationGate';
import BuyerListScreen from "./screens/BuyerListScreen";
import CartScreen from "./screens/CartScreen";
import ChatScreen from "./screens/ChatScreen";
import CustomerPaymentScreen from "./screens/CustomerPaymentScreen";
import CustomerRegistration from "./screens/CustomerRegistration";
import CustomerRequestsScreen from "./screens/CustomerRequestsScreen";
import DeliveryOrdersScreen from "./screens/DeliveryOrdersScreen";
import EditInvoiceScreen from "./screens/EditInvoiceScreen";
import FactorPishDetailScreen from "./screens/FactorPishDetailScreen";
import HomeScreen from "./screens/HomeScreen";
import InvoiceItemsScreen from "./screens/InvoiceItemsScreen";
import InvoicesScreen from "./screens/InvoicesScreen";
import LearnChatBot from "./screens/LearnChatBot";
import LoginScreen from "./screens/LoginScreen";
import ManagerRozMasirScreen from "./screens/ManagerRozMasirScreen";
import ManagerVisitorOrdersScreen from './screens/ManagerVisitorOrdersScreen';
import MapBuyerScreen from "./screens/MapBuyerScreen";
import MapDeliveriScreen from "./screens/MapDeliveriScreen";
import OrderReportScreen from "./screens/OrderReportScreen";
import PendingFactorPishScreen from "./screens/PendingFactorPishScreen";
import ProductGroupsScreen from "./screens/ProductGroupsScreen";
import ProductListScreen from "./screens/ProductListScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ReportScreen from "./screens/ReportScreen";
import SellerPerformanceScreen from "./screens/SellerPerformanceScreen";
import {
  emitUserOffline,
  emitUserOnline
} from './socket';
import styles from "./styles/App.styles";

// 🐛 دیباگ موقت Mock Location — بعد از حل مشکل این خط و کامپوننت DebugMockButton پایین رو حذف کن
import { debugMockCheck } from './debug-mock-check';

// ─── import سرویس لوکیشن ───

const Stack = createStackNavigator();
const APP_CONFIG = { LOCATION_TRACKING_ENABLED: true };

// ─────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────
class AppErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.warn("⚠️ App Error:", error.message); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#010b35ff" }}>
          <Text style={{ color: "white", fontSize: 18 }}>مشکلی پیش آمد</Text>
          <Text style={{ color: "white", marginTop: 10 }}>لطفاً برنامه را restart کنید</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────
// 🔐 Gate مجوز لوکیشن
// ─────────────────────────────────────────────────────────
const LocationPermissionGate = ({ onPermissionsGranted }) => {
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [permStatus, setPermStatus] = useState(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkStatus();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermStatus("denied");
        setChecking(false);
        return;
      }

      // ─── GPS واقعی رو تست کن ───
      try {
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
          timeout: 10000,
        });
        onPermissionsGranted(); // موفق شد → باز کن
      } catch {
        setPermStatus("gps_off"); // نشد → قفل بمون
      }

    } catch (e) {
      console.warn("⚠️ Gate check error:", e.message);
      setPermStatus("denied");
    } finally {
      setChecking(false);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("📍 Permission request result:", status);

      if (status === "granted") {
        // بعد از grant هم provider رو چک کن
        const providerStatus = await Location.getProviderStatusAsync();
        if (!providerStatus.locationServicesEnabled) {
          setPermStatus("gps_off");
        } else {
          onPermissionsGranted();
        }
      } else {
        setPermStatus("denied");
        Alert.alert(
          "دسترسی رد شد",
          "برای استفاده از اپلیکیشن باید موقعیت را از تنظیمات دستگاه فعال کنید.",
          [
            { text: "رفتن به تنظیمات", onPress: () => Linking.openSettings() },
            { text: "بعداً", style: "cancel" },
          ]
        );
      }
    } catch (e) {
      console.warn("⚠️ Request error:", e.message);
    } finally {
      setRequesting(false);
    }
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#010b35ff" }}>
        <StatusBar barStyle="light-content" backgroundColor="#010b35ff" />
        <ActivityIndicator size="large" color="#4f7eff" />
        <Text style={{ color: "#fff", marginTop: 16, fontFamily: "IRANYekan", fontSize: 14 }}>
          در حال بررسی دسترسی‌ها...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#010b35ff", padding: 32 }}>
      <StatusBar barStyle="light-content" backgroundColor="#010b35ff" />

      <View style={{
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: "rgba(6,34,163,0.35)",
        justifyContent: "center", alignItems: "center",
        marginBottom: 32,
        borderWidth: 1, borderColor: "rgba(79,126,255,0.3)",
      }}>
        <FontAwesome name="map-marker" size={48} color="#4f7eff" />
      </View>

      <Text style={{ color: "#fff", fontSize: 22, fontFamily: "IRANYekan-Bold", textAlign: "center", marginBottom: 16 }}>
        دسترسی موقعیت الزامی است
      </Text>

      <Text style={{ color: "#8899cc", fontSize: 14, fontFamily: "IRANYekan", textAlign: "center", lineHeight: 28, marginBottom: 32 }}>
        این اپلیکیشن برای ردیابی ویزیتور نیاز به{"\n"}
        دسترسی موقعیت مکانی شما دارد.{"\n"}
        بدون این مجوز امکان ورود وجود ندارد.
      </Text>

      {permStatus === "denied" && (
        <View style={{
          backgroundColor: "rgba(220,53,69,0.15)", borderRadius: 10, padding: 12,
          marginBottom: 16, width: "100%",
          borderWidth: 1, borderColor: "rgba(220,53,69,0.3)",
        }}>
          <Text style={{ color: "#ff6b6b", fontSize: 13, fontFamily: "IRANYekan", textAlign: "center" }}>
            ⚠️ دسترسی رد شده — لطفاً از تنظیمات فعال کنید
          </Text>
        </View>
      )}

      {permStatus === "gps_off" && (
        <View style={{
          backgroundColor: "rgba(255,140,0,0.15)", borderRadius: 10, padding: 12,
          marginBottom: 16, width: "100%",
          borderWidth: 1, borderColor: "rgba(255,140,0,0.3)",
        }}>
          <Text style={{ color: "#ffaa44", fontSize: 13, fontFamily: "IRANYekan", textAlign: "center" }}>
            ⚠️ لوکیشن دستگاه خاموش است — لطفاً GPS را روشن کنید
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={
          permStatus === "denied" || permStatus === "gps_off"
            ? () => Linking.openSettings()
            : handleRequest
        }
        disabled={requesting}
        style={{
          backgroundColor: "#0622a3", paddingVertical: 16,
          borderRadius: 14, width: "100%", alignItems: "center",
          marginBottom: 14, opacity: requesting ? 0.7 : 1,
          borderWidth: 1, borderColor: "rgba(79,126,255,0.4)",
        }}
        activeOpacity={0.8}
      >
        {requesting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontFamily: "IRANYekan-Bold" }}>
            {permStatus === "denied"
              ? "رفتن به تنظیمات"
              : permStatus === "gps_off"
                ? "روشن کردن GPS"
                : "فعال‌سازی موقعیت"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={checkStatus} activeOpacity={0.7} style={{ padding: 8 }}>
        <Text style={{ color: "#4f7eff", fontSize: 13, fontFamily: "IRANYekan" }}>
          بررسی مجدد دسترسی
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// دکمه خانه در هدر
// ─────────────────────────────────────────────────────────
const HomeHeaderButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate("Home")}
    style={{ marginRight: 15, padding: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)" }}
    activeOpacity={0.7}
  >
    <FontAwesome name="home" size={20} color="#fff" />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────
// 🐛 دکمه شناور دیباگ Mock Location (فقط برای تست - بعد از حل مشکل حذف شود)
// ─────────────────────────────────────────────────────────
const DebugMockButton = () => (
  <TouchableOpacity
    onPress={debugMockCheck}
    style={{
      position: 'absolute',
      bottom: 40,
      right: 20,
      backgroundColor: '#ff0000',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      elevation: 10,
    }}
    activeOpacity={0.7}
  >
    <Text style={{ color: '#fff', fontSize: 20 }}>🐛</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────
// App اصلی
// ─────────────────────────────────────────────────────────
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationChecking, setLocationChecking] = useState(true);
  const [locationGranted, setLocationGranted] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState("");
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState("seller");
  const [buyerCode, setBuyerCode] = useState(null);
  const [overlayAnimation] = useState(new Animated.Value(0));

  // 🔥 ref برای نگه داشتن interval لوکیشن
  const locationIntervalRef = useRef(null);

  const [fontsLoaded] = useFonts({
    IRANYekan: require("./assets/fonts/IRANYekanMediumFaNum.ttf"),
    "IRANYekan-Bold": require("./assets/fonts/IRANYekanRegularFaNum.ttf"),
  });

  // ─── SplashScreen + چک مجوز اولیه ───
  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();

  }, [fontsLoaded]);

  // ─── بررسی وضعیت لاگین ───
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          const { resolvedUserType, resolvedBuyerCode } = resolveUserType(parsedUser);
          setIsLoggedIn(true);
          setUser(parsedUser);
          setUserType(resolvedUserType);
          setBuyerCode(resolvedBuyerCode);

          if (resolvedUserType === "seller") {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === "granted") {
              try {
                await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Lowest,
                  timeout: 10000,
                });
                setLocationGranted(true);
                setTimeout(() => startLocationTracking(parsedUser), 500);
              } catch {
                setLocationGranted(false);
              }
            } else {
              setLocationGranted(false);
            }
          } else {
            setLocationGranted(true);
            setTimeout(() => startLocationTracking(parsedUser), 500);
          }
        }
      } catch (err) {
        console.warn("⚠️ Auth check:", err.message);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);


useEffect(() => {
  if (!isLoggedIn || !user) return;

  let mounted = true;

  const connectAndGoOnline = async () => {
    try {
      await initSocket();
      if (mounted) {
        emitUserOnline({
          userId: user?.NOF,
          userName: user?.NameF,
          role: user?.role || user?.UserType 
        });
      }
    } catch (e) {
      console.warn("⚠️ خطا در اتصال سوکت:", e.message);
    }
  };

  // ✅ بلافاصله بعد از این‌که isLoggedIn و user ست شدن (لاگین تازه، یا اپ با توکن قبلی باز شده) وصل شو
  connectAndGoOnline();

  const subscription = AppState.addEventListener("change", async (nextState) => {
    if (nextState === "active") {
      await connectAndGoOnline();
    }
    if (nextState === "background" || nextState === "inactive") {
      emitUserOffline();
    }
  });

  return () => {
    mounted = false;
    subscription.remove();
  };
}, [isLoggedIn, user]);

  // ─── انیمیشن منو ───
  useEffect(() => {
    Animated.timing(overlayAnimation, {
      toValue: menuOpen ? 1 : 0,
      duration: menuOpen ? 250 : 200,
      useNativeDriver: true,
    }).start();
  }, [menuOpen]);

  // ─── 🔒 نگهبان GPS: قفل برنامه اگه GPS خاموش شد ───
  useEffect(() => {
    if (!locationGranted) return;

    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active") {
        try {
          // ─── فقط برای seller چک کن ───
          const userData = await AsyncStorage.getItem("user");
          const parsedUser = userData ? JSON.parse(userData) : null;
          const isSeller = !parsedUser ||
            parsedUser.role === 'seller' ||
            parsedUser.UserType === 'seller';

          if (!isSeller) return; // customer/delivery → رد بشه

          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== "granted") {
            setLocationGranted(false);
            return;
          }
          try {
            await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
              timeout: 8000,
            });
          } catch {
            setLocationGranted(false);
          }
        } catch (e) {
          console.warn("⚠️ GPS re-check:", e.message);
        }
      }
    });

    return () => subscription.remove();
  }, [locationGranted]);
  // ─────────────────────────────────────────────
  // 🔥 شروع ارسال لوکیشن هر ۶۰ ثانیه
  // ─────────────────────────────────────────────

  const startLocationTracking = async (parsedUser) => {
    if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) return;

    try {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      // 🔍 چک مجوز مدیر قبل از شروع
      const trackingAllowed = await checkTrackingEnabled();
      if (!trackingAllowed) {
        console.log('🚫 Location tracking disabled by manager');
        return;
      }

      const visitorInfo = {
        VisitorCode:
          parsedUser.userId?.toString() ||
          parsedUser.UserID?.toString() ||
          parsedUser.id?.toString() ||
          parsedUser.NOF?.toString() ||
          'unknown',
        VisitorName:
          parsedUser.NameF || parsedUser.name || parsedUser.FullName || 'Unknown User',
      };

      await AsyncStorage.setItem('visitor_info', JSON.stringify(visitorInfo));
      await startAutoSendLocation(visitorInfo, { intervalMs: 60000, minInterval: 10000 });

      console.log('✅ Location tracking started');
    } catch (e) {
      console.warn('⚠️ Location tracking error:', e.message);
    }
  };

  const stopLocationTracking = () => {
    stopAutoSendLocation();
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    console.log("⏹ Location tracking stopped");
  };

  // ─────────────────────────────────────────────
  // تابع کمکی نوع کاربر
  // ─────────────────────────────────────────────
  const resolveUserType = (userObj) => {
    let resolvedUserType = "seller";
    let resolvedBuyerCode = null;
    if (userObj.role === "delivery" || userObj.UserType === "delivery") {
      resolvedUserType = "delivery";
    } else if (userObj.role === "customer" || userObj.UserType === "customer") {
      resolvedUserType = "customer";
      resolvedBuyerCode = userObj.NOF || userObj.id || null;
    }
    return { resolvedUserType, resolvedBuyerCode };
  };

  // ─────────────────────────────────────────────
  // هندل لاگین
  // ─────────────────────────────────────────────
  const handleLoginSuccess = async (userData) => {
    try {
      const parsedUser = userData || JSON.parse(await AsyncStorage.getItem("user"));
      if (!parsedUser) { setIsLoggedIn(false); return; }

      const { resolvedUserType, resolvedBuyerCode } = resolveUserType(parsedUser);
      setIsLoggedIn(true);
      setUser(parsedUser);
      setUserType(resolvedUserType);
      setBuyerCode(resolvedBuyerCode);
      setMenuOpen(false);
    

      if (resolvedUserType === "seller") {
        // حالا که لاگین موفق بوده، چک کن GPS واقعاً روشنه یا نه
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
              timeout: 10000,
            });
            setLocationGranted(true);
          } catch {
            setLocationGranted(false); // گیت نشون داده میشه
          }
        } else {
          setLocationGranted(false); // گیت نشون داده میشه، کاربر مجوز میده
        }
        setTimeout(() => startLocationTracking(parsedUser), 500);
      } else {
        setLocationGranted(true); // customer/delivery نیازی به گیت ندارن
      }

      console.log("✅ Login success:", {
        name: parsedUser.name || parsedUser.NameF,
        type: resolvedUserType,
        userId: parsedUser.userId || parsedUser.id,
      });
    } catch (err) {
      console.warn("⚠️ Login warning:", err.message);
      setIsLoggedIn(false);
    }
  };

  // ─────────────────────────────────────────────
  // هندل خروج
  // ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      stopLocationTracking(); // 🔥 توقف لوکیشن
      setIsLoggedIn(false);
      setUser(null);
      setUserType("seller");
      setBuyerCode(null);
      setMenuOpen(false);
    } catch (err) {
      console.warn("⚠️ Logout warning:", err.message);
    }
  };
// ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0c0116ff" />
        <View style={styles.loadingGradient}>
          <View style={styles.loadingContent}>
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>در حال بارگذاری...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // 🔐 Gate مجوز لوکیشن
  // ─────────────────────────────────────────────
  if (isLoggedIn && userType === "seller" && !locationGranted) {
    return (
      <AppErrorBoundary>
        <LocationPermissionGate onPermissionsGranted={() => setLocationGranted(true)} />
      </AppErrorBoundary>
    );
  }

  // ─────────────────────────────────────────────
  // اپ اصلی
  // ─────────────────────────────────────────────
  const mainApp = (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const route = getCurrentRoute();
        setCurrentRouteName(route?.name || "");
      }}
    >
      <View style={styles.container}>
        <StatusBar
          barStyle={isLoggedIn ? "dark-content" : "light-content"}
          backgroundColor="transparent"
          translucent
        />
        <Stack.Navigator
          screenOptions={({ navigation, route }) => ({
            headerStyle: { backgroundColor: "#0622a3ff", elevation: 0, shadowOpacity: 0 },
            headerTintColor: "#fff",
            headerTitleStyle: { fontFamily: "IRANYekan", fontSize: 15 },
            headerTitleAlign: "center",
            headerRight: () =>
              route.name !== "Home" && <HomeHeaderButton navigation={navigation} />,
          })}
        >
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => (
                  <HomeScreen
                    {...props}
                    route={{
                      ...props.route,
                      params: { ...props.route.params, onLogout: handleLogout, userType, buyerCode },
                    }}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "پروفایل" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ title: "سبد خرید" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="ProductGroups" component={ProductGroupsScreen} options={{ title: "گروه کالاها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: "کالاها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="Search" component={ProductListScreen} options={{ title: "جستجو" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="Report" component={ReportScreen} options={{ title: "گزارش فاکتورها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="BuyerList" component={BuyerListScreen} options={{ title: "لیست مشتری‌ها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="CustomerRegistration" component={CustomerRegistration} options={{ title: "تعریف مشتری جدید" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="MapBuyer" component={MapBuyerScreen} options={{ title: "نقشه مشتری‌ها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: "فاکتورها" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="EditInvoice" component={EditInvoiceScreen} options={{ title: "ویرایش فاکتور", headerRight: null }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="OrderReport" component={OrderReportScreen} options={{ title: "گزارش سفارشات" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "پیام رسانی" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="SellerPerformance" component={SellerPerformanceScreen} options={{ title: "عملکرد فروشنده" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="CustomerRequests" component={CustomerRequestsScreen} options={{ title: "درخواست‌های من" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="DeliveryOrdersScreen" component={DeliveryOrdersScreen} options={{ title: "خروجی کالا" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="MapDeliveri" component={MapDeliveriScreen} options={{ title: "نقشه تحویل" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="InvoiceItems" component={InvoiceItemsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ManagerRozMasir" component={ManagerRozMasirScreen} options={{ title: "مدیریت روزمسیر" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="LearnChatBot" component={LearnChatBot} options={{ title: "آموزش اپلیکیشن" }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="ManagerVisitorOrders" component={ManagerVisitorOrdersScreen} options={{ title: 'گزارش سفارشات ویزیتورها' }} />
              <Stack.Screen name="PendingFactorPish" component={PendingFactorPishScreen} options={{ headerShown: false }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="FactorPishDetail" component={FactorPishDetailScreen} options={{ headerShown: false }} initialParams={{ userType, buyerCode }} />
              <Stack.Screen name="CustomerPayment" component={CustomerPaymentScreen} options={{ headerShown: false }} initialParams={{ userType, buyerCode }} />
            </>
          ) : (
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }}>
              {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>

        {isLoggedIn && currentRouteName !== "EditInvoice" && (
          <SideMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </View>
    </NavigationContainer>
  );

  return (
    <AppErrorBoundary>
      <CartProvider>
        {isLoggedIn && userType === "seller" ? (
          <MockLocationGate>{mainApp}</MockLocationGate>
        ) : (
          mainApp
        )}
        {/* 🐛 دکمه موقت دیباگ - بعد از حل مشکل حذف شود */}
        <DebugMockButton />
      </CartProvider>
    </AppErrorBoundary>
  );
}