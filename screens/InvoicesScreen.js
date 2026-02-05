// InvoicesScreen.js - نسخه اصلاح شده
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { getCustomerSellerInfo, getLastFactorNumber, getSentInvoices, saveFactor } from '../api';
import { styles } from '../styles/InvoicesScreen.styles';
import {
  deleteInvoice as deleteInvoiceFile,
  getAllInvoices,
  updateInvoiceSentStatus
} from '../utils/invoiceFileManager';

export default function InvoicesScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [dateRangeModal, setDateRangeModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [serverInvoices, setServerInvoices] = useState([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // تابع برای تبدیل تاریخ میلادی به شمسی
  const convertToPersianDate = (gregorianDate) => {
    const { jy, jm, jd } = require('jalaali-js').toJalaali(
      gregorianDate.getFullYear(),
      gregorianDate.getMonth() + 1,
      gregorianDate.getDate()
    );
    return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  };

  // دریافت تاریخ دیروز به شمسی
  const getYesterdayPersianDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return convertToPersianDate(yesterday);
  };

  // دریافت تاریخ امروز به شمسی
  const getTodayPersianDate = () => {
    return convertToPersianDate(new Date());
  };

  // مقداردهی اولیه تاریخ‌ها
  useEffect(() => {
    const yesterday = getYesterdayPersianDate();
    setStartDate(yesterday);
    setEndDate(yesterday);
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserInfo(user);
      }
    } catch (error) {
      // خطا به صورت خاموش مدیریت می‌شود
    }
  };

  const cleanupCorruptedInvoices = async () => {
    try {
      const allInvoices = await getAllInvoices();
      const corruptedInvoices = allInvoices.filter(invoice => !invoice.customer);
      
      if (corruptedInvoices.length > 0) {
        for (const invoice of corruptedInvoices) {
          await deleteInvoiceFile(invoice.id);
        }
        await loadInvoices();
      }
    } catch (error) {
      // خطا به صورت خاموش مدیریت می‌شود
    }
  };

  const loadInvoices = async () => {
    try {
      const allInvoices = await getAllInvoices();
      setInvoices(allInvoices);
    } catch (error) {
      Alert.alert('خطا', 'خطا در دریافت لیست فاکتورها');
    }
  };

const loadServerInvoices = async () => {
  try {
    setLoading(true);
    
    if (!startDate || !endDate) {
      return;
    }
    
    const user = await getUserInfo();
    const result = await getSentInvoices(startDate, endDate);
    
  
    if (result && (result.invoices || result.data)) {
      let invoicesData = result.invoices || result.data || [];
      
      if (user) {
        
        if (user.role === 'customer') {
          // مشتری: فقط فاکتورهای خودش (بر اساس BuyerCode)
          const customerCode = user.buyerCode || user.NOF || user.id;
        
          
          invoicesData = invoicesData.filter(invoice => {
            const match = String(invoice.BuyerCode) === String(customerCode);
            if (match) {
             
            }
            return match;
          });
          
         
        } else {
          // فروشنده/ویزیتور: فاکتورهایی که خودش زده (بر اساس SellerCode)
          const sellerCode = user.NOF || user.id || user.userId;
        
          
          if (sellerCode) {
            invoicesData = invoicesData.filter(invoice => {
              const match = String(invoice.SellerCode) === String(sellerCode);
              if (match) {
                
              }
              return match;
            });
            
         
          } else {
            invoicesData = [];
          }
        }
      }
      
      setServerInvoices(invoicesData);
    } else {
      setServerInvoices([]);
    }
    
  } catch (error) {
    console.log('❌ خطا در دریافت فاکتورهای ارسال شده:', error);
    Alert.alert('خطا', 'خطا در دریافت فاکتورهای ارسال شده');
    setServerInvoices([]);
  } finally {
    setLoading(false);
  }
};
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'sent' && (!startDate || !endDate)) {
      const yesterday = getYesterdayPersianDate();
      setStartDate(yesterday);
      setEndDate(yesterday);
    }
  };

  useEffect(() => {
    loadUserInfo();
    loadInvoices();
    cleanupCorruptedInvoices();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserInfo();
      loadInvoices();
      if (activeTab === 'sent' && startDate && endDate) {
        loadServerInvoices();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (activeTab === 'sent' && startDate && endDate) {
      loadServerInvoices();
    }
  }, [activeTab, startDate, endDate]);

  const getUserInfo = async () => {
    try {
      if (userInfo) {
        return userInfo;
      }
      
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        let role = user.role;
        let userCode = user.NOF || user.id;
        
        if (!role && user.UserType) {
          role = user.UserType === 'customer' ? 'customer' : 'seller';
        }
        
        let buyerCode = user.buyerCode;
        if (role === 'customer' && !buyerCode) {
          buyerCode = userCode;
        }
        
        const userInfoData = {
          ...user,
          role: role || 'seller',
          id: userCode,
          buyerCode: buyerCode
        };
        
        setUserInfo(userInfoData);
        return userInfoData;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  };

const sendToServer = async (invoice) => {
  if (!invoice.customer) {
    Alert.alert('خطا', 'مشتری انتخاب نشده است.');
    return;
  }

  if (!invoice.customer.code || !invoice.customer.name) {
    Alert.alert('خطا', 'اطلاعات مشتری (کد یا نام) ناقص است.');
    return;
  }

  if (!invoice.items || invoice.items.length === 0) {
    Alert.alert('خطا', 'سبد خرید خالی است.');
    return;
  }

  const user = await getUserInfo();

  if (!user) {
    Alert.alert('خطا', 'اطلاعات کاربر یافت نشد. لطفاً مجدداً وارد شوید.');
    return;
  }

  let sellerCode, sellerName;

  // تشخیص نقش کاربر و تعیین فروشنده
  if (user.role === 'customer') {
    // اگر کاربر مشتری هست، از فروشنده معرف استفاده کن
    try {
      const sellerInfo = await getCustomerSellerInfo(invoice.customer.code);
      if (sellerInfo.success) {
        sellerCode = sellerInfo.sellerInfo.sellerCode;
        sellerName = sellerInfo.sellerInfo.sellerName;
      } else {
        // اگر اطلاعات فروشنده پیدا نشد، از پیش‌فرض استفاده کن
        sellerCode = '1';
        sellerName = 'فروشنده پیش‌فرض';
      }
    } catch (sellerError) {
      sellerCode = '1';
      sellerName = 'فروشنده پیش‌فرض';
    }
  } else {
    // اگر کاربر فروشنده/ویزیتور هست، از کد خودش استفاده کن
    sellerCode = invoice.sellerCode || user.NOF || user.id || user.userId || '1';
    sellerName = user.NameF || user.name || 'فروشنده';
  }

  if (!sellerCode || !sellerName) {
    Alert.alert('خطا', 'اطلاعات فروشنده ناقص است. لطفاً مجدداً وارد شوید.');
    return;
  }

  if (invoice.sentToServer) {
    Alert.alert('توجه', 'این فاکتور قبلاً به سرور ارسال شده است');
    return;
  }

  if (sendingInvoice) {
    Alert.alert('توجه', 'در حال ارسال فاکتور دیگری هستید. لطفا صبر کنید.');
    return;
  }

  setSendingInvoice(invoice.id);
  setLoading(true);

  try {
    const lastNumberData = await getLastFactorNumber();
    const newFactorNumber = lastNumberData.newNumber;

    const cleanDescription = (invoice.description || '').replace(/[\r\n]+/g, ' ').trim();

    const factorData = {
      number: newFactorNumber.toString(),
      dateF: convertToPersianDate(new Date()),
      moen: sellerCode.toString(), // استفاده از sellerCode واقعی
      moenName: sellerName, // استفاده از sellerName واقعی
      buyerCode: invoice.customer.code.toString(),
      buyerName: invoice.customer.name,
      price: Number(invoice.totalPrice) || 0,
      buyerAdd: invoice.customer.address || '',
      tozeh: cleanDescription,
      np: invoice.paymentMethod || 'نقدی',
      items: invoice.items.map(item => ({
        code: (item.Code || item.code || '').toString(),
        name: item.Name || item.name || '',
        masterT: Number(item.countMbna || item.masterCount || 0),
        slaveT: Number(item.countSlave || item.slaveCount || 0),
        allT: Number(item.totalCount || 0),
        slavePrice: Number(item.DisplayPrice || item.Price || item.PriceF1 || item.price || 0),
        truePrice: Number(item.DisplayPrice || item.Price || item.PriceF1 || item.price || 0),
        price: Number(item.totalPrice || 0)
      }))
    };

    const result = await saveFactor(factorData);
    
    if (result.success) {
      const fileDeleted = await deleteInvoiceFile(invoice.id);
      
      if (fileDeleted) {
        await loadInvoices();
        Alert.alert(
          "موفقیت", 
          `فاکتور شماره ${newFactorNumber} با موفقیت به سرور ارسال شد.\n\n` +
          `فروشنده: ${sellerName} (کد: ${sellerCode})\n` +
          `مشتری: ${invoice.customer.name}\n\n` 
        );
      } else {
        await updateInvoiceSentStatus(invoice.id, true);
        await loadInvoices();
        Alert.alert(
          "موفقیت با اخطار", 
          `فاکتور شماره ${newFactorNumber} با موفقیت به سرور ارسال شد.\n\n` +
          `مشتری: ${invoice.customer.name}\n\n` 
        );
      }
    } else {
      throw new Error(result.message || 'خطا در ارسال فاکتور به سرور');
    }

  } catch (error) {
    let errorMessage = error.message || 'خطا در ارسال فاکتور به سرور';
    if (error.message.includes('Network')) {
      errorMessage = 'ارتباط با سرور برقرار نشد. لطفا اینترنت را بررسی کنید.';
    }
    
    Alert.alert("خطا", errorMessage);
  } finally {
    setLoading(false);
    setSendingInvoice(null);
  }
};

  // کامپوننت انتخاب تاریخ شمسی
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
      <View style={pickerStyles.stepContainer}>
        <Text style={pickerStyles.stepTitle}>سال را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={pickerStyles.scrollContainer}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                pickerStyles.pickerItem,
                tempDate.year === year && pickerStyles.selectedItem
              ]}
              onPress={() => handleYearSelect(year)}
            >
              <Text style={[
                pickerStyles.pickerItemText,
                tempDate.year === year && pickerStyles.selectedItemText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );

    const renderMonthPicker = () => (
      <View style={pickerStyles.stepContainer}>
        <Text style={pickerStyles.stepTitle}>ماه را انتخاب کنید</Text>
        <ScrollView contentContainerStyle={pickerStyles.scrollContainer}>
          {months.map(month => (
            <TouchableOpacity
              key={month.number}
              style={[
                pickerStyles.pickerItem,
                tempDate.month === month.number && pickerStyles.selectedItem
              ]}
              onPress={() => handleMonthSelect(month.number)}
            >
              <Text style={[
                pickerStyles.pickerItemText,
                tempDate.month === month.number && pickerStyles.selectedItemText
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
        <View style={pickerStyles.stepContainer}>
          <Text style={pickerStyles.stepTitle}>روز را انتخاب کنید</Text>
          <ScrollView contentContainerStyle={pickerStyles.scrollContainer}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  pickerStyles.pickerItem,
                  tempDate.day === day && pickerStyles.selectedItem
                ]}
                onPress={() => handleDaySelect(day)}
              >
                <Text style={[
                  pickerStyles.pickerItemText,
                  tempDate.day === day && pickerStyles.selectedItemText
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

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={pickerStyles.modalOverlay}>
          <View style={pickerStyles.modalContainer}>
            <View style={pickerStyles.modalHeader}>
              {currentStep !== 'year' && (
                <TouchableOpacity onPress={goBack} style={pickerStyles.backButton}>
                  <MaterialIcons name="arrow-back" size={24} color="#1e3a8a" />
                  <Text style={pickerStyles.backButtonText}>بازگشت</Text>
                </TouchableOpacity>
              )}
              <Text style={pickerStyles.modalTitle}>
                انتخاب تاریخ
              </Text>
              <TouchableOpacity onPress={onClose} style={pickerStyles.closeButton}>
                <MaterialIcons name="close" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
            
            <View style={pickerStyles.currentDatePreview}>
              <Text style={pickerStyles.currentDateText}>
                {tempDate.year && tempDate.month && tempDate.day 
                  ? `${tempDate.year}/${String(tempDate.month).padStart(2, '0')}/${String(tempDate.day).padStart(2, '0')}`
                  : 'تاریخ انتخاب نشده'
                }
              </Text>
            </View>
            
            <View style={pickerStyles.pickerContent}>
              {renderCurrentStep()}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const setTodayDate = () => {
    const today = getTodayPersianDate();
    setStartDate(today);
    setEndDate(today);
    setDateRangeModal(false);
  };

  const setYesterdayDate = () => {
    const yesterday = getYesterdayPersianDate();
    setStartDate(yesterday);
    setEndDate(yesterday);
    setDateRangeModal(false);
  };

  const setThisWeekDate = () => {
    const today = new Date();
    const currentDate = getTodayPersianDate();
    
    // محاسبه اولین روز هفته (شنبه)
    const firstDayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToSaturday = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1) % 7;
    firstDayOfWeek.setDate(today.getDate() + diffToSaturday);
    
    const { jy, jm, jd } = require('jalaali-js').toJalaali(
      firstDayOfWeek.getFullYear(),
      firstDayOfWeek.getMonth() + 1,
      firstDayOfWeek.getDate()
    );
    const persianFirstDay = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    
    setStartDate(persianFirstDay);
    setEndDate(currentDate);
    setDateRangeModal(false);
  };

  const setThisMonthDate = () => {
    const today = new Date();
    const currentDate = getTodayPersianDate();
    
    // اولین روز ماه شمسی جاری
    const { jy, jm } = require('jalaali-js').toJalaali(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
    const firstDayOfMonth = `${jy}/${String(jm).padStart(2, '0')}/01`;
    
    setStartDate(firstDayOfMonth);
    setEndDate(currentDate);
    setDateRangeModal(false);
  };

  const convertToSimplePersianDate = (dateString) => {
    try {
      if (dateString.includes('/') && dateString.length === 10) {
        return dateString;
      }
      
      if (dateString.includes('۲۰۲۵')) {
        const miladiDate = dateString.split('،')[0];
        const [year, month, day] = miladiDate.split('/').map(num => 
          parseInt(num.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        );
        
        const persianDate = require('jalaali-js').toJalaali(year, month, day);
        return `${persianDate.jy}/${String(persianDate.jm).padStart(2, '0')}/${String(persianDate.jd).padStart(2, '0')}`;
      }
      
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  const getTodayInvoices = () => {
    const today = getTodayPersianDate();
    return invoices.filter(invoice => {
      const invoiceDate = convertToSimplePersianDate(invoice.date);
      return invoiceDate ;
    });
  };

  const getSentInvoicesList = () => {
    return serverInvoices;
  };

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      Alert.alert('خطا', 'لطفاً هر دو تاریخ شروع و پایان را وارد کنید');
      return;
    }
    setDateRangeModal(false);
  };

  const resetDateFilter = () => {
    const yesterday = getYesterdayPersianDate();
    setStartDate(yesterday);
    setEndDate(yesterday);
    setDateRangeModal(false);
  };

  const viewInvoiceDetails = (invoice) => {
    if (!invoice.customer) {
      Alert.alert(
        "خطا در داده‌های فاکتور",
        "داده‌های مشتری این فاکتور ناقص است.\n\nلطفاً این فاکتور را حذف و مجدداً ایجاد کنید.",
        [{ text: "متوجه شدم" }]
      );
      return;
    }

    const locationInfo = invoice.locationInfo 
      ? `\n📍 فاصله از مشتری: ${invoice.locationInfo.distance} متر` 
      : '';
    
    Alert.alert(
      "جزئیات فاکتور",
      `مشتری: ${invoice.customer.name || 'نامشخص'}
کد مشتری: ${invoice.customer.code || 'نامشخص'}
مبلغ کل: ${(invoice.totalPrice || 0).toLocaleString()} تومان
تاریخ: ${invoice.date || 'نامشخص'}
نحوه پرداخت: ${invoice.paymentMethod || 'نقدی'}
${invoice.description ? `توضیحات: ${invoice.description}` : ''}
تعداد کالاها: ${(invoice.items || []).length}
${invoice.sentToServer ? `شماره فاکتور در سرور: ${invoice.serverFactorNumber}` : 'وضعیت: ثبت موقت'}${locationInfo}`,
      [{ text: "باشه" }]
    );
  };

  const viewServerInvoiceDetails = (invoice) => {
    const statusText = invoice.IsConfirmed ? 'فاکتور شده' : 'پیش فاکتور';
    
    Alert.alert(
      "جزئیات فاکتور",
      `شماره فاکتور: ${invoice.Number}
مشتری: ${invoice.BuyerName}
کد مشتری: ${invoice.BuyerCode}
مبلغ کل: ${(invoice.TotalAmount || 0).toLocaleString()} تومان
تاریخ: ${invoice.DateF}
${invoice.Description ? `توضیحات: ${invoice.Description}` : ''}
وضعیت: ${statusText}`,
      [{ text: "باشه" }]
    );
  };

  const deleteInvoice = (invoice) => {
    if (invoice.sentToServer) {
      Alert.alert(
        'حذف فاکتور ارسال شده',
        'این فاکتور به سرور ارسال شده است.\n\nآیا می‌خواهید آن را از دستگاه حذف کنید؟\n\n⚠️ توجه: این عمل فقط فایل محلی را حذف می‌کند و بر روی سرور تاثیری ندارد.',
        [
          {
            text: "لغو",
            style: "cancel"
          },
          {
            text: "حذف از دستگاه",
            style: "destructive",
            onPress: async () => {
              await performDelete(invoice.id);
            }
          }
        ]
      );
      return;
    }

    Alert.alert(
      "حذف فاکتور",
      "این فاکتور هنوز به سرور ارسال نشده است.\n\nآیا از حذف این فاکتور مطمئن هستید؟",
      [
        {
          text: "لغو",
          style: "cancel"
        },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await performDelete(invoice.id);
          }
        }
      ]
    );
  };

  const performDelete = async (invoiceId) => {
    try {
      const deleted = await deleteInvoiceFile(invoiceId);
      
      if (deleted) {
        await loadInvoices();
        Alert.alert("موفقیت", "فاکتور با موفقیت حذف شد");
      } else {
        Alert.alert("خطا", "خطا در حذف فاکتور");
      }
    } catch (error) {
      Alert.alert("خطا", "خطا در حذف فاکتور: " + error.message);
    }
  };

  const editInvoice = (invoice) => {
    if (invoice.sentToServer) {
      Alert.alert('توجه', 'فاکتورهای ارسال شده به سرور قابل ویرایش نیستند');
      return;
    }

    if (!invoice.customer) {
      Alert.alert(
        "خطا در داده‌های فاکتور",
        "داده‌های مشتری این فاکتور ناقص است و قابل ویرایش نمی‌باشد.\n\nلطفاً این فاکتور را حذف و مجدداً ایجاد کنید.",
        [
          {
            text: "حذف فاکتور",
            style: "destructive",
            onPress: () => deleteInvoice(invoice)
          },
          {
            text: "متوجه شدم",
            style: "cancel"
          }
        ]
      );
      return;
    }

    if (!invoice.items || invoice.items.length === 0) {
      Alert.alert(
        "خطا در داده‌های فاکتور",
        "سبد خرید این فاکتور خالی است و قابل ویرایش نمی‌باشد.",
        [{ text: "متوجه شدم" }]
      );
      return;
    }

    Alert.alert(
      "ویرایش فاکتور",
      "آیا می‌خواهید این فاکتور را ویرایش کنید?",
      [
        {
          text: "لغو",
          style: "cancel"
        },
        {
          text: "ویرایش",
          onPress: () => {
            navigation.navigate('EditInvoice', { invoice });
          }
        }
      ]
    );
  };

  const renderInvoiceItem = ({ item }) => (
    <View style={[
      styles.invoiceRow,
      item.sentToServer && styles.sentInvoiceRow
    ]}>
      <TouchableOpacity 
        style={styles.invoiceInfo}
        onPress={() => viewInvoiceDetails(item)}
      >
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>
            {item.customer?.name || '❌ مشتری نامشخص'}
          </Text>
        </View>
        
        <View style={styles.invoiceDetailRow}>
          <Text style={styles.invoiceDate}>{item.date || 'تاریخ نامشخص'}</Text>
          <Text style={styles.invoiceAmount}>{(item.totalPrice || 0).toLocaleString()} </Text>
        </View>
        
        {item.sentToServer && (
          <Text style={styles.sentText}>
            ✅ ارسال شده - شماره: {item.serverFactorNumber}
          </Text>
        )}
        
        {!item.sentToServer && (
          <Text style={styles.pendingText}>
            ⏳ در انتظار ارسال
          </Text>
        )}

        {!item.customer && (
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 5 }}>
            ⚠️ داده‌های مشتری ناقص است
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.actionContainer}>
        {!item.sentToServer ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => editInvoice(item)}
              disabled={!item.customer}
            >
              <MaterialIcons 
                name="edit" 
                size={24} 
                color={!item.customer ? "#9ca3af" : "#153fbbff"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteInvoice(item)}
            >
              <MaterialIcons name="delete" size={24} color="#bb2015bb" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.sendButton]}
              onPress={() => sendToServer(item)}
              disabled={loading || !item.customer}
            >
              {sendingInvoice === item.id ? (
                <ActivityIndicator size="small" color="#153fbbff" />
              ) : (
                <MaterialIcons 
                  name="send" 
                  size={24} 
                  color={!item.customer ? "#9ca3af" : "#059669"} 
                />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sentActions}>
            <Text style={styles.sentBadge}>ارسال شده</Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteInvoice(item)}
            >
              <MaterialIcons name="delete" size={20} color="#bb2015bb" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderServerInvoiceItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.invoiceRow,
        styles.serverInvoiceRow,
        item.IsConfirmed && styles.confirmedInvoiceRow
      ]}
      onPress={() => viewServerInvoiceDetails(item)}
    >
      <View style={styles.serverInvoiceContent}>
        <View style={styles.serverInvoiceHeader}>
          <Text style={styles.serverInvoiceNumber}>
            شماره: {item.Number}
          </Text>
          <Text style={styles.serverInvoiceAmount}>
            {item.TotalAmount?.toLocaleString()} 
          </Text>
        </View>
        
        <Text style={styles.serverInvoiceCustomer}>
          {item.BuyerName}
        </Text>
        
        <View style={styles.serverInvoiceFooter}>
          <Text style={styles.serverInvoiceDate}>
            تاریخ: {item.DateF}
          </Text>
          <View style={[
            styles.statusBadge,
            item.IsConfirmed ? styles.factorBadge : styles.prefactorBadge
          ]}>
            <MaterialIcons 
              name={item.IsConfirmed ? "check-circle" : "description"} 
              size={14} 
              color={item.IsConfirmed ? "#1e3a8a" : "#f59e0b"} 
            />
            <Text style={styles.statusBadgeText}>
              {item.IsConfirmed ? 'فاکتور شده' : 'پیش فاکتور'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const currentData = activeTab === 'today' ? getTodayInvoices() : getSentInvoicesList();

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => handleTabChange('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            فاکتورهای امروز ({getTodayInvoices().length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => handleTabChange('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            ارسال شده ({serverInvoices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sent' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setDateRangeModal(true)}
          >
            <MaterialIcons name="filter-list" size={20} color="#1e3a8a" />
            <Text style={styles.filterButtonText}>
              {startDate && endDate 
                ? `از ${startDate} تا ${endDate}` 
                : 'انتخاب بازه زمانی'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>در حال بارگذاری...</Text>
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt-long" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {activeTab === 'today' 
              ? 'هیچ فاکتوری برای امروز ثبت نشده است' 
              : `هیچ فاکتور ارسال شده‌ای برای بازه ${startDate} تا ${endDate} یافت نشد`}
          </Text>
          {activeTab === 'today' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>ثبت فاکتور جدید</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item, index) => 
            activeTab === 'today' 
              ? item.id || `local_${index}`
              : `server_${item.Number}_${index}`
          }
          renderItem={activeTab === 'today' ? renderInvoiceItem : renderServerInvoiceItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={dateRangeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>انتخاب بازه زمانی</Text>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={setTodayDate}
              >
                <MaterialIcons name="today" size={20} color="#1e3a8a" />
                <Text style={styles.quickActionText}>امروز</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={setYesterdayDate}
              >
                <MaterialIcons name="event" size={20} color="#059669" />
                <Text style={styles.quickActionText}>دیروز</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={setThisWeekDate}
              >
                <MaterialIcons name="date-range" size={20} color="#f59e0b" />
                <Text style={styles.quickActionText}>این هفته</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={setThisMonthDate}
              >
                <MaterialIcons name="calendar-today" size={20} color="#dc2626" />
                <Text style={styles.quickActionText}>این ماه</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputs}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>تاریخ شروع</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>
                    {startDate || 'انتخاب تاریخ شروع'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>تاریخ پایان</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateInputText}>
                    {endDate || 'انتخاب تاریخ پایان'}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={resetDateFilter}
              >
                <Text style={styles.cancelButtonText}>بازنشانی (دیروز)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyDateFilter}
              >
                <Text style={styles.applyButtonText}>اعمال فیلتر</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* کامپوننت‌های انتخاب تاریخ شمسی */}
      <PersianDatePicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={(date) => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
        selectedDate={startDate}
      />
      
      <PersianDatePicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={(date) => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        selectedDate={endDate}
      />
    </View>
  );
}

// استایل‌های کامپوننت انتخاب تاریخ
const pickerStyles = {
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
};