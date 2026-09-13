// screens/ReportScreen.js
// صفحه گزارش فاکتور فروشنده (طراحی هماهنگ با تم آبی سورمه‌ای + طلایی)
// شامل فروش و برگشت از فروش + مبلغ خالص

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-jalaali';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFactorReport } from '../api';

const COLORS = {
  primary: '#1a3a6b',
  primaryDark: '#0f2447',
  primaryMid: '#234e8c',
  primaryLight: '#3d6fbd',
  primaryGhost: '#e8edf6',
  primarySoft: '#c9d7ee',
  accent: '#0ea5c7',
  accentBg: '#e0f5fb',
  danger: '#c0392b',
  dangerBg: '#fdecea',
  white: '#ffffff',
  offWhite: '#f7f9fc',
  background: '#eef2f8',
  cardBg: '#ffffff',
  text: '#0b1f3d',
  textSecondary: '#3d5a80',
  textMuted: '#7e9ab5',
  border: '#d4dff0',
  divider: '#e8eef6',
  inputBg: '#f4f7fc',
  gold: '#c9a84c',
  goldBg: '#faf6e9',
};

const defaultFont = { fontFamily: 'IRANYekan' };

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const formatNumber = (num) => {
  if (num == null) return '—';
  return Number(num).toLocaleString('fa-IR');
};

const pad2 = (n) => n.toString().padStart(2, '0');

// year, month(1-12), day → 'YYYY/MM/DD'
const formatJalaali = (d) => `${d.year}/${pad2(d.month)}/${pad2(d.day)}`;

const getCurrentJalaali = () => {
  const m = moment();
  return { year: m.jYear(), month: m.jMonth() + 1, day: m.jDate() };
};

const monthLength = (year, month) => moment.jDaysInMonth(year, month - 1);

const startOfMonth = (year, month) => ({ year, month, day: 1 });
const endOfMonth = (year, month) => ({ year, month, day: monthLength(year, month) });

// ───────────────────────── Calendar Modal (انتخاب تاریخ شمسی) ─────────────────────────
function JalaaliCalendarModal({ visible, initialDate, title, onClose, onSelect }) {
  const today = getCurrentJalaali();
  const [viewYear, setViewYear] = useState(initialDate?.year || today.year);
  const [viewMonth, setViewMonth] = useState(initialDate?.month || today.month);

  useEffect(() => {
    if (visible) {
      setViewYear(initialDate?.year || today.year);
      setViewMonth(initialDate?.month || today.month);
    }
  }, [visible]);

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const days = Array.from({ length: monthLength(viewYear, viewMonth) }, (_, i) => i + 1);
  const isSelected = (d) =>
    initialDate && initialDate.year === viewYear && initialDate.month === viewMonth && initialDate.day === d;
  const isToday = (d) =>
    today.year === viewYear && today.month === viewMonth && today.day === d;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={[styles.calendarTitle, defaultFont]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.calendarCloseBtn}>
              <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarNav}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.calendarNavBtn}>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={[styles.calendarNavText, defaultFont]}>
              {persianMonths[viewMonth - 1]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.calendarNavBtn}>
              <MaterialIcons name="chevron-left" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {days.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.calendarDayCell,
                  isSelected(d) && styles.calendarDayCellSelected,
                  !isSelected(d) && isToday(d) && styles.calendarDayCellToday,
                ]}
                onPress={() => onSelect({ year: viewYear, month: viewMonth, day: d })}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    defaultFont,
                    isSelected(d) && styles.calendarDayTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ───────────────────────── صفحه اصلی ─────────────────────────
const FILTER_MODES = {
  THIS_MONTH: 'thisMonth',
  SELECT_MONTH: 'selectMonth',
  RANGE: 'range',
  OVERALL: 'overall',
};

const ReportScreen = ({ navigation }) => {
  const today = getCurrentJalaali();

  const [filterMode, setFilterMode] = useState(FILTER_MODES.THIS_MONTH);

  const [selectedMonth, setSelectedMonth] = useState(today.month);
  const [selectedYear, setSelectedYear] = useState(today.year);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [calendarTarget, setCalendarTarget] = useState(null); // 'start' | 'end' | null

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [userName, setUserName] = useState('کاربر');
  const [moen, setMoen] = useState('');

  // 🔥 خلاصه‌ی فروش/برگشت/خالص (جایگزین totalCount/totalAmount قبلی)
  const [summary, setSummary] = useState({
    salesCount: 0,
    salesAmount: 0,
    returnsCount: 0,
    returnsAmount: 0,
    netAmount: 0,
  });

  const [dateRangeLabel, setDateRangeLabel] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');

        if (userData) {
          const parsed = JSON.parse(userData);

          const displayName = parsed.NameF || parsed.name || 'کاربر';
          setUserName(displayName);

          const code = parsed.NOF || parsed.userId || parsed.id || '';

          if (code) {
            setMoen(code.toString());
          } else {
            Alert.alert('هشدار', 'کد فروشنده شما یافت نشد. لطفاً دوباره وارد شوید.');
          }
        } else {
          Alert.alert('خطا', 'لطفاً دوباره وارد شوید');
        }
      } catch (err) {
        Alert.alert('خطا', 'مشکلی در بارگذاری اطلاعات پیش آمد');
      }
    };
    loadUser();
  }, []);

  // 🔥 محاسبه‌ی خلاصه: تفکیک فروش (Type !== 'return') و برگشت (Type === 'return')
  useEffect(() => {
    if (reportData && reportData.length > 0) {
      const sales = reportData.filter((item) => item.Type !== 'return');
      const returns = reportData.filter((item) => item.Type === 'return');

      const salesAmount = sales.reduce((sum, item) => sum + (parseFloat(item.Price) || 0), 0);
      const returnsAmount = returns.reduce((sum, item) => sum + (parseFloat(item.Price) || 0), 0);

      setSummary({
        salesCount: sales.length,
        salesAmount,
        returnsCount: returns.length,
        returnsAmount,
        netAmount: salesAmount - returnsAmount,
      });
    } else {
      setSummary({ salesCount: 0, salesAmount: 0, returnsCount: 0, returnsAmount: 0, netAmount: 0 });
    }
  }, [reportData]);

  const fetchReport = async (params, { silent } = {}) => {
    if (!moen) return;

    console.log('📤 sending report request:', { moen, ...params, filterMode });

    try {
      if (!silent) setLoading(true);
      const data = await getFactorReport({ moen, ...params });
      console.log('📥 received response:', JSON.stringify(data));
      setReportData(data.data || []);
      setDateRangeLabel(data.dateRange || null);
      setHasLoadedOnce(true);
    } catch (err) {
      Alert.alert('خطا', err.message || 'خطا در دریافت گزارش');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // بارگذاری خودکار برای «این ماه»، «انتخاب ماه»، «کلی»
  useEffect(() => {
    if (!moen) return;

    if (filterMode === FILTER_MODES.THIS_MONTH) {
      const s = startOfMonth(today.year, today.month);
      const e = endOfMonth(today.year, today.month);
      fetchReport({ startDate: formatJalaali(s), endDate: formatJalaali(e) });
    } else if (filterMode === FILTER_MODES.SELECT_MONTH) {
      const s = startOfMonth(selectedYear, selectedMonth);
      const e = endOfMonth(selectedYear, selectedMonth);
      fetchReport({ startDate: formatJalaali(s), endDate: formatJalaali(e) });
    } else if (filterMode === FILTER_MODES.OVERALL) {
      fetchReport({ reportType: 'overall' });
    }
    // برای RANGE منتظر دکمه «اعمال» می‌مانیم
  }, [filterMode, selectedMonth, selectedYear, moen]);

  const onRefresh = () => {
    setRefreshing(true);
    if (filterMode === FILTER_MODES.THIS_MONTH) {
      const s = startOfMonth(today.year, today.month);
      const e = endOfMonth(today.year, today.month);
      fetchReport({ startDate: formatJalaali(s), endDate: formatJalaali(e) }, { silent: true });
    } else if (filterMode === FILTER_MODES.SELECT_MONTH) {
      const s = startOfMonth(selectedYear, selectedMonth);
      const e = endOfMonth(selectedYear, selectedMonth);
      fetchReport({ startDate: formatJalaali(s), endDate: formatJalaali(e) }, { silent: true });
    } else if (filterMode === FILTER_MODES.OVERALL) {
      fetchReport({ reportType: 'overall' }, { silent: true });
    } else if (filterMode === FILTER_MODES.RANGE && rangeStart && rangeEnd) {
      fetchReport({ startDate: formatJalaali(rangeStart), endDate: formatJalaali(rangeEnd) }, { silent: true });
    } else {
      setRefreshing(false);
    }
  };

  const applyRange = () => {
    if (!rangeStart || !rangeEnd) {
      Alert.alert('توجه', 'لطفاً تاریخ شروع و پایان را انتخاب کنید');
      return;
    }
    const startVal = rangeStart.year * 10000 + rangeStart.month * 100 + rangeStart.day;
    const endVal = rangeEnd.year * 10000 + rangeEnd.month * 100 + rangeEnd.day;
    if (startVal > endVal) {
      Alert.alert('توجه', 'تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد');
      return;
    }
    fetchReport({ startDate: formatJalaali(rangeStart), endDate: formatJalaali(rangeEnd) });
  };

  const filterTabs = [
    { key: FILTER_MODES.THIS_MONTH, label: 'این ماه', icon: 'today' },
    { key: FILTER_MODES.SELECT_MONTH, label: 'انتخاب ماه', icon: 'event' },
    { key: FILTER_MODES.RANGE, label: 'بازه تاریخی', icon: 'date-range' },
    { key: FILTER_MODES.OVERALL, label: 'کلی', icon: 'all-inclusive' },
  ];

  // 🔥 نمایش هر ردیف با تفکیک فروش/برگشت
  const renderItem = ({ item }) => {
    const isReturn = item.Type === 'return';

    return (
      <View style={styles.card}>
        <View style={[styles.cardSideBar, isReturn && styles.cardSideBarReturn]} />
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <View style={[styles.badgeContainer, isReturn && styles.badgeContainerReturn]}>
              <MaterialIcons
                name={isReturn ? 'keyboard-return' : 'receipt-long'}
                size={11}
                color={isReturn ? COLORS.danger : COLORS.primary}
              />
              <Text style={[styles.badgeText, defaultFont, isReturn && styles.badgeTextReturn]}>
                {isReturn ? 'برگشت' : 'فروش'} #{item.Number}
              </Text>
            </View>
            <View style={styles.dateChip}>
              <MaterialIcons name="event" size={11} color={COLORS.textMuted} />
              <Text style={[styles.dateText, defaultFont]}>{item.DateF}</Text>
            </View>
          </View>

          <View style={styles.buyerContainer}>
            <Text style={[styles.buyerLabel, defaultFont]}>نام مشتری:</Text>
            <Text style={[styles.buyerName, defaultFont]} numberOfLines={1}>
              {item.BuyerName || '—'}
            </Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardRow}>
            <Text style={[styles.metaText, defaultFont]}>کد مشتری: {item.BuyerCode || '—'}</Text>

            <View style={[styles.priceContainer, isReturn && styles.priceContainerReturn]}>
              <Text style={[styles.priceText, defaultFont, isReturn && styles.priceTextReturn]}>
                {isReturn ? '-' : ''}{formatNumber(item.Price)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="inbox" size={32} color={COLORS.primaryLight} />
        </View>
        <Text style={[styles.emptyTitle, defaultFont]}>گزارشی برای این بازه وجود ندارد</Text>
        <Text style={[styles.emptySubtitle, defaultFont]}>بازه یا ماه دیگری را امتحان کنید</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ─── هدر ─── */}
      <View style={styles.header}>
        <View style={styles.headerBottomAccent} />

        {navigation && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}

        <View style={styles.headerCenter}>
          <View style={styles.headerIconRow}>
            <MaterialIcons name="receipt-long" size={13} color={COLORS.gold} />
            <Text style={[styles.headerTitle, defaultFont]}>گزارش فاکتور {userName}</Text>
          </View>
        </View>

        <View style={styles.headerCountPill}>
          <Text style={[styles.headerCountText, defaultFont]}>{reportData.length}</Text>
        </View>
      </View>

      {/* ─── تب‌های فیلتر ─── */}
      <View style={styles.filterTabsContainer}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filterMode === tab.key && styles.filterTabActive]}
            onPress={() => setFilterMode(tab.key)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={tab.icon}
              size={14}
              color={filterMode === tab.key ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.filterTabText,
                defaultFont,
                filterMode === tab.key && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── کنترل‌های مخصوص هر حالت ─── */}
      {filterMode === FILTER_MODES.SELECT_MONTH && (
        <View>
          <View style={styles.yearSelectorRow}>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)} style={styles.yearArrowBtn}>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={[styles.yearSelectorText, defaultFont]}>{selectedYear}</Text>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)} style={styles.yearArrowBtn}>
              <MaterialIcons name="chevron-left" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthsContainer}
            contentContainerStyle={styles.monthsContent}
          >
            {persianMonths.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.monthChip, selectedMonth === index + 1 && styles.monthChipActive]}
                onPress={() => setSelectedMonth(index + 1)}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    defaultFont,
                    selectedMonth === index + 1 && styles.monthChipTextActive,
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {filterMode === FILTER_MODES.RANGE && (
        <View style={styles.rangeRow}>
          <TouchableOpacity style={styles.rangeDateBtn} onPress={() => setCalendarTarget('start')} activeOpacity={0.8}>
            <MaterialIcons name="event" size={16} color={COLORS.primary} />
            <Text style={[styles.rangeDateText, defaultFont]}>
              {rangeStart ? formatJalaali(rangeStart) : 'از تاریخ'}
            </Text>
          </TouchableOpacity>

          <MaterialIcons name="arrow-back" size={16} color={COLORS.textMuted} />

          <TouchableOpacity style={styles.rangeDateBtn} onPress={() => setCalendarTarget('end')} activeOpacity={0.8}>
            <MaterialIcons name="event" size={16} color={COLORS.primary} />
            <Text style={[styles.rangeDateText, defaultFont]}>
              {rangeEnd ? formatJalaali(rangeEnd) : 'تا تاریخ'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rangeApplyBtn} onPress={applyRange} activeOpacity={0.8}>
            <MaterialIcons name="check" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      <JalaaliCalendarModal
        visible={calendarTarget !== null}
        initialDate={calendarTarget === 'start' ? rangeStart : rangeEnd}
        title={calendarTarget === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان'}
        onClose={() => setCalendarTarget(null)}
        onSelect={(d) => {
          if (calendarTarget === 'start') setRangeStart(d);
          else setRangeEnd(d);
          setCalendarTarget(null);
        }}
      />

      {dateRangeLabel && (dateRangeLabel.startDate || dateRangeLabel.reportType === 'overall') && (
        <View style={styles.periodBanner}>
          <MaterialIcons name="info-outline" size={14} color={COLORS.primaryMid} />
          <Text style={[styles.periodBannerText, defaultFont]}>
            {dateRangeLabel.reportType === 'overall'
              ? 'گزارش کل تاریخچه'
              : `از ${dateRangeLabel.startDate} تا ${dateRangeLabel.endDate}`}
          </Text>
        </View>
      )}

      {/* ─── لیست ─── */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, defaultFont]}>در حال بارگذاری...</Text>
        </View>
      ) : (
        <FlatList
          data={reportData}
          keyExtractor={(item, index) => `${item.Type || 'sale'}-${item.Number}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={hasLoadedOnce ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* ─── خلاصه: فروش / برگشت / خالص ─── */}
      {reportData.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="receipt" size={16} color={COLORS.gold} />
              <Text style={[styles.summaryLabel, defaultFont]}>فروش</Text>
              <Text style={[styles.summaryValue, defaultFont]}>{formatNumber(summary.salesAmount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="keyboard-return" size={16} color={COLORS.danger} />
              <Text style={[styles.summaryLabel, defaultFont]}>برگشت</Text>
              <Text style={[styles.summaryValue, defaultFont, styles.summaryValueReturn]}>
                {formatNumber(summary.returnsAmount)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="payments" size={16} color={COLORS.gold} />
              <Text style={[styles.summaryLabel, defaultFont]}>مبلغ خالص</Text>
              <Text style={[styles.summaryValue, defaultFont]}>{formatNumber(summary.netAmount)}</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  // ─── هدر ───
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
  headerCenter: { flex: 1, alignItems: 'center' },
  headerIconRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  headerTitle: { color: COLORS.white, fontSize: 14, fontFamily: 'IRANYekan-Bold', letterSpacing: 0.2 },
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
  headerCountText: { color: COLORS.gold, fontSize: 11, fontFamily: 'IRANYekan-Bold' },

  // ─── تب‌های فیلتر ───
  filterTabsContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 11, color: COLORS.primary, fontFamily: 'IRANYekan' },
  filterTabTextActive: { color: COLORS.white, fontFamily: 'IRANYekan-Bold' },

  // ─── انتخاب ماه ───
  yearSelectorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  yearArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryGhost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearSelectorText: { fontSize: 16, fontFamily: 'IRANYekan-Bold', color: COLORS.text, minWidth: 50, textAlign: 'center' },
  monthsContainer: { paddingVertical: 4 },
  monthsContent: { paddingHorizontal: 12, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  monthChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthChipText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: 'IRANYekan' },
  monthChipTextActive: { color: COLORS.white, fontFamily: 'IRANYekan-Bold' },

  // ─── بازه تاریخی ───
  rangeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  rangeDateBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rangeDateText: { fontSize: 12, color: COLORS.text, fontFamily: 'IRANYekan' },
  rangeApplyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── مودال تقویم ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,31,61,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, width: '100%', maxWidth: 360 },
  calendarHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarTitle: { fontSize: 14, fontFamily: 'IRANYekan-Bold', color: COLORS.text },
  calendarCloseBtn: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.offWhite,
    justifyContent: 'center', alignItems: 'center',
  },
  calendarNav: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  calendarNavBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.primaryGhost, justifyContent: 'center', alignItems: 'center' },
  calendarNavText: { fontSize: 15, fontFamily: 'IRANYekan-Bold', color: COLORS.text, minWidth: 110, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 },
  calendarDayCell: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.offWhite },
  calendarDayCellSelected: { backgroundColor: COLORS.primary },
  calendarDayCellToday: { borderWidth: 1.5, borderColor: COLORS.gold },
  calendarDayText: { fontSize: 13, color: COLORS.text, fontFamily: 'IRANYekan' },
  calendarDayTextSelected: { color: COLORS.white, fontFamily: 'IRANYekan-Bold' },

  // ─── بنر بازه فعال ───
  periodBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentBg,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  periodBannerText: { fontSize: 11.5, color: COLORS.primaryMid, fontFamily: 'IRANYekan' },

  // ─── لیست ───
  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12, flexGrow: 1 },

  // ─── کارت فاکتور ───
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
  cardSideBar: { width: 5, backgroundColor: COLORS.primary },
  cardSideBarReturn: { backgroundColor: COLORS.danger },
  cardBody: { flex: 1, minWidth: 0, padding: 13, gap: 7 },
  cardRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  badgeContainer: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryGhost, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.primarySoft,
  },
  badgeContainerReturn: { backgroundColor: COLORS.dangerBg, borderColor: 'rgba(192,57,43,0.25)' },
  badgeText: { color: COLORS.primary, fontFamily: 'IRANYekan-Bold', fontSize: 12.5 },
  badgeTextReturn: { color: COLORS.danger },
  dateChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  dateText: { color: COLORS.textMuted, fontSize: 12 },
  buyerContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  buyerLabel: { fontSize: 12, color: COLORS.textMuted },
  buyerName: { fontSize: 15, fontFamily: 'IRANYekan-Bold', color: COLORS.text, flex: 1, textAlign: 'right' },
  cardDivider: { height: 1, backgroundColor: COLORS.divider },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  priceContainer: {
    flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4,
    backgroundColor: COLORS.goldBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
  },
  priceContainerReturn: { backgroundColor: COLORS.dangerBg, borderColor: 'rgba(192,57,43,0.25)' },
  priceText: { color: COLORS.primaryDark, fontFamily: 'IRANYekan-Bold', fontSize: 14 },
  priceTextReturn: { color: COLORS.danger },

  // ─── خالی و لودینگ ───
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: COLORS.textMuted, fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGhost,
    borderWidth: 1.5, borderColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  emptyTitle: { fontSize: 15, color: COLORS.text, fontFamily: 'IRANYekan-Bold' },
  emptySubtitle: { fontSize: 12, color: COLORS.textMuted },

  // ─── خلاصه ───
  summaryCard: {
    backgroundColor: COLORS.primaryDark,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  summaryRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.15)' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  summaryValue: { color: COLORS.white, fontSize: 15, fontFamily: 'IRANYekan-Bold' },
  summaryValueReturn: { color: '#ff8a80' },
});

export default ReportScreen;