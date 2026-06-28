// screens/PendingFactorPishScreen.js
// صفحه لیست پیش‌فاکتورهای فاکتور نشده (طراحی هماهنگ با تم آبی سورمه‌ای + طلایی)

import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPendingFactorPish } from '../api/factorPishApi';

const COLORS = {
  primary: "#1a3a6b",        // آبی سورمه‌ای اصلی
  primaryDark: "#0f2447",    // آبی سورمه‌ای تیره
  primaryMid: "#234e8c",     // آبی سورمه‌ای میانه
  primaryLight: "#3d6fbd",   // آبی روشن‌تر
  primaryGhost: "#e8edf6",   // پس‌زمینه آبی بسیار کم‌رنگ
  primarySoft: "#c9d7ee",    // آبی نرم برای border
  accent: "#0ea5c7",         // فیروزه‌ای برای تاکید
  accentBg: "#e0f5fb",
  danger: "#c0392b",
  dangerBg: "#fdecea",
  white: "#ffffff",
  offWhite: "#f7f9fc",
  background: "#eef2f8",
  cardBg: "#ffffff",
  text: "#0b1f3d",
  textSecondary: "#3d5a80",
  textMuted: "#7e9ab5",
  border: "#d4dff0",
  divider: "#e8eef6",
  inputBg: "#f4f7fc",
  gold: "#c9a84c",
  goldBg: "#faf6e9",
};

const defaultFont = { fontFamily: 'IRANYekan' };

const formatNumber = (num) => {
  if (num == null) return '—';
  return Number(num).toLocaleString('fa-IR');
};

export default function PendingFactorPishScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const searchTimer = useRef(null);
  const PAGE_SIZE = 20;

  // جلوگیری از اجرای همزمان چند درخواست (مثلاً وقتی onEndReached و جستجو هم‌زمان فایر می‌شوند)
  const isFetchingRef = useRef(false);
  // جلوگیری از نمایش چندباره‌ی Alert خطا تا زمانی که کاربر آن را ببندد
  const errorAlertShownRef = useRef(false);

  const loadData = useCallback(async (searchText = search, currentPage = 1, append = false) => {
    // اگر یک درخواست دیگر در حال اجراست، از این یکی صرف‌نظر کن
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await getPendingFactorPish(currentPage, PAGE_SIZE, searchText);

      setItems(prev => append ? [...prev, ...result.items] : result.items);
      setHasMore(result.items.length === PAGE_SIZE);
      setPage(currentPage);

      // اگر درخواست موفق شد، اجازه بده دفعه‌ی بعد دوباره در صورت خطا، Alert نشان داده شود
      errorAlertShownRef.current = false;
    } catch (err) {
      // فقط یک‌بار Alert نشان بده، نه به ازای هر تلاش ناموفق
      if (!errorAlertShownRef.current) {
        errorAlertShownRef.current = true;
        Alert.alert('خطا', err.message, [
          {
            text: 'باشه',
            onPress: () => {
              errorAlertShownRef.current = false;
            },
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadData(text, 1, false);
    }, 500);
  };

  const handleRefresh = () => {
    if (isFetchingRef.current) return;
    setRefreshing(true);
    loadData(search, 1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !isFetchingRef.current) {
      loadData(search, page + 1, true);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('FactorPishDetail', { number: item.Number })
      }
      activeOpacity={0.8}
    >
      {/* نوار رنگی کناری */}
      <View style={styles.cardSideBar} />

      <View style={styles.cardBody}>
        {/* ردیف اول: شماره + تاریخ */}
        <View style={styles.cardRow}>
          <View style={styles.badgeContainer}>
            <MaterialIcons name="receipt-long" size={11} color={COLORS.primary} />
            <Text style={[styles.badgeText, defaultFont]}>#{item.Number}</Text>
          </View>
          <View style={styles.dateChip}>
            <MaterialIcons name="event" size={11} color={COLORS.textMuted} />
            <Text style={[styles.dateText, defaultFont]}>{item.DateF}</Text>
          </View>
        </View>

        {/* لیبل نام مشتری + نام مشتری */}
        <View style={styles.buyerContainer}>
          <Text style={[styles.buyerLabel, defaultFont]}>نام مشتری:</Text>
          <Text style={[styles.buyerName, defaultFont]} numberOfLines={1}>
            {item.BuyerName || '—'}
          </Text>
        </View>

        {/* خط جداکننده */}
        <View style={styles.cardDivider} />

        {/* ردیف دوم: کد مشتری + شهر */}
        <View style={styles.cardRow}>
          <Text style={[styles.metaText, defaultFont]}>
            کد: {item.BuyerCode || '—'}
          </Text>
          {item.City && (
            <View style={styles.cityRow}>
              <MaterialIcons name="location-on" size={12} color={COLORS.textMuted} />
              <Text style={[styles.metaText, defaultFont]}>{item.City}</Text>
            </View>
          )}
        </View>

        {/* ردیف سوم: فروشنده + مبلغ */}
        <View style={styles.cardRow}>
          {item.MoenName ? (
            <Text style={[styles.sellerText, defaultFont]}>
              فروشنده: <Text style={styles.sellerName}>{item.MoenName}</Text>
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, defaultFont]}>
              {formatNumber(item.Price)}
            </Text>
            <Text style={[styles.priceUnit, defaultFont]}></Text>
          </View>
        </View>
      </View>

      {/* فلش */}
      <View style={styles.arrowBox}>
        <MaterialIcons name="chevron-left" size={18} color={COLORS.primaryLight} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="inbox" size={32} color={COLORS.primaryLight} />
        </View>
        <Text style={[styles.emptyTitle, defaultFont]}>
          {search ? 'نتیجه‌ای یافت نشد' : 'پیش‌فاکتوری وجود ندارد'}
        </Text>
        <Text style={[styles.emptySubtitle, defaultFont]}>
          {search ? 'عبارت دیگری را جستجو کنید' : 'پیش‌فاکتور فاکتور نشده‌ای ثبت نشده است'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ─── هدر کوچک ─── */}
      <View style={styles.header}>
        <View style={styles.headerBottomAccent} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconRow}>
            <MaterialIcons name="description" size={13} color={COLORS.gold} />
            <Text style={[styles.headerTitle, defaultFont]}>پیش‌فاکتورهای فاکتور نشده</Text>
          </View>
        </View>

        <View style={styles.headerCountPill}>
          <Text style={[styles.headerCountText, defaultFont]}>{items.length}</Text>
        </View>
      </View>

      {/* جستجو */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={[styles.searchInput, defaultFont]}
          placeholder="جستجو بر اساس نام یا کد مشتری..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
          textAlign="right"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
            <MaterialIcons name="cancel" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* لیست */}
      {loading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, defaultFont]}>در حال بارگذاری...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.Number)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Header (کوچک) ───
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  headerBottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: COLORS.gold,
    opacity: 0.7,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'IRANYekan-Bold',
    letterSpacing: 0.2,
  },
  headerCountPill: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCountText: {
    color: COLORS.gold,
    fontSize: 11,
    fontFamily: 'IRANYekan-Bold',
  },

  // ─── جستجو ───
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.inputBg,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // ─── کارت ───
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardSideBar: {
    width: 5,
    backgroundColor: COLORS.primary,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    padding: 13,
    gap: 7,
  },

  cardRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryGhost,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  badgeText: {
    color: COLORS.primary,
    fontFamily: 'IRANYekan-Bold',
    fontSize: 12.5,
  },
  dateChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  buyerContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  buyerLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buyerName: {
    fontSize: 15,
    fontFamily: 'IRANYekan-Bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },

  cardDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },

  sellerText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  sellerName: {
    color: COLORS.text,
    fontFamily: 'IRANYekan-Bold',
  },
  priceContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: COLORS.goldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  priceText: {
    color: COLORS.primaryDark,
    fontFamily: 'IRANYekan-Bold',
    fontSize: 14,
  },
  priceUnit: {
    color: COLORS.gold,
    fontSize: 10,
  },

  arrowBox: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGhost,
  },

  // ─── خالی و لودینگ ───
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryGhost,
    borderWidth: 1.5,
    borderColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'IRANYekan-Bold',
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});