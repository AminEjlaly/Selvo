// CustomerPasswordModal.js
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { checkCustomer, createCustomerPassword } from '../api';
import { loginStyles } from '../styles/LoginScreen.styles';

export default function CustomerPasswordModal({ visible, onClose, onSuccess }) {
  const [buyerCode, setBuyerCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: وارد کردن کد مشتری, 2: ایجاد رمز عبور
  const [customerData, setCustomerData] = useState(null);

  // تابع تبدیل اعداد فارسی/عربی به انگلیسی
  const convertPersianToEnglishNumbers = (text) => {
    if (!text) return text;

    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    let result = text.toString();

    // تبدیل اعداد فارسی
    persianNumbers.forEach((persianNum, index) => {
      result = result.replace(new RegExp(persianNum, 'g'), index.toString());
    });

    // تبدیل اعداد عربی
    arabicNumbers.forEach((arabicNum, index) => {
      result = result.replace(new RegExp(arabicNum, 'g'), index.toString());
    });

    return result;
  };

  // هندلر برای فیلد کد مشتری
  const handleBuyerCodeChange = (text) => {
    const convertedText = convertPersianToEnglishNumbers(text);
    setBuyerCode(convertedText);
  };

  // هندلر برای فیلد رمز عبور
  const handleNewPasswordChange = (text) => {
    const convertedText = convertPersianToEnglishNumbers(text);
    setNewPassword(convertedText);
  };

  // هندلر برای فیلد تکرار رمز عبور
  const handleConfirmPasswordChange = (text) => {
    const convertedText = convertPersianToEnglishNumbers(text);
    setConfirmPassword(convertedText);
  };

  // بررسی مشتری
  const handleCheckCustomer = async () => {
    const cleanedBuyerCode = convertPersianToEnglishNumbers(buyerCode);
    
    if (!cleanedBuyerCode) {
      Alert.alert('خطا', 'لطفاً کد مشتری را وارد کنید');
      return;
    }

    // بررسی عددی بودن کد مشتری
    const parsedBuyerCode = parseInt(cleanedBuyerCode);
    if (isNaN(parsedBuyerCode)) {
      Alert.alert('خطا', 'کد مشتری باید عددی باشد');
      return;
    }

    setLoading(true);
    try {
      const result = await checkCustomer(parsedBuyerCode);
      
      if (result.success) {
        if (result.customerExists) {
          if (result.hasPassword) {
            Alert.alert(
              'مشتری موجود',
              'این مشتری از قبل رمز عبور دارد. لطفاً از قسمت ورود مشتری وارد شوید.',
              [{ text: 'متوجه شدم' }]
            );
            resetModal();
          } else {
            setCustomerData(result.data);
            setStep(2);
          }
        } else {
          Alert.alert(
            'مشتری یافت نشد',
            'کد مشتری در سیستم ثبت نشده است. لطفاً با مدیر سیستم تماس بگیرید.',
            [{ text: 'متوجه شدم' }]
          );
        }
      } else {
        Alert.alert('خطا', result.message || 'خطا در بررسی مشتری');
      }
    } catch (error) {
      Alert.alert('خطا', error.message || 'ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  };

  // ایجاد رمز عبور
  const handleCreatePassword = async () => {
    const cleanedBuyerCode = convertPersianToEnglishNumbers(buyerCode);
    
    if (!newPassword || !confirmPassword) {
      Alert.alert('خطا', 'لطفاً رمز عبور و تکرار آن را وارد کنید');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطا', 'رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('خطا', 'رمز عبور باید حداقل ۴ کاراکتر باشد');
      return;
    }

    // بررسی عددی بودن کد مشتری
    const parsedBuyerCode = parseInt(cleanedBuyerCode);
    if (isNaN(parsedBuyerCode)) {
      Alert.alert('خطا', 'کد مشتری باید عددی باشد');
      return;
    }

    setLoading(true);
    try {
      const result = await createCustomerPassword(parsedBuyerCode, newPassword);
      
      if (result.success) {
        Alert.alert(
          'موفقیت',
          'رمز عبور با موفقیت ایجاد شد. اکنون می‌توانید وارد شوید.',
          [
            {
              text: 'ورود',
              onPress: () => {
                onSuccess(parsedBuyerCode.toString(), newPassword);
                resetModal();
              }
            }
          ]
        );
      } else {
        Alert.alert('خطا', result.message || 'خطا در ایجاد رمز عبور');
      }
    } catch (error) {
      Alert.alert('خطا', error.message || 'ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
    }
  };

  // بازنشانی Modal
  const resetModal = () => {
    setBuyerCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStep(1);
    setCustomerData(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={resetModal}
    >
      <View style={loginStyles.modalBackground}>
        <View style={loginStyles.modalContainer}>
          <View style={loginStyles.modalHeader}>
            <Text style={loginStyles.modalTitle}>
              {step === 1 ? 'ایجاد رمز عبور مشتری' : 'ایجاد رمز عبور جدید'}
            </Text>
            <TouchableOpacity
              style={loginStyles.closeButton}
              onPress={resetModal}
              activeOpacity={0.7}
            >
              <Text style={loginStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={loginStyles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 1 ? (
                // مرحله اول: وارد کردن کد مشتری
                <>
            
                  
                  <View style={loginStyles.inputWrapper}>
                    <TextInput
                      style={loginStyles.input}
                      placeholder="کد مشتری"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={buyerCode}
                      onChangeText={handleBuyerCodeChange}
                      textAlign="right"
                      autoFocus
                    />
                    <View style={loginStyles.inputIcon}>
                      <Text style={loginStyles.iconText}>🔢</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      loginStyles.saveButton,
                      loading && loginStyles.buttonDisabled
                    ]}
                    onPress={handleCheckCustomer}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={loginStyles.saveButtonText}>
                        بررسی کد مشتری
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // مرحله دوم: ایجاد رمز عبور
                <>
                  {customerData && (
                    <View style={loginStyles.customerInfo}>
                      <Text style={loginStyles.customerName}>
                        {customerData.name}
                      </Text>
                      <Text style={loginStyles.customerMobile}>
                        کد مشتری: {buyerCode}
                      </Text>
                      {customerData.mobile && (
                        <Text style={loginStyles.customerMobile}>
                          موبایل: {customerData.mobile}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={loginStyles.inputWrapper}>
                    <TextInput
                      style={loginStyles.input}
                      placeholder="رمز عبور جدید"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={true}
                      value={newPassword}
                      onChangeText={handleNewPasswordChange}
                      textAlign="right"
                      autoFocus
                    />
                    <View style={loginStyles.inputIcon}>
                      <Text style={loginStyles.iconText}>🔒</Text>
                    </View>
                  </View>

                  <View style={loginStyles.inputWrapper}>
                    <TextInput
                      style={loginStyles.input}
                      placeholder="تکرار رمز عبور"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={true}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      textAlign="right"
                    />
                    <View style={loginStyles.inputIcon}>
                      <Text style={loginStyles.iconText}>🔒</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      loginStyles.saveButton,
                      loading && loginStyles.buttonDisabled
                    ]}
                    onPress={handleCreatePassword}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={loginStyles.saveButtonText}>
                        ایجاد رمز عبور
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}