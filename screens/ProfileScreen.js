import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
const defaultFont = { fontFamily: "IRANYekan" };
export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
      } catch (err) {
        console.error("خطا در دریافت اطلاعات کاربر:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0622a3" />
        <Text style={styles.loadingText}>در حال دریافت اطلاعات...</Text>
      </View>
    );

  if (!user)
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={50} color="#ef4444" />
        <Text style={styles.errorText}>اطلاعات کاربر موجود نیست</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <FontAwesome5 name="user" size={40} color="#ffffff" />
        </View>
        <Text style={styles.name}>{user.NameF}</Text>
        <Text style={styles.userRole}>کاربر سیستم</Text>
      </View>

      {/* Profile Cards */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <FontAwesome5 name="id-badge" size={22} color="#0622a3" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>کد کاربری</Text>
            <Text style={styles.cardValue}>{user.NOF}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <FontAwesome5 name="mobile-alt" size={22} color="#0622a3" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>شماره موبایل</Text>
            <Text style={styles.cardValue}>{user.mob}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <FontAwesome5 name="user" size={22} color="#0622a3" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>وضعیت حساب</Text>
            <Text style={[styles.cardValue, styles.activeStatus]}>فعال</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...defaultFont,
    backgroundColor: "#f8fafc",
    direction: "rtl",
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    fontFamily:defaultFont,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "500",
    textAlign: "center",
  },

  // Header Section
  header: {
    backgroundColor: "#0622a3",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    elevation: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  userRole: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },

  // Content Area
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    direction: "rtl",
  },

  // Card Styles
  card: {
    direction: "rtl",

    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 10,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,

    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
  },
  cardValue: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "left",
  },
  activeStatus: {
    color: "#10b981",
    fontWeight: "600",
  },
});
