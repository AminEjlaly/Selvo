import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    direction:"rtl"
  },
  
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },

  // Header Styles
  header: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "IRANYekan",
    color: "#1A1A1A",
    marginRight: 12,
    flex: 1,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 4,
  },

  demoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  demoBadgeText: {
    fontSize: 12,
    color: "#FF9500",
    fontFamily: "IRANYekan",
    marginLeft: 6,
  },

  // List Styles
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },

  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Card Styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 4,
    marginVertical: 6,
    shadowColor: "#0622a3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },

  cardInner: {
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 160,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  name: {
    fontSize: 13,
    fontFamily: "IRANYekan",
    color: "#1A1A1A",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: "auto",
  },

  badgeText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "IRANYekan",
    marginLeft: 4,
  },

  // Loading Styles
  loadingCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: "80%",
  },

  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },

  // Error Styles
  errorCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: "85%",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  demoButton: {
    flexDirection: "row",
    backgroundColor: "#0622a3",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0622a3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  demoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  // اضافه کن به فایل styles
backButton: {
  marginLeft: 10,
  padding: 8,
},

breadcrumbContainer: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  marginTop: 8,
  marginBottom: 4,
},

breadcrumbWrapper: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
},

breadcrumbItem: {
  fontSize: 14,
  color: '#0622a3',
  fontWeight: '600',
},

breadcrumbItemActive: {
  fontSize: 14,
  color: '#666',
  fontWeight: '400',
},
});