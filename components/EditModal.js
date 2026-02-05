// components/ProductModal.js
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getStoredManfiStatus, refreshManfiStatus } from '../api';

const defaultFont = { fontFamily: "IRANYekan" };

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerNew: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeIconButton: {
    padding: 4,
  },
  modalBody: {
    padding: 15,
  },
  productInfoCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  productCode: {
    fontSize: 14,
    color: '#64748b',
  },
  inventoryCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventorySuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  inventoryError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  inventoryWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inventoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    flex: 1,
  },
  inputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  totalCountCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalCountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalCountZero: {
    color: '#9ca3af',
  },
  totalCountError: {
    color: '#dc2626',
  },
  priceCard: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0369a1',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#1e3a8a',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748b',
  },
  saveButtonText: {
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#d1d5db',
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

export default function ProductModal({
  visible,
  product,
  mbnaCount,
  slaveCount,
  totalCount,
  setMbnaCount,
  setSlaveCount,
  setTotalCount,
  onClose,
  onSave,
  isEditing = false,
  cart = []
}) {
  // 🔥 State برای نگهداری وضعیت manfi
  const [hasManfiAccess, setHasManfiAccess] = useState(false);
  const [isCheckingManfi, setIsCheckingManfi] = useState(true);
  const [inventoryError, setInventoryError] = useState('');
  const [availableInventory, setAvailableInventory] = useState(0);

  // ✅ بررسی وجود کالا در سبد خرید
  const existingCartItem = cart?.find(item => item.Code === product?.Code);

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
          }
        }
        
        setHasManfiAccess(manfiStatus);
        
      } catch (error) {
        console.log('❌ خطا در بررسی وضعیت manfi:', error);
        setHasManfiAccess(false);
      } finally {
        setIsCheckingManfi(false);
      }
    };

    if (visible && product) {
      checkManfiAccess();
      // تنظیم موجودی محصول
      const inventory = parseInt(product.Mojoodi) || 0;
      setAvailableInventory(inventory);
      checkInventory(totalCount, inventory);
    }
  }, [visible, product]);

  // 🔥 بررسی موجودی با در نظر گرفتن Manfi
  const checkInventory = (requestedCount, available = availableInventory) => {

    if (requestedCount > available && !hasManfiAccess) {
      const errorMsg = `موجودی کافی نیست! موجودی: ${available}`;
      setInventoryError(errorMsg);
      return false;
    } else {
      setInventoryError('');
      return true;
    }
  };

  // 🔥 محاسبه رنگ بر اساس وضعیت موجودی و manfi
  const getStockAlertStyle = () => {
    const stock = parseFloat(product?.Mojoodi) || 0;
    const isOverStock = totalCount > stock;

    if (!isOverStock) {
      // موجودی کافی است
      return {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        textColor: '#059669',
        icon: 'inventory_2',
        message: ''
      };
    }

    if (hasManfiAccess) {
      // موجودی کم است ولی کاربر اجازه منفی دارد
      return {
        backgroundColor: '#fffbeb',
        borderColor: '#fed7aa',
        textColor: '#d97706',
        icon: 'warning',
        message: '⚠️ فروش منفی مجاز است'
      };
    }

    // موجودی کم است و کاربر اجازه منفی ندارد
    return {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      textColor: '#dc2626',
      icon: 'error',
      message: '✗ فروش منفی مجاز نیست'
    };
  };

  // ✅ تابع ذخیره با بررسی محدودیت موجودی
  const handleSavePress = () => {
    if (!product) return;

    const stock = parseFloat(product.Mojoodi) || 0;

    // بررسی اگر تعداد صفر باشد
    if (totalCount === 0) {
      Alert.alert(
        'خطا در ثبت',
        'لطفاً تعداد کالا را مشخص کنید. تعداد کل نمی‌تواند صفر باشد.',
        [{ text: 'متوجه شدم' }]
      );
      return;
    }

    // بررسی اگر هیچ مقداری وارد نشده باشد
    if (mbnaCount === "" && slaveCount === "") {
      Alert.alert(
        'خطا در ثبت', 
        'لطفاً تعداد مبنا یا تعداد جز را وارد کنید.', 
        [{ text: 'متوجه شدم' }]
      );
      return;
    }

    // 🔥 بررسی موجودی فقط اگر کاربر اجازه منفی نداره
    if (!hasManfiAccess && totalCount > stock) {
      Alert.alert(
        'خطای موجودی',
        `تعداد وارد شده (${totalCount}) از موجودی (${stock}) بیشتر است.\n\nشما اجازه فروش منفی ندارید.`,
        [{ text: 'باشه' }]
      );
      return;
    }

    // 🔥 اگر کاربر اجازه منفی داره، بدون هشدار اجازه بده
    onSave();
  };

useEffect(() => {
  if (!product) return;

  const mbnaVal = parseFloat(mbnaCount) || 0;
  const slaveVal = parseFloat(slaveCount) || 0;

  const total =
    mbnaVal * parseFloat(product.Mbna || 0) +
    slaveVal;

  // ⭐⭐ مقدار جدید را به Parent بفرست
  if (typeof setTotalCount === 'function') {
    setTotalCount(total);
  }

  checkInventory(total);
}, [mbnaCount, slaveCount, product]);

  const stockStyle = getStockAlertStyle();

  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerNew}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, defaultFont]}>
              {isEditing ? 'ویرایش محصول' : 'ثبت کالا'}
            </Text>
            <TouchableOpacity style={styles.closeIconButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
           

            {/* ✅ نمایش وضعیت کالا در سبد خرید */}
            {existingCartItem && (
              <View style={{
                backgroundColor: '#f0fdf4',
                padding: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#10b981',
                marginBottom: 12
              }}>
                <Text style={{ 
                  color: '#059669', 
                  fontWeight: '400', 
                  textAlign: 'center',
                  ...defaultFont 
                }}>
                  ✓ این کالا در سبد خرید شما موجود است
                </Text>
                <Text style={{ 
                  color: '#059669', 
                  textAlign: 'center',
                  fontSize: 10,
                  marginTop: 4,
                  ...defaultFont 
                }}>
                  تعداد فعلی: {existingCartItem.totalCount} عدد
                </Text>
              </View>
            )}

            {/* اطلاعات محصول */}
            <View style={styles.productInfoCard}>
              <View style={styles.productHeader}>
                <MaterialIcons name="inventory" size={20} color="#1e3a8a" />
                <Text style={[styles.productName, defaultFont]}>{product.Name}</Text>
              </View>
              <Text style={[styles.productCode, defaultFont]}>کد: {product.Code}</Text>
              <Text style={[styles.productCode, defaultFont]}>
                مبنا: {product.Mbna} | جز: {product.SlaveUnit}
              </Text>
            </View>
            {/* فیلدهای ورودی */}
            <View style={styles.inputsContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, defaultFont]}>
                  تعداد مبنا ({product.MainUnit})
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    inventoryError && styles.inputError,
                    defaultFont
                  ]}
                  placeholder="0"
                  value={mbnaCount}
                  onChangeText={setMbnaCount}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, defaultFont]}>
                  تعداد جز ({product.SlaveUnit})
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    inventoryError && styles.inputError,
                    defaultFont
                  ]}
                  placeholder="0"
                  value={slaveCount}
                  onChangeText={setSlaveCount}
                  keyboardType="numeric"
                  textAlign="center"
                />
              </View>
            </View>

            {/* اطلاعات کل */}
            <View style={styles.totalCountCard}>
              <Text style={[styles.totalCountLabel, defaultFont]}>تعداد کل:</Text>
              <Text style={[
                styles.totalCountValue,
                defaultFont,
                totalCount === 0 ? styles.totalCountZero : {},
                inventoryError ? styles.totalCountError : {}
              ]}>
                {totalCount.toLocaleString()} {product.SlaveUnit}
              </Text>
            </View>

            {totalCount > 0 && (
              <View style={styles.priceCard}>
                <Text style={[styles.priceLabel, defaultFont]}>قیمت کل:</Text>
                <Text style={[styles.priceValue, defaultFont]}>
                  {(totalCount * parseFloat(product.DisplayPrice || product.Price || product.PriceF1 || 0)).toLocaleString()} 
                </Text>
              </View>
            )}

            {/* دکمه‌های اقدام */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <MaterialIcons name="cancel" size={20} color="#64748b" />
                <Text style={[styles.buttonText, styles.cancelButtonText, defaultFont]}>لغو</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  (totalCount === 0) && styles.saveButtonDisabled
                ]}
                onPress={handleSavePress}
                disabled={totalCount === 0}
              >
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={totalCount > 0 ? "#fff" : "#9ca3af"} 
                />
                <Text style={[
                  styles.buttonText,
                  styles.saveButtonText,
                  defaultFont,
                  (totalCount === 0) && styles.saveButtonTextDisabled
                ]}>
                  {totalCount === 0 ? 'تعداد صفر' : (isEditing ? 'ذخیره تغییرات' : 'افزودن به سبد')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}