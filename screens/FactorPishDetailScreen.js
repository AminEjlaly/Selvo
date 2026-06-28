// screens/FactorPishDetailScreen.js
// صفحه جزئیات پیش‌فاکتور + تبدیل به فاکتور با امکان تخفیف سطری
// (طراحی هماهنگ با تم آبی سورمه‌ای + طلایی)

import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convertFactorPishToFactor, getFactorPishDetail } from '../api/factorPishApi'; // مسیر را اصلاح کنید

const COLORS = {
  primary: "#1a3a6b",        // آبی سورمه‌ای اصلی
  primaryDark: "#0f2447",    // آبی سورمه‌ای تیره
  primaryMid: "#234e8c",     // آبی سورمه‌ای میانه
  primaryLight: "#3d6fbd",   // آبی روشن‌تر
  primaryGhost: "#e8edf6",   // پس‌زمینه آبی بسیار کم‌رنگ
  primarySoft: "#c9d7ee",    // آبی نرم برای border
  accent: "#0ea5c7",         // فیروزه‌ای برای تاکید
  accentBg: "#e0f5fb",
  success: "#2e7d32",
  successBg: "#e8f5e9",
  successBorder: "#a5d6a7",
  danger: "#c0392b",
  dangerSoft: "#d9534f",
  dangerBg: "#fdecea",
  white: "#ffffff",
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
  if (num == null || Number.isNaN(num)) return '—';
  return Number(num).toLocaleString('fa-IR');
};

// تبدیل ارقام فارسی/عربی به انگلیسی برای پارس صحیح ورودی کاربر
const toEnglishDigits = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
};

const parseNumericInput = (str) => {
  const cleaned = toEnglishDigits(str).replace(/[^\d.]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
};

// ردیف اطلاعات (برچسب + مقدار)
const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, defaultFont]}>{label}</Text>
    <Text style={[styles.infoValue, highlight && styles.infoValueHighlight, defaultFont]}>
      {value || '—'}
    </Text>
  </View>
);

export default function FactorPishDetailScreen({ route, navigation }) {
  const { number } = route.params;

  const [detail, setDetail] = useState(null); // { header, items }
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  // discountInputs: { [Code]: { mode: 'tf' | 'mtf', value: string } }
  const [discountInputs, setDiscountInputs] = useState({});

  useEffect(() => {
    loadDetail();
  }, []);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await getFactorPishDetail(number);
      setDetail(data);
      setDiscountInputs({});
    } catch (err) {
      Alert.alert('خطا', err.message, [
        { text: 'بازگشت', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const setDiscountMode = (code, mode) => {
    setDiscountInputs((prev) => ({
      ...prev,
      [code]: { mode, value: prev[code]?.value || '' },
    }));
  };

  const setDiscountValue = (code, value) => {
    setDiscountInputs((prev) => ({
      ...prev,
      [code]: { mode: prev[code]?.mode || 'tf', value },
    }));
  };

  // محاسبه‌ی زنده‌ی جمع کل بر اساس تخفیف‌های واردشده، برای پیش‌نمایش
  // (محاسبه‌ی قطعی و نهایی همیشه سمت سرور انجام می‌شود)
  const { computedRows, totalAfterDiscount, totalDiscountAmount } = useMemo(() => {
    if (!detail) return { computedRows: [], totalAfterDiscount: 0, totalDiscountAmount: 0 };

    let total = 0;
    let totalDiscount = 0;

    const rows = detail.items.map((item) => {
      const baseAmount = (item.AllT || item.SumNo || 0) * (item.SlavePrice || 0);
      const input = discountInputs[item.Code];
      let tf = 0;
      let mtf = 0;

      if (input && input.value !== '') {
        const parsed = parseNumericInput(input.value);
        if (parsed != null) {
          if (input.mode === 'tf') {
            tf = parsed;
            mtf = Math.round((baseAmount * tf) / 100);
          } else {
            mtf = parsed;
            tf = baseAmount > 0 ? (mtf / baseAmount) * 100 : 0;
          }
        }
      }

      const lineFinal = baseAmount - mtf;
      total += lineFinal;
      totalDiscount += mtf;

      return { item, baseAmount, tf, mtf, lineFinal };
    });

    return { computedRows: rows, totalAfterDiscount: total, totalDiscountAmount: totalDiscount };
  }, [detail, discountInputs]);

  // آرایه‌ی نهایی discounts برای ارسال به سرور (فقط ردیف‌هایی که مقدار دارند)
  const buildDiscountsPayload = () => {
    const payload = [];
    Object.entries(discountInputs).forEach(([code, input]) => {
      if (!input || input.value === '') return;
      const parsed = parseNumericInput(input.value);
      if (parsed == null) return;
      if (input.mode === 'tf') {
        payload.push({ code: Number(code), tf: parsed });
      } else {
        payload.push({ code: Number(code), mtf: parsed });
      }
    });
    return payload;
  };

  const handleConvert = () => {
    Alert.alert(
      'تبدیل به فاکتور',
      `آیا از تبدیل پیش‌فاکتور شماره ${number} به فاکتور فروش اطمینان دارید؟${
        totalDiscountAmount > 0 ? `\nجمع تخفیف اعمال‌شده: ${formatNumber(totalDiscountAmount)}` : ''
      }`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، صدور فاکتور',
          style: 'default',
          onPress: doConvert,
        },
      ]
    );
  };

  const doConvert = async () => {
    try {
      setConverting(true);
      const discounts = buildDiscountsPayload();
      const result = await convertFactorPishToFactor(number, discounts);

      Alert.alert(
        '✅ فاکتور صادر شد',
        `فاکتور فروش شماره ${result.factorNumber} با موفقیت صادر شد.\nتعداد کالا: ${result.itemCount} ردیف\nمبلغ نهایی: ${formatNumber(result.priceP)} `,
        [
          {
            text: 'بازگشت به لیست',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('خطا در صدور فاکتور', err.message);
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top','bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, defaultFont]}>در حال بارگذاری...</Text>
      </SafeAreaView>
    );
  }

  if (!detail) return null;

  const { header, items } = detail;
  const alreadyConverted = Boolean(header.FactorNo);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom', 'left', 'right']}>
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
            <Text style={[styles.headerTitle, defaultFont]}>پیش‌فاکتور #{header.Number}</Text>
          </View>
          <View style={styles.headerDatePill}>
            <MaterialIcons name="event" size={10} color="rgba(255,255,255,0.6)" />
            <Text style={[styles.headerDateText, defaultFont]}>{header.DateF}</Text>
          </View>
        </View>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* کارت وضعیت */}
        {alreadyConverted && (
          <View style={styles.convertedBanner}>
            <View style={styles.convertedIconCircle}>
              <MaterialIcons name="check" size={14} color={COLORS.white} />
            </View>
            <Text style={[styles.convertedText, defaultFont]}>
              این پیش‌فاکتور قبلاً به فاکتور شماره {header.FactorNo} تبدیل شده است
            </Text>
          </View>
        )}

        {/* اطلاعات مشتری */}
        <View style={styles.section}>
          <View style={styles.cardSideBar} />
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialIcons name="person" size={14} color={COLORS.white} />
              </View>
              <Text style={[styles.sectionTitle, defaultFont]}>اطلاعات مشتری</Text>
            </View>
            <View style={styles.sectionBody}>
              <InfoRow label="نام مشتری" value={header.BuyerName} />
              <InfoRow label="کد مشتری" value={header.BuyerCode} />
              <InfoRow label="شهر" value={header.City} />
              <InfoRow label="آدرس" value={header.BuyerAdd} />
              <InfoRow label="تلفن" value={header.TEL} />
            </View>
          </View>
        </View>

        {/* اطلاعات مالی */}
        <View style={styles.section}>
          <View style={styles.cardSideBar} />
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialIcons name="receipt" size={14} color={COLORS.white} />
              </View>
              <Text style={[styles.sectionTitle, defaultFont]}>اطلاعات مالی</Text>
            </View>
            <View style={styles.sectionBody}>
              <InfoRow
                label="مبلغ کل پیش‌فاکتور"
                value={`${formatNumber(header.Price)} `}
                highlight
              />
              <InfoRow
                label="تخفیف هدر"
                value={header.PriceB ? `${formatNumber(header.PriceB)} ` : '—'}
              />
              <InfoRow
                label="مبلغ قابل پرداخت"
                value={header.PriceP ? `${formatNumber(header.PriceP)} ` : '—'}
              />
              <InfoRow label="توضیحات" value={header.Tozeh} />
            </View>
          </View>
        </View>

        {/* انبار و فروشنده */}
        <View style={styles.section}>
          <View style={styles.cardSideBar} />
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialIcons name="warehouse" size={14} color={COLORS.white} />
              </View>
              <Text style={[styles.sectionTitle, defaultFont]}>انبار و فروشنده</Text>
            </View>
            <View style={styles.sectionBody}>
              <InfoRow label="انبار" value={header.AnbarName || header.Anbar} />
              <InfoRow label="فروشنده" value={header.MoenName} />
              <InfoRow label="تاریخ ثبت" value={header.DateF} />
            </View>
          </View>
        </View>

        {/* کالاها */}
        <View style={styles.section}>
          <View style={styles.cardSideBar} />
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialIcons name="inventory-2" size={14} color={COLORS.white} />
              </View>
              <Text style={[styles.sectionTitle, defaultFont]}>
                کالاها
              </Text>
              <View style={styles.itemCountBadge}>
                <Text style={[styles.itemCountText, defaultFont]}>{items.length}</Text>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyItems}>
                <MaterialIcons name="inventory" size={26} color={COLORS.textMuted} />
                <Text style={[styles.emptyItemsText, defaultFont]}>کالایی ثبت نشده است</Text>
              </View>
            ) : (
              <View style={styles.sectionBody}>
                {computedRows.map(({ item, baseAmount, lineFinal }, index) => {
                  const code = item.Code;
                  const input = discountInputs[code] || { mode: 'tf', value: '' };
                  const hasDiscountInput = input.value !== '';

                  return (
                    <View key={code ?? index} style={styles.itemCard}>
                      {/* نام و کد */}
                      <View style={styles.itemHeader}>
                        <View style={styles.itemIndexBox}>
                          <Text style={[styles.itemIndex, defaultFont]}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.itemName, defaultFont]} numberOfLines={2}>
                          {item.Name}
                        </Text>
                      </View>
                      <Text style={[styles.itemCode, defaultFont]}>کد: {item.Code}</Text>

                      {/* ردیف اعداد */}
                      <View style={styles.itemNumbers}>
                        <View style={styles.itemNumberBox}>
                          <Text style={[styles.itemNumberLabel, defaultFont]}>تعداد کل</Text>
                          <Text style={[styles.itemNumberValue, defaultFont]}>
                            {formatNumber(item.AllT || item.SumNo)}
                          </Text>
                        </View>
                        <View style={styles.itemNumberBox}>
                          <Text style={[styles.itemNumberLabel, defaultFont]}>قیمت واحد</Text>
                          <Text style={[styles.itemNumberValue, defaultFont]}>
                            {formatNumber(item.SlavePrice)}
                          </Text>
                        </View>
                        <View style={[styles.itemNumberBox, styles.itemNumberBoxHighlight]}>
                          <Text style={[styles.itemNumberLabel, styles.itemNumberLabelHighlight, defaultFont]}>جمع ردیف</Text>
                          <Text style={[styles.itemNumberValueHighlight, defaultFont]}>
                            {formatNumber(baseAmount)}
                          </Text>
                        </View>
                      </View>

                      {/* تخفیف ثبت‌شده‌ی قبلی (در صورت تبدیل‌شده بودن) */}
                      {alreadyConverted && (item.TF > 0 || item.MTF > 0) && (
                        <View style={styles.discountRow}>
                          <MaterialIcons name="local-offer" size={12} color={COLORS.danger} />
                          <Text style={[styles.discountText, defaultFont]}>
                            تخفیف: {item.TF > 0 ? `${item.TF}٪` : ''}{' '}
                            {item.MTF > 0 ? `(${formatNumber(item.MTF)} )` : ''}
                          </Text>
                        </View>
                      )}

                      {/* ورودی تخفیف سطری — فقط وقتی هنوز فاکتور نشده */}
                      {!alreadyConverted && (
                        <View style={styles.discountInputRow}>
                          <View style={styles.discountModeSwitch}>
                            <TouchableOpacity
                              style={[
                                styles.discountModeBtn,
                                input.mode === 'tf' && styles.discountModeBtnActive,
                              ]}
                              onPress={() => setDiscountMode(code, 'tf')}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.discountModeBtnText,
                                  input.mode === 'tf' && styles.discountModeBtnTextActive,
                                  defaultFont,
                                ]}
                              >
                                درصد ٪
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.discountModeBtn,
                                input.mode === 'mtf' && styles.discountModeBtnActive,
                              ]}
                              onPress={() => setDiscountMode(code, 'mtf')}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.discountModeBtnText,
                                  input.mode === 'mtf' && styles.discountModeBtnTextActive,
                                  defaultFont,
                                ]}
                              >
                                مبلغ
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <TextInput
                            style={[styles.discountInput, defaultFont]}
                            placeholder={input.mode === 'tf' ? '٪' : ''}
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={input.value}
                            onChangeText={(text) => setDiscountValue(code, text)}
                            textAlign="center"
                          />

                          {hasDiscountInput && (
                            <TouchableOpacity
                              style={styles.discountClearBtn}
                              onPress={() => setDiscountValue(code, '')}
                              activeOpacity={0.7}
                            >
                              <MaterialIcons name="close" size={14} color={COLORS.textMuted} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* مبلغ نهایی پس از تخفیف — زیر ورودی تخفیف */}
                      {!alreadyConverted && hasDiscountInput && (
                        <View style={styles.finalAfterDiscountRow}>
                          <Text style={[styles.finalAfterDiscountValue, defaultFont]}>
                            {formatNumber(lineFinal)} 
                          </Text>
                          <Text style={[styles.finalAfterDiscountLabel, defaultFont]}>مبلغ نهایی پس از تخفیف</Text>
                        </View>
                      )}
                      {alreadyConverted && (item.TF > 0 || item.MTF > 0) && (
                        <View style={styles.finalAfterDiscountRow}>
                          <Text style={[styles.finalAfterDiscountValue, defaultFont]}>
                            {formatNumber(item.Price)} 
                          </Text>
                          <Text style={[styles.finalAfterDiscountLabel, defaultFont]}>مبلغ نهایی پس از تخفیف</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* فاصله پایین برای دکمه */}
        <View style={{ height: alreadyConverted ? 24 : 100 }} />
      </ScrollView>

      {/* دکمه تبدیل به فاکتور */}
      {!alreadyConverted && (
        <View style={styles.bottomBar}>
          <View style={styles.totalSummary}>
            {totalDiscountAmount > 0 && (
              <Text style={[styles.totalDiscountLabel, defaultFont]}>
                تخفیف: {formatNumber(totalDiscountAmount)} 
              </Text>
            )}
            <Text style={[styles.totalLabel, defaultFont]}>جمع قابل پرداخت</Text>
            <Text style={[styles.totalValue, defaultFont]}>
              {formatNumber(totalAfterDiscount)} <Text style={styles.totalUnit}></Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.convertButton, (converting || items.length === 0) && styles.convertButtonDisabled]}
            onPress={handleConvert}
            disabled={converting || items.length === 0}
            activeOpacity={0.85}
          >
            {converting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="receipt-long" size={18} color={COLORS.white} />
                <Text style={[styles.convertButtonText, defaultFont]}>صدور فاکتور</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
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
    gap: 4,
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
  headerDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },
  headerDateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // بنر تبدیل شده
  convertedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },
  convertedIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convertedText: {
    color: COLORS.success,
    fontSize: 12.5,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'IRANYekan-Bold',
  },

  // سکشن
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardSideBar: {
    width: 5,
    backgroundColor: COLORS.primary,
  },
  sectionInner: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryGhost,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.primaryDark,
    fontFamily: 'IRANYekan-Bold',
    fontSize: 13.5,
    flex: 1,
    textAlign: 'right',
  },
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  itemCountText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: 'IRANYekan-Bold',
  },
  sectionBody: {
    paddingHorizontal: 13,
    paddingVertical: 4,
  },

  // ردیف اطلاعات
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    minWidth: 90,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  infoValueHighlight: {
    color: COLORS.primary,
    fontFamily: 'IRANYekan-Bold',
    fontSize: 14,
  },

  // کارت کالا
  itemCard: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: 13,
  },
  itemHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  itemIndexBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  itemIndex: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'IRANYekan-Bold',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'IRANYekan-Bold',
    color: COLORS.text,
    textAlign: 'right',
  },
  itemCode: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 10,
  },
  itemNumbers: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  itemNumberBox: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemNumberBoxHighlight: {
    backgroundColor: COLORS.goldBg,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  itemNumberLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  itemNumberLabelHighlight: {
    color: COLORS.gold,
  },
  itemNumberValue: {
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'IRANYekan-Bold',
  },
  itemNumberValueHighlight: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontFamily: 'IRANYekan-Bold',
  },
  discountRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 9,
    backgroundColor: COLORS.dangerBg,
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11.5,
    color: COLORS.danger,
  },
  finalAfterDiscountRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
    backgroundColor: COLORS.goldBg,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  finalAfterDiscountLabel: {
    fontSize: 11.5,
    color: COLORS.gold,
  },
  finalAfterDiscountValue: {
    fontSize: 14,
    fontFamily: 'IRANYekan-Bold',
    color: COLORS.primaryDark,
  },
  emptyItems: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyItemsText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // ─── ورودی تخفیف سطری ───
  discountInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
  },
  discountModeSwitch: {
    flexDirection: 'row-reverse',
    backgroundColor: COLORS.inputBg,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
  },
  discountModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  discountModeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  discountModeBtnText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  discountModeBtnTextActive: {
    color: COLORS.white,
    fontFamily: 'IRANYekan-Bold',
  },
  discountInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  discountClearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // نوار پایین
  bottomBar: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  totalSummary: {
    alignItems: 'flex-end',
  },
  totalDiscountLabel: {
    fontSize: 11,
    color: COLORS.danger,
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  totalValue: {
    fontSize: 17,
    fontFamily: 'IRANYekan-Bold',
    color: COLORS.primaryDark,
  },
  totalUnit: {
    fontSize: 11,
    color: COLORS.gold,
    fontFamily: 'IRANYekan',
  },
  convertButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 5 },
    }),
  },
  convertButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  convertButtonText: {
    color: COLORS.white,
    fontFamily: 'IRANYekan-Bold',
    fontSize: 14.5,
  },
});