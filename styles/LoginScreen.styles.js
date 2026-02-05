import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

// 🎨 تم رنگی سفید و آبی سورمه‌ای
const COLORS = {
  primary: "#1e3a8a", // آبی سورمه‌ای اصلی
  primaryLight: "#3b82f6", // آبی روشن‌تر
  primaryDark: "#1e293b", // آبی خیلی تیره
  white: "#ffffff",
  background: "#f8fafc", // خاکستری خیلی روشن
  text: "#1e293b", // متن تیره
  textSecondary: "#64748b", // متن ثانویه
  border: "#e2e8f0", // حاشیه روشن
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  inputBg: "#f1f5f9", // پس‌زمینه اینپوت
  shadow: "rgba(30, 58, 138, 0.15)",
};

export const loginStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    fontFamily: "IRANYekan",
  },

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // Header Section
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },

  logoWrapper: {
    marginBottom: 24,
  },

  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  logoText: {
    fontSize: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },

  // Form Container
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // Biometric Section
  biometricContainer: {
    marginBottom: 24,
  },

  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  biometricIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  biometricText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  // Input Section
  inputContainer: {
    marginBottom: 32,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },

  inputIcon: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  iconText: {
    fontSize: 20,
  },

  // Login Button
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Settings Button
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 58, 138, 0.05)",
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: "rgba(30, 58, 138, 0.15)",
    marginBottom: 24,
  },

  settingsIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  settingsButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Connection Status
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },

  statusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.primary,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: COLORS.white,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },

  modalContent: {
    padding: 24,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // VPN Block Screen
  vpnBlockContainer: {
    flex: 1,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  vpnContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },

  vpnIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  vpnIconText: {
    fontSize: 40,
  },

  vpnTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.error,
    marginBottom: 12,
    textAlign: "center",
  },

  vpnMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },

  retryButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 12,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryLight,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  exitButton: {
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  exitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Simulator Indicator
  simulatorIndicator: {
    position: "absolute",
    top: StatusBar.currentHeight || 40,
    left: 0,
    right: 0,
    paddingVertical: 8,
    backgroundColor: COLORS.warning,
    zIndex: 1000,
  },

  simulatorIndicatorText: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 0,
  },

  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: COLORS.primary,
  },

  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  tabTextActive: {
    color: COLORS.primary,
  },
  // به loginStyles اضافه کنید:
customerInfo: {
  backgroundColor: '#f8fafc',
  padding: 15,
  borderRadius: 12,
  marginBottom: 20,
  borderLeftWidth: 4,
  borderLeftColor: '#3b82f6'
},
customerName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1e293b',
  textAlign: 'right'
},
customerMobile: {
  fontSize: 14,
  color: '#64748b',
  textAlign: 'right',
  marginTop: 5
},
createPasswordLink: {
  marginTop: 15,
  padding: 12,
  alignItems: 'center'
},
createPasswordText: {
  color: '#3b82f6',
  fontSize: 14,
  fontWeight: '500',
  textDecorationLine: 'underline'
},
});
