// CustomerRequestsScreen.js - نسخه بهبود یافته با طراحی مدرن
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    createCustomerRequest,
    getCustomerRequests,
    getCustomerRequestsStats
} from '../api';

export default function CustomerRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({});
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'comment',
    description: '',
    amount: '',
    paymentId: ''
  });

  // بارگذاری درخواست‌ها
  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await getCustomerRequests(activeTab);
      setRequests(requestsData.requests || []);
      
      const statsData = await getCustomerRequestsStats();
      setStats(statsData);
    } catch (error) {
      Alert.alert('خطا', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadRequests();
    });

    return unsubscribe;
  }, [navigation, activeTab]);

  // ایجاد درخواست جدید
  const handleCreateRequest = async () => {
    if (newRequest.type === 'comment' && !newRequest.description.trim()) {
      Alert.alert('خطا', 'لطفاً توضیحات نظر خود را وارد کنید');
      return;
    }

    if (newRequest.type === 'variz') {
      if (!newRequest.amount || parseFloat(newRequest.amount) <= 0) {
        Alert.alert('خطا', 'لطفاً مبلغ واریزی معتبر وارد کنید');
        return;
      }
      if (!newRequest.paymentId.trim()) {
        Alert.alert('خطا', 'لطفاً شناسه واریزی را وارد کنید');
        return;
      }
    }

    try {
      setModalLoading(true);
      
      const requestData = {
        description: newRequest.description.trim(),
        variz: newRequest.type === 'variz',
        amount: newRequest.type === 'variz' ? parseFloat(newRequest.amount) : null,
        paymentId: newRequest.type === 'variz' ? newRequest.paymentId.trim() : null
      };

      await createCustomerRequest(requestData);
      
      Alert.alert('موفقیت', 
        newRequest.type === 'variz' 
          ? 'درخواست واریزی با موفقیت ثبت شد' 
          : 'نظر شما با موفقیت ثبت شد'
      );
      
      setShowNewRequestModal(false);
      resetForm();
      await loadRequests();
      
    } catch (error) {
      Alert.alert('خطا', error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setNewRequest({
      type: 'comment',
      description: '',
      amount: '',
      paymentId: ''
    });
  };

  const handleCloseModal = () => {
    if (!modalLoading) {
      setShowNewRequestModal(false);
      resetForm();
    }
  };

  // فرمت کردن عدد با جداکننده
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // رندر کارت آمار با طراحی جدید
  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialIcons name="assignment" size={20} color="#1e3a8a" />
        <Text style={styles.statNumber}>{stats.totalRequests || 0}</Text>
        <Text style={styles.statLabel}>کل</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="account-balance-wallet" size={20} color="#059669" />
        <Text style={styles.statNumber}>{stats.totalVariz || 0}</Text>
        <Text style={styles.statLabel}>واریزی</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="chat-bubble" size={20} color="#0891b2" />
        <Text style={styles.statNumber}>{stats.totalComments || 0}</Text>
        <Text style={styles.statLabel}>نظرات</Text>
      </View>
    </View>
  );

  // رندر آیتم درخواست با طراحی بهتر
  const renderRequestItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.requestCard, item.variz && styles.varizCard]}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestTypeSection}>
          <View style={[
            styles.typeBadge,
            item.variz ? styles.varizBadge : styles.commentBadge
          ]}>
            <MaterialIcons 
              name={item.variz ? "payment" : "comment"} 
              size={16} 
              color={item.variz ? "#059669" : "#1e3a8a"} 
            />
            <Text style={[
              styles.typeText,
              item.variz ? styles.varizText : styles.commentText
            ]}>
              {item.variz ? 'واریزی' : 'نظر'}
            </Text>
          </View>
        </View>
        
        {item.variz && item.amount && (
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>
              {formatNumber(item.amount)}
            </Text>
            <Text style={styles.amountCurrency}></Text>
          </View>
        )}
      </View>

      {item.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      ) : null}

      {item.variz && item.paymentId && (
        <View style={styles.paymentIdContainer}>
          <MaterialIcons name="receipt" size={16} color="#6b7280" />
          <Text style={styles.paymentIdText}>{item.paymentId}</Text>
        </View>
      )}

      <View style={styles.requestFooter}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            item.status === 'pending' ? styles.pendingDot : styles.completedDot
          ]} />
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'در انتظار بررسی' : 'بررسی شده'}
          </Text>
        </View>
        
        <View style={styles.dateContainer}>
          <MaterialIcons name="access-time" size={14} color="#0f3a84ff" />
          <Text style={styles.createdAt}>
            {item.requestDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* کارت آمار */}
      {renderStatsCard()}

      {/* تب‌ها */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <MaterialIcons 
            name="list" 
            size={20} 
            color={activeTab === 'all' ? '#ffffff' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            همه
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'variz' && styles.activeTab]}
          onPress={() => setActiveTab('variz')}
        >
          <MaterialIcons 
            name="payment" 
            size={20} 
            color={activeTab === 'variz' ? '#ffffff' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'variz' && styles.activeTabText]}>
            واریزی‌ها
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'comment' && styles.activeTab]}
          onPress={() => setActiveTab('comment')}
        >
          <MaterialIcons 
            name="comment" 
            size={20} 
            color={activeTab === 'comment' ? '#ffffff' : '#6b7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'comment' && styles.activeTabText]}>
            نظرات
          </Text>
        </TouchableOpacity>
      </View>

      {/* دکمه درخواست جدید */}
      <TouchableOpacity 
        style={styles.newRequestButton}
        onPress={() => setShowNewRequestModal(true)}
        disabled={loading}
        activeOpacity={0.8}
      >
        <View style={styles.newRequestIcon}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </View>
        <Text style={styles.newRequestButtonText}>ثبت درخواست جدید</Text>
        <MaterialIcons name="arrow-back" size={20} color="#ffffff" />
      </TouchableOpacity>

      {/* لیست درخواست‌ها */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>در حال بارگذاری درخواست‌ها...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialIcons name="inbox" size={80} color="#d1d5db" />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'all' 
              ? 'هنوز درخواستی ثبت نشده' 
              : activeTab === 'variz'
              ? 'واریزی ثبت نشده'
              : 'نظری ثبت نشده'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'all' 
              ? 'اولین درخواست خود را ثبت کنید' 
              : activeTab === 'variz'
              ? 'اولین واریزی خود را ثبت کنید'
              : 'اولین نظر خود را ثبت کنید'}
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setShowNewRequestModal(true)}
          >
            <MaterialIcons name="add-circle" size={20} color="#ffffff" />
            <Text style={styles.emptyStateButtonText}>ثبت درخواست</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadRequests}
        />
      )}

      {/* مودال درخواست جدید - طراحی بهبود یافته */}
      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* هدر مودال */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <MaterialIcons name="post-add" size={24} color="#1e3a8a" />
              </View>
              <Text style={styles.modalTitle}>ثبت درخواست جدید</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
                disabled={modalLoading}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* انتخاب نوع درخواست */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>نوع درخواست</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[
                      styles.typeOption,
                      newRequest.type === 'comment' && styles.selectedType
                    ]}
                    onPress={() => setNewRequest({...newRequest, type: 'comment'})}
                    disabled={modalLoading}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      newRequest.type === 'comment' && styles.selectedTypeIcon
                    ]}>
                      <MaterialIcons 
                        name="chat-bubble-outline" 
                        size={28} 
                        color={newRequest.type === 'comment' ? '#ffffff' : '#1e3a8a'} 
                      />
                    </View>
                    <Text style={[
                      styles.typeOptionText,
                      newRequest.type === 'comment' && styles.selectedTypeText
                    ]}>
                      ثبت نظر و پیشنهاد
                    </Text>
                    <Text style={[
                      styles.typeOptionDesc,
                      newRequest.type === 'comment' && styles.selectedTypeDesc
                    ]}>
                      نظرات و پیشنهادات خود را با ما در میان بگذارید
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.typeOption,
                      newRequest.type === 'variz' && styles.selectedType
                    ]}
                    onPress={() => setNewRequest({...newRequest, type: 'variz'})}
                    disabled={modalLoading}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      newRequest.type === 'variz' && styles.selectedTypeIcon
                    ]}>
                      <MaterialIcons 
                        name="account-balance-wallet" 
                        size={28} 
                        color={newRequest.type === 'variz' ? '#ffffff' : '#059669'} 
                      />
                    </View>
                    <Text style={[
                      styles.typeOptionText,
                      newRequest.type === 'variz' && styles.selectedTypeText
                    ]}>
                      ثبت واریزی
                    </Text>
                    <Text style={[
                      styles.typeOptionDesc,
                      newRequest.type === 'variz' && styles.selectedTypeDesc
                    ]}>
                      اطلاعات واریز وجه خود را ثبت کنید
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* فیلد توضیحات */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>
                  {newRequest.type === 'comment' ? 'توضیحات نظر' : 'توضیحات'}
                  {newRequest.type === 'comment' && <Text style={styles.required}> *</Text>}
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="description" 
                    size={20} 
                    color="#9ca3af" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder={
                      newRequest.type === 'comment' 
                        ? 'نظر، پیشنهاد یا انتقاد خود را بنویسید...' 
                        : 'توضیحات تکمیلی در مورد واریزی (اختیاری)'
                    }
                    value={newRequest.description}
                    onChangeText={(text) => setNewRequest({...newRequest, description: text})}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!modalLoading}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* فیلدهای مخصوص واریزی */}
              {newRequest.type === 'variz' && (
                <View>
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                      مبلغ واریزی<Text style={styles.required}> *</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons 
                        name="attach-money" 
                        size={20} 
                        color="#9ca3af" 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="مثال: 500000"
                        value={newRequest.amount ? formatNumber(newRequest.amount) : ''}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '');
                          setNewRequest({...newRequest, amount: cleaned});
                        }}
                        keyboardType="numeric"
                        editable={!modalLoading}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                      شناسه واریزی<Text style={styles.required}> *</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons 
                        name="receipt-long" 
                        size={20} 
                        color="#9ca3af" 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="کد رهگیری یا شماره پیگیری"
                        value={newRequest.paymentId}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '');
                          setNewRequest({...newRequest, paymentId: cleaned});
                        }}
                        keyboardType="numeric"
                        editable={!modalLoading}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* راهنمای واریزی */}
                  <View style={styles.infoBox}>
                    <MaterialIcons name="info-outline" size={20} color="#0891b2" />
                    <Text style={styles.infoText}>
                      لطفاً اطلاعات واریزی خود را با دقت وارد کنید. پس از بررسی، موجودی حساب شما به‌روزرسانی می‌شود.
                    </Text>
                  </View>
                </View>
              )}

              {newRequest.type === 'comment' && (
                <View style={styles.infoBox}>
                  <MaterialIcons name="favorite-outline" size={20} color="#ec4899" />
                  <Text style={styles.infoText}>
                    نظرات شما برای بهبود کیفیت خدمات ما بسیار ارزشمند است. از اینکه وقت گذاشته‌اید متشکریم!
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* دکمه‌های اقدام */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  modalLoading && styles.disabledButton
                ]}
                onPress={handleCloseModal}
                disabled={modalLoading}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#6b7280" />
                <Text style={styles.cancelButtonText}>انصراف</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  modalLoading && styles.disabledButton
                ]}
                onPress={handleCreateRequest}
                disabled={modalLoading}
                activeOpacity={0.7}
              >
                {modalLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>
                      {newRequest.type === 'variz' ? 'ثبت واریزی' : 'ارسال نظر'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  // استایل‌های کارت آمار
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statCardPrimary: {
    backgroundColor: '#eff6ff',
  },
  statCardSuccess: {
    backgroundColor: '#f0fdf4',
  },
  statCardInfo: {
    backgroundColor: '#ecfeff',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  // استایل‌های تب
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#1e3a8a',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  // دکمه درخواست جدید
  newRequestButton: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newRequestIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  newRequestButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginHorizontal: 12,
  },
  // لیست درخواست‌ها
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderRightWidth: 4,
    borderRightColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  varizCard: {
    borderRightColor: '#059669',
    backgroundColor: '#fefffe',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestTypeSection: {
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  varizBadge: {
    backgroundColor: '#d1fae5',
  },
  commentBadge: {
    backgroundColor: '#dbeafe',
  },
  typeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  varizText: {
    color: '#059669',
  },
  commentText: {
    color: '#1e3a8a',
  },
  amountBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  amountCurrency: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  paymentIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  paymentIdText: {
    fontSize: 13,
    color: '#4b5563',
    fontFamily: 'monospace',
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pendingDot: {
    backgroundColor: '#f59e0b',
  },
  completedDot: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createdAt: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // حالت بارگذاری
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  // حالت خالی
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 50,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // استایل‌های مودال
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  modalHeaderIcon: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  // بخش‌های مودال
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  required: {
    color: '#ef4444',
    fontSize: 14,
  },
  // انتخابگر نوع
  typeSelector: {
    flexDirection: 'column',
    gap: 12,
  },
  typeOption: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedType: {
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
  },
  typeIconContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedTypeIcon: {
    backgroundColor: '#1e3a8a',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  selectedTypeText: {
    color: '#1e3a8a',
  },
  typeOptionDesc: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedTypeDesc: {
    color: '#6b7280',
  },
  // ورودی‌های فرم
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 44,
    fontSize: 15,
    textAlign: 'right',
    color: '#1f2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputSuffix: {
    position: 'absolute',
    left: 44,
    top: 14,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  // باکس اطلاعات
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ecfeff',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cffafe',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0e7490',
    lineHeight: 20,
  },
  // فوتر مودال
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});