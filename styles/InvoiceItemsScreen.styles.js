import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'System', // برای پشتیبانی بهتر فارسی
  },
  headerDetails: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'right',
    fontWeight: '500',
    fontFamily: 'System',
  },
  buyerName: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: 'System',
  },
  exitCode: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
    fontFamily: 'System',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 12,
    fontFamily: 'System',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'System',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    fontFamily: 'System',
  },
  unitsSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  unitSummaryText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },

  // List Styles
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Item Card Styles
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndexContainer: {
    alignItems: 'flex-end',
  },
  itemIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontFamily: 'System',
  },
  productCodeContainer: {
    alignItems: 'flex-end',
  },
  productCode: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: 'System',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 24,
    fontFamily: 'System',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'System',
  },
  quantitySection: {
    marginBottom: 12,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },

  // Quantity Styles
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'System',
  },
  unitsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  unitBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Price Styles
  priceRows: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'right',
    fontFamily: 'System',
  },
  unitPrice: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'left',
    fontFamily: 'System',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'left',
    fontFamily: 'System',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: 'System',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
  },

});