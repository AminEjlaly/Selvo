// customer payment screen - New Design (Final)
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
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

import { getBuyersByCityCode, getCities, getCustomerBalance, submitCustomerPayment } from "../api";

// ─── Colors ───
const COLORS = {
    primary: "#1a3a6b",
    primaryDark: "#0f2447",
    primaryMid: "#234e8c",
    primaryLight: "#3d6fbd",
    primaryGhost: "#e8edf6",
    primarySoft: "#c9d7ee",
    accent: "#0ea5c7",
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

// ─── Helper Functions ───
const formatNumber = (v) =>
    v.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const unformat = (v) => v.replace(/,/g, "");

const normalizeFa = (str) =>
    String(str || "")
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ی")
        .trim()
        .toLowerCase();

const formatJalaliDate = (v) => {
    const digits = v.replace(/[^0-9]/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
    return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`;
};

// فقط عدد برای شماره سریال/پیگیری
const onlyNumbers = (text) => text.replace(/[^0-9]/g, "");

export default function CustomerPaymentScreen({ navigation, route }) {
    const { userType, buyerCode: routeBuyerCode } = route.params || {};

    const [user, setUser] = useState(null);

    // City & Customer
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [citySearchText, setCitySearchText] = useState("");
    const [loadingCities, setLoadingCities] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);

    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Form
    const [paymentType, setPaymentType] = useState(null);
    const [amount, setAmount] = useState("");
    const [serial, setSerial] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [sayyadi, setSayyadi] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("user").then((r) => r && setUser(JSON.parse(r)));
    }, []);

    // ─── API Calls ───
    const openCityModal = async () => {
        setCityModalVisible(true);
        setLoadingCities(true);
        setCitySearchText("");
        try {
            const data = await getCities();
            const formatted = (data || []).map((c) => ({
                code: c.CityCode || c.code,
                name: c.CityName || c.name,
                province: c.ostan || c.province || "",
            }));
            setCities(formatted);
            setFilteredCities(formatted);
        } catch (e) {
            Alert.alert("خطا", "دریافت لیست شهرها با مشکل مواجه شد");
        } finally {
            setLoadingCities(false);
        }
    };

    const loadCustomersByCity = async (cityCode) => {
        setLoadingCustomers(true);
        try {
            const data = await getBuyersByCityCode(cityCode);
            const formatted = (data || []).map((c) => ({
                code: c.BuyerCode || c.code || c.Code,
                name: c.name || c.Name || c.NameF || "",
                cityCode: c.CityCode || c.cityCode,
            }));
            const unique = Array.from(new Map(formatted.map((b) => [b.code, b])).values());
            setCustomers(unique);
            setFilteredCustomers(unique);
        } catch (e) {
            Alert.alert("خطا", "دریافت لیست مشتری‌ها با مشکل مواجه شد");
        } finally {
            setLoadingCustomers(false);
        }
    };

    const selectCity = (city) => {
        setSelectedCity(city);
        setCityModalVisible(false);
        if (selectedCustomer && selectedCustomer.cityCode !== city.code) {
            setSelectedCustomer(null);
            setBalance(null);
        }
        loadCustomersByCity(city.code);
    };

    const openCustomerModal = () => {
        if (!selectedCity) {
            openCityModal();
            return;
        }
        setCustomerModalVisible(true);
        setSearchText("");
        setFilteredCustomers(customers);
    };

    const selectCustomer = (c) => {
        setSelectedCustomer(c);
        setCustomerModalVisible(false);
        loadBalance(c.code);
    };

    const loadBalance = async (code) => {
        setBalanceLoading(true);
        try {
            const res = await getCustomerBalance(code);
            setBalance(typeof res?.balance === "number" ? res.balance : 0);
        } catch (e) {
            console.warn("balance:", e.message);
        } finally {
            setBalanceLoading(false);
        }
    };

    const pickImage = () => {
        Alert.alert("تصویر رسید", "از کجا بارگذاری شود؟", [
            {
                text: "دوربین",
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== "granted") return Alert.alert("خطا", "دسترسی دوربین رد شد");
                    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
                    if (!r.canceled) setImage(r.assets[0].uri);
                },
            },
            {
                text: "گالری",
                onPress: async () => {
                    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
                    if (!r.canceled) setImage(r.assets[0].uri);
                },
            },
            { text: "انصراف", style: "cancel" },
        ]);
    };

    const validate = () => {
        if (!selectedCustomer) return msg("مشتری را انتخاب کنید");
        if (!paymentType) return msg("نوع پرداخت را انتخاب کنید");
        if (!unformat(amount)) return msg("مبلغ را وارد کنید");
        if (!image) return msg("تصویر رسید الزامی است");
        if ((paymentType === "transfer" || paymentType === "pos") && !serial.trim())
            return msg("شماره سریال را وارد کنید");
        if (paymentType === "check") {
            if (!dueDate.trim()) return msg("تاریخ سررسید چک را وارد کنید");
            if (sayyadi.trim().length !== 16) return msg("شماره صیادی باید دقیقاً ۱۶ رقم باشد");
        }
        return true;
    };

    const msg = (m) => { Alert.alert("خطا", m); return false; };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await submitCustomerPayment({
                CustomerCode: selectedCustomer.code,
                CustomerName: selectedCustomer.name,
                PaymentType: paymentType,
                Amount: unformat(amount),
                SerialNumber: serial,
                CheckDueDate: dueDate,
                SayyadiNumber: sayyadi,
                Description: description,
            }, image);

            Alert.alert("✅ ثبت شد", "پرداخت با موفقیت ثبت شد", [
                { text: "ثبت جدید", onPress: resetForm },
                { text: "بازگشت", onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert("خطا", e.message || "مشکلی در ثبت پیش آمد");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setBalance(null);
        setPaymentType(null);
        setAmount("");
        setSerial("");
        setDueDate("");
        setSayyadi("");
        setDescription("");
        setImage(null);
    };

    const TYPES = [
        { key: "cash", label: "نقد", icon: "money" },
        { key: "transfer", label: "حواله", icon: "exchange" },
        { key: "pos", label: "پوز", icon: "credit-card" },
        { key: "check", label: "چک", icon: "file-text-o" },
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerBottomAccent} />

                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerIconRow}>
                        <FontAwesome name="credit-card" size={16} color={COLORS.gold} />
                        <Text style={styles.headerTitle}>ثبت پرداخت مشتری</Text>
                    </View>
                </View>

                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* کارت مشتری */}
                    <View style={styles.card}>
                        <View style={styles.cardSideBar} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardTitleRow}>
                                <FontAwesome name="user" size={15} color={COLORS.white} />
                                <Text style={styles.cardTitle}>اطلاعات مشتری</Text>
                            </View>
                            <View style={styles.cardDivider} />

                            {/* شهر */}
                            <Text style={styles.fieldLabel}>شهر *</Text>
                            <TouchableOpacity style={[styles.selector, selectedCity && styles.selectorActive]} onPress={openCityModal}>
                                <Text style={[styles.selectorText, selectedCity && styles.selectorTextActive, { textAlign: "right" }]}>
                                    {selectedCity ? selectedCity.name : "انتخاب شهر..."}
                                </Text>
                                <FontAwesome name="map-marker" size={14} color={selectedCity ? COLORS.primary : COLORS.textMuted} />
                            </TouchableOpacity>

                            {/* مشتری */}
                            <Text style={styles.fieldLabel}>مشتری *</Text>
                            <TouchableOpacity
                                style={[styles.selector, selectedCustomer && styles.selectorActive, !selectedCity && { opacity: 0.6 }]}
                                onPress={openCustomerModal}
                                disabled={!selectedCity}
                            >
                                {selectedCustomer ? (
                                    <View style={styles.customerRow}>
                                        <Text style={[styles.selectorText, styles.selectorTextActive, { textAlign: "right", flex: 1 }]}>
                                            {selectedCustomer.name}
                                        </Text>

                                        <Text style={[styles.customerCode, { marginRight: 8 }]}>
                                            کد: {selectedCustomer.code}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.selectorText, { textAlign: "right", flex: 1 }]}>
                                        انتخاب مشتری...
                                    </Text>
                                )}
                                <FontAwesome name="user" size={14} color={selectedCustomer ? COLORS.primary : COLORS.textMuted} />
                            </TouchableOpacity>

                            {selectedCustomer && (
                                <View style={styles.balanceBox}>
                                    {balanceLoading ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : balance !== null ? (
                                        <Text style={styles.balanceText}>
                                            مانده حساب: <Text style={{ color: balance >= 0 ? COLORS.danger : "#0a8f5e", fontFamily: "IRANYekan-Bold" }}>
                                                {Math.abs(balance).toLocaleString("fa-IR")}
                                            </Text>
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* نوع پرداخت */}
                    <View style={styles.card}>
                        <View style={styles.cardSideBar} />
                        <View style={styles.cardBody}>
                            <View style={styles.cardTitleRow}>
                                <FontAwesome name="list-ul" size={15} color={COLORS.white} />
                                <Text style={styles.cardTitle}>نوع پرداخت</Text>
                            </View>
                            <View style={styles.cardDivider} />

                            <View style={styles.typeRow}>
                                {TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t.key}
                                        style={[styles.typeBtn, paymentType === t.key && styles.typeBtnActive]}
                                        onPress={() => setPaymentType(t.key)}
                                    >
                                        <FontAwesome name={t.icon} size={18} color={paymentType === t.key ? COLORS.white : COLORS.textMuted} />
                                        <Text style={[styles.typeLbl, paymentType === t.key && styles.typeLblActive]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* اطلاعات پرداخت */}
                    {paymentType && (
                        <View style={styles.card}>
                            <View style={styles.cardSideBar} />
                            <View style={styles.cardBody}>
                                <View style={styles.cardTitleRow}>
                                    <FontAwesome name="pencil-square-o" size={15} color={COLORS.white} />
                                    <Text style={styles.cardTitle}>جزئیات پرداخت</Text>
                                </View>
                                <View style={styles.cardDivider} />

                                <Text style={styles.fieldLabel}>مبلغ  *</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="۵٬۰۰۰٬۰۰۰"
                                    value={amount}
                                    onChangeText={(v) => setAmount(formatNumber(v))}
                                />

                                {(paymentType === "transfer" || paymentType === "pos") && (
                                    <>
                                        <Text style={styles.fieldLabel}>
                                            {paymentType === "pos" ? "شماره پیگیری / سریال" : "شماره حواله"} *
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="1234"
                                            value={serial}
                                            onChangeText={(v) => setSerial(onlyNumbers(v))}
                                            keyboardType="numeric"
                                        />
                                    </>
                                )}

                                {paymentType === "check" && (
                                    <>
                                        <Text style={styles.fieldLabel}>تاریخ سررسید (شمسی) *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="1404/11/18"
                                            value={dueDate}
                                            onChangeText={(v) => setDueDate(formatJalaliDate(v))}
                                            keyboardType="numeric"
                                            maxLength={10}
                                        />
                                        <Text style={styles.fieldLabel}>شماره صیادی (۱۶ رقم) *</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="۱۶ رقم"
                                            value={sayyadi}
                                            keyboardType="numeric"
                                            maxLength={16}
                                            onChangeText={(v) => setSayyadi(v.replace(/[^0-9]/g, "").slice(0, 16))}
                                        />
                                    </>
                                )}

                                <Text style={styles.fieldLabel}>توضیحات (اختیاری)</Text>
                                <TextInput
                                    style={[styles.input, styles.inputML]}
                                    placeholder="توضیحات..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    )}

                    {/* تصویر رسید (الزامی) */}
                    {paymentType && (
                        <View style={styles.card}>
                            <View style={styles.cardSideBar} />
                            <View style={styles.cardBody}>
                                <View style={styles.cardTitleRow}>
                                    <FontAwesome name="camera" size={15} color={COLORS.white} />
                                    <Text style={styles.cardTitle}>تصویر رسید *</Text>
                                </View>
                                <View style={styles.cardDivider} />

                                <TouchableOpacity style={styles.imgBox} onPress={pickImage}>
                                    {image ? (
                                        <View>
                                            <Image source={{ uri: image }} style={styles.imgPreview} resizeMode="cover" />
                                            <TouchableOpacity style={styles.removeImg} onPress={() => setImage(null)}>
                                                <Ionicons name="close-circle" size={28} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.imgPlaceholder}>
                                            <FontAwesome name="camera" size={36} color={COLORS.primaryLight} />
                                            <Text style={styles.imgTxt}>عکس رسید الزامی است</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* دکمه ثبت */}
                    {paymentType && (
                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <FontAwesome name="check-circle" size={18} color={COLORS.white} />
                                    <Text style={styles.submitTxt}>ثبت پرداخت</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 50 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* مودال شهر */}
            <Modal visible={cityModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderRow}>
                            <TouchableOpacity onPress={() => setCityModalVisible(false)} style={styles.modalCloseBtn}>
                                <FontAwesome name="times" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>انتخاب شهر</Text>
                        </View>

                        <View style={styles.searchBox}>
                            <FontAwesome name="search" size={14} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="جستجو شهر یا کد..."
                                value={citySearchText}
                                onChangeText={(text) => {
                                    setCitySearchText(text);
                                    const q = normalizeFa(text);
                                    setFilteredCities(cities.filter(c => normalizeFa(c.name).includes(q) || String(c.code).includes(text)));
                                }}
                            />
                        </View>

                        <FlatList
                            data={filteredCities}
                            keyExtractor={(item) => String(item.code)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => selectCity(item)}>
                                    <Text style={styles.modalItemName}>{item.name}</Text>
                                    {item.province && <Text style={styles.modalItemSub}>استان: {item.province}</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* مودال مشتری */}
            <Modal visible={customerModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderRow}>
                            <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.modalCloseBtn}>
                                <FontAwesome name="times" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>مشتری‌های {selectedCity?.name}</Text>
                        </View>

                        <View style={styles.searchBox}>
                            <FontAwesome name="search" size={14} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="نام یا کد مشتری..."
                                value={searchText}
                                onChangeText={(text) => {
                                    setSearchText(text);
                                    const q = normalizeFa(text);
                                    setFilteredCustomers(customers.filter(c => normalizeFa(c.name).includes(q) || String(c.code).includes(text)));
                                }}
                            />
                        </View>

                        <FlatList
                            data={filteredCustomers}
                            keyExtractor={(item) => String(item.code)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => selectCustomer(item)}>
                                    <View style={{ flexDirection: "row-reverse", flex: 1, justifyContent: "space-between" }}>
                                        <Text style={styles.modalItemName}>{item.name}</Text>
                                        <Text style={styles.modalItemCode}>کد: {item.code}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ───
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },

    header: {
        backgroundColor: COLORS.primaryDark,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 50 : 20,
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
        opacity: 0.75,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: { alignItems: "center" },
    headerIconRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontFamily: "IRANYekan-Bold" },

    scroll: { flex: 1 },
    scrollContent: { padding: 16, gap: 16 },

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
    cardSideBar: { width: 5, backgroundColor: COLORS.primary, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
    cardBody: { flex: 1, padding: 16 },
    cardTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 10 },
    cardTitle: { fontSize: 15, color: COLORS.text, fontFamily: "IRANYekan-Bold" },
    cardDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },

    fieldLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontFamily: "IRANYekan",
        textAlign: "right",
        marginBottom: 6,
    },

    selector: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    selectorActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGhost },
    selectorText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textMuted,
        fontFamily: "IRANYekan",
    },
    selectorTextActive: {
        color: COLORS.primaryDark,
        fontFamily: "IRANYekan-Bold",
    },

    customerRow: {
        flex: 1,
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
    },
    customerCode: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontFamily: "IRANYekan",
        backgroundColor: COLORS.primaryGhost,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },

    balanceBox: {
        marginTop: 8,
        padding: 12,
        backgroundColor: COLORS.primaryGhost,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primarySoft,
    },
    balanceText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontFamily: "IRANYekan",
        textAlign: "right",
    },

    typeRow: { flexDirection: "row-reverse", gap: 8 },
    typeBtn: {
        flex: 1,
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        gap: 6,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeLbl: { fontSize: 13, color: COLORS.textMuted, fontFamily: "IRANYekan" },
    typeLblActive: { color: COLORS.white, fontFamily: "IRANYekan-Bold" },

    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        padding: 14,
        fontSize: 15,
        color: COLORS.text,
        fontFamily: "IRANYekan",
        textAlign: "right",
    },
    inputML: { height: 90, textAlignVertical: "top" },

    imgBox: {
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderStyle: "dashed",
    },
    imgPlaceholder: {
        height: 160,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.inputBg,
        gap: 10,
    },
    imgTxt: { color: COLORS.textMuted, fontSize: 14, fontFamily: "IRANYekan" },
    imgPreview: { width: "100%", height: 220 },
    removeImg: { position: "absolute", top: 12, left: 12 },

    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: "row-reverse",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        ...Platform.select({
            ios: { shadowColor: COLORS.primaryDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
            android: { elevation: 6 },
        }),
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitTxt: { color: COLORS.white, fontSize: 16, fontFamily: "IRANYekan-Bold" },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(10,20,45,0.65)", justifyContent: "flex-end" },
    modalSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        maxHeight: "78%",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 20 },
            android: { elevation: 25 },
        }),
    },
    modalHandle: { width: 45, height: 5, backgroundColor: COLORS.border, borderRadius: 3, alignSelf: "center", marginVertical: 10 },
    modalHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    modalCloseBtn: { padding: 8 },
    modalTitle: { fontSize: 17, color: COLORS.text, fontFamily: "IRANYekan-Bold", flex: 1, textAlign: "right" },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        margin: 16,
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.text, fontFamily: "IRANYekan" },

    modalItem: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalItemName: { flex: 1, fontSize: 15, color: COLORS.text, fontFamily: "IRANYekan", textAlign: "right" },
    modalItemCode: { fontSize: 13, color: COLORS.textMuted, fontFamily: "IRANYekan" },
    modalItemSub: { fontSize: 12, color: COLORS.textMuted, fontFamily: "IRANYekan", marginTop: 4 },
});