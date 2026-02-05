// src/styles/MessageFile.styles.js - TELEGRAM DARK BLUE THEME
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fileContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 4,
    maxWidth: 280,
    borderWidth: 1,
  },
  
  myFileContainer: {
    backgroundColor: '#2c7fb8',
    borderTopRightRadius: 4,
    borderColor: '#2472a4',
  },
  
  otherFileContainer: {
    backgroundColor: '#1e2d3d',
    borderTopLeftRadius: 4,
    borderColor: '#2c3e50',
  },
  
  // ===== Uploading State =====
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: '#1e2d3d',
  },
  
  progressBarContainer: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
    width: '100%',
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  
  // ===== Image Type =====
  imageContainer: {
    padding: 0,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
  },
  
  imageFile: {
    borderRadius: 16,
  },
  
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 45, 61, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
  
  imageError: {
    width: '100%',
    height: 200,
    backgroundColor: '#1e2d3d',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c3e50',
  },
  
  imageErrorText: {
    fontSize: 32,
    marginBottom: 8,
  },
  
  imageErrorSubtext: {
    fontSize: 12,
    color: '#95a5a6',
  },
  
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 24, 40, 0.85)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  
  fileNameOverlay: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  
  fileSizeOverlay: {
    color: '#95a5a6',
    fontSize: 11,
    opacity: 0.9,
  },
  
  // ===== Document Type =====
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  
  fileIcon: {
    fontSize: 36,
    marginRight: 4,
  },
  
  fileInfo: {
    flex: 1,
    gap: 3,
  },
  
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 3,
  },
  
  fileSize: {
    fontSize: 11,
    color: '#95a5a6',
  },
  
  fileType: {
    fontSize: 10,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  
  downloadIcon: {
    fontSize: 24,
    color: '#3498db',
    marginLeft: 4,
  },
});