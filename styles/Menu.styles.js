import { Dimensions, StyleSheet } from "react-native";
const { width } = Dimensions.get("window");

const defaultFont = {
  fontFamily: "IRANYekan",
};

const boldFont = {
  fontFamily: "IRANYekan-Bold",
};

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    
  },
  backdrop: {
    flex: 1,
  },
  container: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.78,
    backgroundColor: "#0e163a",
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    gap:10,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#18265c",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    
    ...defaultFont
  },
  name: {
    color: "#fff",
    fontSize: 16,
    
     ...defaultFont
  },
  role: {
    color: "#9ba0b0",
    fontSize: 13,
  },
  closeBtn: {
    padding: 5,
  },
  closeText: {
    color: "#ccc",
    fontSize: 22,
  },
  scroll: {
    marginTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
     ...defaultFont
  },
});
