// components/HomeMenuGrid.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { navigate } from "../navigationService";
import { sendQuickLocation } from "../services/locationService";
import styles from "../styles/HomeMenuGrid.styles";

const { width } = Dimensions.get("window");
const itemSpacing = 16;
const cardWidth = (width - itemSpacing * 5) / 3;

const HomeMenuGrid = ({ userRole, userData, onMenuClick, onNavigateWithLocation }) => {

  const getVisitorInfo = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user');
      if (!storedData) {
        console.log('❌ اطلاعات کاربر یافت نشد');
        return null;
      }
      const user = JSON.parse(storedData);
      return {
        VisitorCode: user?.id?.toString() || user?.NOF?.toString() || 'unknown',
        VisitorName: user?.NameF || 'Unknown User'
      };
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات کاربر:', error);
      return null;
    }
  };

  // تشخیص مدیر: کد ۱ یا نقش manager
  const isManager = (() => {
    const userId = userData?.NOF || userData?.id || userData?.UserID || userData?.userId || userData?.Code;
    return String(userId) === '1' || userData?.role === 'manager';
  })();
  const getMenuItems = (role) => {

    const orderedItems = [
      {
        icon: "search",
        iconFamily: "FontAwesome",
        label: "لیست کالا",
        screen: "ProductList",
        gradient: ["#06b6d4", "#0891b2"],
      },
      {
        icon: "category",
        iconFamily: "MaterialIcons",
        label: "گروه محصولات",
        screen: "ProductGroups",
        gradient: ["#8b5cf6", "#7c3aed"],
      },
      {
        icon: "user",
        iconFamily: "FontAwesome",
        label: "پروفایل",
        screen: "Profile",
        gradient: ["#6366f1", "#4f46e5"],
      },
      {
        icon: "shopping-cart",
        iconFamily: "FontAwesome",
        label: "سبد خرید",
        screen: "Cart",
        gradient: ["#ec4899", "#db2777"],
      },
    ];

    const sellerOnlyItems = [
      {
        icon: "users",
        iconFamily: "FontAwesome",
        label: "لیست مشتری‌ها",
        screen: "BuyerList",
        gradient: ["#14b8a6", "#0d9488"],
        sellerOnly: true,
      },
      {
        icon: "list-alt",
        iconFamily: "FontAwesome",
        label: "سفارشات",
        screen: "Invoices",
        gradient: ["#10b981", "#059669"],
      },
      {
        icon: "line-chart",
        iconFamily: "FontAwesome",
        label: "گزارش فروش فروشنده",
        screen: "Report",
        gradient: ["#f97316", "#ea580c"],
        sellerOnly: true,
      },
      {
        icon: "map-marker",
        iconFamily: "FontAwesome",
        label: "نقشه مشتری‌ها",
        screen: "MapBuyer",
        gradient: ["#ef4444", "#dc2626"],
        sellerOnly: true,
      },
      {
        icon: "bar-chart",
        iconFamily: "FontAwesome",
        label: "عملکرد فروشنده",
        screen: "SellerPerformance",
        gradient: ["#84cc16", "#65a30d"],
        sellerOnly: true,
      },
      {
        icon: "file-text",
        iconFamily: "FontAwesome",
        label: "گزارش سفارشات",
        screen: "OrderReport",
        gradient: ["#f59e0b", "#d97706"],
      },
      {
        icon: "comments",
        iconFamily: "FontAwesome",
        label: "پیام رسان",
        screen: "Chat",
        gradient: ["#06b6d4", "#0891b2"],
        sellerOnly: true,
      },
      {
        icon: "graduation-cap",
        iconFamily: "FontAwesome",
        label: "آموزش اپلیکیشن",
        screen: "LearnChatBot",
        gradient: ["#3b82f6", "#2563eb"],
      },
    ];

    const customerOnlyItems = [
      {
        icon: "request-quote",
        iconFamily: "MaterialIcons",
        label: "درخواست‌های من",
        screen: "CustomerRequests",
        gradient: ["#8b5cf6", "#7c3aed"],
        customerOnly: true,
      },
    ];

    const deliveryOnlyItems = [
      {
        icon: "comments",
        iconFamily: "FontAwesome",
        label: "پیام رسان",
        screen: "Chat",
        gradient: ["#06b6d4", "#0891b2"],
        deliveryOnly: true,
      },
      {
        icon: "map-marker",
        iconFamily: "FontAwesome",
        label: "نقشه مشتری‌ها",
        screen: "MapDeliveri",
        gradient: ["#ef4444", "#dc2626"],
        deliveryOnly: true,
      },
      {
        icon: "sign-out",
        iconFamily: "FontAwesome",
        label: "خروجی کالا",
        screen: "DeliveryOrdersScreen",
        gradient: ["#10b981", "#059669"],
        deliveryOnly: true,
      },
      {
        icon: "graduation-cap",
        iconFamily: "FontAwesome",
        label: "آموزش اپلیکیشن",
        screen: "LearnChatBot",
        gradient: ["#3b82f6", "#2563eb"],
        deliveryOnly: true,
      },
    ];

    // آیتم مخصوص مدیر
    const managerOnlyItems = [
      {
        icon: "map-signs",
        iconFamily: "FontAwesome",
        label: "روزمسیر",
        screen: "ManagerRozMasir",
        gradient: ["#1e3a8a", "#3b82f6"],
        managerOnly: true,
      },
      {
        icon: "bar-chart",
        iconFamily: "FontAwesome",
        label: "سفارشات ویزیتورها",
        screen: "ManagerVisitorOrders",
        gradient: ["#0f766e", "#14b8a6"],
        managerOnly: true,
      },
    ];

    if (role === "delivery") {
      return deliveryOnlyItems;
    }

    if (role === "customer") {
      return [
        ...orderedItems,
        {
          icon: "list-alt",
          iconFamily: "FontAwesome",
          label: "سفارشات",
          screen: "Invoices",
          gradient: ["#10b981", "#059669"],
        },
        ...customerOnlyItems,
        {
          icon: "graduation-cap",
          iconFamily: "FontAwesome",
          label: "آموزش اپلیکیشن",
          screen: "LearnChatBot",
          gradient: ["#3b82f6", "#2563eb"],
        },
      ];
    }

    // فروشنده — اگر مدیر است آیتم روزمسیر هم اضافه می‌شود
    return [
      ...orderedItems,
      ...sellerOnlyItems,
      ...(isManager ? managerOnlyItems : []),
    ];
  };

  const menuItems = getMenuItems(userRole);

  const handleNavigationWithLocation = async (screen, itemLabel) => {
    try {
      console.log(`📍 کلیک روی منو: ${itemLabel}`);

      // فقط برای seller چک کن
      if (userRole === 'seller') {
        // 🔍 اول چک کن مدیر tracking رو فعال کرده یا نه
        const { checkTrackingEnabled } = require('../services/locationService');
        const trackingAllowed = await checkTrackingEnabled();

        if (trackingAllowed) {
          const visitorInfo = await getVisitorInfo();
          if (visitorInfo) {
            sendQuickLocation(visitorInfo).then(success => {
              if (success) {
                console.log(`✅ لوکیشن برای منو "${itemLabel}" ثبت شد`);
              } else {
                console.log(`⚠️ ثبت لوکیشن برای منو "${itemLabel}" ناموفق بود`);
              }
            }).catch(error => {
              console.log(`❌ خطا در ثبت لوکیشن: ${error.message}`);
            });
          }
        } else {
          console.log('🚫 Location tracking disabled by manager — skipping menu location');
        }
      }

      navigate(screen);

    } catch (error) {
      console.log(`❌ خطا در هندل کلیک منو: ${error.message}`);
      navigate(screen);
    }
  };

  const renderIcon = (item) => {
    const IconComponent = item.iconFamily === "MaterialIcons" ? MaterialIcons : FontAwesome;
    return <IconComponent name={item.icon} size={28} color="#fff" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.guideText}>برای شروع، روی یکی از گزینه‌ها کلیک کنید</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.cardWrapper}
            onPress={() => handleNavigationWithLocation(item.screen, item.label)}
            activeOpacity={0.8}
            delayPressIn={50}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuCard}
            >
              <View style={styles.iconContainer}>
                {renderIcon(item)}
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HomeMenuGrid;