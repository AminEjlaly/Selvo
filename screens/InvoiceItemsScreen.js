import { FontAwesome } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { getInvoiceItems } from '../api';
import styles from '../styles/InvoiceItemsScreen.styles';

export default function InvoiceItemsScreen({ route, navigation }) {
  const { invoiceNumber, buyerName, exitCode } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadInvoiceItems();
  }, [invoiceNumber]);

  const loadInvoiceItems = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 در حال بارگذاری اقلام فاکتور:', invoiceNumber);
      
      const response = await getInvoiceItems(invoiceNumber);
      
      if (response.success) {
        setInvoiceData(response.data);
        setItems(response.data.items || []);
      } else {
        Alert.alert('خطا', response.message || 'خطا در دریافت اطلاعات اقلام فاکتور');
      }
    } catch (error) {
      console.error('💥 خطا در بارگذاری اقلام فاکتور:', error);
      Alert.alert('خطا', error.message || 'ارتباط با سرور برقرار نشد');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvoiceItems();
  }, [invoiceNumber]);

  const formatPrice = (price) => {
    if (!price) return '0';
    const priceInToman = Math.round(price / 10);
    return priceInToman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 🔥 تابع جدید برای نمایش واحدها
  const formatQuantityWithUnits = (item) => {
    const { MasterQuantity, SlaveQuantity, TotalQuantity, MainUnitName, SlaveUnitName } = item;
    
    let parts = [];
    
    if (MasterQuantity > 0) {
      parts.push(`${MasterQuantity} ${MainUnitName || 'مبنا'}`);
    }
    
    if (SlaveQuantity > 0) {
      parts.push(`${SlaveQuantity} ${SlaveUnitName || 'جز'}`);
    }
    
    if (parts.length === 0) {
      return `${TotalQuantity} عدد`;
    }
    
    return `${parts.join(' + ')} (${TotalQuantity} کل)`;
  };

  // رندر هر آیتم کالا - طراحی بهینه‌تر
  const renderItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIndexContainer}>
          <Text style={styles.itemIndex}>{index + 1}</Text>
        </View>
        <View style={styles.productCodeContainer}>
          <Text style={styles.productCode}>کد: {item.ProductCode}</Text>
        </View>
      </View>
      
      <Text style={styles.productName} numberOfLines={2}>
        {item.ProductName || 'نامشخص'}
      </Text>
      
      {/* 🔥 بخش مقدار با واحدهای واقعی */}
      <View style={styles.quantitySection}>
        <Text style={styles.sectionTitle}>مقدار</Text>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>
            {formatQuantityWithUnits(item)}
          </Text>
          
        
        </View>
      </View>

      {/* بخش قیمت‌ها */}
      <View style={styles.priceSection}>
        <Text style={styles.sectionTitle}>مبلغ</Text>
        <View style={styles.priceRows}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>قیمت واحد:</Text>
            <Text style={styles.unitPrice}>{formatPrice(item.UnitPrice)} </Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>جمع آیتم:</Text>
            <Text style={styles.totalPrice}>{formatPrice(item.TotalPrice)} </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // صفحه loading
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>در حال بارگذاری اقلام فاکتور...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* هدر صفحه */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-right" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>جزئیات فاکتور</Text>
          <View style={styles.headerDetails}>
            <Text style={styles.invoiceNumber}>شماره: {invoiceNumber}</Text>
            {buyerName && (
              <Text style={styles.buyerName}>خریدار: {buyerName}</Text>
            )}
            {exitCode && (
              <Text style={styles.exitCode}>خروجی: {exitCode}</Text>
            )}
          </View>
        </View>
      </View>

      {/* خلاصه اطلاعات - بهینه‌تر */}
      {invoiceData?.summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>خلاصه فاکتور</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <FontAwesome name="list" size={16} color="#64748b" />
              <Text style={styles.summaryValue}>{invoiceData.summary.totalItems}</Text>
              <Text style={styles.summaryLabel}>قلم کالا</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <FontAwesome name="cubes" size={16} color="#64748b" />
              <Text style={styles.summaryValue}>{invoiceData.summary.totalQuantity}</Text>
              <Text style={styles.summaryLabel}>تعداد کل</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <FontAwesome name="money" size={16} color="#64748b" />
              <Text style={styles.summaryAmount}>
                {formatPrice(invoiceData.summary.totalAmount)}
              </Text>
              <Text style={styles.summaryLabel}></Text>
            </View>
          </View>
          
          {/* 🔥 اطلاعات واحدها */}
          {(invoiceData.summary.totalMaster > 0 || invoiceData.summary.totalSlave > 0) && (
            <View style={styles.unitsSummary}>
              {invoiceData.summary.totalMaster > 0 && (
                <Text style={styles.unitSummaryText}>
                  مبنا: {invoiceData.summary.totalMaster}
                </Text>
              )}
              {invoiceData.summary.totalSlave > 0 && (
                <Text style={styles.unitSummaryText}>
                  جز: {invoiceData.summary.totalSlave}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* لیست اقلام */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `item-${item.ProductCode}-${index}`}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="file-text-o" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>هیچ کالایی در این فاکتور یافت نشد</Text>
          </View>
        }
      />
    </View>
  );
}