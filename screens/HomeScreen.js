// screens/HomeScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Award, Calendar, LogOut, Mail, Phone, ShoppingCart, User, X } from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CartContext } from '../CartContext';
import HomeMenuGrid from "../components/HomeMenuGrid";
import PersianCalendar from '../components/PersianCalendar';
import { sendQuickLocation } from '../services/locationService'; // اضافه کردن import

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null); // اضافه کردن state جدید
  const slideAnim = useState(new Animated.Value(-width * 0.8))[0];
  const calendarAnim = useState(new Animated.Value(0))[0];
  const calendarOpacity = useState(new Animated.Value(0))[0];

  const { cart } = useContext(CartContext);
  const cartItemsCount = cart.length;
  const onLogoutFromApp = route?.params?.onLogout;
  const userType = route?.params?.userType || 'seller'; // دریافت userType از route params

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        console.log('👤 داده‌های کاربر از AsyncStorage:', userData);
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('👤 کاربر پارس شده:', {
            name: parsedUser.NameF || parsedUser.name,
            role: parsedUser.role,
            UserType: parsedUser.UserType,
            NOF: parsedUser.NOF,
            id: parsedUser.id
          });
          setUser(parsedUser);
          
          // 🔥 ایجاد visitorInfo از اطلاعات کاربر
          const info = {
            VisitorCode: parsedUser?.id?.toString() || parsedUser?.NOF?.toString() || 'unknown',
            VisitorName: parsedUser?.NameF || parsedUser?.name || 'Unknown User'
          };
          setVisitorInfo(info);
          console.log('📍 VisitorInfo ایجاد شد:', info);
        }
      } catch (error) {
        console.log("❌ خطا در بارگذاری کاربر:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // 🔥 تابع برای ارسال سریع لوکیشن
  const sendLocationOnMenuClick = async (menuName) => {
     if (!APP_CONFIG.LOCATION_TRACKING_ENABLED) {
    console.log('📍 Location tracking disabled');
    return;
  }
    try {
      console.log(`📍 کلیک روی منو: ${menuName}`);
      
      if (!visitorInfo) {
        console.log('⚠️ visitorInfo موجود نیست');
        return;
      }
      
      // فقط برای فروشنده و تحویل‌دار لوکیشن بفرست
      if (userType !== 'seller' && userType !== 'delivery') {
        console.log(`📌 کاربر از نوع ${userType} - نیازی به ثبت لوکیشن نیست`);
        return;
      }
      
      console.log(`📍 ارسال لوکیشن برای منو: ${menuName}`);
      
      // ارسال در پس‌زمینه بدون منتظر ماندن
      sendQuickLocation(visitorInfo).then(success => {
        if (success) {
          console.log(`✅ لوکیشن برای منو "${menuName}" ثبت شد`);
        } else {
          console.log(`⚠️ ثبت لوکیشن برای منو "${menuName}" ناموفق بود`);
        }
      }).catch(error => {
        console.log(`❌ خطا در ثبت لوکیشن: ${error.message}`);
      });
      
    } catch (error) {
      console.log(`❌ خطا در ارسال لوکیشن برای منو ${menuName}:`, error.message);
    }
  };

  // تابع کمکی برای تشخیص نقش کاربر
  const getUserRole = () => {
    if (!user) return userType || 'seller'; // اگر user null بود از userType استفاده کن
    
    // اول role را چک کن
    if (user.role) {
      return user.role;
    }
    
    // اگر role نبود، از UserType استفاده کن
    if (user.UserType) {
      return user.UserType;
    }
    
    // اگر هیچکدام نبود، از userType یا پیش‌فرض seller
    return userType || 'seller';
  };

  const userRole = getUserRole();
  console.log('🎯 نقش تشخیص داده شده کاربر:', userRole);

  const toggleSideMenu = () => {
    if (sideMenuVisible) {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSideMenuVisible(false));
    } else {
      setSideMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleCalendar = async () => {
    // 🔥 هنگام باز کردن تقویم هم لوکیشن ثبت کن
    if (!calendarVisible) {
      await sendLocationOnMenuClick('تقویم');
    }
    
    if (calendarVisible) {
      Animated.parallel([
        Animated.timing(calendarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setCalendarVisible(false));
    } else {
      setCalendarVisible(true);
      Animated.parallel([
        Animated.timing(calendarAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 🔥 تابع هندل ناوبری با ثبت لوکیشن
  const handleNavigationWithLocation = async (screen, menuName) => {
    try {
      // 1. ابتدا لوکیشن ثبت کن
      await sendLocationOnMenuClick(menuName);
      
      // 2. سپس ناوبری کن
      navigation.navigate(screen);
      
    } catch (error) {
      console.log(`❌ خطا در ناوبری به ${screen}:`, error.message);
      // در صورت خطا هم به صفحه برو
      navigation.navigate(screen);
    }
  };

  // 🔥 هندل کلیک روی سبد خرید با ثبت لوکیشن
  const handleCartPress = async () => {
    await sendLocationOnMenuClick('سبد خرید');
    navigation.navigate('Cart');
  };

  // 🔥 هندل کلیک روی پروفایل با ثبت لوکیشن
  const handleProfilePress = async () => {
    await sendLocationOnMenuClick('پروفایل');
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    Alert.alert(
      "خروج از حساب",
      "آیا مطمئن هستید که می‌خواهید خارج شوید؟",
      [
        {
          text: "انصراف",
          style: "cancel"
        },
        {
          text: "خروج",
          style: "destructive",
          onPress: async () => {
            console.log('👋 === شروع فرآیند خروج ===');
            
            try {
              try {
                const { disconnectForLogout } = require("../socket");
                await disconnectForLogout();
              } catch (socketErr) {
              }
              try {
                const { stopAutoSendLocation } = require("../services/locationService");
                if (stopAutoSendLocation) {
                  await stopAutoSendLocation();
                }
              } catch (locationErr) {
                console.log("⚠️ Location service warning:", locationErr.message);
              }
              await AsyncStorage.multiRemove([
                "token",
                "user",
                "is_demo_mode",
              ]);
              setSideMenuVisible(false);
              if (onLogoutFromApp) {
                onLogoutFromApp();
              }

            } catch (err) {
              console.error("❌ خطا در خروج:", err);
              Alert.alert(
                "خطا", 
                "مشکلی در خروج از حساب پیش آمد\nلطفاً دوباره تلاش کنید",
                [
                  {
                    text: "تلاش مجدد",
                    onPress: () => handleLogout()
                  },
                  {
                    text: "انصراف",
                    style: "cancel"
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0052CC" />
      </View>
    );
  }

  // تابع برای نمایش نقش کاربری به فارسی
  const getRoleDisplayName = () => {
    const role = getUserRole();
    switch (role) {
      case 'customer': return 'مشتری';
      case 'seller': return 'فروشنده';
      case 'delivery': return 'تحویل‌دار';
      default: return 'کاربر';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.headerActions}>
              {/* User Button */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleSideMenu}
                activeOpacity={0.7}
              >
                <User color="#0052CC" size={20} strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Cart Button - Show for customers and sellers, hide for delivery */}
              {(userRole === "customer" || userRole === "seller") && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleCartPress} // 🔥 تغییر به تابع جدید
                  activeOpacity={0.7}
                >
                  <ShoppingCart color="#0052CC" size={20} strokeWidth={2.5} />
                  {cartItemsCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {cartItemsCount > 99 ? '99+' : cartItemsCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Calendar Button */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleCalendar}
                activeOpacity={0.7}
              >
                {calendarVisible ? (
                  <X color="#0052CC" size={20} strokeWidth={2.5} />
                ) : (
                  <Calendar color="#0052CC" size={20} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>

            {/* Welcome */}
            <View style={styles.welcomeArea}>
              <Text style={styles.greeting}>سلام، خوش اومدید</Text>
              <Text style={styles.userName}>{user?.NameF || user?.name || "کاربر عزیز"}</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        {calendarVisible && (
          <Animated.View
            style={[
              styles.calendarWrapper,
            ]}
          >
            <PersianCalendar 
              onDateSelect={(date) => {
                console.log('تاریخ انتخاب شده:', date);
                toggleCalendar();
              }}
            />
          </Animated.View>
        )}
        
        {/* 🔥 ارسال visitorInfo به HomeMenuGrid */}
        <HomeMenuGrid 
          userRole={userRole} 
          userData={user}
          visitorInfo={visitorInfo}
          onMenuClick={sendLocationOnMenuClick}
          onNavigateWithLocation={handleNavigationWithLocation}
        />
      </ScrollView>

      {/* Side Menu */}
      {sideMenuVisible && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleSideMenu}
          />
          <Animated.View
            style={[
              styles.sideMenu,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* Header */}
            <View style={styles.menuHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={toggleSideMenu}
                activeOpacity={0.7}
              >
                <X color="#0052CC" size={22} strokeWidth={2.5} />
              </TouchableOpacity>
              
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <User color="#0052CC" size={36} strokeWidth={2} />
                </View>
                <Text style={styles.profileName}>
                  {user?.NameF || user?.name || "کاربر"}
                </Text>
                <TouchableOpacity 
                  style={styles.profileButton}
                  onPress={async () => {
                    await sendLocationOnMenuClick('پروفایل از منو');
                    navigation.navigate('Profile');
                    setSideMenuVisible(false);
                  }}
                >
                  <Text style={styles.profileButtonText}>مشاهده پروفایل</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              <View style={styles.infoCards}>
                <View style={styles.card}>
                  <View style={styles.cardIcon}>
                    <User color="#0052CC" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>نام کامل</Text>
                    <Text style={styles.cardValue}>{user?.NameF || user?.name || "نامشخص"}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Mail color="#0052CC" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>ایمیل</Text>
                    <Text style={styles.cardValue}>{user?.email || "ثبت نشده"}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Phone color="#0052CC" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>شماره تماس</Text>
                    <Text style={styles.cardValue}>{user?.phone || user?.mob || user?.mobile || "ثبت نشده"}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Award color="#0052CC" size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardLabel}>نقش کاربری</Text>
                    <Text style={styles.cardValue}>
                      {getRoleDisplayName()}
                    </Text>
                  </View>
                </View>

               
              </View>


              <TouchableOpacity 
                style={styles.logoutBtn} 
                activeOpacity={0.8}
                onPress={handleLogout}
              >
                <LogOut color="#fff" size={18} strokeWidth={2.5} />
                <Text style={styles.logoutBtnText}>خروج از حساب</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </>
      )}
      
    
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    direction: "rtl"
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  
  // Header Styles
  headerSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4D4F",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "IRANYekan-Bold",
  },
  welcomeArea: {
    flex: 1,
    alignItems: "flex-start",
    marginRight: 5
  },
  greeting: {
    fontSize: 13,
    color: "#8C9BAB",
    marginBottom: 2,
    textAlign: "right",
    fontFamily: "IRANYekan",
  },
  userName: {
    fontSize: 18,
    color: "#0052CC",
    fontFamily: "IRANYekan-Bold",
    textAlign: "right",
  },
  userTypeBadge: {
    fontSize: 12,
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    fontFamily: "IRANYekan",
    alignSelf: "flex-start",
  },
  
  // Calendar
  calendarWrapper: {
    backgroundColor: "transparent",
    padding: 16
  },
  
  // Side Menu
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: "#FFFFFF",
  },
  menuHeader: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  profile: {
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    color: "#0052CC",
    fontFamily: "IRANYekan-Bold",
    marginBottom: 8,
  },
  profileButton: {
    backgroundColor: "#0052CC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  profileButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "IRANYekan",
  },
  menuContent: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  infoCards: {
    padding: 20,
  },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    direction: "ltr",
    justifyContent: "flex-start",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#8C9BAB",
    marginBottom: 2,
    textAlign: "right",
    fontFamily: "IRANYekan",
  },
  cardValue: {
    fontSize: 14,
    color: "#0052CC",
    fontFamily: "IRANYekan-Bold",
    textAlign: "right",
  },
  testLocationBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  testLocationBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "IRANYekan-Bold",
  },
  logoutBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4D4F",
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "IRANYekan-Bold",
  },
  
  // Floating Test Button
  floatingTestButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  floatingTestButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default HomeScreen;