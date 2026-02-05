// styles/SideMenu.styles.js
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const defaultFont = {
  fontFamily: "IRANYekan",
};

const boldFont = {
  fontFamily: "IRANYekan-Bold",
};
export default StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    direction:"rtl",
    
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.8,
    maxWidth: 320,
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {

    backgroundColor: "#0622a3ff",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap:10
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 24,
    color: "#0622a3ff",
    
    ...defaultFont
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    ...defaultFont,
    color: "#fff",
    fontFamily: "IRANYekan-Bold",
  },
  closeMenuButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeMenuText: {
    fontSize: 24,
    color: "#fff",
    ...defaultFont
  },
  menuContent: {
    flex: 1,
  },
  menuContentContainer: {
    paddingVertical: 10,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "IRANYekan",
  },
  menuArrow: {
    fontSize: 18,
    color: "#a6a9b2ff",
  },
});