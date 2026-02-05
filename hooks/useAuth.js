// src/hooks/useAuth.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // 🔹 بررسی وضعیت ورود کاربر
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

  // 🔹 هندل ورود موفق
  const handleLoginSuccess = async (userData) => {
    try {
      setIsLoggedIn(true);
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.warn("⚠️ Login success warning:", err.message);
    }
  };

  // 🔹 هندل خروج از حساب
  const handleLogout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem("token"),
        AsyncStorage.removeItem("user"),
        AsyncStorage.removeItem("is_demo_mode"),
      ]);
      setIsLoggedIn(false);
      setUser(null);
    } catch (err) {
      console.warn("⚠️ Logout warning:", err.message);
    }
  };

  return {
    loading,
    isLoggedIn,
    user,
    handleLoginSuccess,
    handleLogout,
  };
}
