import { StyleSheet } from 'react-native';

const defaultFont = { fontFamily: 'IRANYekan' };

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 30,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    ...defaultFont,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 28,
    color: '#1e293b',
    ...defaultFont,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#334155',
    textAlign: 'right',
    ...defaultFont,
  },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    ...defaultFont,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  pickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  pickerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  pickerButtonText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
    ...defaultFont,
  },

  pickerArrow: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 8,
  },

  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
    ...defaultFont,
    fontWeight: '500',
  },

  locationContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
    ...defaultFont,
  },

  locationButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  locationButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    ...defaultFont,
  },

  submitButton: {
    backgroundColor: '#101279ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#030d16ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },

  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    ...defaultFont,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
    ...defaultFont,
  },

  closeButton: {
    padding: 8,
    marginHorizontal: 4,
  },

  closeButtonText: {
    fontSize: 22,
    color: '#64748b',
    fontWeight: '300',
  },

  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectedItem: {
    backgroundColor: '#e0f2fe',
  },

  modalItemText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
    ...defaultFont,
  },

  selectedIcon: {
    color: '#0066cc',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});