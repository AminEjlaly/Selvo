import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: "#1a3a6b",
  primaryDark: "#0f2447",
  primaryLight: "#3d6fbd",
  gold: "#c9a84c",
  white: "#ffffff",
  background: "#eef2f8",
  cardBg: "#ffffff",
  text: "#0b1f3d",
  textSecondary: "#3d5a80",
  textMuted: "#7e9ab5",
  border: "#d4dff0",
  divider: "#e8eef6",
};

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  headerBottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.gold,
    opacity: 0.75,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  refreshHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 4,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // کارت خلاصه
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  cardSideBar: {
    width: 6,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // کارت آیتم
  itemCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  rowIndexBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIndexText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardVerticalLine: {
    width: 2,
    height: 70,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
  },
  itemContent: {
    flex: 1,
  },
  productName: {
    fontSize: 15.5,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  productCode: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  quantityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: COLORS.primaryGhost,
    padding: 10,
    borderRadius: 10,
  },
  quantityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  unitPrice: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalPriceContainer: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.gold,
  },

  // بخش عنوان لیست
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionBadgeWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 15,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});