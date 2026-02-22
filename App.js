import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar, Text, TouchableOpacity, View
} from "react-native";
import { CartProvider } from "./CartContext";
import { getCurrentRoute, navigationRef } from "./navigationService";
import {
  getLastSentTime,
  isAutoSendRunning,
  startAutoSendLocation,
  stopAutoSendLocation
} from './services/locationService';

// صفحات
import BuyerListScreen from "./screens/BuyerListScreen";
import CartScreen from "./screens/CartScreen";
import ChatScreen from "./screens/ChatScreen";
import CustomerRegistration from "./screens/CustomerRegistration";
import CustomerRequestsScreen from "./screens/CustomerRequestsScreen";
import DeliveryOrdersScreen from "./screens/DeliveryOrdersScreen";
import EditInvoiceScreen from "./screens/EditInvoiceScreen";
import HomeScreen from "./screens/HomeScreen";
import InvoiceItemsScreen from './screens/InvoiceItemsScreen';
import InvoicesScreen from "./screens/InvoicesScreen";
import LearnChatBot from "./screens/LearnChatBot";
import LoginScreen from "./screens/LoginScreen";
import MapBuyerScreen from "./screens/MapBuyerScreen";
import MapDeliveriScreen from "./screens/MapDeliveriScreen";
import OrderReportScreen from "./screens/OrderReportScreen";
import ProductGroupsScreen from "./screens/ProductGroupsScreen";
import ProductListScreen from "./screens/ProductListScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ReportScreen from "./screens/ReportScreen";
import SellerPerformanceScreen from "./screens/SellerPerformanceScreen";

// کامپوننت منوی جانبی
import SideMenu from "./components/MenuItems";

// استایل جدا
import styles from "./styles/App.styles";

const Stack = createStackNavigator();

// Error Boundary
class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("⚠️ App Error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#010b35ff",
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>مشکلی پیش آمد</Text>
          <Text style={{ color: "white", marginTop: 10 }}>
            لطفاً برنامه را restart کنید
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// تابع کمکی برای دریافت اطلاعات کاربر و buyerCode
// در App.js، تابع getUserInfo را اینطور اصلاح کنید:
const getUserInfo = async () => {
  try {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return { user: null, buyerCode: null, userType: null };

    const user = JSON.parse(userData);

    // 🔥 تشخیص صحیح نوع کاربر
    let buyerCode = null;
    let userType = 'seller'; // پیش‌فرض

    if (user.role === 'delivery' || user.UserType === 'delivery') {
      userType = 'delivery';
    } else if (user.role === 'customer' || user.UserType === 'customer') {
      userType = 'customer';
      buyerCode = user.NOF || user.id || null;
    }
    return { user, buyerCode, userType };
  } catch (error) {
    console.warn("⚠️ Error getting user info:", error);
    return { user: null, buyerCode: null, userType: null };
  }
};

// 🔥 کامپوننت دکمه خانه برای هدر
const HomeHeaderButton = ({ navigation }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate("Home")}
    style={{
      marginRight: 15,
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    }}
    activeOpacity={0.7}
  >
    <FontAwesome name="home" size={20} color="#fff" />
  </TouchableOpacity>
);

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState("");
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('seller');
  const [buyerCode, setBuyerCode] = useState(null);
  const [overlayAnimation] = useState(new Animated.Value(0));

  const [fontsLoaded] = useFonts({
    IRANYekan: require("./assets/fonts/IRANYekanMediumFaNum.ttf"),
    "IRANYekan-Bold": require("./assets/fonts/IRANYekanRegularFaNum.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ✅ بررسی وضعیت لاگین و دریافت اطلاعات کاربر
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");

        if (token && userData) {
          const user = JSON.parse(userData);

          // تشخیص نوع کاربر
          let userType = 'seller';
          let buyerCode = null;

          if (user.role === 'delivery' || user.UserType === 'delivery') {
            userType = 'delivery';
          } else if (user.role === 'customer' || user.UserType === 'customer') {
            userType = 'customer';
            buyerCode = user.NOF || user.id || null;
          }

          setIsLoggedIn(true);
          setUser(user);
          setUserType(userType);
          setBuyerCode(buyerCode);

          console.log('👤 Initial User Info:', {
            name: user.NameF || user.name,
            type: userType,
            buyerCode: buyerCode,
            NOF: user.NOF,
            id: user.id
          });

          // 🔥 اگر کاربر از قبل لاگین بود، سرویس لوکیشن را شروع کن
          if (userType === 'seller' || userType === 'delivery') {
            setTimeout(async () => {
              try {
                console.log('📍 Starting location service for existing session...');
const visitorInfo = {
  VisitorCode: user.userId?.toString() ||  // 🔥 این را اضافه کنید
              user.id?.toString() || 
              user.NOF?.toString() || 
              user.UserID?.toString() ||
              'unknown',
  VisitorName: user.NameF || 
              user.name || 
              user.FullName || 
              'Unknown User'
};

                console.log('📍 VisitorInfo for existing session:', visitorInfo);

                // ذخیره visitor info
                await AsyncStorage.setItem('visitor_info', JSON.stringify(visitorInfo));

                // شروع ارسال خودکار
                await startAutoSendLocation(visitorInfo, {
                  intervalMs: 60000,
                  minInterval: 10000
                });

                console.log('✅ Location service started for existing session');
              } catch (locationError) {
                console.warn('⚠️ Failed to start location service for existing session:', locationError.message);
              }
            }, 2000); // 2 ثانیه تاخیر برای اطمینان
          }
        }
      } catch (err) {
        console.warn("⚠️ Auth check warning:", err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  // ✅ انیمیشن دکمه منو
  useEffect(() => {
    if (menuOpen) {
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [menuOpen]);

  // ✅ هندل موفقیت لاگین
  // ✅ هندل موفقیت لاگین
 const handleLoginSuccess = async (userData) => {  // پارامتر رو برگردون
  try {
    setIsLoggedIn(true);

    // از پارامتر استفاده کن، نه فقط AsyncStorage
    const user = userData || JSON.parse(await AsyncStorage.getItem("user"));
    if (!user) { setIsLoggedIn(false); return; }

    setUser(user);

    let userType = 'seller';
    let buyerCode = null;

    if (user.role === 'delivery' || user.UserType === 'delivery') {
      userType = 'delivery';
    } else if (user.role === 'customer' || user.UserType === 'customer') {
      userType = 'customer';
      buyerCode = user.NOF || user.id || null;
    }

    setUserType(userType);
    setBuyerCode(buyerCode);

      if (user.role === 'delivery' || user.UserType === 'delivery') {
        userType = 'delivery';
      } else if (user.role === 'customer' || user.UserType === 'customer') {
        userType = 'customer';
        buyerCode = user.NOF || user.id || null;
      }

      setUserType(userType);
      setBuyerCode(buyerCode);

      console.log('✅ User Info Loaded:', {
        name: user.NameF || user.name,
        type: userType,
        buyerCode: buyerCode,
        NOF: user.NOF,
        id: user.id
      });

      setMenuOpen(false);

      // 🔥 شروع سرویس لوکیشن برای فروشنده و تحویل‌دار
      if (userType === 'seller' || userType === 'delivery') {
        try {
          console.log('📍 Starting location service...');

 const visitorInfo = {
  VisitorCode: user.userId?.toString() ||  // 🔥 این را اضافه کنید
              user.id?.toString() || 
              user.NOF?.toString() || 
              user.UserID?.toString() ||
              'unknown',
  VisitorName: user.NameF || 
              user.name || 
              user.FullName || 
              'Unknown User'
};


          // ذخیره visitor info
          await AsyncStorage.setItem('visitor_info', JSON.stringify(visitorInfo));

          // شروع ارسال خودکار
          await startAutoSendLocation(visitorInfo, {
            intervalMs: 60000, // هر 1 دقیقه
            minInterval: 10000
          });

          console.log('✅ Location service started successfully');

          // تست بعد از 2 دقیقه
          setTimeout(() => {
            console.log('📍 Test after 2 minutes...');
            try {
              const running = isAutoSendRunning();
              const lastTime = getLastSentTime();
              const timeSince = Date.now() - lastTime;
              console.log(`📍 Status: ${running ? 'running' : 'stopped'}`);
              console.log(`📍 Last sent: ${Math.floor(timeSince / 1000)} seconds ago`);
            } catch (error) {
              console.log('❌ Error checking status:', error.message);
            }
          }, 120000);

        } catch (locationError) {
          console.warn('⚠️ Failed to start location service:', locationError.message);
        }
      }

    } catch (err) {
      console.warn("⚠️ Login success warning:", err.message);
      setIsLoggedIn(false);
    }
  };

  // ✅ هندل خروج
  const handleLogout = async () => {
    try {
      stopAutoSendLocation();
      setIsLoggedIn(false);
      setUser(null);
      setUserType('seller');
      setBuyerCode(null);
      setMenuOpen(false);
    } catch (err) {
      console.warn("⚠️ Logout warning:", err.message);
    }
  };

  // ✅ هندل باز کردن منو
  const handleOpenMenu = async () => {
    setMenuOpen((prev) => !prev);
  };

  // ✅ صفحه loading
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

  return (
    <AppErrorBoundary>
      <CartProvider>
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
              style={{ fontFamily: "IRANYekan" }}
              translucent
            />

            <Stack.Navigator
              screenOptions={({ navigation, route }) => ({
                headerStyle: {
                  backgroundColor: "#0622a3ff",
                  elevation: 0,
                  shadowOpacity: 0,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontFamily: "IRANYekan",
                  fontSize: 15,
                },
                headerTitleAlign: "center",
                // 🔥 اضافه کردن دکمه خانه در تمام صفحات به جز صفحه اصلی
                headerRight: () =>
                  route.name !== "Home" && (
                    <HomeHeaderButton navigation={navigation} />
                  ),
              })}
            >
              {isLoggedIn ? (
                // ✅ صفحات کاربر لاگین شده
                <>
                  <Stack.Screen
                    name="Home"
                    options={{ headerShown: false }}
                  >
                    {(props) => (
                      <HomeScreen
                        {...props}
                        route={{
                          ...props.route,
                          params: {
                            ...props.route.params,
                            onLogout: handleLogout,
                            userType: userType,
                            buyerCode: buyerCode
                          }
                        }}
                      />
                    )}
                  </Stack.Screen>

                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: "پروفایل" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="Cart"
                    component={CartScreen}
                    options={{ title: "سبد خرید" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="ProductGroups"
                    component={ProductGroupsScreen}
                    options={{ title: "گروه کالاها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="ProductList"
                    component={ProductListScreen}
                    options={{ title: "کالاها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="Search"
                    component={ProductListScreen}
                    options={{ title: "جستجو" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="Report"
                    component={ReportScreen}
                    options={{ title: "گزارش فاکتورها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="BuyerList"
                    component={BuyerListScreen}
                    options={{ title: "لیست مشتری‌ها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="CustomerRegistration"
                    component={CustomerRegistration}
                    options={{ title: "تعریف مشتری جدید" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="MapBuyer"
                    component={MapBuyerScreen}
                    options={{ title: "نقشه مشتری‌ها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="Invoices"
                    component={InvoicesScreen}
                    options={{ title: "فاکتورها" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="EditInvoice"
                    component={EditInvoiceScreen}
                    options={{
                      title: "ویرایش فاکتور",
                      // 🔥 غیرفعال کردن دکمه خانه در صفحه EditInvoice
                      headerRight: null
                    }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="OrderReport"
                    component={OrderReportScreen}
                    options={{ title: "گزارش سفارشات" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{ title: "پیام رسانی" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />

                  <Stack.Screen
                    name="SellerPerformance"
                    component={SellerPerformanceScreen}
                    options={{ title: "عملکرد فروشنده" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />
                  <Stack.Screen
                    name="CustomerRequests"
                    component={CustomerRequestsScreen}
                    options={{ title: "درخواست‌های من" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />
                  <Stack.Screen
                    name="DeliveryOrdersScreen"
                    component={DeliveryOrdersScreen}
                    options={{ title: "خروجی کالا" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />
                  <Stack.Screen
                    name="MapDeliveri"
                    component={MapDeliveriScreen}
                    options={{ title: "نقشه تحویل" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />
                  <Stack.Screen
                    name="InvoiceItems"
                    component={InvoiceItemsScreen}
                    options={{ title: 'اقلام فاکتور' }}
                  />

                  <Stack.Screen
                    name="LearnChatBot"
                    component={LearnChatBot}
                    options={{ title: "آموزش اپلیکیشن" }}
                    initialParams={{
                      userType: userType,
                      buyerCode: buyerCode
                    }}
                  />
                </>
              ) : (
                // ✅ صفحه لاگین
                <Stack.Screen name="LoginScreen" options={{ headerShown: false }}>
                  {(props) => (
                    <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
                  )}
                </Stack.Screen>
              )}
            </Stack.Navigator>

            {/* ✅ منو جانبی - فقط وقتی لاگین هستیم */}
            {isLoggedIn && currentRouteName !== "EditInvoice" && (
              <>
                <SideMenu
                  isOpen={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  user={user}
                  onLogout={handleLogout}
                />
              </>
            )}
          </View>
        </NavigationContainer>
      </CartProvider>
    </AppErrorBoundary>
  );
}