// components/HomeMenuGrid.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { navigate } from "../navigationService";
import { sendQuickLocation } from "../services/locationService";
import styles from "../styles/HomeMenuGrid.styles";
const { width } = Dimensions.get("window");
const itemSpacing = 16;
const cardWidth = (width - itemSpacing * 5) / 3;

const HomeMenuGrid = ({ userRole }) => {
   const getVisitorInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        console.log('❌ اطلاعات کاربر یافت نشد');
        return null;
      }
      
      const user = JSON.parse(userData);
      return {
        VisitorCode: user?.id?.toString() || user?.NOF?.toString() || 'unknown',
        VisitorName: user?.NameF || 'Unknown User'
      };
    } catch (error) {
      console.log('❌ خطا در دریافت اطلاعات کاربر:', error);
      return null;
    }
  };
  const getMenuItems = (role) => {
    // 🔥 ترتیب جدید منوها
    const orderedItems = [
      // 1️⃣ جستجو کالا
      {
        icon: "search",
        iconFamily: "FontAwesome",
        label: "لیست کالا",
        screen: "ProductList",
        gradient: ["#06b6d4", "#0891b2"],
      },
      // 2️⃣ گروه کالا
      {
        icon: "category",
        iconFamily: "MaterialIcons",
        label: "گروه محصولات",
        screen: "ProductGroups",
        gradient: ["#8b5cf6", "#7c3aed"],
      },
      // 3️⃣ پروفایل
      {
        icon: "user",
        iconFamily: "FontAwesome",
        label: "پروفایل",
        screen: "Profile",
        gradient: ["#6366f1", "#4f46e5"],
      },
      // 4️⃣ سبد خرید
      {
        icon: "shopping-cart",
        iconFamily: "FontAwesome",
        label: "سبد خرید",
        screen: "Cart",
        gradient: ["#ec4899", "#db2777"],
      },
    ];

    // آیتم‌های مخصوص فروشنده
    const sellerOnlyItems = [
      // 5️⃣ لیست مشتری‌ها (فقط فروشنده)
      {
        icon: "users",
        iconFamily: "FontAwesome",
        label: "لیست مشتری‌ها",
        screen: "BuyerList",
        gradient: ["#14b8a6", "#0d9488"],
        sellerOnly: true,
      },
      // 6️⃣ سفارشات
      {
        icon: "list-alt",
        iconFamily: "FontAwesome",
        label: "سفارشات",
        screen: "Invoices",
        gradient: ["#10b981", "#059669"],
      },
      // 7️⃣ گزارش فاکتورها (فقط فروشنده)
      {
        icon: "line-chart",
        iconFamily: "FontAwesome",
        label: "گزارش فروش فروشنده",
        screen: "Report",
        gradient: ["#f97316", "#ea580c"],
        sellerOnly: true,
      },
      // 8️⃣ نقشه مشتری‌ها (فقط فروشنده)
      {
        icon: "map-marker",
        iconFamily: "FontAwesome",
        label: "نقشه مشتری‌ها",
        screen: "MapBuyer",
        gradient: ["#ef4444", "#dc2626"],
        sellerOnly: true,
      },
      // 9️⃣ عملکرد فروشنده (فقط فروشنده)
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
      // 🔟 پیام رسان (فقط فروشنده)
      {
        icon: "comments",
        iconFamily: "FontAwesome",
        label: "پیام رسان",
        screen: "Chat",
        gradient: ["#06b6d4", "#0891b2"],
        sellerOnly: true,
      },
      // 1️⃣1️⃣ آموزش اپلیکیشن
      {
        icon: "graduation-cap",
        iconFamily: "FontAwesome",
        label: "آموزش اپلیکیشن",
        screen: "LearnChatBot",
        gradient: ["#3b82f6", "#2563eb"],
      },
    ];

    // آیتم‌های مخصوص مشتری
    const customerOnlyItems = [
      // درخواست‌های من (فقط مشتری)
      {
        icon: "request-quote",
        iconFamily: "MaterialIcons",
        label: "درخواست‌های من",
        screen: "CustomerRequests",
        gradient: ["#8b5cf6", "#7c3aed"],
        customerOnly: true,
      },
    ];

    // 🔥 آیتم‌های مخصوص تحویل‌دار (فقط ۴ منو)
    const deliveryOnlyItems = [
      // 1. پیام رسان
      {
        icon: "comments",
        iconFamily: "FontAwesome",
        label: "پیام رسان",
        screen: "Chat",
        gradient: ["#06b6d4", "#0891b2"],
        deliveryOnly: true,
      },
      // 2. نقشه مشتری‌ها
      {
        icon: "map-marker",
        iconFamily: "FontAwesome",
        label: "نقشه مشتری‌ها",
        screen: "MapDeliveri",
        gradient: ["#ef4444", "#dc2626"],
        deliveryOnly: true,
      },
      // 3. خروجی کالا (جدید)
      {
        icon: "sign-out",
        iconFamily: "FontAwesome",
        label: "خروجی کالا",
        screen: "DeliveryOrdersScreen",
        gradient: ["#10b981", "#059669"],
        deliveryOnly: true,
      },
      // 4. آموزش اپلیکیشن
      {
        icon: "graduation-cap",
        iconFamily: "FontAwesome",
        label: "آموزش اپلیکیشن",
        screen: "LearnChatBot",
        gradient: ["#3b82f6", "#2563eb"],
        deliveryOnly: true,
      },
    ];

    // 🔥 اگر کاربر تحویل‌دار است
    if (role === "delivery") {
      return deliveryOnlyItems;
    }

    // اگر کاربر مشتری است
    if (role === "customer") {
      return [
        ...orderedItems,
        // سفارشات برای مشتری
        {
          icon: "list-alt",
          iconFamily: "FontAwesome",
          label: "سفارشات",
          screen: "Invoices",
          gradient: ["#10b981", "#059669"],
        },
        // درخواست‌های من (فقط برای مشتری)
        ...customerOnlyItems,
        // آموزش اپلیکیشن
        {
          icon: "graduation-cap",
          iconFamily: "FontAwesome",
          label: "آموزش اپلیکیشن",
          screen: "LearnChatBot",
          gradient: ["#3b82f6", "#2563eb"],
        },
      ];
    }

    // اگر فروشنده است، همه آیتم‌های عمومی و فروشنده را نشان بده
    return [...orderedItems, ...sellerOnlyItems];
  };
  
  const menuItems = getMenuItems(userRole);

  const handleNavigation = (screen) => {
    navigate(screen);
  };
   const handleNavigationWithLocation = async (screen, itemLabel) => {
    try {
      console.log(`📍 کلیک روی منو: ${itemLabel}`);
      
      // 1. ابتدا دریافت اطلاعات ویزیتور
      const visitorInfo = await getVisitorInfo();
      
      if (visitorInfo) {
        // 2. تلاش برای ارسال لوکیشن (در پس‌زمینه، بدون انتظار)
        sendQuickLocation(visitorInfo).then(success => {
          if (success) {
            console.log(`✅ لوکیشن برای منو "${itemLabel}" ثبت شد`);
          } else {
            console.log(`⚠️ ثبت لوکیشن برای منو "${itemLabel}" ناموفق بود`);
          }
        }).catch(error => {
          console.log(`❌ خطا در ثبت لوکیشن: ${error.message}`);
        });
      } else {
        console.log('⚠️ اطلاعات ویزیتور برای ثبت لوکیشن یافت نشد');
      }
      
      // 3. ناوبری به صفحه مورد نظر (بدون منتظر ماندن برای ارسال لوکیشن)
      navigate(screen);
      
    } catch (error) {
      console.log(`❌ خطا در هندل کلیک منو: ${error.message}`);
      // در صورت خطا هم به صفحه برو
      navigate(screen);
    }
  };
  const renderIcon = (item) => {
    const IconComponent = item.iconFamily === "MaterialIcons" ? MaterialIcons : FontAwesome;
    return <IconComponent name={item.icon} size={28} color="#fff" />;
  };


  return (
    <View style={styles.container}>
      {/* 🎯 متن راهنما */}
      <View style={styles.headerSection}>
        <Text style={styles.guideText}>برای شروع، روی یکی از گزینه‌ها کلیک کنید</Text>
      </View>

      {/* 📱 Grid منو */}
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.cardWrapper}
            onPress={() => handleNavigationWithLocation(item.screen, item.label)}
            activeOpacity={0.8}
            delayPressIn={50} // تأخیر کوچک برای بهبود UX
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.menuCard}
            >
              {/* آیکن */}
              <View style={styles.iconContainer}>
                {renderIcon(item)}
              </View>

              {/* متن */}
              <Text style={styles.menuLabel}>{item.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HomeMenuGrid;