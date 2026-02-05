// EditInvoiceScreen.js - کامل و اصلاح شده
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { CartContext } from '../CartContext';
import styles from '../styles/EditInvoiceScreenStyles';
import { getProducts, getStoredManfiStatus, refreshManfiStatus } from '../api';
import { clearSelectedCustomer, getSelectedCustomer, saveSelectedCustomer } from '../utils/storage';
import { updateInvoice } from '../utils/invoiceFileManager';
import ProductSelectionModal from "../components/ProductSelectionModal";
import ProductModal from "../components/EditModal";

const defaultFont = { fontFamily: "IRANYekan" };

export default function EditInvoiceScreen({ route, navigation }) {
  const { invoice } = route.params;

  const { cart, addToCart, removeFromCart, updateCartItem, clearCart, setCart } = useContext(CartContext);

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
  const [hasManfiAccess, setHasManfiAccess] = useState(false);
  
  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 🔥 دریافت وضعیت Manfi
  useEffect(() => {
    const checkManfiAccess = async () => {
      try {
        let manfiStatus = await getStoredManfiStatus();
        
        if (addProductModalVisible) {
          try {
            manfiStatus = await refreshManfiStatus();
          } catch (refreshError) {
            console.log('⚠️ خطا در بروزرسانی وضعیت manfi');
          }
        }
        
        setHasManfiAccess(manfiStatus);
        
      } catch (error) {
        console.log('❌ خطا در بررسی وضعیت manfi:', error);
        setHasManfiAccess(false);
      }
    };

    if (addProductModalVisible) {
      checkManfiAccess();
    }
  }, [addProductModalVisible]);

  useEffect(() => {
    if (invoice) {
      setSelectedCustomer(invoice.customer);
      setCart(invoice.items || []);

      if (invoice.paymentMethod) {
        if (invoice.paymentMethod.includes('چک')) {
          setPaymentMethod('چک');
          const daysMatch = invoice.paymentMethod.match(/(\d+)/);
          if (daysMatch) {
            setCheckDays(daysMatch[1]);
          }
        } else {
          setPaymentMethod(invoice.paymentMethod);
        }
      }

      setDescription(invoice.description || '');
    }
  }, [invoice]);

  useEffect(() => {
    const loadCustomer = async () => {
      const savedCustomer = await getSelectedCustomer();
      if (savedCustomer && !selectedCustomer) {
        setSelectedCustomer(savedCustomer);
      }
    };
    loadCustomer();
  }, []);

  useEffect(() => {
    setCheckFieldVisible(paymentMethod === 'چک');
  }, [paymentMethod]);

  useEffect(() => {
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

  useEffect(() => {
    if (invoice && cart.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [cart, invoice]);

  // 🔥 اضافه کردن useEffect برای لاگ وضعیت
  useEffect(() => {
    console.log('🔄 وضعیت ویرایش:', {
      hasInvoice: !!invoice,
      selectedCustomer: selectedCustomer?.name || 'null',
      cartItems: cart?.length || 0,
      hasUnsavedChanges
    });
  }, [invoice, selectedCustomer, cart, hasUnsavedChanges]);

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
    Alert.alert(
      "دسترسی محدود",
      "به این منو دسترسی ندارید و نمی‌توانید مشتری را عوض کنید.",
      [
        {
          text: "متوجه شدم",
          style: "cancel"
        }
      ]
    );
    return;
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

      console.log('🛒 دریافت محصولات برای مشتری:', buyerCode);

      const result = await getProducts(null, null, buyerCode);
      const productsData = result.products || [];
      const pricingData = result.pricing || {
        buyerCode: buyerCode,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      };

      console.log('💰 اطلاعات قیمت‌گذاری دریافت شده:', pricingData);

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

      console.log('✅ تعداد محصولات با قیمت اصلاح شده:', productsWithCorrectPrice.length);

      setProducts(productsWithCorrectPrice);
      setFilteredProducts(productsWithCorrectPrice);
      setPricingInfo(pricingData);

    } catch (error) {
      console.error('❌ خطا در دریافت محصولات:', error);
      Alert.alert('خطا', 'دریافت لیست کالاها با مشکل مواجه شد: ' + error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 🔥 تابع اصلاح شده addProductToCart
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
  const openModal = (item, index) => {
    setSelectedProduct(item);
    setEditingIndex(index);
    setMbnaCount(item.countMbna?.toString() || '');
    setSlaveCount(item.countSlave?.toString() || '');
    setTotalCount(item.totalCount || 0);
    setModalVisible(true);
  };

  // ✅ تابع ذخیره تغییرات محصول
  const handleAddOrEditCart = () => {
    if (!selectedProduct) return;

    const productPrice = parseFloat(selectedProduct.DisplayPrice || selectedProduct.Price || selectedProduct.PriceF1 || 0);
    
    console.log('💵 قیمت محاسبه شده:', productPrice);

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

  // 🔥 تابع اصلاح شده: ذخیره با invoiceFileManager
  const saveInvoiceChanges = async () => {
    try {
      // 🔥 بررسی وجود مشتری
      if (!selectedCustomer) {
        throw new Error('لطفاً ابتدا مشتری را انتخاب کنید');
      }

      // 🔥 بررسی وجود آیتم در سبد خرید
      if (!cart || cart.length === 0) {
        throw new Error('سبد خرید خالی است');
      }

      const updatedInvoiceData = {
        customer: selectedCustomer,
        items: [...cart],
        totalPrice: totalCartPrice,
        paymentMethod: paymentMethod === 'چک' ? `چک ${checkDays} روزه` : paymentMethod,
        description: description,
        date: new Date().toLocaleString('fa-IR'),
        checkDays: paymentMethod === 'چک' ? checkDays : null
      };

      // استفاده از updateInvoice از invoiceFileManager
      const success = await updateInvoice(invoice.id, updatedInvoiceData);

      if (!success) {
        throw new Error('بروزرسانی فایل فاکتور با مشکل مواجه شد');
      }

      return true;
    } catch (error) {
      console.error('❌ خطا در ذخیره فاکتور:', error);
      throw error;
    }
  };

  // 🔥 اصلاح useFocusEffect برای بررسی وضعیت
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!hasUnsavedChanges) {
          return;
        }

        e.preventDefault();

        Alert.alert(
          "تغییرات بدون ذخیره",
          "آیا می‌خواهید تغییرات را ذخیره کنید؟",
          [
            {
              text: "لغو (ادامه ویرایش)",
              style: "cancel",
              onPress: () => { }
            },
            {
              text: "ذخیره",
              style: "default",
              onPress: async () => {
                try {
                  // 🔥 بررسی قبل از ذخیره
                  if (!selectedCustomer) {
                    Alert.alert('خطا', 'لطفاً ابتدا مشتری را انتخاب کنید');
                    return;
                  }

                  if (!cart || cart.length === 0) {
                    Alert.alert('خطا', 'سبد خرید خالی است');
                    return;
                  }

                  await saveInvoiceChanges();

                  await AsyncStorage.multiRemove(['cart', 'selectedCustomer']);
                  await clearSelectedCustomer();
                  clearCart();
                  setHasUnsavedChanges(false);

                  navigation.dispatch(e.data.action);
                } catch (err) {
                  console.log("خطا در ذخیره فاکتور:", err);
                  Alert.alert("خطا", err.message || "مشکلی در ذخیره فاکتور پیش آمد");
                }
              }
            },
            {
              text: "بدون ذخیره",
              style: "destructive",
              onPress: async () => {
                try {
                  await AsyncStorage.multiRemove(['cart', 'selectedCustomer']);
                  await clearSelectedCustomer();
                  clearCart();
                  setHasUnsavedChanges(false);
                  navigation.dispatch(e.data.action);
                } catch (err) {
                  console.log("خطا:", err);
                  Alert.alert("خطا", "مشکلی پیش آمد.");
                }
              }
            }
          ]
        );
      });

      return () => unsubscribe();
    }, [hasUnsavedChanges, cart, selectedCustomer, paymentMethod, checkDays, description, invoice, totalCartPrice, navigation])
  );

  const openPaymentModal = () => {
    // 🔥 بررسی وجود مشتری
    if (!selectedCustomer) {
      Alert.alert("خطا", "لطفاً ابتدا مشتری را انتخاب کنید");
      return;
    }

    // 🔥 بررسی سبد خرید
    if (!cart || cart.length === 0) {
      Alert.alert("خطا", "سبد خرید خالی است");
      return;
    }

    setPaymentModalVisible(true);
  };

  const resetEverything = () => {
    clearCart();
    setSelectedCustomer(null);
    setPaymentMethod('نقدی');
    setDescription('');
    setCheckDays('');
    setIsSubmitting(false);
  };

  const handleCancelEdit = () => {
    Alert.alert(
      "لغو ویرایش",
      "آیا از لغو ویرایش اطمینان دارید؟ تغییرات ذخیره نخواهند شد.",
      [
        {
          text: "ادامه ویرایش",
          style: "cancel"
        },
        {
          text: "بازگشت",
          style: "destructive",
          onPress: () => {
            navigation.goBack();
          }
        }
      ]
    );
  };

  // 🔥 تابع اصلاح شده: ذخیره با invoiceFileManager
  const handleUpdateInvoice = async () => {
    // 🔥 بررسی‌های اولیه قبل از ذخیره
    if (!selectedCustomer) {
      Alert.alert('خطا', 'لطفاً ابتدا مشتری را انتخاب کنید');
      return;
    }

    if (!cart || cart.length === 0) {
      Alert.alert('خطا', 'سبد خرید خالی است');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // استفاده از تابع جدید برای ذخیره
      await saveInvoiceChanges();

      await AsyncStorage.multiRemove(['cart', 'selectedCustomer']);
      await clearSelectedCustomer();
      clearCart();
      setSelectedCustomer(null);
      setPaymentMethod('نقدی');
      setDescription('');
      setCheckDays('');

      setPaymentModalVisible(false);
      Alert.alert(
        "موفقیت",
        "✅ فاکتور با موفقیت ویرایش و ذخیره شد",
        [
          {
            text: "مشاهده فاکتورها",
            onPress: () => {
              navigation.navigate("Invoices");
            }
          },
          {
            text: "باشه",
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );

    } catch (err) {
      console.error("❌ خطا در ویرایش فاکتور:", err);
      Alert.alert("خطا", err.message || "مشکلی در ویرایش فاکتور پیش آمد");
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
            clearCart();
            Alert.alert("موفقیت", "سبد خرید با موفقیت پاک شد");
          }
        }
      ]
    );
  };

  const closePaymentModal = () => {
    setPaymentModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.GroupbuttonTop}>
        <TouchableOpacity style={styles.CustomerBtn} onPress={openCustomerModal}>
          <Text style={{ color: '#ffffffff', fontWeight: 'bold', ...defaultFont }}>
            {selectedCustomer ? `مشتری: ${selectedCustomer.name}` : 'انتخاب مشتری'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.AddBtn, { backgroundColor: '#e79703ff', marginBottom: 10 }]}
          onPress={openAddProductModal}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', ...defaultFont }}>اضافه کردن کالا</Text>
          <MaterialIcons name="add" size={20} color="#ffffffff" />
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
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 20 }}>
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: '#140101ff', flex: 1 }]}
          onPress={handleCancelEdit}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', ...defaultFont }}>لغو ویرایش</Text>
        </TouchableOpacity>

        {cart.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: '#e79703ff', flex: 1 }]}
              onPress={handleClearCart}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', ...defaultFont }}>حذف همه</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: '#11076eff', flex: 1 }]}
              onPress={openPaymentModal}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', ...defaultFont }}>ذخیره تغییرات</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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

      {/* مدال پرداخت */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, ...defaultFont }}>
              ذخیره تغییرات فاکتور
            </Text>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5, ...defaultFont }}>مشتری:</Text>
              <Text style={defaultFont}>{selectedCustomer?.name} (کد: {selectedCustomer?.code})</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5, ...defaultFont }}>مبلغ کل:</Text>
              <Text style={defaultFont}>{totalCartPrice.toLocaleString()} تومان</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10, ...defaultFont }}>نحوه پرداخت:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                {['نقدی', 'کارت', 'نسیه'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={{
                      padding: 10,
                      backgroundColor: paymentMethod === method ? '#c2185b' : '#f0f0f0',
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
                    <Text style={{ color: paymentMethod === method ? 'white' : 'black', ...defaultFont }}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      backgroundColor: paymentMethod === 'چک' ? '#c2185b' : '#f0f0f0',
                      borderRadius: 8,
                      minWidth: 60,
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setPaymentMethod('چک');
                    }}
                  >
                    <Text style={{ color: paymentMethod === 'چک' ? 'white' : 'black', ...defaultFont }}>
                      چک
                    </Text>
                  </TouchableOpacity>

                  {checkFieldVisible && (
                    <View style={{ width: 80 }}>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#ccc',
                          borderRadius: 8,
                          padding: 8,
                          textAlign: 'center',
                          fontSize: 14,
                          height: 40,
                          minWidth: 80,
                          ...defaultFont
                        }}
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
              <Text style={{ fontWeight: 'bold', marginBottom: 5, ...defaultFont }}>توضیحات (اختیاری):</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 10,
                  textAlignVertical: 'top',
                  minHeight: 80,
                  ...defaultFont
                }}
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
                <Text style={{ color: '#fff', textAlign: 'center', ...defaultFont }}>بازگشت</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: 'green', flex: 1 },
                  isSubmitting && { opacity: 0.6 }
                ]}
                onPress={handleUpdateInvoice}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', textAlign: 'center', ...defaultFont }}>ذخیره تغییرات</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}