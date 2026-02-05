// screens/ModernChatBot.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const defaultFont = { fontFamily: "IRANYekan" };

const ModernChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [typing, setTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const fadeAnim = new Animated.Value(0);

  const categories = [
    { id: 'order', icon: 'cart-outline', title: 'سفارش‌دهی', color: '#0052CC' },
    { id: 'track', icon: 'cube-outline', title: 'پیگیری', color: '#0052CC' },
    { id: 'payment', icon: 'card-outline', title: 'پرداخت', color: '#0052CC' },
    { id: 'support', icon: 'call-outline', title: 'پشتیبانی', color: '#0052CC' },
  ];

  const predefinedQA = {
    order: [
      { question: 'چطور سفارش بدم؟', answer: 'وارد صفحه محصولات شوید و کالاها را به سبد خرید اضافه کنید.', icon: 'cart-outline' },
      { question: 'حداقل مبلغ سفارش؟', answer: 'حداقل مبلغ ۱۰۰ هزار تومان است.', icon: 'cash-outline' },
      { question: 'زمان تحویل چقدره؟', answer: 'بین ۲ تا ۵ روز کاری کالا به دستتان می‌رسد.', icon: 'time-outline' },
    ],
    track: [
      { question: 'چطور پیگیری کنم؟', answer: 'در بخش "سفارشات من" وضعیت سفارش را ببینید.', icon: 'search-outline' },
      { question: 'کد رهگیری چیه؟', answer: 'یک شماره یکتا که پس از ارسال پیامک می‌شود.', icon: 'barcode-outline' },
      { question: 'سفارشم کجاست؟', answer: 'با کد رهگیری موقعیت بسته را ببینید.', icon: 'location-outline' },
    ],
    payment: [
      { question: 'روش‌های پرداخت؟', answer: 'آنلاین، پرداخت در محل و اقساط.', icon: 'card-outline' },
      { question: 'خرید قسطی دارید؟', answer: 'برای خرید بالای ۵۰۰ هزار تومان تا ۱۲ ماه.', icon: 'wallet-outline' },
      { question: 'پرداخت در محل؟', answer: 'بله، هنگام تحویل پرداخت کنید.', icon: 'cash-outline' },
    ],
    support: [
      { question: 'تماس با پشتیبانی؟', answer: 'شماره ۰۲۱-۱۲۳۴۵۶۷۸ یا بخش تماس با ما.', icon: 'call-outline' },
      { question: 'ساعت کاری؟', answer: 'شنبه تا پنجشنبه ۹ صبح تا ۹ شب.', icon: 'time-outline' },
      { question: 'مرجوع کالا؟', answer: 'تا ۷ روز بعد از تحویل امکان مرجوع دارید.', icon: 'return-down-back-outline' },
    ],
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const addBotMessage = (text) => {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTyping(false);
    }, 600);
  };

  const handleQuestionClick = (qa) => {
    setMessages((prev) => [
      ...prev,
      {
        from: 'user',
        text: qa.question,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    addBotMessage(qa.answer);
  };

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat.id);
  };

  const resetChat = () => {
    setSelectedCategory(null);
    setMessages([]);
  };

  return (
    <View style={styles.container}>
      {/* Welcome Screen */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeScreen, { opacity: fadeAnim }]}>
          <View style={styles.welcomeIconContainer}>
            <Ionicons name="chatbubbles" size={64} color="#0052CC" />
          </View>
          <Text style={styles.welcomeTitle}>چت‌بات هوشمند</Text>
          <Text style={styles.welcomeSubtitle}>آماده پاسخگویی به شما</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </Animated.View>
      )}

      {!showWelcome && (
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>دستیار هوشمند</Text>
            <Text style={styles.headerSubtitle}>سوالتو بپرس، پاسخت رو بگیر</Text>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <View style={styles.categoriesRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && styles.categoryCardActive,
                  ]}
                  onPress={() => handleCategoryClick(cat)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={cat.icon} 
                    size={28} 
                    color={selectedCategory === cat.id ? '#FFFFFF' : '#0052CC'} 
                  />
                  <Text style={[
                    styles.categoryTitle, 
                    selectedCategory === cat.id && styles.categoryTitleActive
                  ]}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Questions */}
          {selectedCategory && (
            <View style={styles.questionsSection}>
              <Text style={styles.sectionTitle}>سوالات پرتکرار</Text>
              {predefinedQA[selectedCategory]?.map((qa, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.questionCard}
                  onPress={() => handleQuestionClick(qa)}
                  activeOpacity={0.6}
                >
                  <View style={styles.questionIcon}>
                    <Ionicons name={qa.icon} size={18} color="#0052CC" />
                  </View>
                  <Text style={styles.questionCardText}>{qa.question}</Text>
                  <Ionicons name="chevron-back-outline" size={18} color="#8C9BAB" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chat Box */}
          <View style={styles.chatSection}>
            <View style={styles.chatHeader}>
              <Text style={styles.sectionTitle}>گفتگو</Text>
              {messages.length > 0 && (
                <TouchableOpacity onPress={resetChat} style={styles.resetButton}>
                  <Ionicons name="refresh-outline" size={20} color="#0052CC" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.chatBox}>
              {messages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <View style={styles.emptyChatIcon}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#D1D9E6" />
                  </View>
                  <Text style={styles.emptyChatText}>گفتگو شروع نشده</Text>
                  <Text style={styles.emptyChatSubtext}>یک سوال انتخاب کنید تا شروع کنیم</Text>
                </View>
              ) : (
                <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
                  {messages.map((msg, i) => (
                    <View key={i} style={[styles.messageRow, msg.from === 'user' ? styles.userRow : styles.botRow]}>
                      <View style={[styles.avatar, msg.from === 'user' ? styles.userAvatar : styles.botAvatar]}>
                        <Ionicons 
                          name={msg.from === 'user' ? 'person' : 'sparkles'} 
                          size={16} 
                          color="#FFFFFF" 
                        />
                      </View>
                      
                      <View style={styles.messageContainer}>
                        <View style={[styles.messageBubble, msg.from === 'user' ? styles.userBubble : styles.botBubble]}>
                          <Text style={[styles.messageText, msg.from === 'user' ? styles.userText : styles.botText]}>
                            {msg.text}
                          </Text>
                        </View>
                        <Text style={[styles.messageTime, msg.from === 'user' ? styles.userTime : styles.botTime]}>
                          {msg.timestamp}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {typing && (
                    <View style={[styles.messageRow, styles.botRow]}>
                      <View style={[styles.avatar, styles.botAvatar]}>
                        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.messageContainer}>
                        <View style={[styles.messageBubble, styles.botBubble]}>
                          <View style={styles.typingIndicator}>
                            <View style={[styles.typingDot, styles.typingDot1]} />
                            <View style={[styles.typingDot, styles.typingDot2]} />
                            <View style={[styles.typingDot, styles.typingDot3]} />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Welcome Screen
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  welcomeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    
    color: '#0052CC',
    marginBottom: 8,
    ...defaultFont,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#8C9BAB',
    marginBottom: 32,
    ...defaultFont,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0052CC',
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  
  // Main Content
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
    paddingTop: 24,
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    
    color: '#0052CC',
    marginBottom: 4,
    textAlign: 'right',
    ...defaultFont,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8C9BAB',
    textAlign: 'right',
    ...defaultFont,
  },
  
  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '22%',
    minHeight: 90,
    justifyContent: 'center',
  },
  categoryCardActive: {
    backgroundColor: '#0052CC',
  },
  categoryTitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    ...defaultFont,
  },
  categoryTitleActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Questions
  questionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0052CC',
    marginBottom: 12,
    textAlign: 'right',
    ...defaultFont,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  questionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCardText: {
    flex: 1,
    fontSize: 13,
    color: '#2D3748',
    textAlign: 'right',
    fontWeight: '500',
    ...defaultFont,
  },
  
  // Chat Section
  chatSection: {
    marginBottom: 24,
  },
  chatHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 400,
    overflow: 'hidden',
  },
  
  // Empty Chat
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatIcon: {
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 15,
    color: '#2D3748',
    marginBottom: 6,
    fontWeight: '600',
    ...defaultFont,
  },
  emptyChatSubtext: {
    fontSize: 12,
    color: '#8C9BAB',
    textAlign: 'center',
    ...defaultFont,
  },
  
  // Messages
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageRow: {
    marginBottom: 16,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 10,
  },
  userRow: {
    flexDirection: 'row-reverse',
  },
  botRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: '#0052CC',
  },
  botAvatar: {
    backgroundColor: '#8C9BAB',
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#0052CC',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#F0F4FF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    ...defaultFont,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#2D3748',
  },
  messageTime: {
    fontSize: 10,
    color: '#8C9BAB',
    marginTop: 4,
    ...defaultFont,
  },
  userTime: {
    textAlign: 'left',
  },
  botTime: {
    textAlign: 'right',
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8C9BAB',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
});

export default ModernChatBot;