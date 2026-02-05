// src/components/ErrorBoundary.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log("🧩 Caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>خطایی رخ داده است</Text>
          <Text style={styles.msg}>
            {this.state.error?.message || "مشکل غیرمنتظره‌ای پیش آمد"}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 5,
    color: "#1e3a8a",
  },
  msg: {
    color: "#555",
    fontSize: 15,
    textAlign: "center",
  },
});
