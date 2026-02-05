// components/PersianCalendar.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, Leaf, Sun, Wind, Snowflake } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const PersianCalendar = ({ onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(1403);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const today = new Date();
    const persianDate = gregorianToPersian(today);
    setCurrentMonth(persianDate.month - 1);
    setCurrentYear(persianDate.year);
  }, []);

  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const gregorianToPersian = (date) => {
    let gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    
    let jy, jm, jd;
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    
    if (gy > 1600) {
      jy = 979;
      gy -= 1600;
    } else {
      jy = 0;
      gy -= 621;
    }
    
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + 
               (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }
    
    return { year: jy, month: jm, day: jd };
  };

  const persianToGregorian = (jy, jm, jd) => {
    let gy, gm, gd;
    let yearG = jy;
    
    if (yearG > 979) {
      gy = 1600;
      yearG -= 979;
    } else {
      gy = 621;
    }
    
    let days = (365 * yearG) + ((Math.floor(yearG / 33)) * 8) + (Math.floor(((yearG % 33) + 3) / 4)) + 78 + jd;
    
    if (jm < 7) {
      days += (jm - 1) * 31;
    } else {
      days += ((jm - 7) * 30) + 186;
    }
    
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    
    let leap = true;
    if (days >= 36525) {
      days--;
      gy += 100 * Math.floor(days / 36524);
      days %= 36524;
      
      if (days >= 365) {
        days++;
      }
    }
    
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    
    if (days >= 366) {
      leap = false;
      days--;
      gy += Math.floor(days / 365);
      days %= 365;
    }
    
    const g_d_m = [0, 31, leap ? 60 : 59, leap ? 91 : 90, leap ? 121 : 120, leap ? 152 : 151, 
                   leap ? 182 : 181, leap ? 213 : 212, leap ? 244 : 243, leap ? 274 : 273, 
                   leap ? 305 : 304, leap ? 335 : 334];
    
    for (gm = 0; gm < g_d_m.length; gm++) {
      const v = g_d_m[gm];
      if (days < v) {
        gd = days - g_d_m[gm - 1] + 1;
        break;
      }
    }
    
    return new Date(gy, gm - 1, gd);
  };

  const getDaysInMonth = (month, year) => {
    const persianMonth = month + 1;
    if (persianMonth <= 6) return 31;
    if (persianMonth <= 11) return 30;
    return isLeapYear(year) ? 30 : 29;
  };

  const isLeapYear = (year) => {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
    const gy = year + 621;
    const leapJ = breaks.indexOf((gy - 474) % 128 % 33 % 4) !== -1;
    return leapJ;
  };

  const getFirstDayOfMonth = (month, year) => {
    const gregorianDate = persianToGregorian(year, month + 1, 1);
    return (gregorianDate.getDay() + 1) % 7;
  };

  const getSeasonIcon = (month) => {
    if (month >= 0 && month <= 2) return <Leaf color="#10b981" size={18} />;
    if (month >= 3 && month <= 5) return <Sun color="#f59e0b" size={18} />;
    if (month >= 6 && month <= 8) return <Wind color="#ef4444" size={18} />;
    return <Snowflake color="#3b82f6" size={18} />;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (day) => {
    const date = { day, month: currentMonth + 1, year: currentYear };
    setSelectedDate(`${day}-${currentMonth}`);
    onDateSelect && onDateSelect(date);
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();
    const persianToday = gregorianToPersian(today);
    const isCurrentMonth = persianToday.month === currentMonth + 1 && persianToday.year === currentYear;

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && persianToday.day === day;
      const isSelected = selectedDate === `${day}-${currentMonth}`;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            styles.dayButton,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
          ]}
          onPress={() => handleDatePress(day)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.todayText,
              isSelected && styles.selectedText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
          <ChevronLeft color="#64748b" size={20} />
        </TouchableOpacity>

        <View style={styles.monthYearContainer}>
          {getSeasonIcon(currentMonth)}
          <Text style={styles.monthYear}>
            {persianMonths[currentMonth]} {currentYear}
          </Text>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
          <ChevronRight color="#64748b" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>{renderDays()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  monthYear: {
    fontSize: 16,
    
    color: '#1e293b',
    fontFamily: 'IRANYekan-Bold',
  },

  weekDaysContainer: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: 'IRANYekan',
  },

  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 64) / 7,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayButton: {
    borderRadius: 8,
  },
  dayText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    fontFamily: 'IRANYekan',
  },

  todayCell: {
    backgroundColor: '#3b82f6',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  selectedCell: {
    backgroundColor: '#8b5cf6',
  },
  selectedText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default PersianCalendar;