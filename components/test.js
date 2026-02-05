// App.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CartProvider } from "./CartContext";
import { navigate, navigationRef } from "./navigationService";
import VPNBlockedScreen from "./screens/VPNBlockedScreen";
import VPNService from "./services/VPNService";

// صفحات
import BuyerListScreen from "./screens/BuyerListScreen";
import CartScreen from "./screens/CartScreen";
import CustomerRegistration from "./screens/CustomerRegistration";
import EditInvoiceScreen from "./screens/EditInvoiceScreen";
import InvoicesScreen from "./screens/InvoicesScreen";
import LoginScreen from "./screens/LoginScreen";
import MapBuyerScreen from "./screens/MapBuyerScreen";
import ProductGroupsScreen from "./screens/ProductGroupsScreen";
import ProductListScreen from "./screens/ProductListScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ReportScreen from "./screens/ReportScreen";
import { stopAutoSendLocation } from "./services/locationService";

// استایل جدا
import styles from "./styles/App.styles";

const Stack = createStackNavigator();
const { width, height } = Dimensions.get("window");

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
            backgroundColor: "#667eea",
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

// ✅ صفحه Home
function HomeScreen({ navigation }) {
  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      <View style={styles.homeGradient}>
        <View style={styles.homeFloat1} />
        <View style={styles.homeFloat2} />
        <View style={styles.homeContent}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>👋</Text>
            <Text style={styles.welcomeTitle}>خوش آمدید!</Text>
            <Text style={styles.welcomeSubtitle}>
              از منو برای دسترسی به بخش‌ها استفاده کنید
            </Text>

            {/* دکمه تست navigation */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                // بررسی VPN قبل از ناوبری
                const isBlocked = await VPNService.checkAndBlockVPN();
                if (!isBlocked) {
                  navigate("Profile");
                }
              }}
            >
              <Text style={styles.testButtonText}>تست ناوبری</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState("");
  const [user, setUser] = useState(null);
  const [menuAnimation] = useState(new Animated.Value(width));
  const [overlayAnimation] = useState(new Animated.Value(0));
  // const [fontsLoaded] = useFonts({
  //   IRANYekan: require("/fonts/woff/IRANYekan.woff"),
  //   "IRANYekan-Bold": require("/fonts/woff/IRANYekan-Bold.woff"),
  // });
  // 🔥 موقعیت دکمه منو - با در نظر گرفتن StatusBar
  const buttonSize = 60;
  const edgeMargin = 10;
  const statusBarHeight = StatusBar.currentHeight || 0;

  const menuButtonPosition = useRef(
    new Animated.ValueXY({
      x: width - buttonSize - edgeMargin,
      y: height - buttonSize - edgeMargin, // دقیقاً پایین
    })
  ).current;

  // 🔥 تابع محاسبه نزدیک‌ترین لبه و موقعیت نهایی
  const snapToEdge = (x, y) => {
    // محاسبه فاصله تا هر لبه (با در نظر گرفتن StatusBar)
    const distanceToLeft = x;
    const distanceToRight = width - x - buttonSize;
    const distanceToTop = y - statusBarHeight;
    const distanceToBottom = height - y - buttonSize;

    // پیدا کردن کمترین فاصله
    const distances = {
      left: distanceToLeft,
      right: distanceToRight,
      top: distanceToTop,
      bottom: distanceToBottom,
    };

    const closestEdge = Object.keys(distances).reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );

    let finalX, finalY;

    switch (closestEdge) {
      case "left":
        finalX = edgeMargin;
        finalY = y;
        break;
      case "right":
        finalX = width - buttonSize - edgeMargin;
        finalY = y;
        break;
      case "top":
        finalX = x;
        finalY = statusBarHeight; // با در نظر گرفتن StatusBar
        break;
      case "bottom":
        finalX = x;
        finalY = height - buttonSize; // دقیقاً پایین صفحه
        break;
      default:
        finalX = x;
        finalY = y;
    }

    // محدودیت‌های نهایی
    finalX = Math.max(
      edgeMargin,
      Math.min(width - buttonSize - edgeMargin, finalX)
    );
    finalY = Math.max(statusBarHeight, Math.min(height - buttonSize, finalY));

    return { x: finalX, y: finalY };
  };

  // 🔥 PanResponder برای درگ کردن دکمه
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        menuButtonPosition.setOffset({
          x: menuButtonPosition.x._value,
          y: menuButtonPosition.y._value,
        });
        menuButtonPosition.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: menuButtonPosition.x, dy: menuButtonPosition.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (e, gestureState) => {
        menuButtonPosition.flattenOffset();

        const currentX = menuButtonPosition.x._value;
        const currentY = menuButtonPosition.y._value;

        const finalPosition = snapToEdge(currentX, currentY);

        Animated.spring(menuButtonPosition, {
          toValue: finalPosition,
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start(() => {
          saveButtonPosition(finalPosition);
        });
      },

      onPanResponderTerminate: () => {
        menuButtonPosition.flattenOffset();
        const currentX = menuButtonPosition.x._value;
        const currentY = menuButtonPosition.y._value;
        const finalPosition = snapToEdge(currentX, currentY);

        Animated.spring(menuButtonPosition, {
          toValue: finalPosition,
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();
      },
    })
  ).current;

  // 🔥 ذخیره موقعیت
  const saveButtonPosition = async (position) => {
    try {
      await AsyncStorage.setItem(
        "menu_button_position",
        JSON.stringify(position)
      );
    } catch (error) {
      console.log("خطا در ذخیره موقعیت دکمه:", error);
    }
  };
  // useEffect(() => {
  //   if (fontsLoaded) {
  //     SplashScreen.hideAsync();
  //   }
  // }, [fontsLoaded]);

  // 🔥 بارگذاری موقعیت ذخیره شده
  useEffect(() => {
    const loadButtonPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(
          "menu_button_position"
        );
        if (savedPosition) {
          const { x, y } = JSON.parse(savedPosition);
          menuButtonPosition.setValue({ x, y });
        }
      } catch (error) {
        console.log("خطا در بارگذاری موقعیت دکمه:", error);
      }
    };

    loadButtonPosition();
  }, []);

  // ✅ بررسی وضعیت لاگین
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const [token, userData] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("user"),
        ]);

        if (token && userData) {
          setIsLoggedIn(true);
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.warn("⚠️ Auth check warning:", err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // ✅ انیمیشن منو
  useEffect(() => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(menuAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(menuAnimation, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuOpen]);

  // ✅ هندل موفقیت لاگین
  const handleLoginSuccess = async (userData) => {
    try {
      setIsLoggedIn(true);
      setUser(userData || null);
      setMenuOpen(false);
    } catch (err) {
      console.warn("⚠️ Login success warning:", err.message);
    }
  };

  // ✅ هندل خروج
  const handleLogout = async () => {
    Alert.alert("خروج از حساب", "آیا مطمئن هستید که می‌خواهید خارج شوید؟", [
      { text: "انصراف", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          try {
            await Promise.all([
              AsyncStorage.removeItem("token"),
              AsyncStorage.removeItem("user"),
              AsyncStorage.removeItem("is_demo_mode"),
            ]);
            if (stopAutoSendLocation) stopAutoSendLocation();
          } catch (err) {
            console.warn("⚠️ Logout warning:", err.message);
          } finally {
            setIsLoggedIn(false);
            setUser(null);
            setMenuOpen(false);
          }
        },
      },
    ]);
  };

  // ✅ آیتم‌های منو

  const menuItems = [
    {
      icon: <FontAwesome name="user" size={24} color="#a6a9b2ff" />,
      label: "پروفایل",
      screen: "Profile",
    },
    {
      icon: <FontAwesome name="shopping-cart" size={24} color="#a6a9b2ff" />,
      label: "سبد خرید",
      screen: "Cart",
    },
    {
      icon: <MaterialIcons name="category" size={24} color="#a6a9b2ff" />,
      label: "گروه محصولات",
      screen: "ProductGroups",
    },
    {
      icon: <FontAwesome name="search" size={24} color="#a6a9b2ff" />,
      label: "جستجو کالا",
      screen: "ProductList",
    },
    {
      icon: <FontAwesome name="users" size={24} color="#a6a9b2ff" />,
      label: "لیست مشتری‌ها",
      screen: "BuyerList",
    },
    {
      icon: <FontAwesome name="line-chart" size={24} color="#a6a9b2ff" />,
      label: "گزارش فاکتورها",
      screen: "Report",
    },
    {
      icon: <FontAwesome name="map-marker" size={24} color="#a6a9b2ff" />,
      label: "نقشه مشتری‌ها",
      screen: "MapBuyer",
    },
    {
      icon: <FontAwesome name="file-text" size={24} color="#a6a9b2ff" />,
      label: "فاکتورها",
      screen: "Invoices",
    },
  ];

  const navigateToScreen = async (screenName) => {
    try {
      const isBlocked = await VPNService.checkAndBlockVPN();
      if (isBlocked) return;

      const state = navigationRef.getRootState();
      const currentRoute = state?.routes[state.routes.length - 1];
      const currentRouteName = currentRoute?.name;
      const routeParams = currentRoute?.params;
      const hideMenuButton = currentRouteName === "EditInvoice";
      if (currentRouteName === "EditInvoice") {
        Alert.alert(
          "تغییرات بدون ذخیره",
          "آیا می‌خواهید تغییرات را ذخیره کنید؟",
          [
            {
              text: "لغو",
              style: "cancel",
              onPress: () => {
                setMenuOpen(false);
              },
            },
            {
              text: "ذخیره و رفتن",
              style: "default",
              onPress: async () => {
                try {
                  // ✅ فراخوانی تابع ذخیره از EditInvoiceScreen
                  if (routeParams?.saveInvoiceFromMenu) {
                    const saved = await routeParams.saveInvoiceFromMenu();
                    if (saved) {
                      setMenuOpen(false);
                      setTimeout(() => navigate(screenName), 100);
                    } else {
                      Alert.alert("خطا", "مشکلی در ذخیره فاکتور پیش آمد");
                    }
                  } else {
                    setMenuOpen(false);
                    setTimeout(() => navigate(screenName), 100);
                  }
                } catch (err) {
                  console.log("خطا:", err);
                  Alert.alert("خطا", "مشکلی پیش آمد");
                }
              },
            },
            {
              text: "بدون ذخیره",
              style: "destructive",
              onPress: async () => {
                try {
                  await AsyncStorage.multiRemove(["cart", "selectedCustomer"]);
                  setMenuOpen(false);
                  setTimeout(() => navigate(screenName), 100);
                } catch (err) {
                  console.log("خطا:", err);
                }
              },
            },
          ]
        );
        return;
      }

      // اگر صفحه دیگری است، فقط navigate کن
      setMenuOpen(false);
      setTimeout(() => navigate(screenName), 100);
    } catch (err) {
      console.warn("⚠️ Menu navigation warning:", err.message);
    }
  };

  // ✅ هندل باز کردن منو با بررسی VPN
  const handleOpenMenu = async () => {
    // بررسی VPN قبل از باز کردن منو
    const isBlocked = await VPNService.checkAndBlockVPN();
    if (isBlocked) {
      return; // اگر VPN وصل بود، منو باز نشود
    }
    setMenuOpen((prev) => !prev);
  };

  // ✅ صفحه loading
  if (loading) {
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
            const route = navigationRef.getCurrentRoute();
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
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#0622a3ff",
                  elevation: 0,
                  shadowOpacity: 0,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "bold",
                  fontSize: 18,
                },
                headerTitleAlign: "center",
              }}
            >
              {isLoggedIn ? (
                // ✅ صفحات کاربر لاگین شده
                <>
                  <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: "پروفایل" }}
                  />
                  <Stack.Screen
                    name="Cart"
                    component={CartScreen}
                    options={{ title: "سبد خرید" }}
                  />
                  <Stack.Screen
                    name="ProductGroups"
                    component={ProductGroupsScreen}
                    options={{ title: "گروه کالاها" }}
                  />
                  <Stack.Screen
                    name="ProductList"
                    component={ProductListScreen}
                    options={{ title: "کالاها" }}
                  />
                  <Stack.Screen
                    name="Search"
                    component={ProductListScreen}
                    options={{ title: "جستجو" }}
                  />
                  <Stack.Screen
                    name="Report"
                    component={ReportScreen}
                    options={{ title: "گزارش فاکتورها" }}
                  />

                  <Stack.Screen
                    name="BuyerList"
                    component={BuyerListScreen}
                    options={{ title: "لیست مشتری‌ها" }}
                  />
                  <Stack.Screen
                    name="CustomerRegistration"
                    component={CustomerRegistration}
                    options={{ title: "تعریف مشتری جدید" }}
                  />
                  <Stack.Screen
                    name="MapBuyer"
                    component={MapBuyerScreen}
                    options={{ title: "نقشه مشتری‌ها" }}
                  />
                  <Stack.Screen
                    name="Invoices"
                    component={InvoicesScreen}
                    options={{ title: "فاکتورها" }}
                  />
                  <Stack.Screen
                    name="EditInvoice"
                    component={EditInvoiceScreen}
                    options={{ title: "ویرایش فاکتور" }}
                  />
                  <Stack.Screen
                    name="VPNBlocked"
                    component={VPNBlockedScreen}
                    options={{ headerShown: false }}
                  />
                </>
              ) : (
                // ✅ صفحه لاگین
                <Stack.Screen
                  name="LoginScreen"
                  options={{ headerShown: false }}
                >
                  {(props) => (
                    <LoginScreen
                      {...props}
                      onLoginSuccess={handleLoginSuccess}
                    />
                  )}
                </Stack.Screen>
              )}
            </Stack.Navigator>

            {/* ✅ منو جانبی - فقط وقتی لاگین هستیم */}
            {isLoggedIn && currentRouteName !== "EditInvoice" && (
              <>
                <Modal
                  visible={menuOpen}
                  transparent
                  animationType="none"
                  onRequestClose={() => setMenuOpen(false)}
                  statusBarTranslucent
                >
                  <Animated.View
                    style={[styles.menuOverlay, { opacity: overlayAnimation }]}
                  >
                    <TouchableOpacity
                      style={styles.menuBackdrop}
                      activeOpacity={1}
                      onPress={() => setMenuOpen(false)}
                    />

                    <Animated.View
                      style={[
                        styles.menuContainer,
                        { transform: [{ translateX: menuAnimation }] },
                      ]}
                    >
                      {/* محتوای منو */}
                      <View style={styles.menuHeader}>
                        <View style={styles.menuHeaderContent}>
                          <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>
                              {user?.NameF?.charAt(0) ||
                                user?.name?.charAt(0) ||
                                "👤"}
                            </Text>
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.userName}>
                              {user?.NameF || user?.name || "کاربر"}
                            </Text>
                            <Text style={styles.userRole}>ویزیتور</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.closeMenuButton}
                          onPress={() => setMenuOpen(false)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.closeMenuText}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        style={styles.menuContent}
                        contentContainerStyle={styles.menuContentContainer}
                        showsVerticalScrollIndicator={false}
                      >
                        {menuItems.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.menuItemContainer}
                            onPress={() => navigateToScreen(item.screen)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.menuIconWrapper,
                                { backgroundColor: item.color + "20" },
                              ]}
                            >
                              <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Text style={styles.menuArrow}>
                              <FontAwesome
                                name="angle-left"
                                size={24}
                                color="#a6a9b2ff"
                              />
                            </Text>
                          </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                          style={[styles.menuItemContainer]}
                          onPress={handleLogout}
                          activeOpacity={0.7}
                        >
                          <View style={[{ backgroundColor: "transparent" }]}>
                            <Text>
                              <FontAwesome
                                name="sign-out"
                                size={24}
                                color="#f211116b"
                              />
                            </Text>
                          </View>
                          <Text style={[styles.menuLabel]}>خروج از حساب</Text>

                          <Text style={[styles.menuArrow]}>
                            <FontAwesome
                              name="angle-left"
                              size={24}
                              color="#a6a9b2ff"
                            />
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </Animated.View>
                  </Animated.View>
                </Modal>

                {/* 🔥 دکمه شناور منو - قابل درگ کردن */}
                <Animated.View
                  style={[
                    styles.floatingMenuButton,
                    {
                      left: menuButtonPosition.x,
                      top: menuButtonPosition.y,
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <TouchableOpacity
                    onPress={handleOpenMenu}
                    activeOpacity={0.9}
                    style={styles.floatingButtonTouchable}
                  >
                    <View style={styles.floatingButtonGradient}>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              rotate: overlayAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", "90deg"],
                              }),
                            },
                          ],
                        }}
                      >
                        <Text style={styles.floatingButtonText}>☰</Text>
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </View>
        </NavigationContainer>
      </CartProvider>
    </AppErrorBoundary>
  );
}
