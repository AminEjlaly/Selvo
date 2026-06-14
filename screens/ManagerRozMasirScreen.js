import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jalaali from "jalaali-js";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
};

const getTodayJalali = () => {
  const now = new Date();
  const { jy, jm, jd } = jalaali.toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
};

export default function ManagerRozMasirScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");

  const [visitors, setVisitors] = useState([]);
  const [masirList, setMasirList] = useState([]);
  const [assignedList, setAssignedList] = useState([]);

  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [selectedMasir, setSelectedMasir] = useState(null);

  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [loadingMasir, setLoadingMasir] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [visitorModalVisible, setVisitorModalVisible] = useState(false);
  const [masirModalVisible, setMasirModalVisible] = useState(false);

  const [visitorSearch, setVisitorSearch] = useState("");
  const [masirSearch, setMasirSearch] = useState("");

  const todayDate = getTodayJalali();

  useEffect(() => {
    initScreen();
  }, []);

  const initScreen = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const connType = await AsyncStorage.getItem("connection_type");
      let url = "";
      if (connType === "url") {
        url = (await AsyncStorage.getItem("server_url")) || "";
      } else {
        const ip = (await AsyncStorage.getItem("server_ip")) || "";
        const port = (await AsyncStorage.getItem("server_port")) || "";
        url = `http://${ip}:${port}`;
      }
      setToken(storedToken || "");
      setServerUrl(url);
      if (url && storedToken) {
        fetchVisitors(url, storedToken);
        fetchMasir(url, storedToken);
        fetchAssigned(url, storedToken);
      }
    } catch (e) {
      console.warn("initScreen error:", e.message);
    }
  };

  const fetchVisitors = async (url, tok) => {
    setLoadingVisitors(true);
    try {
      const res = await fetch(`${url}/api/manager/visitors`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (data.success) setVisitors(data.data);
    } catch (e) {
      console.warn("fetchVisitors:", e.message);
    } finally {
      setLoadingVisitors(false);
    }
  };

  const fetchMasir = async (url, tok) => {
    setLoadingMasir(true);
    try {
      const res = await fetch(`${url}/api/manager/masir`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (data.success) setMasirList(data.data);
    } catch (e) {
      console.warn("fetchMasir:", e.message);
    } finally {
      setLoadingMasir(false);
    }
  };

  const fetchAssigned = async (url, tok) => {
    setLoadingAssigned(true);
    try {
      const res = await fetch(
        `${url}/api/manager/rozmasir/assigned?date=${todayDate}`,
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      const data = await res.json();
      if (data.success) setAssignedList(data.data);
    } catch (e) {
      console.warn("fetchAssigned:", e.message);
    } finally {
      setLoadingAssigned(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedVisitor) {
      Alert.alert("خطا", "فروشنده را انتخاب کنید");
      return;
    }
    if (!selectedMasir) {
      Alert.alert("خطا", "مسیر را انتخاب کنید");
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`${serverUrl}/api/manager/rozmasir/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitorCode: String(selectedVisitor.NOF),
          visitorName: selectedVisitor.NameF,
          masirCode: String(selectedMasir.codeM),
          masirName: selectedMasir.NameM,
          date: todayDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert(
          "✅ موفق",
          `مسیر "${selectedMasir.NameM}" به "${selectedVisitor.NameF}" افزوده شد`
        );
        setSelectedVisitor(null);
        setSelectedMasir(null);
        fetchAssigned(serverUrl, token);
      } else {
        Alert.alert("خطا", data.message || "مشکلی پیش آمد");
      }
    } catch (e) {
      Alert.alert("خطا", "ارتباط با سرور برقرار نشد");
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      "حذف مسیر",
      `آیا مطمئنید که مسیر "${item.MasirName}" برای "${item.TafzilyName}" حذف شود؟`,
      [
        { text: "انصراف", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `${serverUrl}/api/manager/rozmasir/delete`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    masirCode: String(item.MasirCode),
                    visitorCode: String(item.TafzilyCode),
                    date: todayDate,
                  }),
                }
              );
              const data = await res.json();
              if (data.success) {
                fetchAssigned(serverUrl, token);
              } else {
                Alert.alert("خطا", data.message || "مشکلی پیش آمد");
              }
            } catch (e) {
              Alert.alert("خطا", "ارتباط با سرور برقرار نشد");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* ─── هدر ─── */}
      <View style={styles.header}>
        {/* خط تزئینی پایین هدر */}
        <View style={styles.headerBottomAccent} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-right" size={16} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconRow}>
            <FontAwesome name="map-signs" size={14} color={COLORS.gold} />
            <Text style={styles.headerTitle}>روز مسیر</Text>
          </View>
          <View style={styles.headerDatePill}>
            <FontAwesome name="calendar-o" size={10} color="rgba(255,255,255,0.6)" />
            <Text style={styles.headerDateText}>{todayDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshHeaderBtn}
          onPress={() => fetchAssigned(serverUrl, token)}
          activeOpacity={0.7}
        >
          <FontAwesome name="refresh" size={15} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── کارت افزودن مسیر ─── */}
        <View style={styles.card}>
          {/* نوار رنگی کناری */}
          <View style={styles.cardSideBar} />

          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <FontAwesome name="map-signs" size={15} color={COLORS.white} />
              </View>
              <Text style={styles.cardTitle}>افزودن مسیر به فروشنده</Text>
            </View>

            {/* خط جداکننده */}
            <View style={styles.cardDivider} />

            {/* انتخاب فروشنده */}
            <Text style={styles.fieldLabel}>
              <FontAwesome name="user" size={11} color={COLORS.textMuted} />
              {"  فروشنده"}
            </Text>
            <TouchableOpacity
              style={[
                styles.selector,
                selectedVisitor && styles.selectorActive,
              ]}
              onPress={() => setVisitorModalVisible(true)}
              activeOpacity={0.7}
            >
              {loadingVisitors ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <FontAwesome
                    name="chevron-down"
                    size={11}
                    color={selectedVisitor ? COLORS.primaryLight : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.selectorText,
                      selectedVisitor && styles.selectorTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedVisitor
                      ? selectedVisitor.NameF
                      : "انتخاب فروشنده..."}
                  </Text>
                  <View
                    style={[
                      styles.selectorIcon,
                      selectedVisitor && styles.selectorIconActive,
                    ]}
                  >
                    <FontAwesome
                      name="user"
                      size={13}
                      color={selectedVisitor ? COLORS.white : COLORS.textMuted}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* انتخاب مسیر */}
            <Text style={styles.fieldLabel}>
              <FontAwesome name="road" size={11} color={COLORS.textMuted} />
              {"  مسیر"}
            </Text>
            <TouchableOpacity
              style={[
                styles.selector,
                selectedMasir && styles.selectorActive,
              ]}
              onPress={() => setMasirModalVisible(true)}
              activeOpacity={0.7}
            >
              {loadingMasir ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <FontAwesome
                    name="chevron-down"
                    size={11}
                    color={selectedMasir ? COLORS.primaryLight : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.selectorText,
                      selectedMasir && styles.selectorTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedMasir
                      ? `${selectedMasir.NameM}  •  ${selectedMasir.countBuyer} مشتری`
                      : "انتخاب مسیر..."}
                  </Text>
                  <View
                    style={[
                      styles.selectorIcon,
                      selectedMasir && styles.selectorIconActive,
                    ]}
                  >
                    <FontAwesome
                      name="road"
                      size={13}
                      color={selectedMasir ? COLORS.white : COLORS.textMuted}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* دکمه افزودن */}
            <TouchableOpacity
              style={[styles.addBtn, assigning && styles.addBtnDisabled]}
              onPress={handleAssign}
              disabled={assigning}
              activeOpacity={0.85}
            >
              {assigning ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <FontAwesome name="plus-circle" size={16} color={COLORS.white} />
              )}
              <Text style={styles.addBtnText}>
                {assigning ? "در حال افزودن..." : "افزودن مسیر"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── هدر بخش لیست ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <View style={styles.sectionBadgeWrap}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{assignedList.length}</Text>
            </View>
            <Text style={styles.sectionTitle}>مسیرهای امروز</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>

        {loadingAssigned ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>در حال بارگذاری...</Text>
          </View>
        ) : assignedList.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="map-o" size={30} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>مسیری افزوده نشده</Text>
            <Text style={styles.emptySubtitle}>
              برای شروع، یک مسیر به فروشنده اضافه کنید
            </Text>
          </View>
        ) : (
          assignedList.map((item, index) => (
            <View
              key={`${item.MasirCode}-${item.TafzilyCode}-${index}`}
              style={styles.assignedCard}
            >
              {/* شماره ردیف */}
              <View style={styles.rowIndexBox}>
                <Text style={styles.rowIndexText}>{index + 1}</Text>
              </View>

              {/* خط عمودی جداکننده */}
              <View style={styles.cardVerticalLine} />

              {/* محتوا */}
              <View style={styles.assignedContent}>
                {/* نام مسیر */}
                <View style={styles.masirRow}>
                  <Text
                    style={styles.masirName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {item.MasirName}
                  </Text>
                  <View style={styles.masirIconBox}>
                    <FontAwesome name="map-marker" size={10} color={COLORS.white} />
                  </View>
                </View>

                {/* فروشنده + تعداد مشتری */}
                <View style={styles.visitorRow}>
                  <View style={styles.customerCountPill}>
                    <FontAwesome name="users" size={9} color={COLORS.accent} />
                    <Text style={styles.customerCountText}>{item.customerCount}</Text>
                  </View>
                  <Text
                    style={styles.visitorName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {item.TafzilyName}
                  </Text>
                </View>
              </View>

              {/* دکمه حذف */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <FontAwesome name="trash-o" size={15} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ─── مودال فروشنده ─── */}
      <Modal
        visible={visitorModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => { setVisitorModalVisible(false); setVisitorSearch(""); }}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <FontAwesome name="times" size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.modalTitleRow}>
                <FontAwesome name="user-circle" size={16} color={COLORS.primary} />
                <Text style={styles.modalTitle}>انتخاب فروشنده</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <FontAwesome name="search" size={13} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجو..."
                placeholderTextColor={COLORS.textMuted}
                value={visitorSearch}
                onChangeText={setVisitorSearch}
                textAlign="right"
                autoCorrect={false}
              />
              {visitorSearch.length > 0 && (
                <TouchableOpacity onPress={() => setVisitorSearch("")} activeOpacity={0.7}>
                  <FontAwesome name="times-circle" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={visitors.filter(v =>
                v.NameF?.includes(visitorSearch) ||
                String(v.NOF).includes(visitorSearch)
              )}
              keyExtractor={(item) => String(item.NOF)}
              contentContainerStyle={{ padding: 16, paddingTop: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedVisitor?.NOF === item.NOF;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedVisitor(item);
                      setVisitorModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemCode, isSelected && styles.modalItemCodeSelected]}>
                      {item.NOF}
                    </Text>
                    <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                      {item.NameF}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <FontAwesome name="check" size={11} color={COLORS.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 4 }} />
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── مودال مسیر ─── */}
      <Modal
        visible={masirModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                onPress={() => { setMasirModalVisible(false); setMasirSearch(""); }}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <FontAwesome name="times" size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.modalTitleRow}>
                <FontAwesome name="road" size={16} color={COLORS.primary} />
                <Text style={styles.modalTitle}>انتخاب مسیر</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <FontAwesome name="search" size={13} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجو..."
                placeholderTextColor={COLORS.textMuted}
                value={masirSearch}
                onChangeText={setMasirSearch}
                textAlign="right"
                autoCorrect={false}
              />
              {masirSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMasirSearch("")} activeOpacity={0.7}>
                  <FontAwesome name="times-circle" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={masirList.filter(m =>
                m.NameM?.includes(masirSearch) ||
                String(m.codeM).includes(masirSearch)
              )}
              keyExtractor={(item) => String(item.codeM)}
              contentContainerStyle={{ padding: 16, paddingTop: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedMasir?.codeM === item.codeM;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedMasir(item);
                      setMasirModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalMasirCountBox, isSelected && styles.modalMasirCountBoxSelected]}>
                      <Text style={[styles.modalMasirCount, isSelected && { color: COLORS.white }]}>
                        {item.countBuyer}
                      </Text>
                      <Text style={[styles.modalMasirCountLabel, isSelected && { color: "rgba(255,255,255,0.75)" }]}>نفر</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                        {item.NameM}
                      </Text>
                      {item.NameV ? (
                        <Text style={styles.modalItemSub}>
                          فروشنده پیش‌فرض: {item.NameV}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <FontAwesome name="check" size={11} color={COLORS.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 4 }} />
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Header ───
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  headerBottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.gold,
    opacity: 0.7,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
    gap: 6,
  },
  headerIconRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: "IRANYekan-Bold",
    letterSpacing: 0.3,
  },
  headerDatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerDateText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "IRANYekan",
  },

  // ─── Scroll ───
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // ─── Card ───
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14 },
      android: { elevation: 4 },
    }),
  },
  cardSideBar: {
    width: 5,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "IRANYekan-Bold",
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },

  // ─── Selector ───
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: "IRANYekan",
    textAlign: "right",
    marginBottom: 7,
  },
  selector: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 6,
  },
  selectorActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGhost,
  },
  selectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  selectorIconActive: {
    backgroundColor: COLORS.primary,
  },
  selectorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: "IRANYekan",
    textAlign: "right",
  },
  selectorTextActive: {
    color: COLORS.primaryDark,
    fontFamily: "IRANYekan-Bold",
  },

  // ─── Add Button ───
  addBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  addBtnDisabled: {
    backgroundColor: COLORS.textMuted,
    borderColor: COLORS.textMuted,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "IRANYekan-Bold",
  },

  // ─── Section Header ───
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionBadgeWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: "IRANYekan-Bold",
  },
  sectionBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: "center",
  },
  sectionBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "IRANYekan-Bold",
  },

  // ─── Loading / Empty ───
  loadingBox: {
    alignItems: "center",
    paddingVertical: 44,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "IRANYekan",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 44,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryGhost,
    borderWidth: 1.5,
    borderColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "IRANYekan-Bold",
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: "IRANYekan",
  },

  // ─── Assigned Card ───
  assignedCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  rowIndexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  rowIndexText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "IRANYekan-Bold",
  },
  cardVerticalLine: {
    width: 1.5,
    height: 36,
    backgroundColor: COLORS.divider,
    borderRadius: 1,
  },
  assignedContent: {
    flex: 1,
    gap: 5,
  },
  masirRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
  },
  masirIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  masirName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "IRANYekan-Bold",
    textAlign: "right",
  },
  visitorRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  visitorName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "IRANYekan",
    textAlign: "right",
  },
  customerCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.accentBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  customerCountText: {
    color: COLORS.accent,
    fontSize: 11,
    fontFamily: "IRANYekan-Bold",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: "#f5c6c4",
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,20,45,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "78%",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 20 },
    }),
  },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.inputBg,
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
    fontFamily: "IRANYekan",
    padding: 0,
  },

  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "IRANYekan-Bold",
    textAlign: "right",
  },
  modalItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    borderRadius: 12,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primaryGhost,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  modalItemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "IRANYekan",
    textAlign: "right",
  },
  modalItemNameSelected: {
    color: COLORS.primaryDark,
    fontFamily: "IRANYekan-Bold",
  },
  modalItemCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: "IRANYekan",
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalItemCodeSelected: {
    backgroundColor: COLORS.primaryGhost,
    borderColor: COLORS.primarySoft,
    color: COLORS.primaryDark,
  },
  modalItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: "IRANYekan",
    textAlign: "right",
    marginTop: 3,
  },
  modalMasirCountBox: {
    alignItems: "center",
    backgroundColor: COLORS.accentBg,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    minWidth: 38,
    borderWidth: 1,
    borderColor: "rgba(14,165,199,0.2)",
  },
  modalMasirCountBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryMid,
  },
  modalMasirCount: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: "IRANYekan-Bold",
  },
  modalMasirCountLabel: {
    fontSize: 9,
    color: COLORS.accent,
    fontFamily: "IRANYekan",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});