import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMainGroups, getSubGroups } from "../api";
import styles from "../styles/GroupListScreenStyles";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 3 - 20;

// داده‌های دمو برای سرگروه‌ها
const demoMainGroups = [
  { CodeGroup: "1", NameGroup: "شوینده" },
  { CodeGroup: "2", NameGroup: "بهداشتی" },
  { CodeGroup: "3", NameGroup: "غذایی" },
  { CodeGroup: "4", NameGroup: "آرایشی" },
];

// داده‌های دمو برای زیرگروه‌ها
const demoSubGroups = {
  "1": [
    { CodeGroup: "101", NameGroup: "مایع ظرفشویی", TopCode: "1" },
    { CodeGroup: "102", NameGroup: "پودر لباسشویی", TopCode: "1" },
    { CodeGroup: "103", NameGroup: "پاک‌کننده سطوح", TopCode: "1" },
  ],
  "2": [
    { CodeGroup: "201", NameGroup: "دستمال کاغذی", TopCode: "2" },
    { CodeGroup: "202", NameGroup: "شامپو", TopCode: "2" },
    { CodeGroup: "203", NameGroup: "صابون", TopCode: "2" },
  ],
  "3": [
    { CodeGroup: "301", NameGroup: "روغن", TopCode: "3" },
    { CodeGroup: "302", NameGroup: "برنج", TopCode: "3" },
    { CodeGroup: "303", NameGroup: "حبوبات", TopCode: "3" },
  ],
  "4": [
    { CodeGroup: "401", NameGroup: "کرم مرطوب‌کننده", TopCode: "4" },
    { CodeGroup: "402", NameGroup: "لوسیون", TopCode: "4" },
    { CodeGroup: "403", NameGroup: "ماسک صورت", TopCode: "4" },
  ],
};

// تابع برای انتخاب ایکن بر اساس نام گروه
const getGroupIcon = (groupName) => {
  const name = groupName?.toLowerCase() || "";
  
  // شوینده
  if (name.includes("شوینده")) {
    return { library: "MaterialIcons", name: "cleaning-services", color: "#00BCD4" };
  }
  
  // بهداشتی
  if (name.includes("بهداشت") || name.includes("بهداشتی")) {
    return { library: "MaterialIcons", name: "health-and-safety", color: "#4CAF50" };
  }
  
  // غذایی
  if (name.includes("غذا") || name.includes("غذایی")) {
    return { library: "MaterialIcons", name: "restaurant-menu", color: "#FF9800" };
  }
  
  // سموم کشاورزی
  if (name.includes("سموم") || name.includes("کشاورز") || name.includes("کشاورزی")) {
    return { library: "MaterialIcons", name: "agriculture", color: "#8BC34A" };
  }
  
  // آرایشی
  if (name.includes("آرایش") || name.includes("آرایشی")) {
    return { library: "MaterialIcons", name: "face-retouching-natural", color: "#E91E63" };
  }
  
  // متفرقه
  if (name.includes("متفرقه")) {
    return { library: "MaterialIcons", name: "widgets", color: "#9C27B0" };
  }
  
  // پیش‌فرض
  return { library: "MaterialIcons", name: "category", color: "#0622a3" };
};

export default function GroupListScreen({ navigation }) {
  const [mainGroups, setMainGroups] = useState([]);
  const [subGroups, setSubGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // State برای مدیریت سلسله مراتب
  const [selectedMainGroup, setSelectedMainGroup] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const demoMode = await AsyncStorage.getItem("is_demo_mode");
        setIsDemoMode(demoMode === "true");
      } catch (err) {
        console.warn("Error checking demo mode:", err.message);
      }
    };

    checkDemoMode();
  }, []);

  useEffect(() => {
    fetchMainGroups();
  }, [isDemoMode]);

  // دریافت سرگروه‌ها
  const fetchMainGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemoMode) {
        setMainGroups(demoMainGroups);
        setLoading(false);
        return;
      }
      const data = await getMainGroups();
      // فیلتر کردن فقط سرگروه‌ها (اگه API درست کار نکرد)
      const onlyMainGroups = data.filter(g => !g.TopCode || g.TopCode === null);
      setMainGroups(onlyMainGroups.length > 0 ? onlyMainGroups : data);
    } catch (err) {
      console.error("❌ خطا در دریافت سرگروه‌ها:", err);
      setError(err.message);
      
      if (!isDemoMode) {
        setIsDemoMode(true);
        setMainGroups(demoMainGroups);
      }
    } finally {
      setLoading(false);
    }
  };

  // دریافت زیرگروه‌های یک سرگروه
  const fetchSubGroups = async (mainGroupCode, mainGroupName) => {
    try {
      setLoading(true);
      setError(null);
      if (isDemoMode) {
        const demoSubs = demoSubGroups[mainGroupCode] || [];
        setSubGroups(demoSubs);
        setLoading(false);
        return;
      }

      const data = await getSubGroups(mainGroupCode);
      
      setSubGroups(data);
    } catch (err) {
      console.error("❌ خطا در دریافت زیرگروه‌ها:", err);
      setError(err.message);
      
      if (!isDemoMode) {
        const demoSubs = demoSubGroups[mainGroupCode] || [];
        setSubGroups(demoSubs);
      }
    } finally {
      setLoading(false);
    }
  };

  // انتخاب سرگروه
  const handleMainGroupPress = (item) => {
    setSelectedMainGroup(item);
    setBreadcrumb([{ name: item.NameGroup, code: item.CodeGroup }]);
    fetchSubGroups(item.CodeGroup, item.NameGroup);
  };

  // انتخاب زیرگروه و رفتن به لیست محصولات
  const handleSubGroupPress = (item) => {
    navigation.navigate("ProductList", {
      mainGroupCode: selectedMainGroup.CodeGroup,
      mainGroupName: selectedMainGroup.NameGroup,
      subGroupCode: item.CodeGroup,
      subGroupName: item.NameGroup,
      isDemoMode: isDemoMode,
    });
  };

  // بازگشت به سرگروه‌ها
  const handleBackToMainGroups = () => {
    setSelectedMainGroup(null);
    setSubGroups([]);
    setBreadcrumb([]);
  };

  const renderMainGroupItem = ({ item }) => {
    const iconConfig = getGroupIcon(item.NameGroup);
    const IconComponent = iconConfig.library === "FontAwesome" ? FontAwesome : MaterialIcons;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleMainGroupPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '15' }]}>
            <IconComponent 
              name={iconConfig.name} 
              size={32} 
              color={iconConfig.color} 
            />
          </View>
          
          <Text style={styles.name} numberOfLines={2}>
            {item.NameGroup}
          </Text>
          
          <View style={[styles.badge, { backgroundColor: iconConfig.color }]}>
            <Text style={styles.badgeText}>مشاهده</Text>
            <MaterialIcons name="arrow-back" size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubGroupItem = ({ item }) => {
    const iconConfig = getGroupIcon(item.NameGroup);
    const IconComponent = iconConfig.library === "FontAwesome" ? FontAwesome : MaterialIcons;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSubGroupPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '15' }]}>
            <IconComponent 
              name="subdirectory-arrow-left" 
              size={32} 
              color={iconConfig.color} 
            />
          </View>
          
          <Text style={styles.name} numberOfLines={2}>
            {item.NameGroup}
          </Text>
          
          <View style={[styles.badge, { backgroundColor: iconConfig.color }]}>
            <Text style={styles.badgeText}>محصولات</Text>
            <MaterialIcons name="arrow-back" size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#0622a3" />
          <Text style={styles.loadingText}>
            {selectedMainGroup 
              ? "در حال بارگذاری زیرگروه‌ها..."
              : "در حال بارگذاری گروه‌ها..."}
          </Text>
        </View>
      </View>
    );
  }

  if (error && !isDemoMode) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>خطا در بارگذاری</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setIsDemoMode(true);
              if (selectedMainGroup) {
                fetchSubGroups(selectedMainGroup.CodeGroup, selectedMainGroup.NameGroup);
              } else {
                fetchMainGroups();
              }
            }}
          >
            <MaterialIcons name="visibility" size={20} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.demoButtonText}>
              استفاده از داده‌های نمایشی
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentGroups = selectedMainGroup ? subGroups : mainGroups;
  const currentTitle = selectedMainGroup 
    ? `زیرگروه‌های ${selectedMainGroup.NameGroup}` 
    : "گروه‌های اصلی";

  return (
    <View style={styles.container}>
      {/* هدر */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {selectedMainGroup && (
            <TouchableOpacity 
              onPress={handleBackToMainGroups}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-forward" size={24} color="#0622a3" />
            </TouchableOpacity>
          )}
          
          <MaterialIcons 
            name={selectedMainGroup ? "subdirectory-arrow-left" : "category"} 
            size={28} 
            color="#0622a3" 
          />
          
          <Text style={styles.headerTitle}>
            {currentTitle}
            {isDemoMode && " (نمایشی)"}
          </Text>
        </View>
        
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <View style={styles.breadcrumbContainer}>
            <TouchableOpacity onPress={handleBackToMainGroups}>
            </TouchableOpacity>
            {breadcrumb.map((crumb, index) => (
              <View key={index} style={styles.breadcrumbWrapper}>
              </View>
            ))}
          </View>
        )}
        
        <Text style={styles.headerSubtitle}>
          {isDemoMode && " • حالت نمایشی"}
        </Text>

        {isDemoMode && (
          <View style={styles.demoBadge}>
            <MaterialIcons name="visibility" size={16} color="#FF9500" />
            <Text style={styles.demoBadgeText}>حالت نمایشی فعال</Text>
          </View>
        )}
      </View>

      {/* لیست گروه‌ها */}
      <FlatList
        data={currentGroups}
        keyExtractor={(item) => item.CodeGroup.toString()}
        renderItem={selectedMainGroup ? renderSubGroupItem : renderMainGroupItem}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}