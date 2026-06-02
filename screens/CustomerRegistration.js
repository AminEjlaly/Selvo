// CustomerRegistration.js
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
  getSanf
} from '../api';
import ManualLocationModal from '../components/ManualLocationModal';
import styles from '../styles/CustomerRegistrationStyles';

const URMIA_LAT = 37.55012;
const URMIA_LNG = 45.06872;
const LOCATION_TIMEOUT_MS = 15000;

const validators = {
  name: (value) => {
    if (!value.trim()) return 'نام مشتری الزامی است';
    if (value.length < 2) return 'نام باید حداقل ۲ کاراکتر باشد';
    if (value.length > 100) return 'نام نمی‌تواند بیش از ۱۰۰ کاراکتر باشد';
    if (!/^[\u0600-\u06FF\sa-zA-Z0-9]+$/.test(value)) {
      return 'نام فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و فاصله باشد';
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

  // وضعیت لوکیشن
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | searching | found | failed
  const locationTimeoutRef = useRef(null);

  // مختصات اولیه مودال (لوکیشن کاربر اگه پیدا شد، وگرنه ارومیه)
  const [modalInitialLat, setModalInitialLat] = useState(URMIA_LAT);
  const [modalInitialLng, setModalInitialLng] = useState(URMIA_LNG);

  const [formData, setFormData] = useState({
    name: '', addB: '', tblo: '', tel: '', mobile: '',
    cityCode: '', cityName: '', masirCode: '', masirName: '',
    skh: 'حقیقی', codeSF: '', nameSF: '',
    kindM: 'مالک', onvan: 'آقای', lat: '', lng: ''
  });

  const [errors, setErrors] = useState({
    name: '', tel: '', mobile: '', addB: '', tblo: '', city: '', masir: '', sanf: ''
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
    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    };
  }, []);

  // ── ۱. فرم فوری لود می‌شه، لوکیشن در بک‌گراند دنبال می‌شه ──────────────
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
      // بعد از لود فرم، لوکیشن رو در بک‌گراند دنبال کن
      fetchLocationInBackground();
    }
  };

  // ── ۲. لوکیشن در بک‌گراند با timeout 15 ثانیه ──────────────────────────
  const fetchLocationInBackground = async () => {
    setLocationStatus('searching');

    // timeout 15 ثانیه
    locationTimeoutRef.current = setTimeout(() => {
      setLocationStatus('failed');
    }, LOCATION_TIMEOUT_MS);

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

  // ── ۳. handleSubmit: اگه لوکیشن نداشت، اول مودال باز می‌شه ─────────────
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('خطا', 'لطفا خطاهای فرم را برطرف کنید');
      return;
    }

    // اگه لوکیشن ثبت نشده مودال باز می‌شه
    if (!formData.lat || !formData.lng) {
      setShowManualLocationModal(true);
      return;
    }

    await doRegister();
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      const duplicateCheck = await checkDuplicateCustomer({
        name: formData.name.trim(),
        tel: formData.tel.trim(),
        mobile: formData.mobile.trim(),
        addB: formData.addB.trim(),
        cityCode: formData.cityCode
      });

      if (duplicateCheck.isDuplicate) {
        Alert.alert('خطا', 'مشتری تکراری میباشد');
        return;
      }

      await proceedWithRegistration();
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

  const validateForm = () => {
    const newErrors = {
      name: validators.name(formData.name),
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
    return !Object.values(newErrors).some(e => e !== null);
  };

  const proceedWithRegistration = async () => {
    const buyerCode = await generateBuyerCode(formData.cityCode);
    const customerData = {
      buyerCode,
      name: formData.name.trim(),
      tel: formData.tel.trim(),
      mobile: formData.mobile.trim(),
      addB: formData.addB.trim(),
      cityCode: formData.cityCode,
      cityName: formData.cityName,
      tblo: formData.tblo.trim(),
      skh: formData.skh,
      codeSF: formData.codeSF,
      nameSF: formData.nameSF,
      kindM: formData.kindM,
      onvan: formData.onvan,
      lat: formData.lat,
      lng: formData.lng,
      masirCode: formData.masirCode,
      masirName: formData.masirName
    };
    await createCompleteCustomer(customerData);
    Alert.alert('موفقیت', 'مشتری با موفقیت ثبت شد', [
      { text: 'باشه', onPress: () => navigation.goBack() }
    ]);
  };

  // ── هندل تأیید مودال لوکیشن ─────────────────────────────────────────────
  const handleLocationConfirm = async (coords) => {
    setFormData(prev => ({
      ...prev,
      lat: coords.latitude.toString(),
      lng: coords.longitude.toString()
    }));
    setShowManualLocationModal(false);
    // اگه از مسیر handleSubmit اومدیم، ادامه بده
    if (!formData.lat) {
      // مستقیم ادامه ثبت بده (با coords جدید)
      setLoading(true);
      try {
        const updatedForm = {
          ...formData,
          lat: coords.latitude.toString(),
          lng: coords.longitude.toString()
        };
        const duplicateCheck = await checkDuplicateCustomer({
          name: updatedForm.name.trim(), tel: updatedForm.tel.trim(),
          mobile: updatedForm.mobile.trim(), addB: updatedForm.addB.trim(),
          cityCode: updatedForm.cityCode
        });
        if (duplicateCheck.isDuplicate) { Alert.alert('خطا', 'مشتری تکراری میباشد'); return; }

        const buyerCode = await generateBuyerCode(updatedForm.cityCode);
        await createCompleteCustomer({ ...updatedForm, buyerCode, name: updatedForm.name.trim(), tel: updatedForm.tel.trim(), mobile: updatedForm.mobile.trim(), addB: updatedForm.addB.trim(), tblo: updatedForm.tblo.trim() });
        Alert.alert('موفقیت', 'مشتری با موفقیت ثبت شد', [
          { text: 'باشه', onPress: () => navigation.goBack() }
        ]);
      } catch (error) {
        Alert.alert('خطا', error.message || 'خطای ناشناخته');
      } finally {
        setLoading(false);
      }
    }
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
        paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: config.color + '40'
      }}>
        {locationStatus === 'searching' && <ActivityIndicator size="small" color={config.color} />}
        <Text style={{ fontSize: 12, color: config.color, fontFamily: 'IRANYekan', flex: 1, textAlign: 'right' }}>
          {config.text}
        </Text>
      </View>
    );
  };

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
                style={[styles.modalItem, (selectedValue === (item.value || item.CodeSF || item.codeM || item.CityCode)) && styles.selectedItem]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.modalItemText}>{item.label || item.NameSF || item.NameM || item.CityName}</Text>
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
        <Text style={styles.label}>نام مشتری *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(value) => {
            setFormData(prev => ({ ...prev, name: value }));
            setErrors(prev => ({ ...prev, name: validators.name(value) }));
          }}
          placeholder="نام کامل مشتری را وارد کنید"
          textAlign="right"
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
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
        <TouchableOpacity style={[styles.pickerButton, errors.city && styles.pickerError]} onPress={() => setShowCityModal(true)}>
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.cityName || 'انتخاب شهر'}</Text>
        </TouchableOpacity>
        {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>مسیر *</Text>
        <TouchableOpacity style={[styles.pickerButton, errors.masir && styles.pickerError]} onPress={() => setShowMasirModal(true)}>
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
        <TouchableOpacity style={[styles.pickerButton, errors.sanf && styles.pickerError]} onPress={() => setShowSanfModal(true)}>
          <Text style={styles.pickerArrow}>▼</Text>
          <Text style={styles.pickerButtonText}>{formData.nameSF || 'انتخاب صنف'}</Text>
        </TouchableOpacity>
        {errors.sanf ? <Text style={styles.errorText}>{errors.sanf}</Text> : null}
      </View>

      {/* ── دکمه‌های ثبت ── */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>

        {/* دکمه ثبت لوکیشن — هم‌شکل submitButton */}
        <TouchableOpacity
          style={[styles.submitButton, { flex: 2, marginTop: 0 }, loading && styles.submitButtonDisabled]}
          onPress={() => setShowManualLocationModal(true)}
        >

          <Text style={styles.submitButtonText}>
            {formData.lat ? 'ویرایش لوکیشن' : 'ثبت لوکیشن'}
          </Text>
        </TouchableOpacity>

        {/* دکمه ثبت مشتری */}
        <TouchableOpacity
          style={[styles.submitButton, { flex: 2, marginTop: 0 }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitButtonText}>ثبت مشتری</Text>
          }
        </TouchableOpacity>

      </View>

      <CustomPickerModal visible={showCityModal} onClose={() => setShowCityModal(false)} title="انتخاب شهر" data={cities} selectedValue={formData.cityCode}
        onSelect={(item) => { setFormData(prev => ({ ...prev, cityCode: item.CityCode, cityName: item.CityName })); setErrors(prev => ({ ...prev, city: validators.city(item.CityCode) })); }} />
      <CustomPickerModal visible={showMasirModal} onClose={() => setShowMasirModal(false)} title="انتخاب مسیر" data={masirList} selectedValue={formData.masirCode}
        onSelect={(item) => { setFormData(prev => ({ ...prev, masirCode: item.codeM, masirName: item.NameM })); setErrors(prev => ({ ...prev, masir: validators.masir(item.codeM) })); }} />
      <CustomPickerModal visible={showSanfModal} onClose={() => setShowSanfModal(false)} title="انتخاب صنف" data={sanfList} selectedValue={formData.codeSF}
        onSelect={(item) => { setFormData(prev => ({ ...prev, codeSF: item.CodeSF, nameSF: item.NameSF })); setErrors(prev => ({ ...prev, sanf: validators.sanf(item.CodeSF) })); }} />
      <CustomPickerModal visible={showCustomerTypeModal} onClose={() => setShowCustomerTypeModal(false)} title="نوع مشتری" data={customerTypes} selectedValue={formData.skh}
        onSelect={(item) => setFormData(prev => ({ ...prev, skh: item.value }))} />
      <CustomPickerModal visible={showTitleModal} onClose={() => setShowTitleModal(false)} title="عنوان" data={titles} selectedValue={formData.onvan}
        onSelect={(item) => setFormData(prev => ({ ...prev, onvan: item.value }))} />
      <CustomPickerModal visible={showOwnershipModal} onClose={() => setShowOwnershipModal(false)} title="نوع مالکیت" data={ownershipTypes} selectedValue={formData.kindM}
        onSelect={(item) => setFormData(prev => ({ ...prev, kindM: item.value }))} />

      <ManualLocationModal
        visible={showManualLocationModal}
        buyerName={formData.name || 'مشتری جدید'}
        initialLat={37.55012}
        initialLng={45.06872}
        onConfirm={handleLocationConfirm}
        onCancel={() => setShowManualLocationModal(false)}
      />
    </ScrollView>
  );
};

export default CustomerRegistration;