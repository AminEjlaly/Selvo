// src/components/MessageFile.js - نسخه نهایی
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// تابع تشخیص نوع فایل
const isImageFile = (file) => {
  if (!file) return false;
  
  const name = (file.fileName || file.name || "").toLowerCase();
  const type = (file.fileType || file.type || file.mimeType || "").toLowerCase();


  const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif|tiff|tif)$/;
  const imageMimeTypes = /^image\/(jpeg|png|webp|gif|bmp|heic|heif|tiff)$/;

  const result = (
    type.match(imageMimeTypes) ||
    name.match(imageExtensions) ||
    type.startsWith("image/")
  );


  return result;
};

// تابع ساخت URL تصویر
const getImageUrl = (file, baseUrl) => {
  if (!file) return null;

  // 1) اگر فایل لوکال است
  if (file.uri) {
    return file.uri;
  }

  // 2) اگر fileUrl کامل است
  if (file.fileUrl && file.fileUrl.startsWith("http")) {
    return file.fileUrl;
  }

  // 3) اگر fileUrl نسبی است
  if (file.fileUrl && file.fileUrl.startsWith("/")) {
    return `${baseUrl}${file.fileUrl}`;
  }

  // 4) اگر fileId داریم
  if (file.fileId) {
    return `${baseUrl}/api/media/file/${file.fileId}`;
  }

  return null;
};

const MessageFile = ({ file, isMyMessage, baseUrl, onPress }) => {
  const imageUrl = getImageUrl(file, baseUrl);
  const isImage = isImageFile(file);


  // نمایش تصویر
  if (isImage && !file.uploading && imageUrl) {
    return (
      <TouchableOpacity 
        style={[
          styles.imageContainer,
          isMyMessage && styles.myImageContainer
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={(error) => {
            console.log('❌ خطا در بارگذاری تصویر:', error.nativeEvent);
          }}
          onLoad={() => {

          }}
        />
        
        <View style={styles.imageOverlay}>
          <View style={styles.imageFooter}>
            <Feather name="maximize-2" size={16} color="#ffffff" />
            {file.fileSize && (
              <Text style={styles.imageSize}>
                {(file.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // اگر تصویر است اما در حال آپلود است
  if (isImage && file.uploading) {
    return (
      <View style={[styles.fileContainer, styles.uploadingFile]}>
        <View style={[styles.fileIcon, { backgroundColor: '#3b82f620' }]}>
          <MaterialIcons name="cloud-upload" size={28} color="#3b82f6" />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={2}>
            {file.fileName || 'در حال آپلود تصویر...'}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${file.progress || 0}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(file.progress || 0)}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // نمایش فایل‌های غیر تصویری
  const fileIconData = { icon: 'file', color: '#64748b', library: Feather };
  const IconComponent = fileIconData.library;

  return (
    <TouchableOpacity 
      style={[
        styles.fileContainer,
        isMyMessage ? styles.myFileContainer : styles.otherFileContainer,
        file.uploading && styles.uploadingFile
      ]}
      onPress={file.uploading ? null : onPress}
      disabled={file.uploading}
      activeOpacity={0.8}
    >
      <View style={[styles.fileIcon, { backgroundColor: fileIconData.color + '20' }]}>
        <IconComponent 
          name={fileIconData.icon} 
          size={28} 
          color={fileIconData.color} 
        />
      </View>

      <View style={styles.fileInfo}>
        <Text 
          style={[
            styles.fileName,
            isMyMessage && styles.myFileName
          ]}
          numberOfLines={2}
        >
          {file.fileName || file.name || 'فایل'}
        </Text>
        
        <View style={styles.fileMetadata}>
          {file.fileSize && (
            <Text style={[
              styles.fileSize,
              isMyMessage && styles.myFileSize
            ]}>
              {(file.fileSize / 1024).toFixed(1)} KB
            </Text>
          )}
        </View>
      </View>

      {file.uploading && (
        <View style={styles.uploadingIndicator}>
          <MaterialIcons name="cloud-upload" size={20} color="#60a5fa" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// استایل‌ها (همانند قبل)
const styles = StyleSheet.create({
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 4,
  },
  myImageContainer: {
    borderColor: '#3b82f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: 8,
  },
  imageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageSize: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  fileContainer: {
    direction: "rtl",
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    minWidth: width * 0.5,
    maxWidth: width * 0.65,
    gap: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  myFileContainer: {
    backgroundColor: '#1e3a8a',
    borderColor: '#2563eb',
  },
  otherFileContainer: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  uploadingFile: {
    opacity: 0.7,
  },
  fileIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 6,
    lineHeight: 18,
  },
  myFileName: {
    color: '#ffffff',
  },
  fileMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileSize: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  myFileSize: {
    color: '#bfdbfe',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    minWidth: 30,
  },
  uploadingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageFile;