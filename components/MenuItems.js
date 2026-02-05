// components/MenuItems.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentRoute, getRootState, navigate } from "../navigationService";
import VPNService from "../services/VPNService";
import styles from "../styles/MenuItems.styles";

const { width } = Dimensions.get("window");

const SideMenu = ({ isOpen, onClose, user, onLogout }) => {
  const [menuAnimation] = useState(new Animated.Value(width));
  const [overlayAnimation] = useState(new Animated.Value(0));

  // ✅ انیمیشن منو
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // ✅ آیتم‌های منو بر اساس نقش کاربر
  const getMenuItems = (userRole) => {
    const baseItems = [
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
        label: "لیست کالا",
        screen: "ProductList",
      },
      {
        icon: <FontAwesome name="search" size={24} color="#a6a9b2ff" />,
        label: "گزارش سفارشات",
        screen: "OrderReport",
      },
      {
        icon: <FontAwesome name="file-text" size={24} color="#a6a9b2ff" />,
        label: "سفارشات",
        screen: "Invoices",
      },
    ];

    // فقط برای فروشنده‌ها
    const sellerItems = [
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
        icon: <FontAwesome name="bar-chart" size={24} color="#a6a9b2ff" />,
        label: "عملکرد فروشنده",
        screen: "SellerPerformance",
      },
      {
        icon: <FontAwesome name="comments" size={24} color="#a6a9b2ff" />,
        label: " پیام رسان",
        screen: "Chat",
      },
      {
        icon: <FontAwesome name="map-marker" size={24} color="#a6a9b2ff" />,
        label: "نقشه مشتری‌ها",
        screen: "MapBuyer",
      },
    ];

    if (userRole === "customer") {
      return baseItems;
    } else {
      return [...baseItems, ...sellerItems];
    }
  };

  const navigateToScreen = async (screenName) => {
    try {
      const isBlocked = await VPNService.checkAndBlockVPN();
      if (isBlocked) return;

      const state = getRootState();
      const currentRoute = state?.routes[state.routes.length - 1];
      const currentRouteName = currentRoute?.name;
      const routeParams = currentRoute?.params;

      if (currentRouteName === "EditInvoice") {
        Alert.alert(
          "تغییرات بدون ذخیره",
          "آیا می‌خواهید تغییرات را ذخیره کنید؟",
          [
            {
              text: "لغو",
              style: "cancel",
              onPress: () => {
                onClose();
              },
            },
            {
              text: "ذخیره و رفتن",
              style: "default",
              onPress: async () => {
                try {
                  if (routeParams?.saveInvoiceFromMenu) {
                    const saved = await routeParams.saveInvoiceFromMenu();
                    if (saved) {
                      onClose();
                      setTimeout(() => navigate(screenName), 100);
                    } else {
                      Alert.alert("خطا", "مشکلی در ذخیره فاکتور پیش آمد");
                    }
                  } else {
                    onClose();
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
                  onClose();
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

      onClose();
      setTimeout(() => navigate(screenName), 100);
    } catch (err) {
      console.warn("⚠️ Menu navigation warning:", err.message);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.menuOverlay, { opacity: overlayAnimation }]}>
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={onClose}
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
                  {user?.NameF?.charAt(0) || user?.name?.charAt(0) || "👤"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.NameF || user?.name || "کاربر"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeMenuButton}
              onPress={onClose}
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
            {getMenuItems(user?.role).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItemContainer}
                onPress={() => navigateToScreen(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrapper}>{item.icon}</View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>
                  <FontAwesome name="angle-left" size={24} color="#a6a9b2ff" />
                </Text>
              </TouchableOpacity>
            ))}

            {/* دکمه خروج - جداگانه */}
            <TouchableOpacity
              style={styles.menuItemContainer}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <View style={{ backgroundColor: "transparent" }}>
                <FontAwesome name="sign-out" size={24} color="#f211116b" />
              </View>
              <Text style={[styles.menuLabel, { color: "#f211116b" }]}>
                خروج از حساب
              </Text>
              <Text style={styles.menuArrow}>
                <FontAwesome name="angle-left" size={24} color="#a6a9b2ff" />
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SideMenu;