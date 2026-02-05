import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProducts, getStoredManfiStatus, refreshManfiStatus } from "../api";
import { CartContext } from "../CartContext";
import FullscreenImageModal from "../components/FullscreenImageModal";
import ModalProduct from "../components/ModalProduct";
import ProductCard from "../components/ProductCard";
import styles from "../styles/ProductListScreen.styles";

const { width, height } = Dimensions.get("window");

const demoProducts = [
  {
    Code: "1001",
    Name: "مایع ظرفشویی گلرنگ",
    Price: "45000",
    PriceF1: "45000",
    PriceF2: "43000",
    PriceF3: "42000",
    PriceF4: "41000",
    PriceF5: "40000",
    PriceF6: "39000",
    Mbna: "12",
    MainGroupCode: "1",
    SubGroupCode: "101",
    imageUrl: null,
    MainUnit: "بسته",
    SlaveUnit: "عدد",
    Mojoodi: 50,
    MoenName: "گلرنگ"
  },
  {
    Code: "1002",
    Name: "پودر لباسشویی OMO",
    Price: "85000",
    PriceF1: "85000",
    PriceF2: "83000",
    PriceF3: "82000",
    PriceF4: "81000",
    PriceF5: "80000",
    PriceF6: "79000",
    Mbna: "6",
    MainGroupCode: "1",
    SubGroupCode: "102",
    imageUrl: null,
    MainUnit: "کارتن",
    SlaveUnit: "بسته",
    Mojoodi: 30,
    MoenName: "یونیلیور"
  },
  {
    Code: "2001",
    Name: "دستمال کاغذی ایزی پیک",
    Price: "35000",
    PriceF1: "35000",
    PriceF2: "33000",
    PriceF3: "32000",
    PriceF4: "31000",
    PriceF5: "30000",
    PriceF6: "29000",
    Mbna: "10",
    MainGroupCode: "2",
    SubGroupCode: "201",
    imageUrl: null,
    MainUnit: "بسته بزرگ",
    SlaveUnit: "بسته",
    Mojoodi: 80,
    MoenName: "هفت"
  },
];

const normalizePersian = (text) => {
  if (!text) return "";
  return text
    .replace(/\u064A/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .toLowerCase();
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ProductListScreen({ route, navigation }) {
  const mainGroupCode = route?.params?.mainGroupCode ?? null;
  const mainGroupName = route?.params?.mainGroupName ?? "";
  const subGroupCode = route?.params?.subGroupCode ?? null;
  const subGroupName = route?.params?.subGroupName ?? "";
  const isDemoModeParam = route?.params?.isDemoMode ?? false;
  const buyerCode = route?.params?.buyerCode ?? null;

  const { cart, addToCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(isDemoModeParam);
  const [refreshing, setRefreshing] = useState(false);
  const [pricingInfo, setPricingInfo] = useState(null);

  // State برای وضعیت manfi
  const [hasManfiAccess, setHasManfiAccess] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mbnaCount, setMbnaCount] = useState("");
  const [slaveCount, setSlaveCount] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // 🔥 State های Modal تصویر فول‌اسکرین (اینجا باید باشه!)
  const [fullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pullAnim = useRef(new Animated.Value(0)).current;
  const refreshAnim = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -95],
    extrapolate: "clamp",
  });

  const cartSummary = {
    totalItems: cart.reduce((sum, item) => sum + (item.totalCount || 0), 0),
    totalPrice: cart.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0
    ),
    uniqueProducts: cart.length,
  };

  // دریافت وضعیت manfi هنگام لود صفحه
  useEffect(() => {
    const checkManfiAccess = async () => {
      try {
        let manfiStatus = await getStoredManfiStatus();

        try {
          manfiStatus = await refreshManfiStatus();
        } catch (refreshError) {
        }

        setHasManfiAccess(manfiStatus);

      } catch (error) {
        console.log('❌ خطا در بررسی وضعیت manfi:', error);
        setHasManfiAccess(false);
      }
    };

    checkManfiAccess();
  }, []);

  const fetchProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        Animated.timing(refreshAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        setLoading(true);
      }

      let data;
      let productsData = [];
      let pricingData = null;

      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        productsData = demoProducts;
        pricingData = {
          buyerCode: buyerCode,
          ghk: 0,
          priceColumn: 'PriceF1',
          priceLabel: 'PriceF1'
        };
      } else {
        const result = await getProducts(mainGroupCode, subGroupCode, buyerCode);
        productsData = result.products || [];
        pricingData = result.pricing || {
          buyerCode: buyerCode,
          ghk: 0,
          priceColumn: 'PriceF1',
          priceLabel: 'PriceF1'
        };
      }

      const allProducts = Array.isArray(productsData) ? productsData : [];

      let filtered = allProducts;

      if (mainGroupCode && subGroupCode) {
        filtered = allProducts.filter((p) =>
          String(p.MainGroupCode) === String(mainGroupCode) &&
          String(p.SubGroupCode) === String(subGroupCode)
        );
      } else if (mainGroupCode) {
        filtered = allProducts.filter((p) =>
          String(p.MainGroupCode) === String(mainGroupCode)
        );
      }

      if (filtered.length > 0) {
        const productsWithCorrectPrice = filtered.map(product => {
          const displayPrice = product.CustomerPrice || product.Price ||
            (pricingData?.priceColumn === 'PriceF5' ? product.PriceF5 :
              pricingData?.priceColumn === 'PriceF4' ? product.PriceF4 :
                pricingData?.priceColumn === 'PriceF3' ? product.PriceF3 :
                  pricingData?.priceColumn === 'PriceF2' ? product.PriceF2 :
                    product.PriceF1);

          return {
            ...product,
            Price: displayPrice,
            DisplayPrice: displayPrice
          };
        });

        setProducts(productsWithCorrectPrice);
        setFilteredProducts(productsWithCorrectPrice);
      } else {
        setProducts(filtered);
        setFilteredProducts(filtered);
      }

      setPricingInfo(pricingData);
      setError(null);

    } catch (err) {
      let filtered = demoProducts;

      if (mainGroupCode && subGroupCode) {
        filtered = demoProducts.filter((p) =>
          String(p.MainGroupCode) === String(mainGroupCode) &&
          String(p.SubGroupCode) === String(subGroupCode)
        );
      } else if (mainGroupCode) {
        filtered = demoProducts.filter((p) =>
          String(p.MainGroupCode) === String(mainGroupCode)
        );
      }

      setProducts(filtered);
      setFilteredProducts(filtered);
      setPricingInfo({
        buyerCode: buyerCode,
        ghk: 0,
        priceColumn: 'PriceF1',
        priceLabel: 'PriceF1'
      });
      setIsDemoMode(true);
      setError("خطا در بارگذاری داده‌ها. از حالت نمایشی استفاده می‌شود.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(pullAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(refreshAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const onRefresh = () => {
    fetchProducts(true);
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        if (offsetY < -150 && !refreshing) {
          onRefresh();
        }

        if (offsetY < -50 && !refreshing) {
          const pullDistance = Math.min(Math.abs(offsetY + 50) / 2, 60);
          pullAnim.setValue(pullDistance);
        }
      }
    }
  );

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        if (!isDemoModeParam) {
          const demoMode = await AsyncStorage.getItem("is_demo_mode");
          setIsDemoMode(demoMode === "true");
        }
      } catch (err) {
        console.warn("Error checking demo mode:", err.message);
      }
    };

    checkDemoMode();
  }, [isDemoModeParam]);

  useEffect(() => {
    fetchProducts();
  }, [mainGroupCode, subGroupCode, isDemoMode, buyerCode]);

  useEffect(() => {
    const filtered = products.filter((p) => {
      const matchesCode =
        searchCode.trim() === "" ||
        p.Code.toString().includes(searchCode.trim());
      const matchesName =
        searchName.trim() === "" ||
        normalizePersian(p.Name).includes(normalizePersian(searchName.trim()));
      return matchesCode && matchesName;
    });
    setFilteredProducts(filtered);
  }, [searchCode, searchName, products]);

  useEffect(() => {
    if (!selectedProduct) return;
    const mbnaVal = parseFloat(mbnaCount) || 0;
    const slaveVal = parseFloat(slaveCount) || 0;
    const total = mbnaVal * parseFloat(selectedProduct.Mbna) + slaveVal;
    setTotalCount(total);
  }, [mbnaCount, slaveCount, selectedProduct]);

  const openModal = (item) => {
    setSelectedProduct(item);

    const existingCartItem = cart.find(cartItem => cartItem.Code === item.Code);

    if (existingCartItem) {
      setMbnaCount(existingCartItem.countMbna?.toString() || "0");
      setSlaveCount(existingCartItem.countSlave?.toString() || "0");
      setTotalCount(existingCartItem.totalCount || 0);
    } else {
      setMbnaCount("");
      setSlaveCount("");
      setTotalCount(0);
    }

    setModalVisible(true);
  };

  // 🔥 Handler برای باز کردن تصویر فول‌اسکرین
  const handleImagePress = (imageUrl) => {
    console.log('🖼️ باز کردن تصویر فول‌اسکرین:', imageUrl);
    setFullscreenImageUrl(imageUrl);
    setFullscreenImageVisible(true);
  };

  // 🔥 Handler برای بستن تصویر فول‌اسکرین
  const handleCloseFullscreen = () => {
    console.log('✕ بستن تصویر فول‌اسکرین');
    setFullscreenImageVisible(false);
    setTimeout(() => {
      setFullscreenImageUrl(null);
    }, 300);
  };

  // تابع handleAddToCart با پشتیبانی manfi
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (totalCount === 0) {
      Alert.alert(
        "خطا در ثبت",
        "لطفاً تعداد کالا را مشخص کنید. تعداد کل نمی‌تواند صفر باشد.",
        [{ text: "متوجه شدم" }]
      );
      return;
    }

    if (mbnaCount === "" && slaveCount === "") {
      Alert.alert("خطا در ثبت", "لطفاً تعداد مبنا یا تعداد جز را وارد کنید.", [
        { text: "متوجه شدم" },
      ]);
      return;
    }

    const stock = parseFloat(selectedProduct.Mojoodi) || 0;

    if (!hasManfiAccess && totalCount > stock) {
      Alert.alert(
        "خطای موجودی",
        `تعداد وارد شده (${totalCount}) از موجودی (${stock}) بیشتر است.\n\nشما اجازه فروش منفی ندارید.`,
        [{ text: "باشه" }]
      );
      return;
    }

    const productPrice = parseFloat(selectedProduct.Price) || parseFloat(selectedProduct.PriceF1) || 0;

    addToCart({
      ...selectedProduct,
      countMbna: parseFloat(mbnaCount) || 0,
      countSlave: parseFloat(slaveCount) || 0,
      totalCount,
      totalPrice: totalCount * productPrice,
      Image: selectedProduct.imageUrl,
      isDemo: isDemoMode,
      pricingInfo: pricingInfo
    });

    setModalVisible(false);
  };

  const CustomRefreshHeader = () => {
    const rotate = pullAnim.interpolate({
      inputRange: [0, 60],
      outputRange: ['0deg', '180deg'],
    });

    const opacity = pullAnim.interpolate({
      inputRange: [0, 30, 60],
      outputRange: [0, 0.5, 1],
    });

    const translateY = pullAnim.interpolate({
      inputRange: [0, 60],
      outputRange: [-10, 10],
    });

    return (
      <View style={customStyles.refreshHeader}>
        <Animated.View
          style={[
            customStyles.refreshIndicator,
            {
              opacity,
              transform: [
                { translateY },
                { rotate }
              ]
            }
          ]}
        >
          {refreshing ? (
            <View style={customStyles.refreshLoading}>
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text style={customStyles.refreshLoadingText}>در حال بارگذاری...</Text>
            </View>
          ) : (
            <View style={customStyles.refreshPull}>
              <Text style={customStyles.refreshIcon}>⬇️</Text>
              <Text style={customStyles.refreshText}>برای بارگذاری مجدد بکشید</Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text style={styles.loadingText}>
              {isDemoMode
                ? "بارگذاری داده‌های نمایشی..."
                : "در حال بارگذاری کالاها..."}
            </Text>
            {buyerCode && (
              <Text style={customStyles.loadingSubtext}>
                در حال دریافت قیمت‌های ویژه مشتری...
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>خطا در بارگذاری</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={customStyles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={customStyles.refreshButtonText}>بارگذاری مجدد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const pageTitle = subGroupName
    ? `${mainGroupName} - ${subGroupName}`
    : mainGroupName || "همه محصولات";

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.container} direction="rtl">
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{pageTitle}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerSubtitle}>
                {filteredProducts.length} کالا
              </Text>
              {isDemoMode && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>نمایشی</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="جستجوی کد کالا"
                placeholderTextColor="#9ca3af"
                value={searchCode}
                keyboardType="numeric"
                onChangeText={setSearchCode}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="جستجوی نام کالا"
                placeholderTextColor="#9ca3af"
                value={searchName}
                onChangeText={setSearchName}
              />
            </View>

            {(searchCode || searchName) && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => {
                  setSearchCode("");
                  setSearchName("");
                }}
              >
                <Text style={styles.clearSearchText}>پاک کردن جستجو</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <CustomRefreshHeader />

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>کالایی پیدا نشد</Text>
              <Text style={styles.emptyText}>
                {searchCode || searchName
                  ? "لطفاً جستجوی دیگری امتحان کنید"
                  : "هیچ کالایی در این گروه وجود ندارد"}
              </Text>
              <TouchableOpacity
                style={customStyles.refreshButton}
                onPress={onRefresh}
              >
                <Text style={customStyles.refreshButtonText}>بارگذاری مجدد</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <AnimatedFlatList
            direction="rtl"
            data={filteredProducts}
            keyExtractor={(item, index) => String(item?.Code || index)}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={() => openModal(item)}
                onImagePress={handleImagePress}
                isDemo={isDemoMode}
                pricingInfo={pricingInfo}
                cart={cart}
              />
            )}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: 130,
                paddingBottom: cart.length > 0 ? (Platform.OS === 'ios' ? 100 : 120) : 20
              },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#1e3a8a"]}
                tintColor="#1e3a8a"
                progressViewOffset={120}
              />
            }
          />
        )}

        {cart.length > 0 && (
          <View style={[styles.cartSummary, { paddingBottom: Platform.OS === 'ios' ? 10 : 10 }]}>
            <View style={styles.cartSummaryContent}>
              <View style={styles.cartSummaryInfo}>
                <Text style={styles.cartSummaryText}>
                  🛒 {cartSummary.uniqueProducts} کالا • {cartSummary.totalItems} عدد
                </Text>
                <Text style={styles.cartSummaryPrice}>
                  {cartSummary.totalPrice.toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cartSummaryButton}
                onPress={() => navigation.navigate("Cart")}
              >
                <Text style={styles.cartSummaryButtonText}>مشاهده سبد خرید</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedProduct && (
          <ModalProduct
            visible={modalVisible}
            product={selectedProduct}
            mbnaCount={mbnaCount}
            slaveCount={slaveCount}
            totalCount={totalCount}
            setMbnaCount={setMbnaCount}
            setSlaveCount={setSlaveCount}
            onClose={() => setModalVisible(false)}
            onAddToCart={handleAddToCart}
            isDemo={isDemoMode}
            pricingInfo={pricingInfo}
            cart={cart}
          />
        )}

        {/* 🔥 Modal تصویر فول‌اسکرین */}
        <FullscreenImageModal
          visible={fullscreenImageVisible}
          imageUrl={fullscreenImageUrl}
          onClose={handleCloseFullscreen}
        />
      </View>
    </SafeAreaView>
  );
}

const customStyles = {
  refreshHeader: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#1e3a8a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  refreshPull: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '700',
    textAlign: 'center',
  },
  refreshLoadingText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '700',
    marginRight: 8,
  },
  refreshButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#1e3a8a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
};