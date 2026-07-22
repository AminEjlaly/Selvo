import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Layout Styles
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
    writingwritingDirection: 'rtl',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    writingwritingDirection: 'rtl',
  },

  // Filter Styles
  filterContainer: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    writingwritingDirection: 'rtl',
  },
  clearFilterButton: {
    padding: 12,
    marginRight: 8, // 🔥 تغییر از marginLeft به marginRight
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  // List Styles
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // Date Section Styles
  dateSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSectionHeader: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginLeft: 8, // 🔥 تغییر از marginRight به marginLeft
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 30,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Order Card Styles
  orderCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderRight: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8, // 🔥 تغییر از marginRight به marginLeft
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  exitCodeBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exitCodeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    writingwritingDirection: 'rtl',
  },

  // Order Info Styles
  orderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    width: 60,
    marginRight: 8, // 🔥 تغییر از marginLeft به marginRight
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },

  // Order Footer Styles - 🔥 تغییرات اصلی اینجا
  orderFooter: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  amountContainer: {
    flex: 1,
    alignItems: 'flex-end', // 🔥 تغییر به flex-end
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  detailButton: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    marginLeft: 12, // 🔥 اضافه کردن margin برای فاصله
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4, // 🔥 تغییر از marginRight به marginLeft
    writingwritingDirection: 'rtl',
  },

  // No Invoice Styles
  noInvoiceContainer: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  noInvoiceText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
    marginLeft: 8, // 🔥 تغییر از marginRight به marginLeft
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },

  // Empty State Styles
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
    writingwritingDirection: 'rtl',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    writingwritingDirection: 'rtl',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.7,
  },

  // Date Picker Modal Styles
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    writingwritingDirection: 'rtl',
  },
  datePickerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    writingwritingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  datesList: {
    maxHeight: height * 0.5,
  },
  dateItem: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dateItemText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
    marginRight: 12, // 🔥 تغییر از marginLeft به marginRight
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  dateItemTextSelected: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },

  // Detail Modal Styles
  detailModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: height * 0.8,
    width: width * 0.9,
  },
  detailModalHeader: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    writingwritingDirection: 'rtl',
  },
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row-reverse', // 🔥 تغییر به row-reverse
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right', // 🔥 تغییر به right
    flex: 1,
    marginRight: 16, // 🔥 تغییر از marginLeft به marginRight
    writingwritingDirection: 'rtl',
  },
  detailAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginVertical: 8,
    writingwritingDirection: 'rtl',
  },

  // 🔥 استایل‌های جدید برای حالت‌های مختلف
  noDatesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDatesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    writingwritingDirection: 'rtl',
  },
  // در فایل styles/DeliveryOrdersScreen.styles.js

// 🔥 استایل‌های جدید برای دکمه جزئیات فاکتور
invoiceDetailsButton: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  backgroundColor: '#2d06aaff', // رنگ سبز برای تفاوت
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  minWidth: 100,
  justifyContent: 'center',
  marginLeft: 8,
},

invoiceDetailsButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '500',
  marginLeft: 4,
  writingwritingDirection: 'rtl',
},
// در فایل استایل‌ها این موارد رو اضافه کن:

// Header Top Row
headerTop: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  width: '100%',
},

// Delivery Route Button
deliveryRouteButton: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  backgroundColor: '#2c10b9ff',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 8,
  gap: 6,
  shadowColor: '#0d1613ff',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},
deliveryRouteButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
  fontFamily: 'System',
},
// در فایل styles/DeliveryOrdersScreen.styles.js
defaultBadge: {
  backgroundColor: '#3b82f6',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  marginLeft: 8,
},
todayBadge: {
  backgroundColor: '#10b981',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  marginLeft: 8,
  color: '#fff',
  fontSize: 10,
  fontWeight: 'bold',
},
// در فایل styles/DeliveryOrdersScreen.styles.js
exitInfo: {
  flex: 1,
  marginLeft: 12,
},
exitDate: {
  fontSize: 12,
  color: '#64748b',
  marginTop: 2,
},
exitBuyer: {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 2,
},

// در فایل DeliveryOrdersScreen.styles.js اضافه کنید:
headerTitleContainer: {
  flex: 1,
  flexDirection: 'column',
},
headerTotalAmount: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#032966',
  marginTop: 4,
},
  // ────── Detail Modal - نسخه فشرده‌تر ──────
  detailModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.92,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  detailModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#7a828c',
  },

  detailContent: {
    padding: 16,           // کاهش از 20 به 16
  },

  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,           // کاهش از 18 به 16
    marginBottom: 16,      // کاهش از 20 به 16 (مهم!)
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,      // کاهش فاصله بعد از عنوان
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    writingwritingDirection: 'rtl',
    textAlign: 'right',
  },

  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 9,    // کاهش از 11 به 9
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  // اطلاعات مالی - فشرده‌تر
  detailAmountContainer: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    paddingVertical: 18,   // کاهش از 22
    marginTop: 4,          // خیلی کمتر
    borderWidth: 1,
    borderColor: '#86efac',
  },
  detailAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#10b981',
    writingwritingDirection: 'rtl',
  },
  detailAmountLabel: {
    fontSize: 13,
    color: '#4ade80',
    marginTop: 2,
    fontWeight: '600',
  },

  // وضعیت بدون فاکتور
  noInvoiceDetailContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
});