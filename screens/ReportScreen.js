import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment-jalaali';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getFactorReport } from '../api';

const ReportScreen = () => {
  const [fromDate, setFromDate] = useState(moment().startOf('jMonth'));
  const [toDate, setToDate] = useState(moment());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [userName, setUserName] = useState('کاربر');
  const [moen, setMoen] = useState('');
  const [currentStep, setCurrentStep] = useState('year');
  const [tempDate, setTempDate] = useState(moment());
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

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
            Alert.alert(
              'هشدار',
              'کد فروشنده شما یافت نشد. لطفاً دوباره وارد شوید.'
            );
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

  useEffect(() => {
    if (reportData && reportData.length > 0) {
      const count = reportData.length;
      const amount = reportData.reduce((sum, item) => {
        const price = parseFloat(item.Price) || 0;
        const number = parseFloat(item.Number) || 0;
        return sum + (price * number);
      }, 0);
      
      setTotalCount(count);
      setTotalAmount(amount);
    } else {
      setTotalCount(0);
      setTotalAmount(0);
    }
  }, [reportData]);

  const showPickerFunc = (type) => {
    setPickerType(type);
    setPickerVisible(true);
    setCurrentStep('year');
    setTempDate(type === 'from' ? fromDate : toDate);
  };

  const hidePicker = () => {
    setPickerVisible(false);
    setPickerType(null);
    setCurrentStep('year');
  };

  const handleYearSelect = (year) => {
    const newDate = moment(`${year}/${tempDate.jMonth() + 1}/${tempDate.jDate()}`, 'jYYYY/jM/jD');
    setTempDate(newDate);
    setCurrentStep('month');
  };

  const handleMonthSelect = (month) => {
    const newDate = moment(`${tempDate.jYear()}/${month}/1`, 'jYYYY/jM/jD');
    setTempDate(newDate);
    setCurrentStep('day');
  };

  const handleDaySelect = (day) => {
    const newDate = moment(`${tempDate.jYear()}/${tempDate.jMonth() + 1}/${day}`, 'jYYYY/jM/jD');
    setTempDate(newDate);

    if (pickerType === 'from') setFromDate(newDate);
    else if (pickerType === 'to') setToDate(newDate);

    hidePicker();
  };

  const goBack = () => {
    if (currentStep === 'month') setCurrentStep('year');
    else if (currentStep === 'day') setCurrentStep('month');
  };

  const fetchReport = async () => {
    if (!moen) {
      Alert.alert('خطا', 'کد فروشنده موجود نیست. لطفاً دوباره وارد شوید.');
      return;
    }

    if (!fromDate || !toDate) {
      Alert.alert('خطا', 'تاریخ شروع و پایان الزامی است');
      return;
    }

    setLoading(true);
    try {
      const bodyMoen = moen.toString().trim();
      const start = fromDate.format('jYYYY/jMM/jDD');
      const end = toDate.format('jYYYY/jMM/jDD');

      const data = await getFactorReport(bodyMoen, start, end);
      
      setReportData(data.data || data);
    } catch (err) {
      Alert.alert('خطا', err.message || 'خطا در دریافت گزارش');
    } finally {
      setLoading(false);
    }
  };

  const YearPicker = () => {
    const years = [];
    for (let i = -10; i <= 1; i++) years.push(moment().add(i, 'jYear').jYear());

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>سال را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[styles.pickerItem, tempDate.jYear() === year && styles.selectedItem]}
              onPress={() => handleYearSelect(year)}
            >
              <Text style={[styles.pickerItemText, tempDate.jYear() === year && styles.selectedItemText]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const MonthPicker = () => {
    const months = [
      { number: 1, name: 'فروردین' }, { number: 2, name: 'اردیبهشت' }, { number: 3, name: 'خرداد' },
      { number: 4, name: 'تیر' }, { number: 5, name: 'مرداد' }, { number: 6, name: 'شهریور' },
      { number: 7, name: 'مهر' }, { number: 8, name: 'آبان' }, { number: 9, name: 'آذر' },
      { number: 10, name: 'دی' }, { number: 11, name: 'بهمن' }, { number: 12, name: 'اسفند' }
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>ماه را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {months.map(month => (
            <TouchableOpacity
              key={month.number}
              style={[styles.pickerItem, tempDate.jMonth() + 1 === month.number && styles.selectedItem]}
              onPress={() => handleMonthSelect(month.number)}
            >
              <Text style={[styles.pickerItemText, tempDate.jMonth() + 1 === month.number && styles.selectedItemText]}>
                {month.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const DayPicker = () => {
    const daysInMonth = moment.jDaysInMonth(tempDate.jYear(), tempDate.jMonth());
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>روز را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {days.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.pickerItem, tempDate.jDate() === day && styles.selectedItem]}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={[styles.pickerItemText, tempDate.jDate() === day && styles.selectedItemText]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'year': return <YearPicker />;
      case 'month': return <MonthPicker />;
      case 'day': return <DayPicker />;
      default: return <YearPicker />;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>فروشنده: {item.MoenName || '---'}</Text>
      <Text style={styles.itemText}>مشتری: {item.BuyerName || '---'}</Text>
      <Text style={styles.itemText}>قیمت: {formatNumber(item.Price || '0')} </Text>
      <Text style={styles.itemText}>تعداد: {item.Number || '0'}</Text>
      <Text style={styles.itemText}>تاریخ: {item.DateF || '---'}</Text>
    </View>
  );

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{userName}</Text>

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateButton} onPress={() => showPickerFunc('to')}>
          <Text style={styles.dateButtonText}>تا: {toDate.format('jYYYY/jMM/jDD')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => showPickerFunc('from')}>
          <Text style={styles.dateButtonText}>از: {fromDate.format('jYYYY/jMM/jDD')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.fetchButton, 
          { backgroundColor: loading ? '#94a3b8' : '#1e3a8a' }
        ]} 
        onPress={fetchReport}
        disabled={loading}
      >
        <Text style={styles.fetchButtonText}>
          {loading ? 'در حال دریافت...' : 'دریافت گزارش'}
        </Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              {currentStep !== 'year' && (
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← بازگشت</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {pickerType === 'from' ? 'تاریخ شروع' : 'تاریخ پایان'}
              </Text>
              <TouchableOpacity onPress={hidePicker} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.currentDatePreview}>
              <Text style={styles.currentDateText}>{tempDate.format('jYYYY/jMM/jDD')}</Text>
            </View>
            <View style={styles.pickerContent}>{renderCurrentStep()}</View>
          </View>
        </View>
      </Modal>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={reportData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {reportData.length === 0 ? 'گزارشی برای این بازه وجود ندارد' : ''}
              </Text>
            }
          />
        )}
      </View>

      {(reportData && reportData.length > 0) && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>تعداد کل فاکتورها:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalCount)} عدد</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>مجموع مبلغ:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalAmount)} </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1e3a8a', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  dateRow: { 
    flexDirection: 'row-reverse',
    justifyContent: 'space-between', 
    marginBottom: 15 
  },
  dateButton: { 
    backgroundColor: '#e0e7ff', 
    padding: 12, 
    borderRadius: 8, 
    flex: 1, 
    marginHorizontal: 5 
  },
  dateButtonText: { 
    color: '#1e3a8a', 
    textAlign: 'center', 
    fontSize: 16 
  },
  fetchButton: { 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15
  },
  fetchButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  listContainer: {
    flex: 1,
    marginBottom: 10
  },
  flatListContent: {
    paddingBottom: 10
  },
  itemContainer: { 
    backgroundColor: '#f3f4f6', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10 
  },
  itemText: { 
    direction:"rtl",
    fontSize: 14, 
    color: '#111', 
    marginBottom: 4 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#555' 
  },
  summaryContainer: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 8,
    marginTop: 'auto',
    marginBottom: 10
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContainer: { 
    width: '90%', 
    maxHeight: '70%', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  modalHeader: { 
    flexDirection: 'row-reverse',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    backgroundColor: '#f8f9fa' 
  },
  modalTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1e3a8a', 
    textAlign: 'center', 
    flex: 1 
  },
  backButton: { 
    padding: 8 
  },
  backButtonText: { 
    color: '#1e3a8a', 
    fontSize: 14 
  },
  closeButton: { 
    padding: 8 
  },
  closeButtonText: { 
    color: '#ff3b30', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  currentDatePreview: { 
    padding: 16, 
    backgroundColor: '#e0e7ff', 
    alignItems: 'center' 
  },
  currentDateText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e3a8a' 
  },
  pickerContent: { 
    height: 300 
  },
  stepContainer: { 
    flex: 1, 
    padding: 16 
  },
  stepTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 16, 
    color: '#333' 
  },
  scrollContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center' 
  },
  pickerItem: { 
    width: 70, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    margin: 6, 
    borderRadius: 10, 
    backgroundColor: '#f5f5f5', 
    borderWidth: 2, 
    borderColor: 'transparent' 
  },
  selectedItem: { 
    backgroundColor: '#1e3a8a', 
    borderColor: '#1e3a8a' 
  },
  pickerItemText: { 
    fontSize: 14, 
    color: '#333', 
    fontWeight: '500' 
  },
  selectedItemText: { 
    color: 'white', 
    fontWeight: 'bold' 
  }
});

export default ReportScreen;