import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e8e8e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },

  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginRight: 6,
  },

  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#333',
    textAlign: 'right', // چون چت فارسیه
  },

  sendButton: {
    marginLeft: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  uploadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  uploadText: {
    color: '#4CAF50',
    fontSize: 13,
    marginLeft: 6,
  },
});
