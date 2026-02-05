// src/components/SimpleFilePicker.js
import {
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { styles } from '../styles/FilePicker.styles';

const SimpleFilePicker = ({ visible, onClose, onFileSelect, groupId, userId }) => {

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        Alert.alert('خطا', 'خطا در انتخاب عکس');
      } else if (response.assets && response.assets[0]) {
        const image = response.assets[0];
        handleFileSelection({
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `image_${Date.now()}.jpg`,
          size: image.fileSize,
          groupId: groupId,
          senderId: userId
        });
      }
    });
  };

  const handleFileSelection = (file) => {
    console.log('File selected:', file);
    onFileSelect(file);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ارسال فایل</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.optionIcon}>🖼️</Text>
              <Text style={styles.optionText}>انتخاب عکس از گالری</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                Alert.alert('اطلاعات', 'این قابلیت به زودی اضافه خواهد شد');
              }}
            >
              <Text style={styles.optionIcon}>📸</Text>
              <Text style={styles.optionText}>دوربین (به زودی)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                Alert.alert('اطلاعات', 'این قابلیت به زودی اضافه خواهد شد');
              }}
            >
              <Text style={styles.optionIcon}>📄</Text>
              <Text style={styles.optionText}>انتخاب فایل (به زودی)</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>انصراف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SimpleFilePicker;