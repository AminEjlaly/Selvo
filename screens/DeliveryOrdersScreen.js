import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getDeliveryExits, getDeliveryOrders } from '../api';
import styles from '../styles/DeliveryOrdersScreen.styles';

export default function DeliveryOrdersScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersData, setOrdersData] = useState(null);
  const [selectedExit, setSelectedExit] = useState(null);
  const [availableExits, setAvailableExits] = useState([]);
  const [showExitPicker, setShowExitPicker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedExit]);

  const loadInitialData = async () => {
    await loadAvailableExits();
  };

  const loadAvailableExits = async () => {
    try {
      const response = await getDeliveryExits();
      
      if (response.success) {
        setAvailableExits(response.data?.exits || []);
        
        // تنظیم اولین خروجی به عنوان پیش‌فرض
        if (response.data?.exits?.length > 0 && !selectedExit) {
          setSelectedExit(response.data.exits[0].exitCode);
        }
        
      } else {
        console.log('❌ Failed to load exits:', response.message);
      }
    } catch (error) {
      console.error('❌ Error loading exits:', error);
      Alert.alert('خطا', 'خطا در دریافت لیست خروجی‌ها');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const exitParam = selectedExit;
      const response = await getDeliveryOrders(exitParam);
      if (response.success) {
        setOrdersData(response.data);
      } else {
        if (response.message?.includes('توکن') || response.message?.includes('token')) {
          await AsyncStorage.multiRemove(['token', 'user']);
          Alert.alert(
            'خطای احراز هویت',
            'لطفاً دوباره وارد شوید',
            [
              {
                text: 'باشه',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
          return;
        }
        Alert.alert('خطا', response.message || 'خطا در دریافت اطلاعات');
      }
    } catch (error) {
      console.error('💥 Error loading orders:', error);
      Alert.alert('خطا', error.message || 'ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadOrders(), loadAvailableExits()]);
    } finally {
      setRefreshing(false);
    }
  }, [selectedExit]);

  const formatPrice = (price) => {
    const numPrice = Number(price);
    if (!numPrice || isNaN(numPrice)) return '0';
    const priceInToman = Math.round(numPrice / 10);
    return priceInToman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const onRowPress = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const onDetailsButtonPress = (order) => {
    if (order.invoiceNumber) {
      navigation.navigate('InvoiceItems', {
        invoiceNumber: order.invoiceNumber,
        buyerName: order.buyer?.name,
        exitCode: order.exitCode
      });
    } else {
      Alert.alert('خطا', 'این خروجی فاکتور مرتبطی ندارد');
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const getSelectedExitInfo = () => {
    if (!selectedExit) return 'در حال بارگذاری...';
    
    const exit = availableExits.find(e => e.exitCode == selectedExit);
    if (exit) {
      return `خروجی ${exit.exitCode} - ${exit.exitDate}`;
    }
    return `خروجی ${selectedExit}`;
  };

  const getExitDisplayInfo = (exit) => {
    return `خروجی ${exit.exitCode} - ${exit.exitDate}`;
  };

  const goToDeliveryMap = () => {
    if (!ordersData || ordersData.totalExits === 0) {
      Alert.alert('توجه', 'هیچ خروجی‌ای برای نمایش روی نقشه وجود ندارد');
      return;
    }
    navigation.navigate('MapDeliveri', {
      filterExit: selectedExit
    });
  };

  const renderOrderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => onRowPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderRight}>
          <FontAwesome name="file-text-o" size={20} color="#3b82f6" />
          <Text style={styles.invoiceNumber}>
            {item.invoiceNumber || 'بدون فاکتور'}
          </Text>
        </View>
        <View style={styles.exitCodeBadge}>
          <Text style={styles.exitCodeText}>
            خروجی: {item.exitCode || index + 1}
          </Text>
        </View>
      </View>

      {item.invoiceNumber ? (
        <>
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <FontAwesome name="user" size={14} color="#64748b" />
              <Text style={styles.infoLabel}>خریدار:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.buyer?.name || 'نامشخص'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome name="map-marker" size={14} color="#64748b" />
              <Text style={styles.infoLabel}>آدرس:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.buyer?.address || 'ثبت نشده'}
              </Text>
            </View>

            {item.buyer?.tablo && (
              <View style={styles.infoRow}>
                <FontAwesome name="tag" size={14} color="#64748b" />
                <Text style={styles.infoLabel}>تابلو:</Text>
                <Text style={styles.infoValue}>{item.buyer.tablo}</Text>
              </View>
            )}
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>مبلغ فاکتور:</Text>
              <Text style={styles.amountValue}>
                {formatPrice(item.amount)} تومان
              </Text>
            </View>
            
            {item.invoiceNumber && (
              <TouchableOpacity
                style={styles.invoiceDetailsButton}
                onPress={() => onDetailsButtonPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.invoiceDetailsButtonText}>جزئیات فاکتور</Text>
                <FontAwesome name="list-alt" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.noInvoiceContainer}>
          <FontAwesome name="exclamation-circle" size={18} color="#f59e0b" />
          <Text style={styles.noInvoiceText}>
            {item.message || 'فاکتور مرتبطی یافت نشد'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDateSection = ({ item }) => (
    <View style={styles.dateSection}>
      <View style={styles.dateSectionHeader}>
        <FontAwesome name="calendar" size={18} color="#3b82f6" />
        <Text style={styles.dateSectionTitle}>{item.date}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {item.exits?.length || 0}
          </Text>
        </View>
      </View>

      <FlatList
        data={item.exits || []}
        renderItem={renderOrderItem}
        keyExtractor={(exit, index) => `exit-${exit.exitCode}-${index}`}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          در حال بارگذاری خروجی‌ها...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* هدر صفحه */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            لیست خروجی‌ها
          </Text>
          
          <TouchableOpacity
            style={styles.deliveryRouteButton}
            onPress={goToDeliveryMap}
            activeOpacity={0.7}
          >
            <FontAwesome name="map-marker" size={16} color="#fff" />
            <Text style={styles.deliveryRouteButtonText}>مسیر تحویل</Text>
          </TouchableOpacity>
        </View>
        
        {ordersData && (
          <Text style={styles.headerSubtitle}>
            {ordersData.deliveryName || 'تحویل‌دار'} - 
            تعداد کل خروجی‌ها: {availableExits.length || 0}
          </Text>
        )}
      </View>

      {/* فیلتر خروجی */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowExitPicker(true)}
          activeOpacity={0.7}
        >
          <FontAwesome name="list" size={16} color="#3b82f6" />
          <Text style={styles.filterButtonText}>
            {getSelectedExitInfo()}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#3b82f6" />
        </TouchableOpacity>

        {selectedExit && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => {
              // بازگشت به اولین خروجی
              const firstExit = availableExits[0]?.exitCode;
              setSelectedExit(firstExit || null);
            }}
            activeOpacity={0.7}
          >
            <FontAwesome name="refresh" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {/* لیست خروجی‌ها */}
      <FlatList
        data={ordersData?.dates || []}
        renderItem={renderDateSection}
        keyExtractor={(item, index) => `date-${item.date}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {selectedExit 
                ? `خروجی‌ای برای کد ${selectedExit} یافت نشد`
                : 'هیچ خروجی‌ای یافت نشد'
              }
            </Text>
            <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
              برای به‌روزرسانی، صفحه را به پایین بکشید
            </Text>
          </View>
        }
      />

      {/* مدال انتخاب خروجی */}
      <Modal
        visible={showExitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExitPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>انتخاب خروجی</Text>
                <Text style={styles.datePickerSubtitle}>لیست تمام خروجی‌ها ({availableExits.length})</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowExitPicker(false)}
                >
                  <FontAwesome name="times" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.datesList}
                showsVerticalScrollIndicator={false}
              >
                {availableExits.map((exit, index) => (
                  <TouchableOpacity
                    key={`${exit.exitCode}-${index}`}
                    style={[
                      styles.dateItem,
                      selectedExit === exit.exitCode && styles.dateItemSelected
                    ]}
                    onPress={() => {
                      setSelectedExit(exit.exitCode);
                      setShowExitPicker(false);
                    }}
                  >
                    <FontAwesome
                      name="file-text-o"
                      size={18}
                      color={selectedExit === exit.exitCode ? '#3b82f6' : '#64748b'}
                    />
                    <View style={styles.exitInfo}>
                      <Text style={[
                        styles.dateItemText,
                        selectedExit === exit.exitCode && styles.dateItemTextSelected
                      ]}>
                        {getExitDisplayInfo(exit)}
                      </Text>
                    </View>
                    {selectedExit === exit.exitCode && (
                      <View style={styles.checkIconContainer}>
                        <FontAwesome name="check" size={16} color="#3b82f6" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {availableExits.length === 0 && (
                  <View style={styles.noDatesContainer}>
                    <FontAwesome name="inbox" size={24} color="#cbd5e1" />
                    <Text style={styles.noDatesText}>
                      هیچ خروجی‌ای یافت نشد
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* مدال جزئیات خروجی */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={closeDetailModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDetailModal}
        >
          <View style={styles.modalContent}>
            <View style={styles.detailModalContainer}>
              <View style={styles.detailModalHeader}>
                <Text style={styles.detailModalTitle}>جزئیات خروجی</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeDetailModal}
                >
                  <FontAwesome name="times" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.detailContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedOrder && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>اطلاعات خروجی</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>کد خروجی:</Text>
                        <Text style={styles.detailValue}>
                          {selectedOrder.exitCode || 'نامشخص'}
                        </Text>
                      </View>
                      {selectedOrder.invoiceNumber && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>شماره فاکتور:</Text>
                          <Text style={styles.detailValue}>
                            {selectedOrder.invoiceNumber}
                          </Text>
                        </View>
                      )}
                    </View>

                    {selectedOrder.invoiceNumber && selectedOrder.buyer && (
                      <>
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>اطلاعات خریدار</Text>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>کد مشتری:</Text>
                            <Text style={styles.detailValue}>
                              {selectedOrder.buyer.code || 'نامشخص'}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>نام:</Text>
                            <Text style={styles.detailValue}>
                              {selectedOrder.buyer.name || 'نامشخص'}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>آدرس:</Text>
                            <Text style={styles.detailValue}>
                              {selectedOrder.buyer.address || 'ثبت نشده'}
                            </Text>
                          </View>
                          {selectedOrder.buyer.tablo && (
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>تابلو:</Text>
                              <Text style={styles.detailValue}>
                                {selectedOrder.buyer.tablo}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>اطلاعات مالی</Text>
                          <Text style={styles.detailAmount}>
                            {formatPrice(selectedOrder.amount)} تومان
                          </Text>
                        </View>
                      </>
                    )}

                    {!selectedOrder.invoiceNumber && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>وضعیت</Text>
                        <View style={[styles.noInvoiceContainer, { marginTop: 0 }]}>
                          <FontAwesome name="info-circle" size={18} color="#f59e0b" />
                          <Text style={styles.noInvoiceText}>
                            {selectedOrder.message || 'فاکتور مرتبطی برای این خروجی یافت نشد'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}