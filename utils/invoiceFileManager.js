// utils/invoiceFileManager.js - با تابع updateInvoice اضافه شده
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

const INVOICES_INDEX = 'invoices_index';
const STORAGE_PERMISSION_ASKED = 'storage_permission_asked';

/**
 * دریافت مسیر پوشه Selvo
 */
const getSelvoDirectory = async () => {
  try {
    const baseDir = FileSystem.documentDirectory;
    const selvoDir = `${baseDir}Selvo/`;
    return selvoDir;
  } catch (error) {
    console.log('❌ خطا در دریافت مسیر:', error);
    return `${FileSystem.documentDirectory}Selvo/`;
  }
};

/**
 * درخواست دسترسی به حافظه برای اندروید
 */
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    console.log('🔐 درخواست دسترسی به حافظه...');
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ دسترسی داده شد');
      await AsyncStorage.setItem(STORAGE_PERMISSION_ASKED, 'true');
      return true;
    } else {
      console.log('❌ دسترسی داده نشد');
      await AsyncStorage.setItem(STORAGE_PERMISSION_ASKED, 'denied');
      
      Alert.alert(
        'دسترسی به حافظه',
        'برای ذخیره فاکتورها نیاز به دسترسی حافظه دارید',
        [
          { text: 'بستن', style: 'cancel' },
          { text: 'تنظیمات', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
  } catch (error) {
    console.error('❌ خطا در درخواست دسترسی:', error);
    return false;
  }
};

/**
 * ایجاد پوشه Selvo
 */
const ensureSelvoDir = async () => {
  try {
    console.log('📁 ایجاد پوشه Selvo...');

    if (Platform.OS === 'android') {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        console.warn('⚠️ دسترسی داده نشد اما ادامه خواهیم داد');
      }
    }

    const selvoDir = await getSelvoDirectory();
    
    const dirInfo = await FileSystem.getInfoAsync(selvoDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(selvoDir, { intermediates: true });
      console.log('✅ پوشه Selvo ایجاد شد');
    } else {
      console.log('📂 پوشه از قبل وجود دارد');
    }

    console.log('📍 مسیر Selvo:', selvoDir);
    return selvoDir;
  } catch (error) {
    console.error('❌ خطا در ایجاد پوشه:', error);
    throw error;
  }
};

/**
 * ذخیره فاکتور در فایل
 */
export const saveInvoiceToFile = async (invoice) => {
  try {
    console.log('💾 شروع ذخیره فاکتور...');
    
    const selvoDir = await ensureSelvoDir();
    
    let customerNameForFile = 'مشتری';
    if (invoice.customer) {
      if (typeof invoice.customer === 'object' && invoice.customer.name) {
        customerNameForFile = invoice.customer.name;
      } else if (typeof invoice.customer === 'string') {
        customerNameForFile = invoice.customer;
      }
    }
    
    const customerName = String(customerNameForFile).replace(/[/\\?%*:|"<>]/g, '-').substring(0, 30);
    const invoiceId = String(invoice.id || `inv_${Date.now()}`).replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `فاکتور_${customerName}_${invoiceId}.json`;
    const filePath = `${selvoDir}${fileName}`;
    
    const jsonData = JSON.stringify({
      ...invoice,
      id: invoiceId,
      savedAt: new Date().toISOString(),
      filePath: filePath
    }, null, 2);
    
    await FileSystem.writeAsStringAsync(filePath, jsonData, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    console.log('📄 ذخیره فایل در:', filePath);
    
    await addToIndex(invoiceId, fileName, filePath);
    
    console.log(`✅ فاکتور ذخیره شد: ${fileName}`);
    
    return {
      success: true,
      fileName: fileName,
      filePath: filePath,
      invoiceId: invoiceId,
      message: `فاکتور در پوشه Selvo ذخیره شد`
    };
    
  } catch (error) {
    console.error('❌ خطا در ذخیره فاکتور:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🔥 به‌روزرسانی فاکتور موجود
 */
export const updateInvoice = async (invoiceId, updatedData) => {
  try {
    console.log('🔄 شروع به‌روزرسانی فاکتور:', invoiceId);
    
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) {
      console.error('❌ ایندکس فاکتورها خالی است');
      return false;
    }

    const index = JSON.parse(indexData);
    const invoiceItem = index.find(item => item.id === invoiceId);
    
    if (!invoiceItem) {
      console.error(`❌ فاکتور با ID ${invoiceId} یافت نشد`);
      return false;
    }

    // خواندن فایل فعلی
    const fileInfo = await FileSystem.getInfoAsync(invoiceItem.filePath);
    if (!fileInfo.exists) {
      console.error(`❌ فایل فاکتور وجود ندارد: ${invoiceItem.filePath}`);
      return false;
    }

    const fileContent = await FileSystem.readAsStringAsync(invoiceItem.filePath);
    const currentInvoice = JSON.parse(fileContent);

    // ادغام داده‌های جدید با داده‌های قبلی
    const updatedInvoice = {
      ...currentInvoice,
      ...updatedData,
      id: invoiceId, // حفظ ID اصلی
      updatedAt: new Date().toISOString(),
      filePath: invoiceItem.filePath // حفظ مسیر فایل
    };

    // ذخیره مجدد فایل
    const jsonData = JSON.stringify(updatedInvoice, null, 2);
    await FileSystem.writeAsStringAsync(invoiceItem.filePath, jsonData, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    console.log(`✅ فاکتور به‌روزرسانی شد: ${invoiceId}`);
    console.log('📝 داده‌های به‌روز شده:', {
      customer: updatedInvoice.customer?.name,
      totalPrice: updatedInvoice.totalPrice,
      itemsCount: updatedInvoice.items?.length
    });
    
    return true;
  } catch (error) {
    console.error(`❌ خطا در به‌روزرسانی فاکتور ${invoiceId}:`, error);
    return false;
  }
};

/**
 * افزودن به ایندکس
 */
const addToIndex = async (invoiceId, fileName, filePath) => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    const index = indexData ? JSON.parse(indexData) : [];
    
    const filteredIndex = index.filter(item => item.id !== invoiceId);
    
    filteredIndex.push({
      id: invoiceId,
      fileName: fileName,
      filePath: filePath,
      createdAt: new Date().toISOString()
    });
    
    await AsyncStorage.setItem(INVOICES_INDEX, JSON.stringify(filteredIndex));
    console.log(`📝 فاکتور به ایندکس اضافه شد: ${invoiceId}`);
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی ایندکس:', error);
  }
};

/**
 * دریافت تمام فاکتورها
 */
export const getAllInvoices = async () => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) {
      console.log('ℹ️ ایندکس فاکتورها خالی است');
      return [];
    }

    const index = JSON.parse(indexData);
    const invoices = [];
    
    for (const item of index) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(item.filePath);
        if (fileInfo.exists) {
          const fileContent = await FileSystem.readAsStringAsync(item.filePath);
          const invoice = JSON.parse(fileContent);
          invoices.push(invoice);
        } else {
          console.warn(`⚠️ فایل وجود ندارد: ${item.filePath}`);
          await removeFromIndex(item.id);
        }
      } catch (error) {
        console.warn(`⚠️ خطا در خواندن فایل ${item.fileName}:`, error);
        await removeFromIndex(item.id);
      }
    }

    invoices.sort((a, b) => {
      const dateA = new Date(a.savedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.savedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(`✅ ${invoices.length} فاکتور بارگذاری شد`);
    return invoices;
  } catch (error) {
    console.error('❌ خطا در دریافت فاکتورها:', error);
    return [];
  }
};

/**
 * حذف از ایندکس
 */
const removeFromIndex = async (invoiceId) => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) return;

    const index = JSON.parse(indexData);
    const updatedIndex = index.filter(item => item.id !== invoiceId);
    await AsyncStorage.setItem(INVOICES_INDEX, JSON.stringify(updatedIndex));
    console.log(`🗑️ فاکتور از ایندکس حذف شد: ${invoiceId}`);
  } catch (error) {
    console.error('❌ خطا در حذف از ایندکس:', error);
  }
};

/**
 * دریافت یک فاکتور خاص
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) return null;

    const index = JSON.parse(indexData);
    const invoiceItem = index.find(item => item.id === invoiceId);
    
    if (!invoiceItem) return null;

    const fileInfo = await FileSystem.getInfoAsync(invoiceItem.filePath);
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(invoiceItem.filePath);
      return JSON.parse(fileContent);
    }
    
    return null;
  } catch (error) {
    console.error(`❌ خطا در دریافت فاکتور ${invoiceId}:`, error);
    return null;
  }
};

/**
 * حذف فاکتور
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) return false;

    const index = JSON.parse(indexData);
    const invoiceItem = index.find(item => item.id === invoiceId);
    
    if (!invoiceItem) {
      console.warn(`⚠️ فاکتور یافت نشد: ${invoiceId}`);
      return false;
    }

    try {
      await FileSystem.deleteAsync(invoiceItem.filePath);
    } catch (deleteError) {
      console.warn(`⚠️ خطا در حذف فایل: ${deleteError.message}`);
    }

    await removeFromIndex(invoiceId);
    
    console.log(`✅ فاکتور حذف شد: ${invoiceId}`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در حذف فاکتور ${invoiceId}:`, error);
    return false;
  }
};

/**
 * به‌روزرسانی وضعیت ارسال فاکتور
 */
export const updateInvoiceSentStatus = async (invoiceId, sentToServer = true) => {
  try {
    const indexData = await AsyncStorage.getItem(INVOICES_INDEX);
    if (!indexData) return false;

    const index = JSON.parse(indexData);
    const invoiceItem = index.find(item => item.id === invoiceId);
    if (!invoiceItem) return false;

    const fileInfo = await FileSystem.getInfoAsync(invoiceItem.filePath);
    if (!fileInfo.exists) return false;

    const fileContent = await FileSystem.readAsStringAsync(invoiceItem.filePath);
    const invoice = JSON.parse(fileContent);

    invoice.sentToServer = sentToServer;
    invoice.sentDate = sentToServer ? new Date().toISOString() : null;
    invoice.updatedAt = new Date().toISOString();

    const jsonData = JSON.stringify(invoice, null, 2);
    await FileSystem.writeAsStringAsync(invoiceItem.filePath, jsonData, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    console.log(`✅ وضعیت فاکتور به‌روزرسانی شد: ${invoiceId}`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در به‌روزرسانی فاکتور ${invoiceId}:`, error);
    return false;
  }
};

/**
 * دریافت فاکتورهای ارسال نشده
 */
export const getPendingInvoices = async () => {
  try {
    const allInvoices = await getAllInvoices();
    return allInvoices.filter(invoice => !invoice.sentToServer);
  } catch (error) {
    console.error('❌ خطا در دریافت فاکتورهای ارسال نشده:', error);
    return [];
  }
};

/**
 * دریافت آمار فاکتورها
 */
export const getInvoicesStats = async () => {
  try {
    const allInvoices = await getAllInvoices();
    
    return {
      total: allInvoices.length,
      pending: allInvoices.filter(inv => !inv.sentToServer).length,
      sent: allInvoices.filter(inv => inv.sentToServer).length,
      totalAmount: allInvoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0),
      pendingAmount: allInvoices
        .filter(inv => !inv.sentToServer)
        .reduce((sum, inv) => sum + (inv.totalPrice || 0), 0)
    };
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    return {
      total: 0,
      pending: 0,
      sent: 0,
      totalAmount: 0,
      pendingAmount: 0
    };
  }
};

/**
 * دریافت مسیر پوشه Selvo
 */
export const getSelvoDirPath = async () => {
  const selvoDir = await getSelvoDirectory();
  return selvoDir;
};

/**
 * اشتراک‌گذاری فایل فاکتور
 */
export const shareInvoiceFile = async (filePath) => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'اشتراک‌گذاری فاکتور'
      });
    } else {
      Alert.alert('خطا', 'امکان اشتراک‌گذاری در این دستگاه وجود ندارد');
    }
  } catch (error) {
    console.error('❌ خطا در اشتراک‌گذاری:', error);
    Alert.alert('خطا', 'خطا در اشتراک‌گذاری فایل');
  }
};

/**
 * نمایش مسیر فایل‌ها
 */
export const showInFileManager = async () => {
  try {
    const selvoDir = await getSelvoDirectory();
    
    Alert.alert(
      'مسیر پوشه Selvo',
      `فایل‌های شما در این مسیر ذخیره شده‌اند:\n\n${selvoDir}\n\n✅ این مسیر در حافظه داخلی برنامه ذخیره شده است.`,
      [{ text: 'متوجه شدم' }]
    );
    
    return true;
  } catch (error) {
    console.error('❌ خطا در نمایش مسیر:', error);
    Alert.alert('خطا', 'امکان نمایش مسیر وجود ندارد');
    return false;
  }
};

/**
 * پشتیبان‌گیری از تمام فاکتورها
 */
export const backupAllInvoices = async () => {
  try {
    const allInvoices = await getAllInvoices();
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalInvoices: allInvoices.length,
      invoices: allInvoices
    };

    const selvoDir = await ensureSelvoDir();
    const backupFilePath = `${selvoDir}backup_invoices_${Date.now()}.json`;
    
    await FileSystem.writeAsStringAsync(backupFilePath, JSON.stringify(backupData, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });

    return {
      success: true,
      filePath: backupFilePath,
      message: `پشتیبان با ${allInvoices.length} فاکتور ایجاد شد`
    };
  } catch (error) {
    console.error('❌ خطا در ایجاد پشتیبان:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  saveInvoiceToFile,
  updateInvoice, // 🔥 اضافه شد
  getAllInvoices,
  getInvoiceById,
  deleteInvoice,
  updateInvoiceSentStatus,
  getPendingInvoices,
  getInvoicesStats,
  getSelvoDirPath,
  showInFileManager,
  shareInvoiceFile,
  backupAllInvoices
};