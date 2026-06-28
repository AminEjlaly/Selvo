import { FontAwesome } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getInvoiceItems } from '../api';
import styles from '../styles/InvoiceItemsScreen.styles';

// رنگ‌های یکسان با صفحه روز مسیر
const COLORS = {
  primary: "#1a3a6b",
  primaryDark: "#0f2447",
  primaryMid: "#234e8c",
  primaryLight: "#3d6fbd",
  primaryGhost: "#e8edf6",
  accent: "#0ea5c7",
  gold: "#c9a84c",
  white: "#ffffff",
  background: "#eef2f8",
  cardBg: "#ffffff",
  text: "#0b1f3d",
  textSecondary: "#3d5a80",
  textMuted: "#7e9ab5",
  border: "#d4dff0",
  divider: "#e8eef6",
  danger: "#c0392b",
};

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
      const response = await getInvoiceItems(invoiceNumber);

      if (response.success) {
        setInvoiceData(response.data);
        setItems(response.data.items || []);
      } else {
        Alert.alert('خطا', response.message || 'خطا در دریافت اقلام فاکتور');
      }
    } catch (error) {
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

  const formatQuantityWithUnits = (item) => {
    const { MasterQuantity, SlaveQuantity, TotalQuantity, MainUnitName, SlaveUnitName } = item;
    let parts = [];
    if (MasterQuantity > 0) parts.push(`${MasterQuantity} ${MainUnitName || 'مبنا'}`);
    if (SlaveQuantity > 0) parts.push(`${SlaveQuantity} ${SlaveUnitName || 'جز'}`);
    return parts.length ? `${parts.join(' + ')}` : `${TotalQuantity} عدد`;
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      {/* شماره ردیف */}
      <View style={styles.rowIndexBox}>
        <Text style={styles.rowIndexText}>{index + 1}</Text>
      </View>

      <View style={styles.cardVerticalLine} />

      <View style={styles.itemContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.ProductName || 'نامشخص'}
        </Text>

        <Text style={styles.productCode}>کد کالا: {item.ProductCode}</Text>

        {/* مقدار */}
        <View style={styles.quantityRow}>
          <FontAwesome name="cubes" size={14} color={COLORS.accent} />
          <Text style={styles.quantityText}>
            {formatQuantityWithUnits(item)}
          </Text>
        </View>

        {/* قیمت */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>قیمت واحد</Text>
            <Text style={styles.unitPrice}>{formatPrice(item.UnitPrice)} </Text>
          </View>
          <View style={styles.totalPriceContainer}>
            <Text style={styles.priceLabel}>جمع</Text>
            <Text style={styles.totalPrice}>{formatPrice(item.TotalPrice)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>در حال بارگذاری اقلام فاکتور...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom','top', 'left', 'right']}>
      {/* هدر مشابه صفحه روز مسیر */}
      <View style={styles.header}>
        <View style={styles.headerBottomAccent} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-right" size={18} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>فاکتور {invoiceNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {buyerName ? `خریدار: ${buyerName}` : ''}
            {exitCode ? `   |   خروجی: ${exitCode}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshHeaderBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <FontAwesome name="refresh" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* کارت خلاصه فاکتور */}
        {invoiceData?.summary && (
          <View style={styles.summaryCard}>
            <View style={styles.cardSideBar} />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIconBox}>
                  <FontAwesome name="file-text-o" size={16} color={COLORS.white} />
                </View>
                <Text style={styles.cardTitle}>خلاصه فاکتور</Text>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{invoiceData.summary.totalItems}</Text>
                  <Text style={styles.summaryLabel}>قلم کالا</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{invoiceData.summary.totalQuantity}</Text>
                  <Text style={styles.summaryLabel}>تعداد کل</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.gold }]}>
                    {formatPrice(invoiceData.summary.totalAmount)}
                  </Text>
                  <Text style={styles.summaryLabel}></Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* لیست اقلام */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <View style={styles.sectionBadgeWrap}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{items.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>اقلام فاکتور</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <FontAwesome name="file-text-o" size={50} color={COLORS.primaryLight} />
            <Text style={styles.emptyTitle}>هیچ کالایی یافت نشد</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={`item-${item.ProductCode}-${index}`}>
              {renderItem({ item, index })}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}