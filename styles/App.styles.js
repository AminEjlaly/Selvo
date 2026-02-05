import { Dimensions, StyleSheet } from "react-native";
const { width } = Dimensions.get("window");

const defaultFont = {
  fontFamily: "IRANYekan",
};

const boldFont = {
  fontFamily: "IRANYekan-Bold",
};

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", ...defaultFont },

  // Loading Styles
  loadingContainer: { flex: 1 },
  loadingGradient: {
    flex: 1,
    ...defaultFont,
    backgroundColor: "#011672ff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: { alignItems: "center" },
  loaderWrapper: { alignItems: "center" },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    ...defaultFont,
  },

  // Home Screen Styles
  homeContainer: { flex: 1 },
  homeGradient: { flex: 1, backgroundColor: "#0622a3ff" },
  homeFloat1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -50,
    left: -50,
  },
  homeFloat2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: 100,
    right: -75,
  },
  homeSafe: { flex: 1 },
  homeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: width - 48,
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  welcomeEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0622a3ff",
    marginBottom: 12,
    textAlign: "center",
    ...boldFont,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    ...defaultFont,
  },
  testButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#0622a3ff",
    borderRadius: 12,
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    ...defaultFont,
  },

  // Menu Overlay
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  menuBackdrop: { flex: 1 },
  menuContainer: {
    ...defaultFont,
    direction: "rtl",
    width: width * 0.85,
    backgroundColor: "#ffffff",
    elevation: 25,
    shadowColor: "#000000",
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
  },
  menuHeader: {
    direction: "rtl",
    backgroundColor: "#1e3a8a",
    paddingVertical: 24,
    paddingHorizontal: 20,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 100,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    elevation: 1,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  userAvatarText: {
    ...boldFont,
    fontSize: 20,
    color: "#0369a1",
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 2,
    ...boldFont,
  },
  userRole: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    ...defaultFont,
  },
  closeMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  closeMenuText: {
    color: "#64748b",
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: "transparent",
    ...defaultFont,
  },
  menuContent: { flex: 1 },
  menuContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#eae9e966",
    padding: 8,
    marginBottom: 12,
    ...defaultFont,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  menuIcon: { fontSize: 24 },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 16,
    ...defaultFont,
  },
  menuArrow: {
    fontSize: 16,
    color: "#64748b",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },

  // Floating Menu Button
   // Floating Menu Button
  floatingMenuButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    ...defaultFont,
  },
  floatingButtonTouchable: {
  },

fixedMenuButton: {
  position: 'absolute',
  top: 30, // ????? ?? ????
  right: 20, // ????? ?? ????
  zIndex: 1000,
},

fixedButtonTouchable: {
  borderRadius: 30,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },

},

fixedButtonGradient: {
  width: 60,
  height: 60,
  borderRadius: 10,
  backgroundColor: '#0f0f0f7e', // ??? ???
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 0,
  borderColor: '#fff',
},

fixedButtonText: {
  
alignSelf:"center",
fontSize:12,
...defaultFont,
color:"#f6f6f8ff",
marginBottom: 1,
},
});