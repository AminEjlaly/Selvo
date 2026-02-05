import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  webview: {
    width,
    height,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#0052CC',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'IRANYekan-Bold',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#8C9BAB',
    marginTop: 6,
    fontFamily: 'IRANYekan',
  },
  
  // Error
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 300,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'IRANYekan-Bold',
  },
  errorMessage: {
    fontSize: 13,
    color: '#8C9BAB',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'IRANYekan',
  },
  
  // FAB Buttons
  fabButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabUser: {
    bottom: 180,
    left: 16,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  fabRefresh: {
    bottom: 120,
    left: 16,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  fabRoute: {
    bottom: 60,
    left: 16,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  fabRouteActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  fabShow: {
    bottom: 240,
    left: 16,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  fabHide: {
    bottom: 300,
    left: 16,
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
  },
  
  // Info Badge
  infoBadge: {
    position: 'absolute',
    top: 20,
    left: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 130,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#0052CC',
    fontWeight: '600',
    fontFamily: 'IRANYekan-Bold',
  },
  userRoleText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  filterDateText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
  },
  routeInfo: {
    gap: 2,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 4,
    marginTop: 2,
  },
  routeInfoText: {
    fontSize: 9,
    color: '#8B5CF6',
    fontWeight: '600',
    fontFamily: 'IRANYekan-Bold',
  },
  legend: {
    gap: 4,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleSample: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  inRange: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  outOfRange: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
  },
});

export default styles;