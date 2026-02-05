// src/components/LoadingScreen.js
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen({ message = "در حال بارگذاری ..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1e3a8a" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#1e3a8a",
    fontWeight: "500",
  },
});
