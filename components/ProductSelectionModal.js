// components/ProductSelectionModal.js
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getStoredManfiStatus, refreshManfiStatus } from '../api';

const defaultFont = { fontFamily: "IRANYekan" };

const styles = {
  modalContainerBackgroundKala: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentKala: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  modalButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  productRowKala: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  productRowDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  productInfo: {
    flex: 1,
  },
  productTitr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  addProductButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProductButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  productUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  productStock: {
    fontSize: 14,
    fontWeight: '500',
  },
  manfiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  manfiAllowed: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  manfiNotAllowed: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  manfiText: {
    fontSize: 12,
    fontWeight: '600',
  },
};

export default function ProductSelectionModal({
  visible,
  products = [],
  filteredProducts = [],
  loadingProducts = false,
  productSearchText = '',
  setProductSearchText,
  onAddProduct,
  onClose,
  cart = []
}) {
  // 🔥 State برای نگهداری وضعیت manfi
  const [hasManfiAccess, setHasManfiAccess] = useState(false);
  const [isCheckingManfi, setIsCheckingManfi] = useState(true);

  // 🔥 دریافت وضعیت manfi هنگام باز شدن مدال
  useEffect(() => {
    const checkManfiAccess = async () => {
      try {
        setIsCheckingManfi(true);
        
        // ابتدا از حافظه بخوان
        let manfiStatus = await getStoredManfiStatus();
        
        // اگر مدال باز شد، یک بار هم از سرور بروزرسانی کن
        if (visible) {
          try {
            manfiStatus = await refreshManfiStatus();
          } catch (refreshError) {
            console.log('⚠️ خطا در بروزرسانی وضعیت manfi، از حافظه استفاده می‌شود');
          }
        }
        
        setHasManfiAccess(manfiStatus);
        console.log('✅ وضعیت manfi کاربر در مدال انتخاب محصول:', manfiStatus ? 'دارد' : 'ندارد');
        
      } catch (error) {
        console.log('❌ خطا در بررسی وضعیت manfi:', error);
        setHasManfiAccess(false);
      } finally {
        setIsCheckingManfi(false);
      }
    };

    if (visible) {
      checkManfiAccess();
    }
  }, [visible]);

  // 🔥 بررسی اینکه آیا محصول در سبد خرید وجود دارد
  const isProductInCart = (productCode) => {
    return cart.some(item => item.Code === productCode);
  };

  // 🔥 بررسی موجودی با در نظر گرفتن Manfi - نسخه اصلاح شده
  const canAddProduct = (product) => {
    const stock = parseFloat(product.Mojoodi) || 0;
    
    // اگر محصول در سبد است، اجازه ویرایش نده (باید از دکمه ویرایش استفاده کند)
    if (isProductInCart(product.Code)) {
      return false;
    }
    
    // اگر موجودی کافی است، اجازه بده
    if (stock > 0) {
      return true;
    }
    
    // اگر موجودی صفر یا منفی است ولی کاربر اجازه Manfi دارد، اجازه بده
    if (hasManfiAccess) {
      return true;
    }
    
    // اگر موجودی صفر است و کاربر اجازه Manfi ندارد، اجازه نده
    return false;
  };

  // 🔥 محاسبه سبک نمایش موجودی - نسخه اصلاح شده
  const getStockStyle = (product) => {
    const stock = parseFloat(product.Mojoodi) || 0;
    const inCart = isProductInCart(product.Code);
    
    if (inCart) {
      return {
        color: '#6b7280',
        text: `✅ در سبد خرید موجود است`,
        canAdd: false
      };
    }
    
    if (stock > 0) {
      return {
        color: '#059669',
        text: `موجودی: ${stock.toLocaleString()}`,
        canAdd: true
      };
    }
    
    if (hasManfiAccess) {
      return {
        color: '#d97706',
        text: `موجودی: ${stock.toLocaleString()} (فروش منفی مجاز)`,
        canAdd: true
      };
    }
    
    return {
      color: '#dc2626',
      text: `موجودی: ${stock.toLocaleString()} (ناموجود)`,
      canAdd: false
    };
  };

  // ✅ تابع اضافه کردن محصول به سبد خرید - نسخه اصلاح شده
  const handleAddProduct = (product) => {
    const stockInfo = getStockStyle(product);
    
    if (!stockInfo.canAdd) {
      if (isProductInCart(product.Code)) {
        Alert.alert(
          'توجه',
          'این کالا قبلاً به سبد خرید اضافه شده است. برای ویرایش از دکمه ویرایش در سبد خرید استفاده کنید.',
          [{ text: 'متوجه شدم' }]
        );
      } else {
        Alert.alert(
          'خطای موجودی',
          '❌ این کالا موجودی ندارد و شما اجازه فروش منفی ندارید.',
          [{ text: 'متوجه شدم' }]
        );
      }
      return;
    }

    onAddProduct(product);
  };

  const renderProductItem = ({ item }) => {
    const stockInfo = getStockStyle(item);
    const inCart = isProductInCart(item.Code);
    const displayPrice = item.DisplayPrice || item.Price || item.PriceF1;
    
    return (
      <TouchableOpacity 
        style={[
          styles.productRowKala,
          (!stockInfo.canAdd) && styles.productRowDisabled
        ]}
        onPress={() => stockInfo.canAdd && handleAddProduct(item)}
        disabled={!stockInfo.canAdd}
      >
        <View style={styles.productInfo}>
          <View style={styles.productTitr}>
            <View style={styles.productTitle}>
              <MaterialIcons name="category" size={15} color="#f59607e1" />
              <Text style={[styles.productName, defaultFont]}>{item.Name}</Text>
            </View>
            <View style={[
              styles.addProductButton,
              (!stockInfo.canAdd) && { backgroundColor: '#9ca3af' }
            ]}>
              <Text style={styles.addProductButtonText}>
                {!stockInfo.canAdd ? (
                  inCart ? (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  ) : (
                    <FontAwesome name="cancel" size={16} color="#fff" />
                  )
                ) : (
                  <FontAwesome name="plus" size={14} color="#fff" />
                )}
              </Text>
            </View>
          </View>
          
          <View style={styles.productDetails}>
            <Text style={[styles.productCode, defaultFont]}>کد: {item.Code}</Text>
            <Text style={[styles.productUnit, defaultFont]}>
              واحد: {item.MainUnit} {item.Mbna > 1 ? `(${item.Mbna} ${item.SlaveUnit})` : ''}
            </Text>
          </View>
          
          <View style={styles.productDetails}>
            <Text style={[styles.productPrice, defaultFont]}>
              قیمت: {displayPrice ? parseInt(displayPrice).toLocaleString() : '۰'}
            </Text>
            <Text style={[
              styles.productStock,
              defaultFont,
              { color: stockInfo.color }
            ]}>
              {stockInfo.text}
            </Text>
          </View>
          
          {inCart && (
            <Text style={[{ color: '#059669', fontSize: 12, marginTop: 5, fontWeight: 'bold' }, defaultFont]}>
              ✅ این کالا در سبد خرید موجود است
            </Text>
          )}
          
          {!stockInfo.canAdd && !inCart && (
            <Text style={[{ color: '#dc2626', fontSize: 12, marginTop: 5, fontWeight: 'bold' }, defaultFont]}>
              ❌ این کالا قابل افزودن نیست
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainerBackgroundKala}>
        <View style={[styles.modalContentKala, { height: '80%' }]}>
          <Text style={[{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }, defaultFont]}>
            انتخاب کالا
          </Text>

         

          <TextInput
            style={[styles.input, { marginBottom: 15 }, defaultFont]}
            placeholder="جستجو بر اساس نام یا کد کالا..."
            value={productSearchText}
            onChangeText={setProductSearchText}
          />

          {loadingProducts ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="large" color="#c2185b" />
              <Text style={[{ marginTop: 10 }, defaultFont]}>در حال دریافت لیست کالاها...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.Code.toString()}
              renderItem={renderProductItem}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={[{ color: '#666', textAlign: 'center' }, defaultFont]}>
                    {productSearchText ? 'کالایی با این مشخصات یافت نشد' : 'هیچ کالایی موجود نیست'}
                  </Text>
                </View>
              }
            />
          )}

          <TouchableOpacity
            style={[styles.modalButton, { marginTop: 10 }]}
            onPress={onClose}
          >
            <Text style={[{ color: '#fff', textAlign: 'center' }, defaultFont]}>بستن</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}