// src/components/SideMenu.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { navigate, navigationRef } from "../services/navigationService";
import VPNService from "../services/VPNService";
import styles from "../styles/Menu.styles";

export default function SideMenu({ open, onClose, user, onLogout }) {
  const menuAnimation = useRef(new Animated.Value(500)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
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
          toValue: 500,
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
  }, [open]);

  const menuItems = [
    {
      icon: <FontAwesome name="user" size={22} color="#a6a9b2" />,
      label: "پروفایل",
      screen: "Profile",
    },
    {
      icon: <FontAwesome name="shopping-cart" size={22} color="#a6a9b2" />,
      label: "سبد خرید",
      screen: "Cart",
    },
    {
      icon: <MaterialIcons name="category" size={22} color="#a6a9b2" />,
      label: "گروه محصولات",
      screen: "ProductGroups",
    },
    {
      icon: <FontAwesome name="search" size={22} color="#a6a9b2" />,
      label: "جستجو کالا",
      screen: "ProductList",
    },
    {
      icon: <FontAwesome name="users" size={22} color="#a6a9b2" />,
      label: "لیست مشتری‌ها",
      screen: "BuyerList",
    },
    {
      icon: <FontAwesome name="line-chart" size={22} color="#a6a9b2" />,
      label: "گزارش فاکتورها",
      screen: "Report",
    },
    {
      icon: <FontAwesome name="map-marker" size={22} color="#a6a9b2" />,
      label: "نقشه مشتری‌ها",
      screen: "MapBuyer",
    },
    {
      icon: <FontAwesome name="file-text" size={22} color="#a6a9b2" />,
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

      if (currentRouteName === "EditInvoice") {
        Alert.alert(
          "تغییرات بدون ذخیره",
          "آیا می‌خواهید تغییرات را ذخیره کنید؟",
          [
            { text: "لغو", style: "cancel" },
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
                    }
                  } else {
                    onClose();
                    setTimeout(() => navigate(screenName), 100);
                  }
                } catch {
                  Alert.alert("خطا", "مشکلی پیش آمد");
                }
              },
            },
            {
              text: "بدون ذخیره",
              style: "destructive",
              onPress: async () => {
                await AsyncStorage.multiRemove(["cart", "selectedCustomer"]);
                onClose();
                setTimeout(() => navigate(screenName), 100);
              },
            },
          ]
        );
        return;
      }

      onClose();
      setTimeout(() => navigate(screenName), 100);
    } catch (err) {
      console.log("⚠️ Menu navigation warning:", err.message);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayAnimation }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateX: menuAnimation }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.NameF?.charAt(0) || user?.name?.charAt(0) || "👤"}
                </Text>
              </View>
              <View>
                <Text style={styles.name}>
                  {user?.NameF || user?.name || "کاربر"}
                </Text>
                <Text style={styles.role}>ویزیتور</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.item}
                onPress={() => navigateToScreen(item.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>{item.icon}</View>
                <Text style={styles.label}>{item.label}</Text>
                <FontAwesome name="angle-left" size={22} color="#a6a9b2" />
              </TouchableOpacity>
            ))}

            {/* Logout */}
            <TouchableOpacity
              style={styles.item}
              onPress={onLogout}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <FontAwesome name="sign-out" size={22} color="#f21111a9" />
              </View>
              <Text style={styles.label}>خروج از حساب</Text>
              <FontAwesome name="angle-left" size={22} color="#a6a9b2" />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
