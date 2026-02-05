// components/PersianDatePicker.js
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PersianDatePicker = ({ visible, onClose, onDateSelect, selectedDate }) => {
  const [currentStep, setCurrentStep] = useState('year');
  const [tempDate, setTempDate] = useState({ year: null, month: null, day: null });

  useEffect(() => {
    if (visible && selectedDate) {
      const [year, month, day] = selectedDate.split('/').map(Number);
      setTempDate({ year, month, day });
    } else if (visible) {
      const current = new Date();
      const { jy, jm, jd } = require('jalaali-js').toJalaali(
        current.getFullYear(),
        current.getMonth() + 1,
        current.getDate()
      );
      setTempDate({ year: jy, month: jm, day: jd });
    }
  }, [visible, selectedDate]);

  const years = [];
  const currentYear = tempDate.year || 1403;
  for (let i = currentYear - 10; i <= currentYear + 1; i++) {
    years.push(i);
  }

  const months = [
    { number: 1, name: 'فروردین' },
    { number: 2, name: 'اردیبهشت' },
    { number: 3, name: 'خرداد' },
    { number: 4, name: 'تیر' },
    { number: 5, name: 'مرداد' },
    { number: 6, name: 'شهریور' },
    { number: 7, name: 'مهر' },
    { number: 8, name: 'آبان' },
    { number: 9, name: 'آذر' },
    { number: 10, name: 'دی' },
    { number: 11, name: 'بهمن' },
    { number: 12, name: 'اسفند' }
  ];

  const getDaysInMonth = (year, month) => {
    return require('jalaali-js').jalaaliMonthLength(year, month);
  };

  const handleYearSelect = (year) => {
    setTempDate(prev => ({ ...prev, year }));
    setCurrentStep('month');
  };

  const handleMonthSelect = (month) => {
    setTempDate(prev => ({ ...prev, month }));
    setCurrentStep('day');
  };

  const handleDaySelect = (day) => {
    const finalDate = `${tempDate.year}/${String(tempDate.month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onDateSelect(finalDate);
  };

  const goBack = () => {
    if (currentStep === 'month') setCurrentStep('year');
    else if (currentStep === 'day') setCurrentStep('month');
  };

  const renderYearPicker = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>سال را انتخاب کنید</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.pickerItem,
              tempDate.year === year && styles.selectedItem
            ]}
            onPress={() => handleYearSelect(year)}
          >
            <Text style={[
              styles.pickerItemText,
              tempDate.year === year && styles.selectedItemText
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMonthPicker = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>ماه را انتخاب کنید</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {months.map(month => (
          <TouchableOpacity
            key={month.number}
            style={[
              styles.pickerItem,
              tempDate.month === month.number && styles.selectedItem
            ]}
            onPress={() => handleMonthSelect(month.number)}
          >
            <Text style={[
              styles.pickerItemText,
              tempDate.month === month.number && styles.selectedItemText
            ]}>
              {month.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDayPicker = () => {
    const daysInMonth = getDaysInMonth(tempDate.year, tempDate.month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>روز را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {days.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.pickerItem,
                tempDate.day === day && styles.selectedItem
              ]}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={[
                styles.pickerItemText,
                tempDate.day === day && styles.selectedItemText
              ]}>
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
      case 'year': return renderYearPicker();
      case 'month': return renderMonthPicker();
      case 'day': return renderDayPicker();
      default: return renderYearPicker();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            {currentStep !== 'year' && (
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#1e3a8a" />
                <Text style={styles.backButtonText}>بازگشت</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.modalTitle}>
              انتخاب تاریخ
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#ff3b30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.currentDatePreview}>
            <Text style={styles.currentDateText}>
              {tempDate.year && tempDate.month && tempDate.day 
                ? `${tempDate.year}/${String(tempDate.month).padStart(2, '0')}/${String(tempDate.day).padStart(2, '0')}`
                : 'تاریخ انتخاب نشده'
              }
            </Text>
          </View>
          
          <View style={styles.pickerContent}>
            {renderCurrentStep()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  backButtonText: {
    color: '#1e3a8a',
    fontSize: 14,
    marginRight: 4
  },
  closeButton: {
    padding: 8
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

export default PersianDatePicker;