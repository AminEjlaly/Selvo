import { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getStoredManfiStatus, refreshManfiStatus } from '../api';
import styles from '../styles/ProductListScreen.styles';

const defaultFont = { fontFamily: "IRANYekan" };

export default function ModalProduct({
  visible,
  product,
  mbnaCount,
  slaveCount,
  totalCount,
  setMbnaCount,
  setSlaveCount,
  onClose,
  onAddToCart,
  cart
}) {
  const [hasManfiAccess, setHasManfiAccess] = useState(false);
  const [isCheckingManfi, setIsCheckingManfi] = useState(true);

  const existingCartItem = cart?.find(item => item.Code === product.Code);
  
  useEffect(() => {
    const checkManfiAccess = async () => {
      try {
        setIsCheckingManfi(true);
        
        let manfiStatus = await getStoredManfiStatus();
        
        if (visible) {
          try {
            manfiStatus = await refreshManfiStatus();
          } catch (refreshError) {
            console.log('⚠️ خطا در بروزرسانی وضعیت manfi، از حافظه استفاده می‌شود');
          }
        }
        
        setHasManfiAccess(manfiStatus);
        console.log('✅ وضعیت manfi کاربر در مدال:', manfiStatus ? 'دارد' : 'ندارد');
        
      } catch (error) {
        console.log('❌ خطا در بررسی وضعیت manfi:', error);
        setHasManfiAccess(false);
      } finally {
        setIsCheckingManfi(false);
      }
    };

    if (visible && product) {
      checkManfiAccess();
    }
  }, [visible, product]);

  // 🔥 تابع فیلتر کردن فقط اعداد
  const handleNumberInput = (text, setter) => {
    // فقط اعداد و اعشار را قبول کن
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // جلوگیری از چند نقطه اعشار
    const parts = numericValue.split('.');
    const filtered = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : numericValue;
    
    setter(filtered);
  };

  const handleAddPress = () => {
    const stock = parseFloat(product.Mojoodi) || 0;

    if (totalCount === 0) {
      Alert.alert(
        'خطا در ثبت',
        'لطفاً تعداد کالا را مشخص کنید. تعداد کل نمی‌تواند صفر باشد.',
        [{ text: 'متوجه شدم' }]
      );
      return;
    }

    if (mbnaCount === "" && slaveCount === "") {
      Alert.alert(
        'خطا در ثبت', 
        'لطفاً تعداد مبنا یا تعداد جز را وارد کنید.', 
        [{ text: 'متوجه شدم' }]
      );
      return;
    }

    if (!hasManfiAccess && totalCount > stock) {
      Alert.alert(
        'خطای موجودی',
        `تعداد وارد شده (${totalCount}) از موجودی (${stock}) بیشتر است.\n\nشما اجازه فروش منفی ندارید.`,
        [{ text: 'باشه' }]
      );
      return;
    }

    onAddToCart();
  };

  const getStockAlertStyle = () => {
    const stock = parseFloat(product.Mojoodi) || 0;
    const isOverStock = totalCount > stock;

    if (!isOverStock) {
      return {
        backgroundColor: '#f0f9ff',
        borderColor: '#bae6fd',
        textColor: '#0369a1'
      };
    }

    if (hasManfiAccess) {
      return {
        backgroundColor: '#fef3c7',
        borderColor: '#fcd34d',
        textColor: '#d97706'
      };
    }

    return {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      textColor: '#dc2626'
    };
  };

  const stockStyle = getStockAlertStyle();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 10, textAlign: "center", ...defaultFont }}>
            {existingCartItem ? 'ویرایش کالا در سبد خرید' : 'ثبت کالا'}
          </Text>

          <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 5, textAlign: "center", ...defaultFont }}>
            {product.Name}
          </Text>
          
          <Text style={{ textAlign: "center", ...defaultFont }}>
            مبنا: {product.Mbna} | جز: {product.SlaveUnit}
          </Text>

          {existingCartItem && (
            <View style={{
              backgroundColor: '#f0fdf4',
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#10b981',
              marginVertical: 8
            }}>
              <Text style={{ 
                color: '#059669', 
                fontWeight: '600', 
                textAlign: 'center',
                ...defaultFont 
              }}>
                ✓ این کالا در سبد خرید شما موجود است
              </Text>
              <Text style={{ 
                color: '#059669', 
                textAlign: 'center',
                fontSize: 12,
                marginTop: 4,
                ...defaultFont 
              }}>
                تعداد فعلی: {existingCartItem.totalCount} عدد
              </Text>
            </View>
          )}

          {product.Mojoodi !== undefined && (
            <View style={{
              backgroundColor: stockStyle.backgroundColor,
              padding: 8,
              borderRadius: 6,
              marginVertical: 8,
              borderWidth: 1,
              borderColor: stockStyle.borderColor
            }}>
              <Text style={{ 
                color: stockStyle.textColor, 
                fontWeight: '600', 
                textAlign: "center",
                ...defaultFont 
              }}>
                موجودی فعلی: {product.Mojoodi} {product.SlaveUnit}
                {totalCount > product.Mojoodi && (hasManfiAccess ? ' ⚠️' : ' 🚫')}
              </Text>
              
              {totalCount > product.Mojoodi && !hasManfiAccess && (
                <Text style={{ 
                  color: stockStyle.textColor, 
                  fontSize: 12, 
                  textAlign: "center",
                  marginTop: 4,
                  ...defaultFont 
                }}>
                  ✗ فروش منفی مجاز نیست
                </Text>
              )}
            </View>
          )}

          {/* 🔥 فیلد تعداد مبنا - فقط اعداد */}
          <View style={{ marginVertical: 10 }}>
            <Text style={{ marginBottom: 5, fontWeight: '500', ...defaultFont }}>
              تعداد مبنا ({product.MainUnit}):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                existingCartItem && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }
              ]}
              placeholder="0"
              keyboardType="phone-pad" // 🔥 برای Android بهتر کار می‌کند
              value={mbnaCount}
              onChangeText={(text) => handleNumberInput(text, setMbnaCount)}
              returnKeyType="next"
              maxLength={10} // 🔥 محدودیت طول
            />
          </View>

          {/* 🔥 فیلد تعداد جز - فقط اعداد */}
          <View style={{ marginVertical: 10 }}>
            <Text style={{ marginBottom: 5, fontWeight: '500', ...defaultFont }}>
              تعداد جز ({product.SlaveUnit}):
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                existingCartItem && { borderColor: '#10b981', backgroundColor: '#f0fdf4' }
              ]}
              placeholder="0"
              keyboardType="phone-pad" // 🔥 برای Android بهتر کار می‌کند
              value={slaveCount}
              onChangeText={(text) => handleNumberInput(text, setSlaveCount)}
              returnKeyType="done"
              maxLength={10} // 🔥 محدودیت طول
            />
          </View>

          {/* اطلاعات کل */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            backgroundColor: '#f8fafc',
            padding: 12,
            borderRadius: 8,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}>
            <Text style={{ ...defaultFont, fontWeight: '600' }}>
              تعداد کل: {totalCount} عدد
            </Text>
            <Text style={{ ...defaultFont, fontWeight: '600', color: '#1e3a8a' }}>
              قیمت کل: {(totalCount * parseFloat(product.Price || product.PriceF1 || 0))?.toLocaleString()} 
            </Text>
          </View>

          {/* دکمه‌های اقدام */}
          <TouchableOpacity 
            style={[
              styles.addButton, 
              existingCartItem && { backgroundColor: '#059669' }
            ]} 
            onPress={handleAddPress}
            disabled={isCheckingManfi}
          >
            <Text style={{ color: '#fff', fontWeight: '700', ...defaultFont }}>
              {isCheckingManfi ? 'در حال بررسی...' : (existingCartItem ? 'ویرایش کالا' : 'افزودن به سبد خرید')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={{ color: '#130252ff', fontWeight: '700', ...defaultFont }}>
              انصراف
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}