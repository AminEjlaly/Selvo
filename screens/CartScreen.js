// CartScreen.js
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  Image, Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getCustomerSellerInfo, getDailyBuyers, getMapBuyers, getProducts, getStoredManfiStatus, refreshManfiStatus } from '../api';
import { CartContext } from '../CartContext';
import ProductModal from '../components/EditModal';
import ProductSelectionModal from '../components/ProductSelectionModal';
import { checkProximityForBuyer } from '../services/proximityCheckService';
import styles from '../styles/CartScreenStyles';
import { saveInvoiceToFile } from '../utils/invoiceFileManager';
import { getSelectedCustomer, saveSelectedCustomer } from '../utils/storage';

const defaultFont = { fontFamily: "IRANYekan" };

export default function CartScreen({ navigation, route }) {
  const { cart, addToCart, removeFromCart, updateCartItem, clearCart } = useContext(CartContext);

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [productSearchText, setProductSearchText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [pricingInfo, setPricingInfo] = useState(null);

  // ✅ حالت‌های مربوط به مدال محصول
  const [editingIndex, setEditingIndex] = useState(null);
  const [mbnaCount, setMbnaCount] = useState('');
  const [slaveCount, setSlaveCount] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('نقدی');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkDays, setCheckDays] = useState('');
  const [checkFieldVisible, setCheckFieldVisible] = useState(false);

  // 🔥 State جدید برای وضعیت Manfi
  const [hasManfiAccess, setHasManfiAccess] = useState(false);

  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const [mapBuyers, setMapBuyers] = useState([]);
  
  const fetchMapBuyers = async () => {
    try {
      const data = await getMapBuyers();
      const uniqueData = Array.from(new Map(data.map(b => [b.code, b])).values());
      setMapBuyers(uniqueData);
      return uniqueData;
    } catch (error) {
      return [];
    }
  };

  // 🔥 دریافت وضعیت Manfi
  useEffect(() => {
    const checkManfiAccess = async () => {
      try {
        let manfiStatus = await getStoredManfiStatus();
        
        if (addProductModalVisible) {
          try {
            manfiStatus = await refreshManfiStatus();
          } catch (refreshError) {
            // خطا به صورت خاموش مدیریت می‌شود
          }
        }
        
        setHasManfiAccess(manfiStatus);
        
      } catch (error) {
        setHasManfiAccess(false);
      }
    };

    if (addProductModalVisible) {
      checkManfiAccess();
    }
  }, [addProductModalVisible]);

  useEffect(() => {
    fetchMapBuyers();
    
    if (route.params?.selectedCustomer) {
      const customerFromParams = route.params.selectedCustomer;
      
      setSelectedCustomer(customerFromParams);
      saveSelectedCustomer(customerFromParams);
      
      navigation.setParams({ selectedCustomer: null });
    }
  }, [route.params?.selectedCustomer]);

  useEffect(() => {
    fetchMapBuyers();
    const loadCustomerAndUser = async () => {
  const userData = await AsyncStorage.getItem('user');
  
  if (userData) {
    const user = JSON.parse(userData);
    
    setUserRole(user.role);
    
    if (route.params?.selectedCustomer) {
      return;
    }
    
    if (user.role === 'customer') {
      const customerSelf = {
        code: user.NOF,
        name: user.NameF,
        mobile: user.mob
      };
      setSelectedCustomer(customerSelf);
      await saveSelectedCustomer(customerSelf);
    } else {
      const savedCustomer = await getSelectedCustomer();
      if (savedCustomer) {
        setSelectedCustomer(savedCustomer);
      }
    }
  }
};
    loadCustomerAndUser();
  }, []);

  useEffect(() => {
    fetchMapBuyers();
    setCheckFieldVisible(paymentMethod === 'چک');
  }, [paymentMethod]);

  useEffect(() => {
    fetchMapBuyers();
    if (productSearchText) {
      const normalizedSearch = normalizeText(productSearchText);
      const filtered = products.filter(product =>
        normalizeText(product.Name).includes(normalizedSearch) ||
        normalizeText(product.Code?.toString()).includes(normalizedSearch) ||
        normalizeText(product.MainUnit).includes(normalizedSearch)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearchText, products]);

  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .trim();
  };

  const getProductStock = (product) => {
    const stock = product.Mojoodi !== undefined ? Number(product.Mojoodi) : null;
    return stock;
  };

  const openCustomerModal = async () => {
    if (userRole === 'customer') {
      Alert.alert('توجه', 'شما به عنوان مشتری وارد شده‌اید و نمی‌توانید مشتری دیگری انتخاب کنید.');
      return;
    }

    setCustomerModalVisible(true);
    setLoadingCustomers(true);
    try {
      const data = await getDailyBuyers();
      const uniqueData = Array.from(new Map(data.map(b => [b.code, b])).values());
      setCustomers(uniqueData);
    } catch (error) {
      // خطا به صورت خاموش مدیریت می‌شود
    } finally {
      setLoadingCustomers(false);
    }
  };

  const openAddProductModal = async () => {
    if (!selectedCustomer) {
      Alert.alert('توجه', 'لطفاً ابتدا مشتری را انتخاب کنید');
      return;
    }

    setAddProductModalVisible(true);
    setLoadingProducts(true);
    try {
      const buyerCode = selectedCustomer?.code || null;
      
      const result = await getProducts(null, null, buyerCode);
      const productsData = result.products || [];
      const pricingData = result.pricing || {
        buyerCode: buyerCode,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      };
      
      const productsWithCorrectPrice = productsData.map(product => {
        const displayPrice = product.CustomerPrice || product.Price || 
                           (pricingData?.priceColumn === 'PriceF5' ? product.PriceF5 : 
                            pricingData?.priceColumn === 'PriceF4' ? product.PriceF4 :
                            pricingData?.priceColumn === 'PriceF3' ? product.PriceF3 :
                            pricingData?.priceColumn === 'PriceF2' ? product.PriceF2 :
                            product.PriceF1);

        return {
          ...product,
          Price: displayPrice,
          DisplayPrice: displayPrice
        };
      });
      
      setProducts(productsWithCorrectPrice);
      setFilteredProducts(productsWithCorrectPrice);
      setPricingInfo(pricingData);
      
    } catch (error) {
      Alert.alert('خطا', 'دریافت لیست کالاها با مشکل مواجه شد: ' + error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 🔥 تابع اصلاح شده addProductToCart - بدون پیغام‌های Manfi
  const addProductToCart = (product) => {
    const stock = getProductStock(product);
    const isOutOfStock = stock !== null && stock <= 0;
    
    // فقط اگر موجودی صفر است و کاربر اجازه Manfi ندارد، مانع شو
    if (isOutOfStock && !hasManfiAccess) {
      Alert.alert(
        'خطای موجودی',
        '❌ این کالا موجودی ندارد.'
      );
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.Code === product.Code);
    
    if (existingItemIndex !== -1) {
      Alert.alert(
        'توجه',
        'این کالا قبلاً به سبد خرید اضافه شده است. آیا می‌خواهید تعداد آن را ویرایش کنید؟',
        [
          {
            text: 'لغو',
            style: 'cancel'
          },
          {
            text: 'ویرایش',
            onPress: () => {
              setAddProductModalVisible(false);
              const existingItem = cart[existingItemIndex];
              openModal(existingItem, existingItemIndex);
            }
          }
        ]
      );
      return;
    }

    const newItem = {
      ...product,
      countMbna: 0,
      countSlave: 0,
      totalCount: 0,
      totalPrice: 0,
      Image: product.imageUrl || null,
      customerName: selectedCustomer?.name || '',
      customerCode: selectedCustomer?.code || '',
      pricingInfo: pricingInfo
    };

    addToCart(newItem);
    setAddProductModalVisible(false);
    
    // پیغام ساده بدون اشاره به Manfi
    Alert.alert(
      'موفقیت',
      '✅ کالا به سبد خرید اضافه شد. لطفاً تعداد مورد نظر را تنظیم کنید.'
    );
    
    setTimeout(() => {
      const newItemIndex = cart.length;
      openModal(newItem, newItemIndex);
    }, 500);
  };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes((searchText || '').toLowerCase())
  );

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    await saveSelectedCustomer(customer);
    setCustomerModalVisible(false);
  };

  // ✅ تابع باز کردن مدال محصول
  const openModal = async (item, index) => {
    setSelectedProduct(item);
    setEditingIndex(index);
    setMbnaCount(item.countMbna?.toString() || '');
    setSlaveCount(item.countSlave?.toString() || '');
    setTotalCount(item.totalCount || 0);
    setModalVisible(true);
  };

  // ✅ تابع ذخیره تغییرات محصول
  const handleAddOrEditCart = async () => {
    if (!selectedProduct) return;

    if (totalCount === 0) {
      Alert.alert('خطا', 'لطفاً تعداد کالا را بیشتر از صفر وارد کنید.');
      return;
    }

    const productPrice = parseFloat(selectedProduct.DisplayPrice || selectedProduct.Price || selectedProduct.PriceF1 || 0);
    const item = {
      ...selectedProduct,
      countMbna: parseFloat(mbnaCount) || 0,
      countSlave: parseFloat(slaveCount) || 0,
      totalCount,
      totalPrice: totalCount * productPrice,
      Image: selectedProduct.Image || selectedProduct.imageUrl || null,
      customerName: selectedCustomer?.name || '',
      customerCode: selectedCustomer?.code || '',
      pricingInfo: pricingInfo
    };

    if (editingIndex !== null) {
      updateCartItem(editingIndex, item);
    } else {
      const existingIndex = cart.findIndex(
        c => c.Code === item.Code && c.customerCode === item.customerCode
      );
      if (existingIndex !== -1) {
        updateCartItem(existingIndex, item);
      } else {
        addToCart(item);
      }
    }

    setModalVisible(false);
    setEditingIndex(null);
  };

  // ✅ تابع بستن مدال
  const closeEditModal = () => {
    setModalVisible(false);
    setEditingIndex(null);
    setSelectedProduct(null);
    setMbnaCount('');
    setSlaveCount('');
    setTotalCount(0);
  };
// در ابتدای CartScreen.js بعد از importها

const convertToPersianDate = (gregorianDate) => {
  const { jy, jm, jd } = require('jalaali-js').toJalaali(
    gregorianDate.getFullYear(),
    gregorianDate.getMonth() + 1,
    gregorianDate.getDate()
  );
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
};
const openPaymentModal = async () => {
    if (!selectedCustomer) {
      Alert.alert("خطا", "لطفاً ابتدا مشتری را انتخاب کنید");
      return;
    }

    if (cart.length === 0) {
      Alert.alert("خطا", "سبد خرید خالی است");
      return;
    }

    // 🔥 اگر مشتری خودش لاگین کرده، نیازی به چک نزدیکی نیست
    if (userRole === 'customer') {
      setPaymentModalVisible(true);
      return;
    }

    // 🔥 فقط برای ویزیتور چک نزدیکی انجام میشه
    try {
      let currentMapBuyers = mapBuyers;
      if (currentMapBuyers.length === 0) {
        currentMapBuyers = await fetchMapBuyers();
      }

      const proximityResult = await checkProximityForBuyer(
        selectedCustomer,
        currentMapBuyers,
        50
      );

      if (!proximityResult.hasLocation) {
        Alert.alert(
          '⚠️ لوکیشن ثبت نشده',
          `مشتری "${selectedCustomer.name}" هنوز لوکیشن ثبت نکرده است.\n\n` +
          `برای ثبت فاکتور، ابتدا باید لوکیشن مشتری را ثبت کنید.`,
          [
            { text: 'متوجه شدم', style: 'default' }
          ]
        );
        return;
      }

      if (proximityResult.error) {
        if (proximityResult.error === 'PERMISSION_DENIED') {
          Alert.alert(
            'دسترسی موقعیت مکانی',
            'برای ثبت فاکتور، دسترسی به موقعیت مکانی الزامی است.',
            [
              { text: 'انصراف', style: 'cancel' },
              { 
                text: 'تنظیمات', 
                onPress: () => {
                  const { Linking } = require('react-native');
                  Linking.openSettings();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'خطا',
            'خطا در دریافت موقعیت مکانی.\n\nلطفاً مجدداً تلاش کنید.'
          );
        }
        return;
      }

      if (!proximityResult.canProceed) {
        Alert.alert(
          '⚠️ خارج از محدوده',
          `شما در فاصله ${proximityResult.distance} متری از مشتری "${selectedCustomer.name}" هستید.\n\n` +
          `برای ثبت فاکتور باید حداکثر 50 متر فاصله داشته باشید.\n\n` +
          `لطفاً به نزدیکی مشتری بروید و مجدداً تلاش کنید.`,
          [
            { text: 'متوجه شدم', style: 'default' }
          ]
        );
        return;
      }

      setPaymentModalVisible(true);

    } catch (error) {
      Alert.alert(
        'خطا',
        'خطایی در بررسی موقعیت مکانی رخ داد.\n\nلطفاً دوباره تلاش کنید.'
      );
    }
  };

  // 📍 تابع ثبت لوکیشن مشتری
  const handleRegisterLocation = async () => {
    if (!selectedCustomer) {
      Alert.alert('خطا', 'مشتری انتخاب نشده است');
      return;
    }

    try {
      // درخواست دسترسی به موقعیت
      const { requestLocationPermission, getCurrentPosition } = require('../services/locationService');
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'دسترسی موقعیت مکانی',
          'برای ثبت لوکیشن، دسترسی به موقعیت مکانی الزامی است.',
          [
            { text: 'انصراف', style: 'cancel' },
            { 
              text: 'تنظیمات', 
              onPress: () => {
                const { Linking } = require('react-native');
                Linking.openSettings();
              }
            }
          ]
        );
        return;
      }

      // نمایش لودینگ
      Alert.alert('لطفاً صبر کنید', 'در حال دریافت موقعیت مکانی...');

      // دریافت موقعیت فعلی
      const location = await getCurrentPosition();
      const { latitude, longitude } = location.coords;

      // ارسال به سرور
      const result = await registerBuyerLocation(
        selectedCustomer.code,
        latitude,
        longitude
      );

      // بروزرسانی لیست مشتری‌های دارای لوکیشن
      await fetchMapBuyers();

      Alert.alert(
        '✅ موفقیت',
        `لوکیشن ${userRole === 'customer' ? 'شما' : `مشتری "${selectedCustomer.name}"`} با موفقیت ثبت شد.\n\n` +
        `حالا می‌توانید فاکتور ثبت کنید.`,
        [
          {
            text: 'ادامه ثبت فاکتور',
            onPress: () => {
              // بعد از ثبت موفق، دوباره تلاش برای باز کردن مدال پرداخت
              setTimeout(() => openPaymentModal(), 500);
            }
          }
        ]
      );

    } catch (error) {
      let errorMessage = 'خطا در ثبت لوکیشن. لطفاً دوباره تلاش کنید.';
      
      if (error.message === 'LOCATION_ALREADY_EXISTS') {
        errorMessage = 'لوکیشن قبلاً ثبت شده است.';
      } else if (error.message === 'PERMISSION_DENIED') {
        errorMessage = 'دسترسی به موقعیت مکانی رد شد.';
      } else if (error.message === 'Network request failed') {
        errorMessage = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطا', errorMessage);
    }
  };

  const resetEverything = () => {
    clearCart();
    setSelectedCustomer(null);
    setPaymentMethod('نقدی');
    setDescription('');
    setCheckDays('');
    setIsSubmitting(false);
  };
const handleSaveInvoiceFinal = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    let locationInfo = null;
    let sellerCode = 1;

    // 🔥 تعیین sellerCode بر اساس نقش کاربر
    if (userRole === 'customer') {
      // اگر کاربر مشتری هست، از فروشنده معرف استفاده کن
      try {
        const sellerInfo = await getCustomerSellerInfo(selectedCustomer.code);
        if (sellerInfo.success) {
          sellerCode = sellerInfo.sellerInfo.sellerCode;
        }
      } catch (sellerError) {
        // خطا به صورت خاموش مدیریت می‌شود
      }
    } else {
      // اگر کاربر فروشنده/ویزیتور هست، از کد خودش استفاده کن
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          sellerCode = user.NOF || user.id || user.userId || user.code || 1;
        }
      } catch (userError) {
        // خطا به صورت خاموش مدیریت می‌شود
      }
    }

    // 🔥 فقط برای ویزیتور چک نزدیکی نهایی انجام میشه
    if (userRole !== 'customer') {
      let currentMapBuyers = mapBuyers;
      if (currentMapBuyers.length === 0) {
        currentMapBuyers = await fetchMapBuyers();
      }

      const proximityResult = await checkProximityForBuyer(
        selectedCustomer,
        currentMapBuyers,
        50
      );

      if (!proximityResult.hasLocation) {
        Alert.alert(
          '⚠️ خطا',
          'لوکیشن مشتری یافت نشد. لطفاً ابتدا لوکیشن مشتری را ثبت کنید.',
          [{ text: 'باشه' }]
        );
        setIsSubmitting(false);
        return;
      }

      if (proximityResult.error) {
        Alert.alert(
          'خطا',
          'خطا در بررسی موقعیت مکانی. لطفاً دوباره تلاش کنید.',
          [{ text: 'باشه' }]
        );
        setIsSubmitting(false);
        return;
      }

      if (!proximityResult.canProceed) {
        Alert.alert(
          '🚫 خارج از محدوده',
          `شما در فاصله ${proximityResult.distance} متری از مشتری هستید!\n\n` +
          `به نظر می‌رسید از محل مشتری دور شده‌اید. برای ثبت فاکتور باید حداکثر 50 متر فاصله داشته باشید.\n\n` +
          `لطفاً به نزدیکی مشتری بازگردید.`,
          [
            { 
              text: 'متوجه شدم', 
              style: 'cancel',
              onPress: () => {
                setIsSubmitting(false);
                setPaymentModalVisible(false);
              }
            }
          ]
        );
        return;
      }
      
      locationInfo = {
        visitorLocation: proximityResult.visitorLocation,
        buyerLocation: proximityResult.buyerLocation,
        distance: proximityResult.distance,
        timestamp: new Date().toISOString()
      };
    }

    // ساخت فاکتور
    const newInvoice = {
      id: Date.now().toString(),
      customer: selectedCustomer,
      items: [...cart],
      totalPrice: totalCartPrice,
      paymentMethod: paymentMethod === 'چک' ? `چک ${checkDays} روزه` : paymentMethod,
      description: description,
      date: convertToPersianDate(new Date()),
      sentToServer: false,
      checkDays: paymentMethod === 'چک' ? checkDays : null,
      locationInfo: locationInfo,
      userRole: userRole,
      sellerCode: sellerCode
    };

    // 🔥 ذخیره در فایل
    const saveResult = await saveInvoiceToFile(newInvoice);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'خطا در ذخیره‌سازی فاکتور');
    }

    setPaymentModalVisible(false);
    resetEverything();

    Alert.alert(
      "✅ موفقیت",
      `فاکتور با موفقیت ثبت شد.\n\n`,
      [
        {
          text: "مشاهده فاکتورها",
          onPress: () => navigation.navigate("Invoices")
        },
        {
          text: "ادامه خرید"
        }
      ]
    );

  } catch (err) {
    Alert.alert(
      "خطا", 
      "مشکلی در ثبت فاکتور پیش آمد: " + (err.message || '') + 
      "\n\nلطفاً دوباره تلاش کنید."
    );
    setIsSubmitting(false);
  }
};
  const handleClearCart = () => {
    Alert.alert(
      "تأیید حذف",
      "آیا از حذف کامل سبد خرید مطمئن هستید؟",
      [
        {
          text: "لغو",
          style: "cancel"
        },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {
            resetEverything();
            Alert.alert("موفقیت", "سبد خرید با موفقیت پاک شد");
          }
        }
      ]
    );
  };

  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    setPaymentMethod('نقدی');
    setDescription('');
    setCheckDays('');
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10}}>
        {userRole === 'customer' ? (
          <View style={[styles.clearBtn, { backgroundColor: '#059669' }]}>
            <Text style={[{ color: '#fff'}, defaultFont]}>
              👤 مشتری: {selectedCustomer?.name || 'خود شما'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.clearBtn} onPress={openCustomerModal}>
            <Text style={[{ color: '#fff' }, defaultFont]}>
              {selectedCustomer ? `مشتری: ${selectedCustomer.name}` : 'انتخاب مشتری'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.clearBtn, { backgroundColor: '#081b96ff' }]}
          onPress={openAddProductModal}
        >
          <Text style={[{ color: '#fff',fontFamily: "IRANYekan",alignSelf:"center"}]}>
            <MaterialIcons style={[{alignSelf:"center"}]} name="add" size={18} color="#ffffffbb" /> اضافه کردن کالا
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.main}>
            <View style={styles.cover}>
              <View style={styles.card}>
                <View style={styles.info}>
                  <Text style={[styles.name, defaultFont]}>{item.Name}</Text>
                  <View style={{ flexDirection: 'row', gap: 20 }}>
                    <Text style={[styles.text, defaultFont]}>تعداد: {item.totalCount}</Text>
                    <Text style={[styles.text, defaultFont]}>
                      قیمت واحد: {(item.DisplayPrice || item.Price || item.PriceF1)?.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={[styles.price, defaultFont]}>جمع: {item.totalPrice.toLocaleString()}</Text>
                </View>
                <Image source={{ uri: item.Image }} style={styles.productImage} />
              </View>

              <View style={styles.GroupButtons}>
                <TouchableOpacity onPress={() => removeFromCart(index)}>
                  <Text><MaterialIcons name="delete" size={24} color="#bb2015bb" /></Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openModal(item, index)}>
                  <Text><MaterialIcons name="edit" size={24} color="#0c2197bb" /></Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <Text style={[styles.emptyCartText, defaultFont]}>سبد خرید خالی است</Text>
            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => navigation.navigate('ProductList')}
            >
              <Text style={[styles.continueShoppingText, defaultFont]}>ادامه خرید</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {cart.length > 0 && (
        <View style={styles.totalContainer}>
          <Text style={[styles.totalText, defaultFont]}>جمع کل سبد: {totalCartPrice.toLocaleString()}</Text>
        </View>
      )}

      {cart.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: "center", marginTop: 5 }}>
          <TouchableOpacity
            style={[styles.clearBtn1, { backgroundColor: 'red' }]}
            onPress={handleClearCart}
          >
            <Text style={[{ color: '#fff', fontWeight: 'bold' }, defaultFont]}>حذف فاکتور <MaterialIcons name="edit" size={18} color="#ffffffbb" /></Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.clearBtn1, { backgroundColor: 'green' }]}
            onPress={openPaymentModal}
          >
            <Text style={[{ color: '#fff', fontWeight: 'bold', alignSelf: "center" }, defaultFont]}>ثبت فاکتور <MaterialIcons name="done" size={18} color="#f0f0f3bb" /></Text>
          </TouchableOpacity>
        </View>
      )}

      {cart.length === 0 && (
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: '#1e3a8a', marginTop: 20 }]}
          onPress={() => navigation.navigate('ProductList')}
        >
          <Text style={[{ color: '#fff'}, defaultFont]}>بازگشت به محصولات</Text>
        </TouchableOpacity>
      )}

      {/* ✅ کامپوننت جدید مدال انتخاب محصولات */}
      <ProductSelectionModal
        visible={addProductModalVisible}
        products={products}
        filteredProducts={filteredProducts}
        loadingProducts={loadingProducts}
        productSearchText={productSearchText}
        setProductSearchText={setProductSearchText}
        onAddProduct={addProductToCart}
        onClose={() => setAddProductModalVisible(false)}
        cart={cart}
      />

      {/* ✅ کامپوننت مدال ویرایش محصول */}
      <ProductModal
        visible={modalVisible}
        product={selectedProduct}
        mbnaCount={mbnaCount}
        slaveCount={slaveCount}
        totalCount={totalCount}
        setMbnaCount={setMbnaCount}
        setSlaveCount={setSlaveCount}
        setTotalCount={setTotalCount}
        onClose={closeEditModal}
        onSave={handleAddOrEditCart}
        isEditing={true}
        cart={cart}
      />

      {/* مدال انتخاب مشتری */}
      <Modal
        visible={customerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {loadingCustomers ? (
              <ActivityIndicator size="large" color="#c2185b" />
            ) : (
              <>
                <TextInput
                  style={[styles.input, defaultFont]}
                  placeholder="جستجو مشتری..."
                  value={searchText}
                  onChangeText={setSearchText}
                />
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.code.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.customerRow}
                      onPress={() => selectCustomer(item)}
                    >
                      <Text style={[styles.customerName, defaultFont]}>{item.name}</Text>
                      <Text style={[styles.customerPhone, defaultFont]}>{item.code}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 10 }]}
              onPress={() => setCustomerModalVisible(false)}>
              <Text style={[{ color: '#fff' }, defaultFont]}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* مدال پرداخت */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, ...defaultFont }]}>
              ثبت نهایی فاکتور
            </Text>

            <View style={{ marginBottom: 15 }}>
              <Text style={[{ fontWeight: 'bold', marginBottom: 5,...defaultFont }]}>مشتری:</Text>
              <Text style={defaultFont}>{selectedCustomer?.name} (کد: {selectedCustomer?.code})</Text>
            </View>

            <View style={{ marginBottom: 15,flexDirection:"row",justifyContent: "space-between"}}>
              <Text style={[{ fontWeight: 'bold', marginBottom: 5,...defaultFont }]}>مبلغ کل:</Text>
              <Text style={defaultFont}>{totalCartPrice.toLocaleString()}</Text>
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={[{ fontWeight: 'bold', marginBottom: 5 }, defaultFont]}>نحوه پرداخت:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {['نقدی', 'کارت', 'نسیه'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={{
                      padding: 6,
                      backgroundColor: paymentMethod === method ? '#081185ff' : '#f0f0f0',
                      borderRadius: 8,
                      minWidth: 60,
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setPaymentMethod(method);
                      if (method !== 'چک') {
                        setCheckDays('');
                      }
                    }}
                  >
                    <Text style={[{ color: paymentMethod === method ? 'white' : 'black' }, defaultFont]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <TouchableOpacity
                    style={{
                      padding: 6,
                      backgroundColor: paymentMethod === 'چک' ? '#081185ff' : '#f0f0f0',
                      borderRadius: 8,
                      minWidth: 60,
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setPaymentMethod('چک');
                    }}
                  >
                    <Text style={[{ color: paymentMethod === 'چک' ? 'white' : 'black' }, defaultFont]}>
                      چک
                    </Text>
                  </TouchableOpacity>

                  {checkFieldVisible && (
                    <View style={{ width: 80 }}>
                      <TextInput
                        style={[
                          {
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            padding: 8,
                            textAlign: 'center',
                            fontSize: 14,
                            height: 40,
                            minWidth: 80
                          },
                          defaultFont
                        ]}
                        placeholder="روز"
                        value={checkDays}
                        onChangeText={setCheckDays}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[{ fontWeight: 'bold', marginBottom: 5 }, defaultFont]}>توضیحات :</Text>
              <TextInput
                style={[
                  {
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    textAlignVertical: 'top',
                    minHeight: 80
                  },
                  defaultFont
                ]}
                placeholder="توضیحات فاکتور..."
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: 'gray', flex: 1 }]}
                onPress={closePaymentModal}
              >
                <Text style={[{ color: '#fff', textAlign: 'center' }, defaultFont]}>بازگشت</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: '#0529a1ff', flex: 1 },
                  isSubmitting && { opacity: 0.6 }
                ]}
                onPress={handleSaveInvoiceFinal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[{ color: '#fff', textAlign: 'center' }, defaultFont]}>تأیید و ثبت</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}