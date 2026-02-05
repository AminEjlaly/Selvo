import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    direction: "rtl"
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: "IRANYekan",
  },

  // Header Styles
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "IRANYekan",
    color: '#1F2937',
    marginRight: 12,
  },

  addButton: {
    flexDirection: 'row',
    backgroundColor: '#0b1780ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    marginTop: 5,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "IRANYekan",
    marginLeft: 8,
  },

  // Search Section
  searchSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },

  searchIcon: {
    marginLeft: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: "IRANYekan",
    paddingVertical: 0,
  },

  clearButton: {
    padding: 4,
    marginRight: 8,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },

  statNumber: {
    fontSize: 18,
    fontFamily: "IRANYekan",
    color: '#1F2937',
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Card Styles - COMPACT VERSION
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    fontSize: 14,
    fontFamily: "IRANYekan",
    color: '#1F2937',
    marginBottom: 2,
  },

  code: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: "IRANYekan",
  },

  locationBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardBody: {
    gap: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  infoText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: "IRANYekan",
    flex: 1,
  },

  cardFooter: {
    alignItems: 'flex-start',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // Empty States
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptySearchText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: "IRANYekan",
    marginTop: 16,
    textAlign: 'center',
  },

  noCustomerText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },

  // Error States
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: "IRANYekan",
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "IRANYekan",
  },

  // Modal Styles - COMPACT VERSION
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    maxHeight: '85%', // کاهش ارتفاع مدال
  },

  modalHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },

  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: "IRANYekan",
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },

  modalCode: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: "IRANYekan",
  },

  modalBody: {
    gap: 8,
    marginBottom: 5,
  },

  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
  },

  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  modalTextBox: {
    flex: 1,
    fontFamily: "IRANYekan",
  },

  modalLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: "IRANYekan",
    marginBottom: 2,
  },

  modalValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: "IRANYekan",
  },

  // Modal Actions - COMPACT VERSION
  modalActions: {
    gap: 3,
  },

  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "IRANYekan",
  },

  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "IRANYekan",
  },

  mapButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },

  mapButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: "IRANYekan",
  },

  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },

  disabledMapButton: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },

  disabledMapButtonText: {
    color: '#9CA3AF',
  },
});