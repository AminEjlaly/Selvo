import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCustomerBalance, getCustomerOrders, getCustomerReturns, getDailyBuyers, getOrderDetails } from '../api';
import styles from '../styles/OrderReportScreen.styles';

const OrderReportScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUserRole(parsedUser.role || parsedUser.UserType);
        
        if (parsedUser.role === 'customer' || parsedUser.UserType === 'customer') {
          const customerSelf = {
            code: parsedUser.NOF || parsedUser.id,
            name: parsedUser.NameF || parsedUser.name,
            mobile: parsedUser.mob
          };
          setSelectedCustomer(customerSelf);
          loadOrdersData(customerSelf.code);
        } else {
          const savedCustomer = await AsyncStorage.getItem('selectedCustomer');
          if (savedCustomer) {
            const customer = JSON.parse(savedCustomer);
            setSelectedCustomer(customer);
            loadOrdersData(customer.code);
          }
        }
      }
    } catch (error) {
      Alert.alert('خطا', 'خطا در بارگذاری اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersData = async (buyerCode) => {
    try {
      setLoading(true);
      
      const [ordersResponse, returnsResponse, balanceResponse] = await Promise.all([
        getCustomerOrders(buyerCode),
        getCustomerReturns(buyerCode),
        getCustomerBalance(buyerCode)
      ]);
      
      setOrders(ordersResponse.orders || []);
      setReturns(returnsResponse || []);
      setPayments(balanceResponse.data || []);
      setBalance(balanceResponse.balance || 0);
      
    } catch (error) {
      Alert.alert('خطا', error.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedCustomer) {
      loadOrdersData(selectedCustomer.code);
    }
  };

  const openCustomerModal = async () => {
    setCustomerModalVisible(true);
    setLoadingCustomers(true);
    try {
      const data = await getDailyBuyers();
      const uniqueData = Array.from(new Map(data.map(b => [b.code, b])).values());
      setCustomers(uniqueData);
      setFilteredCustomers(uniqueData);
    } catch (error) {
      Alert.alert('خطا', 'دریافت لیست مشتری‌ها با مشکل مواجه شد');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSearchCustomers = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = customers.filter(customer =>
        customer.name?.includes(text) ||
        customer.code?.toString().includes(text)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    AsyncStorage.setItem('selectedCustomer', JSON.stringify(customer));
    setCustomerModalVisible(false);
    setSearchText('');
    loadOrdersData(customer.code);
  };

  const handleOrderPress = async (orderNumber, type) => {
    try {
      setDetailsLoading(true);
      const details = await getOrderDetails(orderNumber, type);
      setOrderDetails(details.details || []);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('خطا', error.message || 'خطا در دریافت جزیات سفارش');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      if (typeof dateString === 'string' && dateString.includes('/')) {
        return dateString;
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR');
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '۰';
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const renderOrderItem = (item, index, isReturn = false) => (
    <TouchableOpacity
      key={`${isReturn ? 'return' : 'order'}-${item.Number}-${index}`}
      style={styles.orderItem}
      onPress={() => handleOrderPress(item.Number, isReturn ? 'B' : 'F')}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          شماره {isReturn ? 'برگشتی' : 'سفارش'}: {item.Number || 'نامشخص'}
        </Text>
        <Text style={styles.orderDate}>تاریخ: {formatDate(item.DateF)}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        {item.Price !== undefined && item.Price !== null && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>مبلغ کل:</Text>
            <Text style={styles.priceValue}>{formatPrice(item.Price)} ریال</Text>
          </View>
        )}
        
        {item.PriceP !== undefined && item.PriceP !== null && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>مبلغ پرداختی:</Text>
            <Text style={styles.priceValue}>{formatPrice(item.PriceP)} ریال</Text>
          </View>
        )}
        
        {isReturn && (
          <View style={styles.returnBadge}>
            <Text style={styles.returnBadgeText}>برگشت از فروش</Text>
          </View>
        )}
      </View>
      
      <View style={styles.orderArrow}>
        <MaterialIcons name="chevron-left" size={24} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  const renderOrderList = () => {
    const data = activeTab === 'orders' ? orders : returns;
    const isReturn = activeTab === 'returns';

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name={isReturn ? "assignment-return" : "receipt"} 
            size={64} 
            color="#cbd5e1" 
          />
          <Text style={styles.emptyText}>
            {isReturn ? 'برگشتی یافت نشد' : 'سفارشی یافت نشد'}
          </Text>
        </View>
      );
    }

    return (
      <View>
        {data.map((item, index) => renderOrderItem(item, index, isReturn))}
      </View>
    );
  };

  const renderPaymentItem = (item, index) => {
    const isDebit = item.Bedahkar > 0;
    const amount = isDebit ? item.Bedahkar : item.Bestankar;
    const amountType = isDebit ? 'بدهکار' : 'بستانکار';
    
    return (
      <View key={`payment-${index}`} style={styles.paymentItem}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentDate}>
            تاریخ: {formatDate(item.SanadDate)}
          </Text>
          <View style={[
            styles.paymentType,
            isDebit ? styles.debitType : styles.creditType
          ]}>
            <Text style={{ color: 'white', fontSize: 12, fontFamily: 'IRANYekan' }}>
              {amountType}
            </Text>
          </View>
        </View>
        
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentDescription}>
            {item.Sherh || 'بدون توضیح'}
          </Text>
          <Text style={[
            styles.paymentAmount,
            isDebit ? styles.debitAmount : styles.creditAmount
          ]}>
            {formatPrice(amount)} ریال
          </Text>
        </View>
      </View>
    );
  };

  const renderBalanceSection = () => (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceTitle}>مانده حساب</Text>
      <Text style={[
        styles.balanceAmount,
        balance > 0 ? styles.positiveBalance : 
        balance < 0 ? styles.negativeBalance : styles.zeroBalance
      ]}>
        {formatPrice(Math.abs(balance))} ریال
        {balance > 0 ? ' (بدهکار)' : balance < 0 ? ' (بستانکار)' : ''}
      </Text>
    </View>
  );

  const renderPaymentsList = () => {
    if (payments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="account-balance-wallet" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>تراکنشی یافت نشد</Text>
        </View>
      );
    }

    return (
      <View>
        {renderBalanceSection()}
        {payments.map((item, index) => renderPaymentItem(item, index))}
      </View>
    );
  };

  const renderDetailsModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>جزیات کامل سفارش</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {detailsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0622a3" />
              <Text style={styles.loadingText}>در حال دریافت جزیات...</Text>
            </View>
          ) : orderDetails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>موردی یافت نشد</Text>
            </View>
          ) : (
            <ScrollView style={styles.detailsList}>
              {orderDetails.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.productName}>{item.Name || 'نامشخص'}</Text>
                    <Text style={styles.productCode}>کد: {item.Code || 'نامشخص'}</Text>
                  </View>
                  
                  {item.Quantity !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>تعداد:</Text>
                      <Text style={styles.detailValue}>{formatPrice(item.Quantity)}</Text>
                    </View>
                  )}
                  
                  {item.SlavePrice !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>قیمت واحد:</Text>
                      <Text style={styles.detailValue}>{formatPrice(item.SlavePrice)} ریال</Text>
                    </View>
                  )}
                  
                  {item.Price !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>قیمت کل:</Text>
                      <Text style={styles.detailValue}>{formatPrice(item.Price)} ریال</Text>
                    </View>
                  )}
                  
                  {item.Datef !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>تاریخ:</Text>
                      <Text style={styles.detailValue}>{formatDate(item.Datef)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderCustomerModal = () => (
    <Modal
      visible={customerModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCustomerModalVisible(false)}
    >
      <View style={styles.customerModalContainer}>
        <View style={styles.customerModalContent}>
          <View style={styles.customerModalHeader}>
            <Text style={styles.customerModalTitle}>انتخاب مشتری</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCustomerModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="جستجو بر اساس نام یا کد مشتری..."
              value={searchText}
              onChangeText={handleSearchCustomers}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {loadingCustomers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0622a3" />
              <Text style={styles.loadingText}>در حال دریافت لیست مشتری‌ها...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.code?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <View style={styles.customerItem}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{item.name || 'نامشخص'}</Text>
                    <Text style={styles.customerCode}>کد: {item.code || 'نامشخص'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => selectCustomer(item)}
                  >
                    <Text style={styles.selectButtonText}>انتخاب</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noCustomersText}>
                  {searchText ? 'مشتری با این مشخصات یافت نشد' : 'مشتری‌ای موجود نیست'}
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  const renderCustomerSelection = () => (
    <View style={styles.customerSelection}>
      <Text style={styles.selectionTitle}>برای مشاهده سفارشات، لطفاً یک مشتری انتخاب کنید:</Text>
      <TouchableOpacity
        style={styles.selectCustomerButton}
        onPress={openCustomerModal}
      >
        <Text style={styles.selectCustomerText}>
          {selectedCustomer ? selectedCustomer.name : 'انتخاب مشتری'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#0622a3" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0622a3" />
        <Text style={styles.loadingText}>در حال دریافت اطلاعات...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === 'customer' ? 'سفارشات من' : 'گزارش سفارشات'}
        </Text>
        {userRole === 'customer' && (
          <Text style={styles.welcomeText}>خوش آمدید {user?.NameF || user?.name}</Text>
        )}
      </View>

      {userRole === 'seller' && renderCustomerSelection()}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            سفارش‌ها ({orders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'returns' && styles.activeTab]}
          onPress={() => setActiveTab('returns')}
        >
          <Text style={[styles.tabText, activeTab === 'returns' && styles.activeTabText]}>
            برگشتی‌ها ({returns.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.activeBalanceTab]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeBalanceTabText]}>
            پرداخت‌ها ({payments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0622a3']}
            tintColor="#0622a3"
          />
        }
      >
        {activeTab === 'orders' && renderOrderList()}
        {activeTab === 'returns' && renderOrderList()}
        {activeTab === 'payments' && renderPaymentsList()}
      </ScrollView>

      {renderDetailsModal()}
      {renderCustomerModal()}
    </SafeAreaView>
  );
};

export default OrderReportScreen;