// DailyBuyerListScreen.js
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { getDailyBuyers, getMapBuyers } from '../api';
import { navigate } from '../navigationService';
import { checkAndSendBuyerLocation } from '../services/buyerLocationService';
import { styles } from '../styles/DailyBuyerListStyles';

export default function DailyBuyerListScreen() {
  const navigation = useNavigation();
  const [buyers, setBuyers] = useState([]);
  const [mapBuyers, setMapBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [registeringLocation, setRegisteringLocation] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // استفاده از useRef برای جلوگیری از فراخوانی تکراری
  const isFetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  // تابع بهبود یافته برای نرمال سازی متن فارسی
  const normalizePersianText = (text) => {
    if (!text) return '';
    
    text = String(text);
    text = text.trim();
    
    text = text
      .replace(/[يٰ]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/\s+/g, ' ')
      .toLowerCase();
    
    return text;
  };

  // تابع جدید برای ثبت فاکتور با چک نزدیکی
  const handleRegisterInvoice = async () => {
    if (!selectedBuyer) return;

    try {
      // وارد کردن تابع چک نزدیکی
      const { checkProximityForBuyer } = require('../services/proximityCheckService');
      
      // بررسی نزدیکی ویزیتور به مشتری
      const proximityResult = await checkProximityForBuyer(
        selectedBuyer,
        mapBuyers,
        50 // محدوده 50 متری
      );

      // اگر مشتری لوکیشن ثبت نشده
      if (!proximityResult.hasLocation) {
        Alert.alert(
          '⚠️ لوکیشن ثبت نشده',
          `مشتری "${selectedBuyer.name}" هنوز لوکیشن ثبت نکرده است.\n\nلطفاً ابتدا لوکیشن مشتری را ثبت کنید.`,
          [
            { text: 'انصراف', style: 'cancel' },
            { 
              text: 'ثبت لوکیشن', 
              onPress: () => handleRegisterLocation(),
              style: 'default'
            }
          ]
        );
        return;
      }

      // اگر خطایی در دریافت لوکیشن رخ داده
      if (proximityResult.error) {
        if (proximityResult.error === 'PERMISSION_DENIED') {
          Alert.alert(
            'دسترسی موقعیت مکانی',
            'برای ثبت فاکتور، دسترسی به موقعیت مکانی الزامی است.',
            [
              { text: 'انصراف', style: 'cancel' },
              { 
                text: 'تنظیمات', 
                onPress: () => Linking.openSettings() 
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

      // اگر ویزیتور خارج از محدوده است
      if (!proximityResult.canProceed) {
        Alert.alert(
          '⚠️ خارج از محدوده',
          `شما در فاصله ${proximityResult.distance} متری از مشتری هستید.\n\n` +
          `برای ثبت فاکتور باید حداکثر 50 متر از مشتری "${selectedBuyer.name}" فاصله داشته باشید.\n\n` +
          `لطفاً به نزدیکی مشتری بروید.`,
          [{ text: 'متوجه شدم', style: 'default' }]
        );
        return;
      }

      // ✅ همه چیز OK است - انتقال به صفحه Cart
      console.log(`✅ ویزیتور در محدوده مجاز (${proximityResult.distance} متر)`);
      
      setModalVisible(false);
      
      setTimeout(() => {
        navigation.navigate('Cart', { 
          selectedCustomer: {
            code: selectedBuyer.code,
            name: selectedBuyer.name,
            tel: selectedBuyer.tel,
            address: selectedBuyer.address,
            mande: selectedBuyer.mande,
            tblo: selectedBuyer.tblo,
            // ارسال لوکیشن مشتری به Cart
              Lat: proximityResult.buyerLocation?.latitude || 
         selectedBuyer.Lat || 
         mapBuyers.find(b => String(b.code) === String(selectedBuyer.code))?.Lat || 
         0,
    Lng: proximityResult.buyerLocation?.longitude || 
         selectedBuyer.Lng || 
         mapBuyers.find(b => String(b.code) === String(selectedBuyer.code))?.Lng || 
         0
          }
        });
      }, 300);

    } catch (error) {
      console.error('❌ خطا در بررسی نزدیکی:', error);
      Alert.alert(
        'خطا',
        'خطایی در بررسی موقعیت مکانی رخ داد.\n\nلطفاً دوباره تلاش کنید.',
        [{ text: 'باشه' }]
      );
    }
  };

  // فیلتر کردن مشتری‌ها بر اساس جستجو با نرمال سازی
  const filteredBuyers = buyers.filter(buyer => {
    if (!searchQuery.trim()) return true;
    
    const normalizedSearch = normalizePersianText(searchQuery);
    const normalizedName = normalizePersianText(buyer.name);
    
    return normalizedName.includes(normalizedSearch);
  });

  const fetchBuyers = async (forceRefresh = false) => {
    // جلوگیری از فراخوانی تکراری
    if (isFetchingRef.current && !forceRefresh) {
      console.log('⏸️ درخواست قبلی در حال اجراست...');
      return;
    }

    try {
      isFetchingRef.current = true;
      
      // فقط برای اولین بار loading نشان بده
      if (isInitialMount.current || forceRefresh) {
        setLoading(true);
      }
      
      console.log('🔄 در حال دریافت داده‌های مشتریان...');
      const [dailyData, mapData] = await Promise.all([
        getDailyBuyers(),
        getMapBuyers()
      ]);

      const normalizedDailyData = dailyData.map(buyer => ({
        ...buyer,
        name: normalizePersianText(buyer.name)
      }));

      const normalizedMapData = mapData.map(buyer => ({
        ...buyer,
        name: normalizePersianText(buyer.name)
      }));

      setBuyers(Array.from(new Map(normalizedDailyData.map(b => [b.code, b])).values()));
      setMapBuyers(Array.from(new Map(normalizedMapData.map(b => [b.code, b])).values()));

      console.log(`✅ دریافت داده‌ها موفق: ${normalizedDailyData.length} مشتری روزانه, ${normalizedMapData.length} مشتری با لوکیشن`);

    } catch (err) {
      setError(err.message);
      console.error('❌ خطا در دریافت داده‌ها:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
      isInitialMount.current = false;
    }
  };

  // بارگذاری اولیه - فقط یک بار اجرا شود
  useEffect(() => {
    console.log('🚀 بارگذاری اولیه صفحه');
    fetchBuyers(true);
  }, []);

  // ریلود خودکار فقط وقتی از صفحات دیگر برمی‌گردیم
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 صفحه فوکوس شد - بررسی برای ریلود');
      
      // فقط اگر اولین بار نیست و در حال حاضر در حال fetch نیستیم
      if (!isInitialMount.current && !isFetchingRef.current) {
        const timer = setTimeout(() => {
          console.log('🔄 ریلود خودکار داده‌ها');
          fetchBuyers(true);
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }, [])
  );

  // ریلود وقتی مدال بسته شد
  const handleModalClose = () => {
    setModalVisible(false);
    // ریلود داده‌ها بعد از بسته شدن مدال
    setTimeout(() => {
      fetchBuyers(true);
    }, 500);
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 رفرش دستی');
    setRefreshing(true);
    fetchBuyers(true);
  }, []);

  const navigateToCustomerRegistration = () => {
    // استفاده از navigate برای اینکه بتوانیم برگردیم
    navigation.navigate('CustomerRegistration');
  };

  const openBuyerDetails = async (buyer) => {
    setSelectedBuyer(buyer);
    setCheckingLocation(true);
    
    try {
      const existsInMap = mapBuyers.find(b => String(b.code) === String(buyer.code));
      
      if (existsInMap) {
        console.log('ℹ️ مشتری قبلاً لوکیشن دارد:', buyer.name);
      }
      
      setModalVisible(true);
    } catch (error) {
      console.error('خطا در بررسی وضعیت:', error);
      setModalVisible(true);
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleRegisterLocation = async () => {
    if (!selectedBuyer) return;

    try {
      setRegisteringLocation(true);

      const result = await checkAndSendBuyerLocation(selectedBuyer.code, selectedBuyer.name);

      const updatedMapBuyers = [...mapBuyers, {
        ...selectedBuyer,
        Lat: result.coordinates.latitude,
        Lng: result.coordinates.longitude
      }];
      setMapBuyers(updatedMapBuyers);

      Alert.alert('✅ موفق', result.message || 'لوکیشن مشتری با موفقیت ثبت شد');
      setModalVisible(false);

      // ریلود داده‌ها بعد از ثبت لوکیشن
      setTimeout(() => {
        fetchBuyers(true);
      }, 300);

    } catch (error) {
      console.error('❌ Error registering location:', error);
      
      if (error.message === 'LOCATION_ALREADY_EXISTS') {
        Alert.alert(
          '⚠️ توجه', 
          `مشتری "${selectedBuyer.name}" قبلاً لوکیشن ثبت کرده است.\n\nنیازی به ثبت مجدد نیست.`,
          [{ text: 'متوجه شدم', style: 'default' }]
        );
      } else if (error.message === 'PERMISSION_DENIED') {
        Alert.alert(
          'دسترسی ضروری', 
          'برای ثبت لوکیشن، لطفاً دسترسی موقعیت مکانی را فعال کنید',
          [
            { text: 'انصراف', style: 'cancel' },
            { text: 'تنظیمات', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (error.message === 'LOCATION_ERROR') {
        Alert.alert('خطا', 'دریافت موقعیت با خطا مواجه شد. لطفاً دوباره تلاش کنید');
      } else {
        Alert.alert('خطا', error.message || 'خطا در ثبت لوکیشن');
      }
    } finally {
      setRegisteringLocation(false);
    }
  };

  const hasLocation = selectedBuyer ? 
    mapBuyers.some(b => String(b.code) === String(selectedBuyer.code)) : 
    false;

  const handleOutsidePress = () => handleModalClose();

  const handleShowOnMap = () => {
    if (!selectedBuyer) return;

    const existsBuyer = mapBuyers.find(b => String(b.code) === String(selectedBuyer.code));

    if (existsBuyer) {
      setModalVisible(false);
      navigate('MapBuyer', { buyer: selectedBuyer });
    } else {
      Alert.alert('خطا', 'مشتری لوکیشن ثبت نشده است!');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const renderItem = ({ item }) => {
    const hasLoc = mapBuyers.some(b => String(b.code) === String(item.code));
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => openBuyerDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={20} color="#fff" />
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.code}>کد: {item.code}</Text>
          </View>

          {hasLoc && (
            <View style={styles.locationBadge}>
              <MaterialIcons name="location-on" size={14} color="#10B981" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <MaterialIcons name="phone" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.infoText}>{item.tel}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <FontAwesome5 name="money-bill-wave" size={14} color="#10B981" />
            </View>
            <Text style={styles.infoText}>مانده: {item.mande}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <MaterialIcons name="chevron-left" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) 
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>در حال بارگذاری...</Text>
      </View>
    );
  
  if (error) 
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchBuyers(true)}>
          <MaterialIcons name="refresh" size={20} color="#fff" style={{ marginLeft: 8 }} />
          <Text style={styles.retryButtonText}>تلاش مجدد</Text>
        </TouchableOpacity>
      </View>
    );
  
  if (buyers.length === 0) 
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToCustomerRegistration}
        >
          <MaterialIcons name="person-add" size={20} color="#fff" style={{ marginLeft: 8}} />
          <Text style={styles.addButtonText}>تعریف مشتری جدید</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <MaterialIcons name="people-outline" size={80} color="#D1D5DB" />
          <Text style={styles.noCustomerText}>هیچ مشتری‌ای برای امروز وجود ندارد</Text>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* هدر با دکمه اضافه */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToCustomerRegistration}
          activeOpacity={0.8}
        >
          <MaterialIcons name="person-add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>تعریف مشتری جدید</Text>
        </TouchableOpacity>
      </View>

      {/* باکس جستجو */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="جستجو بر اساس نام مشتری..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#9CA3AF"
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <MaterialIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{filteredBuyers.length}</Text>
            <Text style={styles.statLabel}>مشتری</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="location-on" size={20} color="#10B981" />
            <Text style={styles.statNumber}>{mapBuyers.length}</Text>
            <Text style={styles.statLabel}>با لوکیشن</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredBuyers}
        keyExtractor={item => item.code.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptySearch}>
            <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptySearchText}>
              {searchQuery ? `مشتری با نام "${searchQuery}" یافت نشد` : 'مشتری‌ای وجود ندارد'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleOutsidePress}
      >
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                {selectedBuyer ? (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalAvatar}>
                        <MaterialIcons name="person" size={24} color="#fff" />
                      </View>
                      <Text style={styles.modalTitle}>{selectedBuyer.name}</Text>
                      <Text style={styles.modalCode}>کد مشتری: {selectedBuyer.code}</Text>
                    </View>
                    
                    <View style={styles.modalBody}>
                      <View style={styles.modalRow}>
                        <View style={styles.modalIconBox}>
                          <FontAwesome5 name="money-bill-wave" size={16} color="#10B981" />
                        </View>
                        <View style={styles.modalTextBox}>
                          <Text style={styles.modalLabel}>مانده</Text>
                          <Text style={styles.modalValue}>{selectedBuyer.mande}</Text>
                        </View>
                      </View>

                      <View style={styles.modalRow}>
                        <View style={styles.modalIconBox}>
                          <MaterialIcons name="phone" size={18} color="#3B82F6" />
                        </View>
                        <View style={styles.modalTextBox}>
                          <Text style={styles.modalLabel}>تلفن</Text>
                          <Text style={styles.modalValue}>{selectedBuyer.tel}</Text>
                        </View>
                      </View>

                      <View style={styles.modalRow}>
                        <View style={styles.modalIconBox}>
                          <MaterialIcons name="home" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.modalTextBox}>
                          <Text style={styles.modalLabel}>آدرس</Text>
                          <Text style={styles.modalValue}>{selectedBuyer.address || 'ثبت نشده'}</Text>
                        </View>
                      </View>

                      <View style={styles.modalRow}>
                        <View style={styles.modalIconBox}>
                          <MaterialIcons name="store" size={18} color="#8B5CF6" />
                        </View>
                        <View style={styles.modalTextBox}>
                          <Text style={styles.modalLabel}>تابلو</Text>
                          <Text style={styles.modalValue}>{selectedBuyer.tblo || 'ثبت نشده'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* دکمه‌های جمع‌وجور و بالاتر */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handleRegisterInvoice}
                      >
                        <MaterialIcons name="receipt-long" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>ثبت فاکتور</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[
                          styles.secondaryButton,
                          (registeringLocation || hasLocation) && styles.disabledButton
                        ]} 
                        onPress={handleRegisterLocation}
                        disabled={registeringLocation || hasLocation}
                      >
                        {registeringLocation ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : hasLocation ? (
                          <>
                            <MaterialIcons name="check-circle" size={18} color="#fff" />
                            <Text style={styles.secondaryButtonText}>ثبت شده</Text>
                          </>
                        ) : (
                          <>
                            <MaterialIcons name="add-location" size={18} color="#fff" />
                            <Text style={styles.secondaryButtonText}>ثبت لوکیشن</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[
                          styles.mapButton,
                          !hasLocation && styles.disabledMapButton
                        ]} 
                        onPress={handleShowOnMap}
                        disabled={!hasLocation}
                      >
                        <MaterialIcons 
                          name="map" 
                          size={18} 
                          color={hasLocation ? "#3B82F6" : "#9CA3AF"} 
                        />
                        <Text style={[
                          styles.mapButtonText,
                          !hasLocation && styles.disabledMapButtonText
                        ]}>
                          {hasLocation ? 'نمایش روی نقشه' : 'لوکیشن ثبت نشده'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <ActivityIndicator size="large" color="#3B82F6" />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}