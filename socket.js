// src/socket.js - FIX کامل برای مشکل Logout
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import io from 'socket.io-client';

// ✨ تنظیمات
const CONFIG = {
  DEFAULT_SERVER_IP: '192.168.1.15',
  DEFAULT_PORT: '5050',
  MAX_RECONNECT_ATTEMPTS: 10,
  RECONNECT_DELAY: 1000,
  SOCKET_TIMEOUT: 20000,
  HEARTBEAT_INTERVAL: 20000
};

// ✨ State مدیریت اتصال
let socket = null;
let socketUrl = null;
let isConnecting = false;
let isInitialized = false;
let heartbeatInterval = null;
let connectionAttempts = 0;
let currentUserId = null;
let socketPromiseResolver = null;

import { getServerUrl as getConfigServerUrl } from './config';

const getServerUrl = async () => {
  try {
    const url = await getConfigServerUrl();
    return url;
  } catch (error) {
    console.error('❌ خطا در دریافت آدرس سرور:', error);
    return `http://${CONFIG.DEFAULT_SERVER_IP}:${CONFIG.DEFAULT_PORT}`;
  }
};

const cleanupSocket = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  if (socket) {
    try {
      socket.removeAllListeners();
      if (socket.connected) {
        socket.disconnect();
      }
      socket.close();
    } catch (error) {
      console.error('خطا در پاک‌سازی socket:', error);
    }
    socket = null;
  }
  
  isConnecting = false;
  isInitialized = false;
  connectionAttempts = 0;
};

const setupHeartbeat = (socketInstance) => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('ping', { timestamp: Date.now() });
    }
  }, CONFIG.HEARTBEAT_INTERVAL);
};

const checkUserChanged = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      return { changed: true, newUserId: null };
    }
    
    const user = JSON.parse(userData);
    const newUserId = user.NOF || user.userId || user.id;
    
    if (currentUserId && newUserId && currentUserId !== newUserId) {
      return { changed: true, newUserId };
    }
    
    return { changed: false, newUserId };
  } catch (error) {
    console.error('❌ خطا در بررسی کاربر:', error);
    return { changed: false, newUserId: null };
  }
};

const initializeSocket = async (forceNew = false) => {
  try {
    const { changed: userChanged, newUserId } = await checkUserChanged();
    
    if (userChanged || forceNew) {
      cleanupSocket();
      currentUserId = newUserId;
      socketPromiseResolver = null;
    }
    
    if (isConnecting) {
      if (socketPromiseResolver) {
        return socketPromiseResolver;
      }
      return socket;
    }

    if (socket?.connected && isInitialized && !userChanged && !forceNew) {
      return socket;
    }

    isConnecting = true;

    cleanupSocket();

    socketUrl = await getServerUrl();

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: CONFIG.SOCKET_TIMEOUT,
      reconnection: true,
      reconnectionAttempts: CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: CONFIG.RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      forceNew: true,
      multiplex: false,
      upgrade: true,
      rememberUpgrade: true,
      query: {
        clientType: 'mobile',
        platform: Platform.OS,
        userId: currentUserId,
        timestamp: Date.now()
      }
    });

    socket.on('connect', () => {
      isInitialized = true;
      connectionAttempts = 0;
      setupHeartbeat(socket);
    });

    socket.on('disconnect', (reason) => {
      isInitialized = false;
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (socket && !socket.connected) {
            socket.connect();
          }
        }, 2000);
      }
    });

    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error(`❌ خطای اتصال (${connectionAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS}):`, error.message);
    });

    socket.on('error', (error) => {
      console.error('❌ خطای Socket:', error);
    });

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(socket);
      }, CONFIG.SOCKET_TIMEOUT);

      const onConnect = () => {
        clearTimeout(timeout);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        resolve(socket);
      };

      const onError = () => {
        clearTimeout(timeout);
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        resolve(socket);
      };

      if (socket.connected) {
        clearTimeout(timeout);
        resolve(socket);
      } else {
        socket.once('connect', onConnect);
        socket.once('connect_error', onError);
      }
    });

    return socket;

  } catch (error) {
    console.error('❌ خطا:', error);
    return socket;
  } finally {
    isConnecting = false;
  }
};

export const getSocketPromise = async () => {
  const { changed: userChanged } = await checkUserChanged();
  
  if (userChanged) {
    socketPromiseResolver = null;
    return await initializeSocket(true);
  }
  
  if (socket?.connected && isInitialized) {
    return socket;
  }
  
  if (isConnecting && socketPromiseResolver) {
    return socketPromiseResolver;
  }
  
  socketPromiseResolver = initializeSocket();
  return socketPromiseResolver;
};

export const getSocket = () => {
  if (!socket) {
    getSocketPromise().catch(console.error);
    return null;
  }
  
  if (!socket.connected && !isConnecting) {
    socket.connect();
  }
  
  return socket;
};

export const socketPromise = getSocketPromise();

export const sendMessageWithSocket = async (messageData) => {
  try {
    if (!socket || !socket.connected) {
      await getSocketPromise();
    }

    if (!socket || !socket.connected) {
      return await sendMessageViaAPI(messageData);
    }

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, CONFIG.SOCKET_TIMEOUT);

      socket.emit('sendMessage', messageData, (response) => {
        clearTimeout(timeout);
        
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'خطا در ارسال'));
        }
      });
    });
    
  } catch (error) {
    console.error('❌ خطا:', error);
    
    try {
      return await sendMessageViaAPI(messageData);
    } catch (apiError) {
      throw new Error('ارسال ناموفق: ' + apiError.message);
    }
  }
};

export const sendMessageViaAPI = async (messageData) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const serverUrl = await getServerUrl();
    const apiUrl = `${serverUrl}/api/chat/send`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      throw new Error(`خطای سرور: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ خطای API:', error);
    throw error;
  }
};

// در socket.js - تابع uploadFile
export const uploadFile = async (file, onProgress = null) => {
  try {
    console.log('🔑 دریافت توکن برای آپلود...');
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('توکن یافت نشد');
    }

    const serverUrl = await getServerUrl();
    const uploadUrl = `${serverUrl}/api/media/upload`;

    console.log('📤 آپلود به آدرس:', uploadUrl);
    console.log('📋 اطلاعات فایل:', {
      name: file.name,
      type: file.type,
      size: file.size,
      groupId: file.groupId,
      senderId: file.senderId
    });

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.name
    });
    formData.append('groupId', String(file.groupId));
    formData.append('senderId', String(file.senderId));
    formData.append('senderName', String(file.senderName || 'کاربر'));

    console.log('📦 فرم دیتا آماده شد');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          console.log(`📊 پیشرفت آپلود: ${progress.toFixed(1)}%`);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        console.log('📨 پاسخ سرور دریافت شد - وضعیت:', xhr.status);
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ پاسخ آپلود:', response);
            resolve(response);
          } catch (error) {
            console.error('❌ خطا در پارس پاسخ:', error);
            reject(new Error('خطا در پاسخ سرور'));
          }
        } else {
          console.error('❌ خطای HTTP:', xhr.status, xhr.responseText);
          reject(new Error(`خطای آپلود: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('❌ خطا در ارتباط با سرور');
        reject(new Error('خطا در ارتباط'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('⏰ timeout آپلود');
        reject(new Error('Timeout آپلود'));
      });

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = 120000; // 2 دقیقه
      
      console.log('🚀 ارسال درخواست آپلود...');
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ خطا در uploadFile:', error);
    throw error;
  }
};

// در socket.js - تابع uploadAndSendFile رو بررسی کنید
export const uploadAndSendFile = async (file, messageData, onProgress = null) => {
  try {
    console.log('📤 شروع آپلود فایل:', file);
    
    const uploadResult = await uploadFile(file, onProgress);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.message || 'آپلود ناموفق');
    }

    console.log('✅ آپلود موفق:', uploadResult.data);

    const messageWithFile = {
      ...messageData,
      fileId: uploadResult.data.fileId,
      text: messageData.text || `📁 ${uploadResult.data.fileName}`
    };

    console.log('📨 ارسال پیام با فایل:', messageWithFile);
    
    const sendResult = await sendMessageWithSocket(messageWithFile);
    
    console.log('✅ ارسال پیام موفق:', sendResult);
    
    return {
      success: true,
      uploadData: uploadResult.data,
      messageData: sendResult.data
    };

  } catch (error) {
    console.error('❌ خطا در آپلود و ارسال فایل:', error);
    throw error;
  }
};

export const disconnectForLogout = async () => {
  if (socket?.connected) {
    try {
      socket.emit('userLogout', { 
        userId: currentUserId,
        timestamp: Date.now() 
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ خطا در Logout:', error);
    }
  }
  
  cleanupSocket();
  
  socket = null;
  socketUrl = null;
  isConnecting = false;
  isInitialized = false;
  connectionAttempts = 0;
  currentUserId = null;
  socketPromiseResolver = null;
};

export const disconnectSocket = () => {
  cleanupSocket();
  socket = null;
  socketUrl = null;
  isConnecting = false;
  isInitialized = false;
  connectionAttempts = 0;
  currentUserId = null;
  socketPromiseResolver = null;
};

export const forceReconnect = async () => {
  cleanupSocket();
  socketPromiseResolver = null;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return await initializeSocket(true);
};

export default socket;