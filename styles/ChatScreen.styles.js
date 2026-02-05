// src/styles/ChatScreen.styles.js - ULTRA MODERN DESIGN
import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
const defaultFont = {
  fontFamily: "IRANYekan",
};

export const styles = StyleSheet.create({
  // ====== CONTAINER ======
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  // ====== LOADING ======
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // ====== HEADER - MODERN GRADIENT ======
  header: {
    direction: "rtl",
    backgroundColor: '#1e293b',
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
    paddingBottom: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },

  headerContent: {
    paddingHorizontal: 20,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Group Avatar
  groupAvatarContainer: {
    position: 'relative',
  },

  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1e3a8a',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },

  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  // Group Info
  groupInfo: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 6,
    ...defaultFont
  },

  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    ...defaultFont
  },

  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#334155',
  },

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Header Actions
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },

  statusIcon: {
    fontSize: 12,
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },

  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },

  refreshButtonText: {
    fontSize: 16,
  },

  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
  },

  reconnectBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ====== MESSAGES LIST ======
  messagesList: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 80,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.25,
  },

  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },

  // ====== MESSAGE BUBBLE - GLASS MORPHISM ======
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  myMessageWrapper: {
    justifyContent: 'flex-end',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6', // جایگزین gradient
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },

  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  messageContainer: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // My Message - Gradient Blue
  myMessage: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-start',
  },

  // Other Message - Dark Glass
  otherMessage: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },

  messageWithoutAvatar: {
    marginLeft: 44,
  },

  // File Message
  fileMessage: {
    padding: 8,
  },

  sendingMessage: {
    opacity: 0.7,
  },

  errorMessage: {
    backgroundColor: '#991b1b',
    borderColor: '#dc2626',
  },

  systemMessage: {
    backgroundColor: '#374151',
    alignSelf: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  // ====== MESSAGE CONTENT ======
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e2e8f0',
    ...defaultFont
  },

  myMessageText: {
    color: '#ffffff',
  },

  systemMessageText: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 14,
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 6,
  },

  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  myTimestamp: {
    color: '#bfdbfe',
  },

  checkmark: {
    fontSize: 14,
    color: '#bfdbfe',
  },

  // ====== PROGRESS BAR ======
  progressContainer: {
    marginTop: 8,
  },

  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },

  progressText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // ====== INPUT CONTAINER - MODERN FLOATING ======
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 10,
  },

  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  attachButtonDisabled: {
    opacity: 0.5,
  },

  attachIcon: {
    fontSize: 20,
  },

  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#0f172a',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#334155',
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  sendButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
  },

  sendButtonText: {
    fontSize: 22,
    color: '#ffffff',
    transform: [{ rotate: '180deg' }],
  },

  // ====== UPLOAD INDICATOR ======
  uploadIndicator: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  uploadInfo: {
    flex: 1,
  },

  uploadIndicatorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  uploadPercent: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '500',
  },

  // ====== FILE PICKER MODAL - BOTTOM SHEET ======
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },

  filePickerContainer: {
    direction: "rtl",
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },

  filePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },

  filePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },

  filePickerClose: {
    fontSize: 28,
    color: '#94a3b8',
    fontWeight: '300',
  },

  filePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },

  filePickerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  filePickerOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },

  filePickerOptionSub: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // ====== IMAGE PREVIEW MODAL ======
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePreviewClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  imagePreviewCloseText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },

  imagePreview: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 16,
  },

  imagePreviewInfo: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },

  imagePreviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },

  imagePreviewSize: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // ====== FULL SCREEN IMAGE MODAL ======
  fullScreenImageOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  fullScreenImageClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 1000,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  
  fullScreenImage: {
    width: width,
    height: height,
  },
  
  fullScreenImageInfo: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  fullScreenImageName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  fullScreenImageSize: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  // استایل‌های جدید برای دکمه اسکرول به پایین
scrollToBottomButton: {
  position: 'absolute',
  bottom: 120,
  right: 20,
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: '#052252ff',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  borderWidth: 2,
  borderColor: 'transparent',
},
unreadBadge: {
  position: 'absolute',
  top: -5,
  right: -5,
  backgroundColor: '#ef4444',
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#343333ff',
},
unreadBadgeText: {
  color: '#ffffff',
  fontSize: 10,
  fontWeight: 'bold',
},
});