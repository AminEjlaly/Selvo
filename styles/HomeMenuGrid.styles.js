// styles/HomeMenuGrid.styles.js
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const itemSpacing = 12;
const cardWidth = (width - itemSpacing * 5) / 3.1;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: 20,
    paddingHorizontal: 16,
    
  },
  
  // 🎯 بخش هدر و راهنما
  headerSection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    fontFamily: "IRANYekan",
    marginBottom: 6,
    textAlign: "left",
    letterSpacing: -0.5,
    
  },
  guideText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    fontFamily: "IRANYekan",
    textAlign: "left",
    lineHeight: 22,
  },

  // 📱 Grid
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: itemSpacing / 2,
  },

  // 🎴 کارت منو - طراحی مدرن با افکت‌های جذاب
  menuCard: {
    width: cardWidth,
    height: cardWidth * 1.15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: itemSpacing + 6,
    padding: 12,
    overflow: "hidden",
    position: "relative",
    
    // سایه حرفه‌ای و عمیق
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    
    // بوردر نازک شفاف
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // 🌟 افکت درخشان پس‌زمینه (Glow)
  glowEffect: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },

  // ✨ دایره نورانی دور آیکن
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    
    // سایه داخلی
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // 🎨 کانتینر آیکن
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    
    // افکت Glassmorphism
    backdropFilter: "blur(10px)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  // 📝 متن لیبل
  menuLabel: {
    fontSize: 11.5,
    marginTop:5,
    color: "#fff",
    textAlign: "center",
    fontFamily: "IRANYekan",
    lineHeight: 18,
    letterSpacing: -0.2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 4,
  },

  // 💫 افکت درخشش (Shine Effect)
  shineEffect: {
    position: "absolute",
    top: 0,
    left: -100,
    width: 40,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    transform: [{ skewX: "-20deg" }],
    opacity: 0.4,
  },
});