// src/utils/chatUtils.js

/**
 * تبدیل پیام‌های دریافتی از API به فرمت استاندارد
 */
export const formatMessage = (msg) => {
  return {
    id: msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`,
    senderId: msg.senderId || msg.sender_id,
    senderName: msg.senderName || msg.sender_name || 'کاربر',
    text: msg.text || msg.message || '',
    timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
    groupId: msg.groupId || msg.group_id
  };
};

/**
 * تبدیل آرایه‌ای از پیام‌ها
 */
export const formatMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  return messages.map(formatMessage);
};

/**
 * ساخت پیام موقت برای نمایش قبل از ارسال
 */
export const createTempMessage = (messageData) => {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    ...messageData,
    id: tempId,
    isSending: true,
    local: true,
    tempId: tempId
  };
};

/**
 * بررسی تشابه دو پیام (برای حذف پیام‌های موقت)
 */
export const areSimilarMessages = (msg1, msg2, timeThreshold = 5000) => {
  if (!msg1 || !msg2) return false;
  
  return (
    msg1.text === msg2.text &&
    msg1.senderId === msg2.senderId &&
    Math.abs(new Date(msg1.timestamp) - new Date(msg2.timestamp)) < timeThreshold
  );
};

/**
 * حذف پیام‌های تکراری
 */
export const removeDuplicates = (messages) => {
  const seen = new Set();
  
  return messages.filter(msg => {
    if (seen.has(msg.id)) {
      return false;
    }
    seen.add(msg.id);
    return true;
  });
};

/**
 * جایگزینی پیام موقت با پیام سرور
 */
export const replaceTempMessage = (messages, serverMessage) => {
  const filteredMessages = messages.filter(msg => {
    // حذف پیام‌های موقت مشابه
    if (msg.local && areSimilarMessages(msg, serverMessage)) {
      console.log('🔄 Removing temp message:', msg.id);
      return false;
    }
    return true;
  });
  
  // بررسی تکراری نبودن پیام سرور
  const exists = filteredMessages.find(msg => msg.id === serverMessage.id);
  if (exists) {
    console.log('⚠️ Duplicate server message, skipping');
    return filteredMessages;
  }
  
  console.log('✅ Adding server message');
  return [...filteredMessages, serverMessage];
};

/**
 * آپدیت وضعیت پیام موقت
 */
export const updateTempMessageStatus = (messages, tempId, updates) => {
  return messages.map(msg => {
    if (msg.id === tempId || msg.tempId === tempId) {
      return { ...msg, ...updates };
    }
    return msg;
  });
};

/**
 * مرتب‌سازی پیام‌ها بر اساس زمان
 */
export const sortMessagesByTime = (messages) => {
  return [...messages].sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
};

/**
 * فرمت زمان برای نمایش
 */
export const formatMessageTime = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return '--:--';
  }
};

/**
 * بررسی اعتبار پیام
 */
export const isValidMessage = (message) => {
  return (
    message &&
    typeof message === 'object' &&
    message.text &&
    message.senderId !== undefined &&
    message.timestamp
  );
};

/**
 * ساخت پیام سیستمی
 */
export const createSystemMessage = (text, type = 'info') => {
  return {
    id: `system_${Date.now()}`,
    senderId: 0,
    senderName: 'سیستم',
    text: text,
    timestamp: new Date().toISOString(),
    isSystem: true,
    isError: type === 'error'
  };
};

/**
 * گروه‌بندی پیام‌ها بر اساس تاریخ
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toLocaleDateString('fa-IR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
  });
  
  return groups;
};

/**
 * شمارش پیام‌های خوانده نشده
 */
export const countUnreadMessages = (messages, lastReadTimestamp) => {
  if (!lastReadTimestamp) return messages.length;
  
  return messages.filter(msg => 
    new Date(msg.timestamp) > new Date(lastReadTimestamp)
  ).length;
};

/**
 * فیلتر پیام‌ها بر اساس متن جستجو
 */
export const filterMessagesByText = (messages, searchText) => {
  if (!searchText || !searchText.trim()) return messages;
  
  const search = searchText.toLowerCase().trim();
  return messages.filter(msg => 
    msg.text.toLowerCase().includes(search) ||
    msg.senderName.toLowerCase().includes(search)
  );
};

/**
 * دریافت آخرین پیام
 */
export const getLastMessage = (messages) => {
  if (!messages || messages.length === 0) return null;
  return messages[messages.length - 1];
};

/**
 * بررسی اینکه آیا کاربر فرستنده پیام است
 */
export const isMyMessage = (message, userId) => {
  return message.senderId === userId;
};

/**
 * ساخت پیام خطا
 */
export const createErrorMessage = (errorText) => {
  return createSystemMessage(errorText, 'error');
};

/**
 * ساخت پیام خوش‌آمدگویی
 */
export const createWelcomeMessage = () => {
  return {
    id: `welcome_${Date.now()}`,
    senderId: 0,
    senderName: 'سیستم',
    text: 'به گروه چت خوش آمدید! 🎉',
    timestamp: new Date().toISOString(),
    isSystem: true
  };
};