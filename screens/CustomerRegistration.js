// CustomerRegistration.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  checkDuplicateCustomer,
  createCompleteCustomer,
  getCities,
  getMasir,
  getNewBuyerCode,
  getSanf,
  uploadCustomerPhotos
} from '../api';
import ManualLocationModal from '../components/ManualLocationModal';
import { compressImage, compressWebFile } from '../services/Imagecompression';
import styles from '../styles/CustomerRegistrationStyles';

const URMIA_LAT = 37.55012;
const URMIA_LNG = 45.06872;
const LOCATION_TIMEOUT_MS = 15000;
const isWeb = Platform.OS === 'web';

const validators = {
  firstName: (value) => {
    if (!value.trim()) return 'نام الزامی است';
    if (value.trim().length < 2) return 'نام باید حداقل ۲ کاراکتر باشد';
    if (value.length > 50) return 'نام نمی‌تواند بیش از ۵۰ کاراکتر باشد';
    if (!/^[\u0600-\u06FF\sa-zA-Z0-9]+$/.test(value)) {
      return 'نام فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و فاصله باشد';
    }
    return null;
  },
  lastName: (value) => {
    if (!value.trim()) return 'نام خانوادگی الزامی است';
    if (value.trim().length < 2) return 'نام خانوادگی باید حداقل ۲ کاراکتر باشد';
    if (value.length > 50) return 'نام خانوادگی نمی‌تواند بیش از ۵۰ کاراکتر باشد';
    if (!/^[\u0600-\u06FF\sa-zA-Z0-9]+$/.test(value)) {
      return 'نام خانوادگی فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و فاصله باشد';
    }
    return null;
  },
  tel: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 8 || cleaned.length > 11) return 'تلفن ثابت باید بین ۸ تا ۱۱ رقم باشد';
    if (!/^\d+$/.test(cleaned)) return 'تلفن ثابت فقط می‌تواند شامل اعداد باشد';
    return null;
  },
  mobile: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return 'تلفن همراه باید ۱۱ رقم باشد';
    if (!/^09\d{9}$/.test(cleaned)) return 'تلفن همراه باید با 09 شروع شود';
    return null;
  },
  addB: (value) => {
    if (!value) return null;
    if (value.length > 500) return 'آدرس نمی‌تواند بیش از ۵۰۰ کاراکتر باشد';
    return null;
  },
  tblo: (value) => {
    if (!value) return null;
    if (value.length > 50) return 'تابلو نمی‌تواند بیش از ۵۰ کاراکتر باشد';
    return null;
  },
  city: (value) => (!value ? 'انتخاب شهر الزامی است' : null),
  masir: (value) => (!value ? 'انتخاب مسیر الزامی است' : null),
  sanf: (value) => (!value ? 'انتخاب صنف الزامی است' : null),
};

const formatPhoneNumber = (value, isMobile = false) => {
  let cleaned = value.replace(/\D/g, '');
  if (isMobile) {
    if (cleaned.startsWith('9') && cleaned.length === 10) cleaned = '0' + cleaned;
    if (cleaned.length > 11) cleaned = cleaned.substring(0, 11);
  } else {
    if (cleaned.length > 11) cleaned = cleaned.substring(0, 11);
  }
  return cleaned;
};

// ترکیب نام و نام خانوادگی برای ارسال به سرور به صورت یک فیلد واحد
const getFullName = (data) => `${data.firstName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim();

const CustomerRegistration = ({ navigation }) => {
  const [cities, setCities] = useState([]);
  const [masirList, setMasirList] = useState([]);
  const [sanfList, setSanfList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showCityModal, setShowCityModal] = useState(false);
  const [showMasirModal, setShowMasirModal] = useState(false);
  const [showSanfModal, setShowSanfModal] = useState(false);
  const [showCustomerTypeModal, setShowCustomerTypeModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showManualLocationModal, setShowManualLocationModal] = useState(false);

  // ── عکس‌های مغازه ──────────────────────────────────────────────────────────
  const [selectedPhotos, setSelectedPhotos] = useState([]); // آرایه uri
  const [photoError, setPhotoError] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // ── اطلاعات دستگاه ─────────────────────────────────────────────────────────
  const [deviceInfo, setDeviceInfo] = useState('');

  // وضعیت لوکیشن
  const [locationStatus, setLocationStatus] = useState('idle');
  const locationTimeoutRef = useRef(null);

  const [modalInitialLat, setModalInitialLat] = useState(URMIA_LAT);
  const [modalInitialLng, setModalInitialLng] = useState(URMIA_LNG);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', addB: '', tblo: '', tel: '', mobile: '',
    cityCode: '', cityName: '', masirCode: '', masirName: '',
    skh: 'حقیقی', codeSF: '', nameSF: '',
    kindM: 'مالک', onvan: 'آقای', lat: '', lng: ''
  });

  const [errors, setErrors] = useState({
    firstName: '', lastName: '', tel: '', mobile: '', addB: '', tblo: '', city: '', masir: '', sanf: ''
  });

  const customerTypes = [
    { label: 'حقیقی', value: 'حقیقی' },
    { label: 'حقوقی', value: 'حقوقی' },
    { label: 'حقوقی دولتی', value: 'حقوقی دولتی' }
  ];
  const titles = [
    { label: 'شرکت', value: 'شرکت' }, { label: 'آقای', value: 'آقای' },
    { label: 'خانم', value: 'خانم' }, { label: 'موسسه', value: 'موسسه' },
    { label: 'تعاونی', value: 'تعاونی' }, { label: 'درمانگاه', value: 'درمانگاه' },
    { label: 'بیمارستان', value: 'بیمارستان' }, { label: 'داروخانه', value: 'داروخانه' }
  ];
  const ownershipTypes = [
    { label: 'مالک', value: 'مالک' },
    { label: 'اجاره', value: 'اجاره' },
    { label: 'نامعلوم', value: 'نامعلوم' }
  ];

  useEffect(() => {
    loadInitialData();

    // گرفتن اطلاعات دستگاه
    const getDeviceInfo = async () => {
      try {
        const deviceName = Device.deviceName || 'Unknown';
        const modelName = Device.modelName || Device.modelId || 'Unknown';
        const osName = Device.osName || 'Unknown';
        const osVersion = Device.osVersion || '';
        const manufacturer = Device.manufacturer || '';

        const info = `${deviceName} | ${manufacturer} ${modelName} | ${osName} ${osVersion}`;
        setDeviceInfo(info.trim());
        console.log('📱 Device Info:', info);
      } catch (e) {
        console.warn('⚠️ Could not get device info:', e);
        setDeviceInfo('Unknown Device');
      }
    };

    getDeviceInfo();

    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    };
  }, []);

  // ── ۱. لود اولیه ─────────────────────────────────────────────────────────
  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      const [citiesData, masirData, sanfData] = await Promise.all([
        getCities(), getMasir(), getSanf()
      ]);
      setCities(citiesData);
      setMasirList(masirData);
      setSanfList(sanfData);
    } catch (error) {
      Alert.alert('خطا', 'خطا در دریافت اطلاعات اولیه: ' + error.message);
    } finally {
      setInitialLoading(false);
      fetchLocationInBackground();
    }
  };

  // ── ۲. لوکیشن در بک‌گراند ────────────────────────────────────────────────
  const fetchLocationInBackground = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const isSeller = !userData ||
        userData.role === 'seller' ||
        userData.UserType === 'seller';

      if (!isSeller) {
        setLocationStatus('failed');
        return;
      }
    } catch { }

    setLocationStatus('searching');
    locationTimeoutRef.current = setTimeout(() => setLocationStatus('failed'), LOCATION_TIMEOUT_MS);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        clearTimeout(locationTimeoutRef.current);
        setLocationStatus('failed');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: LOCATION_TIMEOUT_MS,
      });
      clearTimeout(locationTimeoutRef.current);
      const lat = loc.coords.latitude.toString();
      const lng = loc.coords.longitude.toString();
      setFormData(prev => ({ ...prev, lat, lng }));
      setModalInitialLat(loc.coords.latitude);
      setModalInitialLng(loc.coords.longitude);
      setLocationStatus('found');
    } catch {
      clearTimeout(locationTimeoutRef.current);
      setLocationStatus('failed');
    }
  };

  // ── ۳. انتخاب عکس از گالری ───────────────────────────────────────────────
// CustomerRegistration.js - اصلاح handlePickPhotos برای وب



const handlePickPhotos = async () => {
  if (isWeb) {
    pickWebFiles();
    return;
  }
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطا', 'دسترسی به گالری رد شد.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoError('');
      const compressedUris = await Promise.all(
        result.assets.map(a => compressImage(a.uri))
      );
      const items = compressedUris.map(uri => ({ kind: 'native', uri, previewUri: uri }));
      setSelectedPhotos(prev => [...prev, ...items]);
    }
  } catch (error) {
    Alert.alert('خطا', 'خطا در دسترسی به گالری: ' + error.message);
  }
};

// 🔥 فقط وب: input فایل استاندارد
const pickWebFiles = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotoError('');
    const compressed = await Promise.all(files.map(compressWebFile));
    const items = compressed.map(c => ({
      kind: 'web', blob: c.blob, name: c.name, previewUri: c.previewUri,
    }));
    setSelectedPhotos(prev => [...prev, ...items]);
  };
  input.click();
};

const handleTakePhoto = async () => {
  if (isWeb) {
    // رو وب معمولاً دوربین جدا نیازی نیست، همون input بالا با capture هم کار می‌کنه؛
    // اگه لازم دارید دوربین جدا، بگید تا اضافه کنم
    pickWebFiles();
    return;
  }
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطا', 'دسترسی به دوربین رد شد.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setSelectedPhotos(prev => [...prev, { kind: 'native', uri: compressedUri, previewUri: compressedUri }]);
      setPhotoError('');
    }
  } catch (error) {
    Alert.alert('خطا', 'خطا در دسترسی به دوربین: ' + error.message);
  }
};


  // ── ۵. حذف یه عکس از لیست ───────────────────────────────────────────────
  const handleRemovePhoto = (indexToRemove) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // ── ۶. آپلود عکس‌ها ──────────────────────────────────────────────────────
  const uploadPhotos = async (buyerCode) => {
    if (selectedPhotos.length === 0) return;
    setUploadingPhotos(true);
    try {
      await uploadCustomerPhotos(buyerCode, selectedPhotos, deviceInfo);
    } catch (e) {
      console.warn('⚠️ Photo upload failed:', e.message);
      Alert.alert('هشدار', 'مشتری ثبت شد ولی آپلود عکس‌ها ناموفق بود');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // ── ۷. اعتبارسنجی فرم با چک عکس ─────────────────────────────────────────
const validateForm = () => {
  const newErrors = {
    firstName: validators.firstName(formData.firstName),
    lastName: validators.lastName(formData.lastName),
    tel: validators.tel(formData.tel),
    mobile: validators.mobile(formData.mobile),
    addB: validators.addB(formData.addB),
    tblo: validators.tblo(formData.tblo),
    city: validators.city(formData.cityCode),
    masir: validators.masir(formData.masirCode),
    sanf: validators.sanf(formData.codeSF)
  };
  setErrors(newErrors);

  if (!formData.tel.trim() && !formData.mobile.trim()) {
    newErrors.tel = 'حداقل یکی از تلفن‌ها باید وارد شود';
    newErrors.mobile = 'حداقل یکی از تلفن‌ها باید وارد شود';
    setErrors(newErrors);
    return false;
  }

  // 🔥 عکس فقط تو موبایل اجباریه، رو وب اصلاً نمایش داده نمیشه
  if (!isWeb && selectedPhotos.length === 0) {
    setPhotoError('ثبت حداقل یک عکس از مغازه الزامی است');
    return false;
  }

  return !Object.values(newErrors).some(e => e !== null);
};

  // ── ۸. handleSubmit ───────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!validateForm()) {
    Alert.alert('خطا', 'لطفا خطاهای فرم را برطرف کنید');
    return;
  }
  if (!formData.lat || !formData.lng) {
    setShowManualLocationModal(true);
    return;
  }
  // formData رو مستقیم پاس بده
  await doRegister(formData);
};

const doRegister = async (currentFormData) => {  // ← پارامتر اضافه شد
  setLoading(true);
  try {
    console.log('🔍 tblo sending:', currentFormData.tblo); // ← چک کن
    
    const duplicateCheck = await checkDuplicateCustomer({
      name: getFullName(currentFormData),
      tel: currentFormData.tel.trim(),
      mobile: currentFormData.mobile.trim(),
      tblo: currentFormData.tblo.trim(),   // ← از currentFormData بخون
      cityCode: currentFormData.cityCode
    });
    
    if (duplicateCheck.isDuplicate) {
      Alert.alert('مشتری تکراری', duplicateCheck.message);
      return;
    }
    await proceedWithRegistration(currentFormData);  // ← اینجا هم
  } catch (error) {
    Alert.alert('خطا', error.message || 'خطای ناشناخته در ثبت مشتری');
  } finally {
    setLoading(false);
  }
};

  const generateBuyerCode = async (cityCode) => {
    try {
      const result = await getNewBuyerCode(cityCode);
      return result.newBuyerCode;
    } catch (error) {
      throw new Error('خطا در تولید کد مشتری: ' + error.message);
    }
  };

  // ── ۹. ثبت نهایی + آپلود عکس ─────────────────────────────────────────────
const proceedWithRegistration = async (data) => {
  const buyerCode = await generateBuyerCode(data.cityCode);

  // 🔥 آپلود عکس فقط تو موبایل - رو وب رد میشه
  if (!isWeb && selectedPhotos.length > 0) {
    setUploadingPhotos(true);
    try {
      const uploadResult = await uploadCustomerPhotos(buyerCode, selectedPhotos, deviceInfo);
      if (!uploadResult.success) {
        Alert.alert('خطا', 'آپلود عکس‌ها ناموفق بود. لطفاً دوباره امتحان کنید.');
        return;
      }
    } catch (e) {
      Alert.alert('خطا', 'خطا در آپلود عکس‌ها: ' + e.message);
      return;
    } finally {
      setUploadingPhotos(false);
    }
  }

  const customerData = {
    buyerCode,
    name: getFullName(data),
    tel: data.tel.trim(),
    mobile: data.mobile.trim(),
    addB: data.addB.trim(),
    cityCode: data.cityCode,
    cityName: data.cityName,
    tblo: data.tblo.trim(),
    skh: data.skh,
    codeSF: data.codeSF,
    nameSF: data.nameSF,
    kindM: data.kindM,
    onvan: data.onvan,
    lat: data.lat,
    lng: data.lng,
    masirCode: data.masirCode,
    masirName: data.masirName
  };

  await createCompleteCustomer(customerData);

  Alert.alert('موفقیت', 'مشتری با موفقیت ثبت شد', [
    { text: 'باشه', onPress: () => navigation.goBack() }
  ]);
};

  // ── ۱۰. تأیید مودال لوکیشن ───────────────────────────────────────────────
const handleLocationConfirm = async (coords) => {
  const updatedForm = {
    ...formData,
    lat: coords.latitude.toString(),
    lng: coords.longitude.toString()
  };
  setFormData(updatedForm);
  setShowManualLocationModal(false);
  await doRegister(updatedForm);  // ← updatedForm پاس بده
};

  // ── نشانگر وضعیت لوکیشن ──────────────────────────────────────────────────
  const LocationStatusBadge = () => {
    if (locationStatus !== 'searching' && locationStatus !== 'failed') return null;
    const config = {
      searching: { color: '#F59E0B', bg: '#FFFBEB', text: 'در حال دریافت موقعیت...' },
      failed: { color: '#EF4444', bg: '#FEF2F2', text: '⚠ موقعیت دریافت نشد' },
    }[locationStatus];
    if (!config) return null;
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: config.bg, borderRadius: 8, paddingHorizontal: 12,
        paddingVertical: 6, marginBottom: 12, borderWidth: 1,
        borderColor: config.color + '40'
      }}>
        {locationStatus === 'searching' && <ActivityIndicator size="small" color={config.color} />}
        <Text style={{ fontSize: 12, color: config.color, fontFamily: 'IRANYekan', flex: 1, textAlign: 'right' }}>
          {config.text}
        </Text>
      </View>
    );
  };

  // ── بخش انتخاب عکس ───────────────────────────────────────────────────────
  const PhotoSection = () => (
    <View style={{
      marginTop: 16, marginBottom: 8,
      borderWidth: 1.5,
      borderColor: photoError ? '#EF4444' : selectedPhotos.length > 0 ? '#10B981' : '#D1D5DB',
      borderRadius: 12, padding: 12,
      backgroundColor: photoError ? '#FEF2F2' : '#F9FAFB'
    }}>
      {/* عنوان */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontFamily: 'IRANYekan', fontSize: 14, color: '#374151', textAlign: 'right' }}>
          عکس مغازه *
        </Text>
        {selectedPhotos.length > 0 && (
          <View style={{
            backgroundColor: '#10B981', borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'IRANYekan' }}>
              {selectedPhotos.length} عکس
            </Text>
          </View>
        )}
      </View>

      {/* پیش‌نمایش عکس‌ها */}
      {selectedPhotos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {selectedPhotos.map((uri, index) => (
            <View key={index} style={{ marginLeft: 8, position: 'relative' }}>
              <Image
                source={{ uri }}
                style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#E5E7EB' }}
              />
              {/* دکمه حذف */}
              <TouchableOpacity
                onPress={() => handleRemovePhoto(index)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
                  borderWidth: 2, borderColor: '#fff'
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', lineHeight: 14 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* دکمه‌های انتخاب */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {/* دوربین */}
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#4F46E5', borderRadius: 8,
            paddingVertical: 10, gap: 6
          }}
          onPress={handleTakePhoto}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}></Text>
          <Text style={{ color: '#fff', fontFamily: 'IRANYekan', fontSize: 12 }}>دوربین</Text>
        </TouchableOpacity>

        {/* گالری */}
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#0622a3', borderRadius: 8,
            paddingVertical: 10, gap: 6
          }}
          onPress={handlePickPhotos}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}></Text>
          <Text style={{ color: '#fff', fontFamily: 'IRANYekan', fontSize: 12 }}>گالری</Text>
        </TouchableOpacity>
      </View>

      {/* پیام خطا */}
      {photoError ? (
        <Text style={{ color: '#EF4444', fontFamily: 'IRANYekan', fontSize: 12, textAlign: 'right', marginTop: 6 }}>
          {photoError}
        </Text>
      ) : (
        <Text style={{ color: '#6B7280', fontFamily: 'IRANYekan', fontSize: 11, textAlign: 'right', marginTop: 6 }}>
          حداقل ۱ عکس — حداکثر ۱۰ عکس (هر عکس تا ۱۰MB)
        </Text>
      )}
    </View>
  );

  const CustomPickerModal = ({ visible, onClose, title, data, onSelect, selectedValue }) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={{ width: 40 }} />
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.value || item.CodeSF || item.codeM || item.CityCode}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  (selectedValue === (item.value || item.CodeSF || item.codeM || item.CityCode)) && styles.selectedItem
                ]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.modalItemText}>
                  {item.label || item.NameSF || item.NameM || item.CityName}
                </Text>
                {(selectedValue === (item.value || item.CodeSF || item.codeM || item.CityCode)) && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>در حال دریافت اطلاعات...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <LocationStatusBadge />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>نام *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={formData.firstName}
          onChangeText={(value) => {
            setFormData(prev => ({ ...prev, firstName: value }));
            setErrors(prev => ({ ...prev, firstName: validators.firstName(value) }));
          }}
          placeholder="نام مشتری را وارد کنید"
          textAlign="right"
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>نام خانوادگی *</Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={formData.lastName}
          onChangeText={(value) => {
            setFormData(prev => ({ ...prev, lastName: value }));
            setErrors(prev => ({ ...prev, lastName: validators.lastName(value) }));
          }}
          placeholder="نام خانوادگی مشتری را وارد کنید"
          textAlign="right"
        />
        {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>آدرس</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.addB && styles.inputError]}
          value={formData.addB}
          onChangeText={(value) => {
            setFormData(prev => ({ ...prev, addB: value }));
            setErrors(prev => ({ ...prev, addB: validators.addB(value) }));
          }}
          placeholder="آدرس کامل"
          multiline numberOfLines={3} maxLength={500} textAlign="right"
        />
        {errors.addB ? <Text style={styles.errorText}>{errors.addB}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>تابلو</Text>
        <TextInput
          style={[styles.input, errors.tblo && styles.inputError]}
          value={formData.tblo}
          onChangeText={(value) => {
            setFormData(prev => ({ ...prev, tblo: value }));
            setErrors(prev => ({ ...prev, tblo: validators.tblo(value) }));
          }}
          placeholder="نام تابلو" maxLength={50} textAlign="right"
        />
        {errors.tblo ? <Text style={styles.errorText}>{errors.tblo}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>تلفن همراه</Text>
        <TextInput
          style={[styles.input, errors.mobile && styles.inputError]}
          value={formData.mobile}
          onChangeText={(value) => {
            const formatted = formatPhoneNumber(value, false);
            setFormData(prev => ({ ...prev, mobile: formatted }));
            setErrors(prev => ({ ...prev, mobile: validators.mobile(formatted) }));
          }}
          placeholder="09121111111" keyboardType="phone-pad" maxLength={11} textAlign="right"
        />
        {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>تلفن ثابت</Text>
        <TextInput
          style={[styles.input, errors.tel && styles.inputError]}
          value={formData.tel}
          onChangeText={(value) => {
            const formatted = formatPhoneNumber(value, true);
            setFormData(prev => ({ ...prev, tel: formatted }));
            setErrors(prev => ({ ...prev, tel: validators.tel(formatted) }));
          }}
          placeholder="02111111111" keyboardType="phone-pad" maxLength={11} textAlign="right"
        />
        {errors.tel ? <Text style={styles.errorText}>{errors.tel}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>شهر *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.city && styles.pickerError]}
          onPress={() => setShowCityModal(true)}
        >
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.cityName || 'انتخاب شهر'}</Text>
        </TouchableOpacity>
        {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>مسیر *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.masir && styles.pickerError]}
          onPress={() => setShowMasirModal(true)}
        >
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.masirName || 'انتخاب مسیر'}</Text>
        </TouchableOpacity>
        {errors.masir ? <Text style={styles.errorText}>{errors.masir}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>نوع مشتری</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCustomerTypeModal(true)}>
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.skh}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>عنوان</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTitleModal(true)}>
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.onvan}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>نوع مالکیت</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowOwnershipModal(true)}>
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.kindM}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>صنف *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.sanf && styles.pickerError]}
          onPress={() => setShowSanfModal(true)}
        >
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.nameSF || 'انتخاب صنف'}</Text>
        </TouchableOpacity>
        {errors.sanf ? <Text style={styles.errorText}>{errors.sanf}</Text> : null}
      </View>

      {/* ── بخش عکس مغازه - فقط موبایل ── */}
{!isWeb && <PhotoSection />}

      {/* ── دکمه‌های ثبت ── */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>

        {/* دکمه ثبت لوکیشن */}
        <TouchableOpacity
          style={[styles.submitButton, { flex: 1, marginTop: 0 }, loading && styles.submitButtonDisabled]}
          onPress={() => setShowManualLocationModal(true)}
        >
          <Text style={styles.submitButtonText}>
            {formData.lat ? 'ویرایش لوکیشن' : 'ثبت لوکیشن'}
          </Text>
        </TouchableOpacity>

        {/* دکمه ثبت مشتری */}
        <TouchableOpacity
          style={[styles.submitButton, { flex: 1, marginTop: 0 }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingPhotos}
        >
          {loading || uploadingPhotos
            ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>
                  {uploadingPhotos ? 'آپلود عکس...' : 'در حال ثبت...'}
                </Text>
              </View>
            )
            : <Text style={styles.submitButtonText}>ثبت مشتری</Text>
          }
        </TouchableOpacity>

      </View>

      <CustomPickerModal
        visible={showCityModal} onClose={() => setShowCityModal(false)}
        title="انتخاب شهر" data={cities} selectedValue={formData.cityCode}
        onSelect={(item) => {
          setFormData(prev => ({ ...prev, cityCode: item.CityCode, cityName: item.CityName }));
          setErrors(prev => ({ ...prev, city: validators.city(item.CityCode) }));
        }}
      />
      <CustomPickerModal
        visible={showMasirModal} onClose={() => setShowMasirModal(false)}
        title="انتخاب مسیر" data={masirList} selectedValue={formData.masirCode}
        onSelect={(item) => {
          setFormData(prev => ({ ...prev, masirCode: item.codeM, masirName: item.NameM }));
          setErrors(prev => ({ ...prev, masir: validators.masir(item.codeM) }));
        }}
      />
      <CustomPickerModal
        visible={showSanfModal} onClose={() => setShowSanfModal(false)}
        title="انتخاب صنف" data={sanfList} selectedValue={formData.codeSF}
        onSelect={(item) => {
          setFormData(prev => ({ ...prev, codeSF: item.CodeSF, nameSF: item.NameSF }));
          setErrors(prev => ({ ...prev, sanf: validators.sanf(item.CodeSF) }));
        }}
      />
      <CustomPickerModal
        visible={showCustomerTypeModal} onClose={() => setShowCustomerTypeModal(false)}
        title="نوع مشتری" data={customerTypes} selectedValue={formData.skh}
        onSelect={(item) => setFormData(prev => ({ ...prev, skh: item.value }))}
      />
      <CustomPickerModal
        visible={showTitleModal} onClose={() => setShowTitleModal(false)}
        title="عنوان" data={titles} selectedValue={formData.onvan}
        onSelect={(item) => setFormData(prev => ({ ...prev, onvan: item.value }))}
      />
      <CustomPickerModal
        visible={showOwnershipModal} onClose={() => setShowOwnershipModal(false)}
        title="نوع مالکیت" data={ownershipTypes} selectedValue={formData.kindM}
        onSelect={(item) => setFormData(prev => ({ ...prev, kindM: item.value }))}
      />

      <ManualLocationModal
        visible={showManualLocationModal}
        buyerName={getFullName(formData) || 'مشتری جدید'}
        initialLat={modalInitialLat}
        initialLng={modalInitialLng}
        onConfirm={handleLocationConfirm}
        onCancel={() => setShowManualLocationModal(false)}
      />

    </ScrollView>
  );
};

export default CustomerRegistration;