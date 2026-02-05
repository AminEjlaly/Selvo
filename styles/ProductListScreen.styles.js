import { Dimensions, Platform, StyleSheet } from "react-native";
const { width, height } = Dimensions.get("window");

// پالت رنگی سفید و آبی تیره
const colors = {
  primary: "#1e3a8a", // آبی تیره اصلی
  primaryLight: "#3730a3", // آبی تیره روشن‌تر
  primaryDark: "#1e40af", // آبی تیره تیره‌تر
  white: "#ffffff",
  background: "#f8fafc", // پس‌زمینه روشن
  surface: "#ffffff", // سطوح
  textPrimary: "#1f2937", // متن اصلی
  textSecondary: "#6b7280", // متن ثانویه
  textLight: "#9ca3af", // متن روشن
  border: "#e5e7eb", // حاشیه
  borderLight: "#f1f5f9", // حاشیه روشن
  success: "#10b981", // سبز برای موجودی مثبت
  error: "#ef4444", // قرمز برای موجودی منفی
  warning: "#f59e0b", // نارنجی برای حالت دمو
};

export default StyleSheet.create({
  container: {
    flex: 1,
    direction: "rtl",
    backgroundColor: colors.background,
    fontFamily: "IRANYekan",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // هدر کشویی - Gradient Blue
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 110,
  },
  headerContent: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    marginBottom: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "IRANYekan",
    color: colors.white,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerInfo: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    marginRight: 10,
    fontFamily: "IRANYekan",
    opacity: 0.9,
  },
  demoBadge: {
    backgroundColor: "#f2bf07ff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  demoBadgeText: {
    color: "#fff",
    fontSize: 11,
    
    letterSpacing: 0.5,
  },

  // بخش جستجو - Clean White
  searchSection: {
  },
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  searchInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  searchLabel: {
    fontSize: 12,
    fontFamily: "IRANYekan",
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: "right",
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 12,
    color: colors.textPrimary,
   fontFamily: "IRANYekan",
    textAlign: "right",
    placeholderTextColor: colors.textLight,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  clearSearchButton: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  clearSearchText: {
    color: colors.textPrimary,
    fontSize: 12,
    
  },

  // لیست محصولات
  columnWrapper: {
    display: "flex",
    direction: "rtl",
    gap: 12,
    marginBottom: 1,
    padding: 5,
    backgroundColor: "transparent",
    margin: "auto",
  },
  listContent: {
    paddingTop: 160,
    paddingBottom: 24,
  },

  // Product Card - Clean White with Blue Accents
  card: {
    textAlign: "right",
    backgroundColor: colors.white,
    width: width / 2 - 19,
    borderRadius: 10,
    marginBottom: 0,
    overflow: "hidden",
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  // 🔥 استایل بهبودشده برای عکس
  cardImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    overflow: "hidden",
    position: 'relative',
  },
  cardImagePlaceholder: {
    fontSize: 48,
    color: colors.textLight,
  },
  // استایل جدید برای کد روی عکس
  codeOverlay: {
    position: "absolute",
    top: 8,
    right:1,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(1, 3, 9, 0.3)",
    zIndex: 10,
  },
  codeOverlayText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  cardBody: {
    padding: 10,
    
   
  },
  name: {
    
    
    fontSize: 12,
    fontFamily: "IRANYekan-Bold",
    textAlign: "left",
    color: colors.textPrimary,
    lineHeight: 22,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  // غیرفعال کردن کد قدیمی
  code: {
    display: 'none',
     fontFamily: "IRANYekan",
     marginRight:10,
    
  },

  // اطلاعات جزئیات - لیبل‌ها راست و مقادیر چپ با فاصله مناسب
  detailsContainer: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    minHeight: 18,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
     fontFamily: "IRANYekan",
    width: 60,
    marginLeft: 2,
  },
  detailValue: {
    fontSize: 10,
    color: colors.textPrimary,
    textAlign: "left",
     fontFamily: "IRANYekan",
    flex: 1,
  },

  // بخش قیمت
  priceContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: "auto",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  price: {
    fontSize: 14,
    color: colors.white,
    textAlign: "left",
     fontFamily: "IRANYekan",
    letterSpacing: 0.1,
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: "#dbeafe",
     fontFamily: "IRANYekan",
    letterSpacing: 0.1,
    flex: 1,
  },

  // Modal تمام صفحه - Clean White with Blue Accents
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    width: "100%",
    maxHeight: height * 0.85,
    elevation: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 16,
    textAlign: "right",
  },
  modalInput: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 16,
    height: 60,
    marginTop: 8,
    paddingHorizontal: 18,
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "800",
    textAlign: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modalInputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  totalContainer: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
    borderWidth: 0,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center",
    letterSpacing: 1,
  },
  modalButtons: {
    marginTop: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: colors.background,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 14,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },

  // Empty State - Clean
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 150,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 48,
    alignItems: "center",
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
    color: colors.textLight,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },

  // Loading State - Clean
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 48,
    alignItems: "center",
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // 🔥 استایل‌های نوار سبد خرید
  cartSummary: {
    backgroundColor: colors.primary,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cartSummaryContent: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 16,
  },
  cartSummaryInfo: {
    flex: 1,
  },
  cartSummaryText: {
    alignSelf:"center",
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "right",
  },
  cartSummaryPrice: {
        alignSelf:"center",
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
  cartSummaryButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
  },
  cartSummaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  // 🔥 استایل‌های جدید برای بهبود نمایش
  stockPositive: {
    color: colors.success,
    fontWeight: "700",
  },
  stockNegative: {
    color: colors.error,
    fontWeight: "700",
  },
  unitBadge: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  unitBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "600",
  },

  // استایل‌های جدید برای بخش قیمت
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceSection: {
    flex: 1,
  },
});