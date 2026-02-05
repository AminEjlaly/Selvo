// src/screens/ChatScreen.js - نسخه نهایی و پایدار
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MessageFile from '../components/MessageFile';
import { getSocketPromise, sendMessageWithSocket, uploadAndSendFile } from '../socket';
import { styles } from '../styles/ChatScreen.styles';

const ChatScreen = ({ route }) => {
  const { groupId = 1 } = route.params || {};

  // ✨ State ها
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // ✨ Refs
  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✨ دریافت آدرس سرور
  const getBaseUrl = async () => {
    try {
      const serverIp = await AsyncStorage.getItem('server_ip');
      return `http://${serverIp}:5050`;
    } catch (error) {
      console.error('❌ خطا در دریافت آدرس سرور:', error);
      return 'http://localhost:5050';
    }
  };

  // ✨ بارگذاری اطلاعات کاربر
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const fixedUser = {
          ...parsedUser,
          NOF: parsedUser.NOF || parsedUser.userId || parsedUser.id || 0,
          NameF: parsedUser.NameF || parsedUser.name || 'کاربر'
        };
        console.log('👤 کاربر بارگذاری شد:', fixedUser.NameF);
        setUser(fixedUser);
        return fixedUser;
      }
      return null;
    } catch (error) {
      console.error('❌ خطا در بارگذاری کاربر:', error);
      return null;
    }
  };

  // ✨ بررسی نوع فایل
  const isImageFile = (file) => {
    if (!file) return false;
    
    const name = (file.fileName || file.name || "").toLowerCase();
    const type = (file.fileType || file.type || file.mimeType || "").toLowerCase();

    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif|tiff|tif|svg|ico)$/;
    const imageMimeTypes = /^image\/(jpeg|png|webp|gif|bmp|heic|heif|tiff|svg\+xml|x-icon)$/;

    return (
      type.match(imageMimeTypes) ||
      name.match(imageExtensions) ||
      type.startsWith("image/")
    );
  };

  // ✨ راه‌اندازی چت
  const initializeChat = async () => {
    if (isInitializedRef.current) {
      console.log('⚠️ چت از قبل راه‌اندازی شده');
      return;
    }

    console.log('\n🚀 === راه‌اندازی چت ===');
    setIsLoading(true);

    try {
      const [currentBaseUrl, currentUser] = await Promise.all([
        getBaseUrl(),
        loadUserData()
      ]);

      setBaseUrl(currentBaseUrl);

      if (!currentUser) {
        throw new Error('کاربری یافت نشد');
      }

      console.log('✅ اطلاعات پایه آماده شد');
      await loadPreviousMessages(currentUser);
      setupSocketConnection(currentUser);

      isInitializedRef.current = true;
      console.log('✅ راه‌اندازی چت تکمیل شد\n');

    } catch (error) {
      console.error('❌ خطا در راه‌اندازی چت:', error);
      setConnectionStatus('error');
      showErrorMessage('خطا در راه‌اندازی چت: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✨ راه‌اندازی اتصال سوکت
  const setupSocketConnection = async (currentUser) => {
    try {
      setConnectionStatus('connecting');
      console.log('🔌 در حال راه‌اندازی Socket...');

      const initializedSocket = await getSocketPromise();

      if (initializedSocket && typeof initializedSocket.on === 'function') {
        setSocket(initializedSocket);
        setupSocketListeners(initializedSocket);

        if (initializedSocket.connected) {
          console.log('✅ Socket متصل است');
          setIsConnected(true);
          setConnectionStatus('connected');
          joinGroup(initializedSocket, currentUser);
        } else {
          console.log('⏳ در انتظار اتصال Socket...');
          const connectHandler = () => {
            console.log('✅ Socket متصل شد');
            setIsConnected(true);
            setConnectionStatus('connected');
            joinGroup(initializedSocket, currentUser);
            initializedSocket.off('connect', connectHandler);
          };
          initializedSocket.on('connect', connectHandler);
        }
      } else {
        throw new Error('راه‌اندازی Socket ناموفق بود');
      }
    } catch (error) {
      console.error('❌ خطا در راه‌اندازی Socket:', error);
      setConnectionStatus('disconnected');
    }
  };

  // ✨ تنظیم شنوندگان سوکت
  const setupSocketListeners = useCallback((socketInstance) => {
    if (!socketInstance) return;

    console.log('📡 راه‌اندازی Socket listeners...');

    socketInstance.on('connect', () => {
      console.log('✅ Socket متصل شد:', socketInstance.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      if (user) {
        joinGroup(socketInstance, user);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket قطع شد:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ خطای اتصال Socket:', error.message);
      setConnectionStatus('error');
    });

    socketInstance.on('receiveMessage', (serverMessage) => {
      console.log('📨 پیام جدید دریافت شد:', serverMessage);

      setMessages(prev => {
        if (serverMessage.senderId === user?.NOF) {
          const tempMessage = prev.find(msg =>
            msg.local &&
            msg.senderId === serverMessage.senderId &&
            msg.text === serverMessage.text
          );

          if (tempMessage) {
            console.log('🔄 جایگزینی پیام موقت با پیام سرور');
            return prev.map(msg =>
              msg.id === tempMessage.id
                ? { ...serverMessage, local: false, isSending: false }
                : msg
            );
          }
        }

        if (prev.find(m => m.id === serverMessage.id)) {
          console.log('⚠️ پیام تکراری، نادیده گرفته شد');
          return prev;
        }

        const messageToAdd = {
          ...serverMessage,
          local: false
        };

        if (messageToAdd.file && !messageToAdd.file.baseUrl) {
          messageToAdd.file.baseUrl = baseUrl;
        }

        console.log('✅ پیام جدید اضافه شد');
        return [...prev, messageToAdd];
      });

      // فقط اگر کاربر در پایین هست، اسکرول کن
      if (isAtBottom) {
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // اگر کاربر در پایین نیست، دکمه اسکرول رو نشون بده
        setShowScrollToBottom(true);
        setUnreadMessageCount(prev => prev + 1);
      }
    });

    socketInstance.on('userJoined', (data) => {
      console.log(`👋 ${data.userName} به گروه پیوست`);
    });

    console.log('✅ Socket listeners آماده شد');
  }, [user, baseUrl, isAtBottom]);

  // ✨ لود پیام‌های قبلی
  const loadPreviousMessages = async (currentUser) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('❌ توکن یافت نشد');
        showWelcomeMessage();
        return;
      }

      const currentBaseUrl = baseUrl || await getBaseUrl();
      const url = `${currentBaseUrl}/api/chat/${groupId}/recent?limit=100`;

      console.log('📥 در حال بارگذاری پیام‌ها از:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const messagesArray = result.data.messages || result.data;
          if (Array.isArray(messagesArray) && messagesArray.length > 0) {
            
            const messagesWithFileInfo = await Promise.all(
              messagesArray.map(async (msg) => {
                if (msg.file && msg.file.fileId) {
                  try {
                    const fileInfoResponse = await fetch(
                      `${currentBaseUrl}/api/media/info/${msg.file.fileId}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                    
                    if (fileInfoResponse.ok) {
                      const fileInfoResult = await fileInfoResponse.json();
                      if (fileInfoResult.success) {
                        return {
                          ...msg,
                          file: {
                            ...fileInfoResult.data,
                            fileUrl: `/api/media/file/${msg.file.fileId}`,
                            baseUrl: currentBaseUrl
                          }
                        };
                      }
                    }
                  } catch (error) {
                    console.error('❌ خطا در دریافت اطلاعات فایل:', error);
                  }
                }
                
                return {
                  ...msg,
                  file: msg.file ? {
                    ...msg.file,
                    baseUrl: currentBaseUrl
                  } : null
                };
              })
            );

            const formattedMessages = messagesWithFileInfo.map(msg => ({
              id: msg.id || msg.Id || `msg_${Date.now()}_${Math.random()}`,
              senderId: msg.senderId || msg.SenderId,
              senderName: msg.senderName || msg.SenderName || 'کاربر',
              text: msg.text || msg.Text || '',
              timestamp: msg.timestamp || msg.Time || new Date().toISOString(),
              groupId: msg.groupId || msg.GroupId || groupId,
              local: false,
              file: msg.file
            }));

            const uniqueMessages = formattedMessages.reduce((acc, msg) => {
              if (!acc.find(m => m.id === msg.id)) {
                acc.push(msg);
              }
              return acc;
            }, []);

            setMessages(uniqueMessages);
            
            // موقع لود اولیه به پایین اسکرول کن
            setTimeout(() => {
              scrollToBottom(false);
            }, 500);
          } else {
            showWelcomeMessage();
          }
        } else {
          showWelcomeMessage();
        }
      } else {
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری پیام‌ها:', error);
      showWelcomeMessage();
    }
  };

  // ✨ هندل اسکرول
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // محاسبه فاصله از پایین
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    
    // اگر کمتر از 50 پیکسل از پایین فاصله داریم، کاربر در پایین است
    const userIsAtBottom = distanceFromBottom < 50;
    
    setIsAtBottom(userIsAtBottom);
    
    // اگر کاربر از پایین فاصله گرفت، دکمه اسکرول رو نشون بده
    if (distanceFromBottom > 100) {
      setShowScrollToBottom(true);
    } else {
      setShowScrollToBottom(false);
      setUnreadMessageCount(0); // وقتی به پایین رسید، شمارنده رو پاک کن
    }
  };

  // ✨ هندل کلیک روی دکمه اسکرول به پایین
  const handleScrollToBottomPress = () => {
    setIsAtBottom(true);
    setShowScrollToBottom(false);
    setUnreadMessageCount(0);
    scrollToBottom(true);
  };

  // ✨ نمایش پیام خوش‌آمدگویی
  const showWelcomeMessage = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        senderId: 0,
        senderName: 'سیستم',
        text: '👋 به گروه چت خوش آمدید!',
        timestamp: new Date().toISOString(),
        isSystem: true
      }
    ]);
  };

  // ✨ نمایش پیام خطا
  const showErrorMessage = (text) => {
    setMessages(prev => [
      ...prev,
      {
        id: `error_${Date.now()}`,
        senderId: 0,
        senderName: 'سیستم',
        text: `❌ ${text}`,
        timestamp: new Date().toISOString(),
        isError: true
      }
    ]);
  };

  // ✨ اسکرول به پایین
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  // ✨ پاک‌سازی شنوندگان سوکت
  const cleanupSocketListeners = useCallback(() => {
    try {
      const currentSocket = socket;
      if (currentSocket && typeof currentSocket.off === 'function') {
        const events = [
          'receiveMessage', 'newNotification', 'connect', 'disconnect',
          'connect_error', 'joinConfirmation', 'messageSent',
          'userJoined', 'userTyping', 'connected', 'messageError'
        ];
        events.forEach(event => {
          try {
            currentSocket.off(event);
          } catch (error) {}
        });
      }
    } catch (error) {
      console.error('❌ Error in cleanupSocketListeners:', error);
    }
  }, [socket]);

  // ✨ پیوستن به گروه
  const joinGroup = useCallback((socketInstance, currentUser) => {
    if (!socketInstance || !socketInstance.connected || !currentUser) return;

    const joinData = {
      groupId: parseInt(groupId),
      userId: parseInt(currentUser.NOF),
      userName: currentUser.NameF.toString()
    };

    console.log('📤 ارسال داده‌های joinGroup:', joinData);
    socketInstance.emit('joinGroup', joinData);
  }, [groupId]);

  // ✨ ارسال پیام
  const sendMessage = async () => {
    if ((!newMessage.trim() && !uploadingFile) || !user) return;

    const messageText = newMessage.trim();
    const messageData = {
      groupId: groupId,
      senderId: user.NOF,
      senderName: user.NameF,
      text: messageText,
      timestamp: new Date().toISOString()
    };

    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      ...messageData,
      id: tempMessageId,
      isSending: true,
      local: true,
      tempId: tempMessageId
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // همیشه بعد از ارسال پیام به پایین اسکرول کن
    scrollToBottom();

    try {
      const result = await sendMessageWithSocket(messageData);
      if (result.success) {
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempMessageId);
          const serverMessage = result.data || result.message;
          if (serverMessage && !filtered.find(m => m.id === serverMessage.id)) {
            return [...filtered, {
              ...serverMessage,
              isSending: false,
              local: false
            }];
          }
          return filtered;
        });
      } else {
        throw new Error(result.error || 'خطا در ارسال پیام');
      }
    } catch (error) {
      console.error('❌ خطا در ارسال پیام:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId
          ? { ...msg, isSending: false, sendError: true, errorMessage: error.message }
          : msg
      ));
    }
  };

  // ✨ هندل انتخاب فایل
  const handleFileSelection = async (file) => {
    if (!user) {
      console.log('❌ کاربر لاگین نیست');
      return;
    }

    const shortenFileName = (fileName, maxLength = 100) => {
      if (!fileName || fileName.length <= maxLength) return fileName;
      
      const ext = file.type?.split('/')[1] || 'file';
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      
      const shortenedName = nameWithoutExt.substring(0, maxLength - 10);
      return `${shortenedName}_${Date.now()}.${ext}`;
    };

    const safeFileName = shortenFileName(file.name || 'file');

    console.log('🔄 شروع آپلود فایل:', {
      originalName: file.name,
      safeName: safeFileName,
      type: file.type,
      size: file.size,
    });

    setUploadingFile(true);
    setUploadProgress(0);

    const tempMessageId = `temp_file_${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      senderId: user.NOF,
      senderName: user.NameF,
      text: '',
      file: {
        ...file,
        name: safeFileName,
        baseUrl: baseUrl,
        uploading: true,
        progress: 0
      },
      timestamp: new Date().toISOString(),
      isSending: true,
      local: true
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const messageData = {
        groupId: groupId,
        senderId: user.NOF,
        senderName: user.NameF,
        text: '',
        timestamp: new Date().toISOString()
      };

      const onProgress = (progress) => {
        console.log(`📊 پیشرفت آپلود: ${progress}%`);
        setUploadProgress(progress);
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessageId
            ? { 
                ...msg, 
                file: { 
                  ...msg.file, 
                  progress: progress 
                } 
              }
            : msg
        ));
      };

      console.log('🚀 فراخوانی uploadAndSendFile...');
      
      const fileToUpload = {
        ...file,
        name: safeFileName
      };
      
      const result = await uploadAndSendFile(fileToUpload, messageData, onProgress);

      console.log('✅ نتیجه آپلود:', result);

      if (result.success) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessageId
            ? {
                ...msg,
                isSending: false,
                file: {
                  ...msg.file,
                  uploading: false,
                  fileId: result.uploadData?.fileId,
                  fileName: result.uploadData?.fileName,
                  fileType: result.uploadData?.fileType,
                  fileSize: result.uploadData?.fileSize,
                  fileUrl: `/api/media/file/${result.uploadData?.fileId}`,
                  baseUrl: baseUrl
                }
              }
            : msg
        ));
        console.log('🎉 فایل با موفقیت آپلود و ارسال شد');
      } else {
        throw new Error('آپلود ناموفق بود');
      }

    } catch (error) {
      console.error('❌ خطا در آپلود فایل:', error);
      
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId
          ? { 
              ...msg, 
              isSending: false, 
              sendError: true,
              errorMessage: error.message 
            }
          : msg
      ));
      
      Alert.alert('خطا', `آپلود فایل ناموفق بود: ${error.message}`);
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      console.log('🏁 پایان فرآیند آپلود');
    }
  };

  // ✨ هندل انتخاب عکس از گالری
  const handleImagePick = async () => {
    try {
      setShowFilePicker(false);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        
        const safeName = `image_${Date.now()}.jpg`;
        
        handleFileSelection({
          uri: image.uri,
          type: 'image/jpeg',
          name: safeName,
          size: image.fileSize || 0,
          groupId: groupId,
          senderId: user?.NOF,
        });
      }
    } catch (error) {
      console.log('❌ خطا در انتخاب عکس:', error);
    }
  };

  // ✨ هندل انتخاب سند
  const handleDocumentPick = async () => {
    try {
      setShowFilePicker(false);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result;
        if (file.size > 25 * 1024 * 1024) {
          Alert.alert('خطا', 'حجم فایل نمی‌تواند بیشتر از 25 مگابایت باشد');
          return;
        }

        const originalName = file.name || 'document';
        const safeName = originalName.length > 50 
          ? `file_${Date.now()}.${originalName.split('.').pop()}`
          : originalName;

        handleFileSelection({
          uri: file.uri,
          type: file.mimeType || file.type || 'application/octet-stream',
          name: safeName,
          size: file.size,
          groupId: groupId,
          senderId: user?.NOF,
        });
      }
    } catch (error) {
      console.log('❌ خطا در انتخاب فایل:', error);
    }
  };

  // ✨ هندل عکس گرفتن با دوربین
  const handleCameraPick = async () => {
    try {
      setShowFilePicker(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        
        const safeName = `photo_${Date.now()}.jpg`;
        
        handleFileSelection({
          uri: image.uri,
          type: 'image/jpeg',
          name: safeName,
          size: image.fileSize || 0,
          groupId: groupId,
          senderId: user?.NOF,
        });
      }
    } catch (error) {
      console.log('❌ خطا در دوربین:', error);
    }
  };

  // ✨ ساخت URL فایل
  const buildFileUrl = (file, currentBaseUrl) => {
    if (file.fileUrl && file.fileUrl.startsWith('/')) {
      return `${currentBaseUrl}${file.fileUrl}`;
    }
    
    if (file.fileUrl && file.fileUrl.startsWith('http')) {
      return file.fileUrl;
    }
    
    if (file.uri) {
      return file.uri;
    }
    
    if (file.fileId && currentBaseUrl) {
      return `${currentBaseUrl}/api/media/file/${file.fileId}`;
    }
    
    return null;
  };

  // ✨ فرمت زمان
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✨ رندر محتوای پیام
  const renderMessageContent = (item) => {
    if (item.file) {
      const completeFile = {
        ...item.file,
        baseUrl: baseUrl
      };

      return (
        <MessageFile
          file={completeFile}
          isMyMessage={item.senderId === user?.NOF}
          baseUrl={baseUrl}
          onPress={() => {
            const isImg = isImageFile(completeFile);

            if (isImg) {
              const imageUrl = buildFileUrl(completeFile, baseUrl);
              
              if (imageUrl) {
                setSelectedImage({
                  ...completeFile,
                  fileUrl: imageUrl
                });
              } else {
                Alert.alert('خطا', 'آدرس تصویر نامعتبر است');
              }
            } else {
              const fileUrl = buildFileUrl(completeFile, baseUrl);
              
              if (fileUrl) {
                Linking.openURL(fileUrl).catch(error => {
                  console.error('❌ خطا در باز کردن فایل:', error);
                  Alert.alert('خطا', 'امکان باز کردن فایل وجود ندارد');
                });
              }
            }
          }}
        />
      );
    }

    return (
      <Text style={[
        styles.messageText,
        item.senderId === user?.NOF && styles.myMessageText,
        item.isSystem && styles.systemMessageText
      ]}>
        {item.text}
      </Text>
    );
  };

  // ✨ رندر هر پیام
  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user?.NOF;
    const showAvatar = !isMyMessage &&
      (index === messages.length - 1 || messages[index + 1]?.senderId !== item.senderId);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[
          styles.messageWrapper,
          isMyMessage && styles.myMessageWrapper
        ]}>
          {!isMyMessage && showAvatar && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.senderName?.charAt(0) || '?'}
              </Text>
            </View>
          )}

          <View style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
            item.isSending && styles.sendingMessage,
            item.sendError && styles.errorMessage,
            item.isSystem && styles.systemMessage,
            !isMyMessage && !showAvatar && styles.messageWithoutAvatar,
            item.file && styles.fileMessage
          ]}>
            {!isMyMessage && !item.isSystem && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}

            {renderMessageContent(item)}

            {item.file?.uploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.file.progress || 0}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(item.file.progress || 0)}%
                </Text>
              </View>
            )}

            <View style={styles.messageFooter}>
              <Text style={[
                styles.timestamp,
                isMyMessage && styles.myTimestamp
              ]}>
                {formatTime(item.timestamp)}
              </Text>

              {isMyMessage && (
                <Text style={styles.checkmark}>
                  {item.isSending ? '🕐' : item.sendError ? '❌' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ✨ useEffect برای راه‌اندازی اولیه
  useEffect(() => {
    initializeChat();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      cleanupSocketListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      isInitializedRef.current = false;
    };
  }, []);

  // ✨ useEffect برای مدیریت کیبورد
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // فقط اگر در پایین هستیم، اسکرول کن
        if (isAtBottom) {
          scrollToBottom();
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isAtBottom]);

  // ✨ تازه‌سازی پیام‌ها
  const refreshMessages = async () => {
    console.log('🔄 در حال تازه‌سازی پیام‌ها...');
    if (user) await loadPreviousMessages(user);
  };

  // ✨ اتصال مجدد
  const reconnect = async () => {
    console.log('🔄 در حال اتصال مجدد...');
    setConnectionStatus('connecting');
    isInitializedRef.current = false;
    await initializeChat();
  };

  // ✨ نمایش صفحه لودینگ
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>در حال بارگذاری چت...</Text>
      </View>
    );
  }

  // ✨ رندر اصلی
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.groupAvatarContainer}>
              <View style={styles.groupAvatar}>
                <Ionicons name="people" size={24} color="#ffffff" />
              </View>
            </View>

            <View style={styles.groupInfo}>
              <Text style={styles.headerTitle}>گروه چت {groupId}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.metaItem}>
                  <Feather name="user" size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>{user?.NameF || 'کاربر'}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Feather name="message-circle" size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>{messages.length} پیام</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={refreshMessages} style={styles.headerAction}>
              <Feather name="refresh-cw" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={() => {
          // فقط اگر در پایین هستیم، اسکرول کن
          if (isAtBottom) {
            scrollToBottom();
          }
        }}
      />

      {/* دکمه اسکرول به پایین */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={handleScrollToBottomPress}
          activeOpacity={0.7}
        >
          <Feather name="arrow-down" size={20} color="#ffffff" />
          {unreadMessageCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <View style={[
        styles.inputContainer,
        { paddingBottom: keyboardHeight > 0 ? 110 : 50 }
      ]}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowFilePicker(true)}
          disabled={uploadingFile || !isConnected}
        >
          <Feather name="paperclip" size={20} color="#ffffff" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="پیام خود را بنویسید..."
          placeholderTextColor="#64748b"
          multiline
          maxLength={4000}
          editable={isConnected && !uploadingFile}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            ((!newMessage.trim() && !uploadingFile) || !isConnected) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={(!newMessage.trim() && !uploadingFile) || !isConnected}
        >
          <Feather name="send" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilePicker(false)}
        >
          <View style={styles.filePickerContainer}>
            <View style={styles.filePickerHeader}>
              <Text style={styles.filePickerTitle}>انتخاب فایل</Text>
              <TouchableOpacity onPress={() => setShowFilePicker(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.filePickerOption} onPress={handleCameraPick}>
              <Feather name="camera" size={24} color="#3b82f6" />
              <Text style={styles.filePickerOptionText}>عکس گرفتن</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filePickerOption} onPress={handleImagePick}>
              <Feather name="image" size={24} color="#10b981" />
              <Text style={styles.filePickerOptionText}>انتخاب عکس</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filePickerOption} onPress={handleDocumentPick}>
              <Feather name="file-text" size={24} color="#f59e0b" />
              <Text style={styles.filePickerOptionText}>انتخاب فایل</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.fullScreenImageOverlay}>
          <TouchableOpacity
            style={styles.fullScreenImageClose}
            onPress={() => setSelectedImage(null)}
          >
            <Feather name="x" size={28} color="#ffffff" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{
                uri: selectedImage.fileUrl,
                cache: 'force-cache'
              }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.fullScreenImageInfo}>
            <Text style={styles.fullScreenImageName} numberOfLines={1}>
              {selectedImage?.fileName || selectedImage?.name || 'تصویر'}
            </Text>
            {selectedImage?.fileSize && (
              <Text style={styles.fullScreenImageSize}>
                {(selectedImage.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;