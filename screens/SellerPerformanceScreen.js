import { Ionicons } from '@expo/vector-icons';
import { toJalaali } from 'jalaali-js';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getSellerPerformance } from "../api";

const getCurrentJalaaliDate = () => {
  const now = new Date();
  const jalaaliDate = toJalaali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  
  return {
    year: jalaaliDate.jy,
    month: jalaaliDate.jm,
    day: jalaaliDate.jd
  };
};

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// پالت رنگی متنوع و زیبا
const chartColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
];

export default function SellerPerformanceScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const currentJalaali = getCurrentJalaaliDate();
  const [selectedMonth, setSelectedMonth] = useState(currentJalaali.month);
  const [selectedYear, setSelectedYear] = useState(currentJalaali.year);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    loadSellerPerformance();
  }, [selectedMonth, selectedYear]);

  const loadSellerPerformance = async () => {
    try {
      setLoading(true);
      const result = await getSellerPerformance(selectedMonth, selectedYear);

      if (!result || result.length === 0) {
        Alert.alert(
          "اطلاع", 
          `در ${persianMonths[selectedMonth - 1]} ${selectedYear} داده‌ای برای فروشنده‌ها موجود نیست`
        );
        setData([]);
        return;
      }

      setData(result);
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("خطا", error.message || "مشکلی در دریافت اطلاعات وجود دارد.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSellerPerformance();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>در حال بارگذاری...</Text>
      </View>
    );
  }

  // داده چارت دونات
  const pieChartData = data.length > 0 ? data.slice(0, 8).map((seller, index) => ({
    name: seller.SellerName?.substring(0, 10) || `فروشنده ${index + 1}`,
    score: seller.Score || 0,
    color: chartColors[index % chartColors.length],
    legendFontColor: "#555",
    legendFontSize: 11
  })) : [];

  const totalScore = pieChartData.reduce((sum, item) => sum + item.score, 0);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* هدر مینیمال */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={28} color="#333" />
        <Text style={styles.headerTitle}>عملکرد فروشنده‌ها</Text>
      </View>

      {/* انتخاب تاریخ */}
      <View style={styles.dateSelector}>
        <View style={styles.yearControl}>
          <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)}>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity onPress={() => setSelectedYear(prev => prev + 1)}>
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.currentButton}
          onPress={() => {
            setSelectedMonth(currentJalaali.month);
            setSelectedYear(currentJalaali.year);
          }}
        >
          <Ionicons name="calendar-outline" size={18} color="#4ECDC4" />
          <Text style={styles.currentButtonText}>امروز</Text>
        </TouchableOpacity>
      </View>

      {/* لیست ماه‌ها */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.monthsContainer}
        contentContainerStyle={styles.monthsContent}
      >
        {persianMonths.map((month, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.monthChip,
              selectedMonth === index + 1 && styles.monthChipActive
            ]}
            onPress={() => setSelectedMonth(index + 1)}
          >
            <Text style={[
              styles.monthChipText,
              selectedMonth === index + 1 && styles.monthChipTextActive
            ]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {data.length > 0 ? (
        <>
          {/* چارت دونات */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Ionicons name="pie-chart" size={20} color="#333" />
              <Text style={styles.chartTitle}>توزیع امتیازات</Text>
            </View>
            
            <PieChart
              data={pieChartData}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="score"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[0, 0]}
              absolute
              hasLegend={false}
            />

            {/* لژند */}
            <View style={styles.legendGrid}>
              {pieChartData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.legendPercent}>
                    {((item.score / totalScore) * 100).toFixed(0)}٪
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* آمار کلی */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={24} color="#4ECDC4" />
              <Text style={styles.statValue}>{data.length}</Text>
              <Text style={styles.statLabel}>فروشنده</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="cash" size={24} color="#FFA07A" />
             {/* <Text style={styles.statValue}>
                {(data.reduce((sum, d) => sum + (d.TotalSalesAmount || 0), 0) / 1000000).toFixed(1)}م
              </Text>*/}
              <Text style={styles.statLabel}>کل فروش</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statValue}>
                {Math.max(...data.map(d => d.Score || 0)).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>بالاترین امتیاز</Text>
            </View>
          </View>

          {/* لیست فروشنده‌ها */}
          <View style={styles.listHeader}>
            <Ionicons name="list" size={20} color="#333" />
            <Text style={styles.listTitle}>رتبه‌بندی</Text>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item.SellerCode}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              
              return (
                <View style={styles.sellerCard}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>

                  <View style={styles.sellerContent}>
                    <View style={styles.sellerHeader}>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {medal && <Text>{medal} </Text>}
                        {item.SellerName || `فروشنده ${item.SellerCode}`}
                      </Text>
                      <View style={styles.scoreTag}>
                        <Ionicons name="star" size={14} color="#FFA07A" />
                        <Text style={styles.scoreValue}>{Math.round(item.Score)}</Text>
                      </View>
                    </View>

                   {/* <View style={styles.sellerStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={14} color="#52B788" />
                        <Text style={styles.statText}>
                          {(item.TotalSalesAmount / 1000000).toFixed(1)}م تومان
                        </Text>
                      </View>
                      
                      {item.TotalReturnAmount > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="arrow-undo" size={14} color="#E76F51" />
                          <Text style={[styles.statText, { color: '#E76F51' }]}>
                           {(item.TotalReturnAmount / 1000000).toFixed(1)}م برگشت
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.statItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                        <Text style={styles.statText}>
                          {(item.NetAmount / 1000000).toFixed(1)}م خالص
                        </Text>
                      </View>
                    </View>*/}
                  </View>
                </View>
              );
            }}
          />

          {/* برترین فروشنده */}
          <View style={styles.topSellerCard}>
            <View style={styles.topSellerBadge}>
              <Ionicons name="ribbon" size={20} color="#FFD700" />
              <Text style={styles.topSellerText}>برترین فروشنده</Text>
            </View>
            <Text style={styles.topSellerName}>{data[0]?.SellerName}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>داده‌ای موجود نیست</Text>
          <Text style={styles.emptySubText}>
            {persianMonths[selectedMonth - 1]} {selectedYear}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'IRANYekan',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'IRANYekan',
    color: '#333',
    marginRight: 8,
  },
  dateSelector: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  yearControl: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  yearText: {
    fontSize: 18,
    fontFamily: 'IRANYekan',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  currentButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FFFE',
    borderRadius: 20,
    gap: 4,
  },
  currentButtonText: {
    fontSize: 13,
    fontFamily: 'IRANYekan',
    color: '#4ECDC4',
  },
  monthsContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    marginTop: 2,
  },
  monthsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  monthChipActive: {
    backgroundColor: '#4ECDC4',
  },
  monthChipText: {
    fontSize: 12,
    fontFamily: 'IRANYekan',
    color: '#666',
  },
  monthChipTextActive: {
    color: '#FFF',
  },
  chartCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  chartHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: 'IRANYekan',
    color: '#333',
  },
  legendGrid: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'IRANYekan',
    color: '#555',
    textAlign: 'right',
  },
  legendPercent: {
    fontSize: 11,
    fontFamily: 'IRANYekan',
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'IRANYekan',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'IRANYekan',
    color: '#999',
  },
  listHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  listTitle: {
    fontSize: 15,
    fontFamily: 'IRANYekan',
    color: '#333',
  },
  sellerCard: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'IRANYekan',
    color: '#666',
  },
  sellerContent: {
    flex: 1,
    gap: 8,
  },
  sellerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'IRANYekan',
    color: '#333',
    textAlign: 'right',
    marginLeft: 8,
  },
  scoreTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreValue: {
    fontSize: 12,
    fontFamily: 'IRANYekan',
    color: '#FFA07A',
  },
  sellerStats: {
    gap: 6,
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 11,
    fontFamily: 'IRANYekan',
    color: '#666',
  },
  topSellerCard: {
    backgroundColor: '#FFFBF0',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  topSellerBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  topSellerText: {
    fontSize: 13,
    fontFamily: 'IRANYekan',
    color: '#B8860B',
  },
  topSellerName: {
    fontSize: 18,
    fontFamily: 'IRANYekan',
    color: '#333',
    marginBottom: 4,
  },
  topSellerAmount: {
    fontSize: 14,
    fontFamily: 'IRANYekan',
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'IRANYekan',
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: 'IRANYekan',
    color: '#CCC',
    marginTop: 4,
  },
});