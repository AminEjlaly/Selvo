import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { getServerUrl } from '../config';
import styles from '../styles/ProductListScreen.styles';

export default function ProductCard({ item, onPress, onImagePress, isDemo }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [serverBaseUrl, setServerBaseUrl] = useState(null);
  const [loadingServerUrl, setLoadingServerUrl] = useState(true);

  useEffect(() => {
    const fetchServerUrl = async () => {
      try {
        const baseUrl = await getServerUrl();
        setServerBaseUrl(baseUrl);
      } catch (error) {
        console.error('❌ Error fetching server URL:', error);
      } finally {
        setLoadingServerUrl(false);
      }
    };
    fetchServerUrl();
  }, []);

  const getCorrectImageUrl = () => {
    if (!item.imageUrl || !serverBaseUrl) return null;
    
    try {
      const fileName = item.imageUrl.split('/').pop();
      const correctUrl = `${serverBaseUrl}/Gallery/${fileName}`;      
      return correctUrl;
    } catch (error) {
      console.error('❌ Error creating correct URL:', error);
      return item.imageUrl;
    }
  };

  const correctImageUrl = getCorrectImageUrl();

  const handleImageLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
    console.log(`🖼️ [Image Load Start] - Product: ${item.Code}`);
    console.log(`📍 URL: ${correctImageUrl}`);
  };

  const handleImageLoadEnd = () => {
    setImageLoading(false);
    console.log(`✅ [Image Load Success] - Product: ${item.Code}`);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    console.error(`❌ [Image Load Error] - Product: ${item.Code}`);
  };

  // 🔥 تابع جدید: کلیک روی عکس
  const handleImageClick = () => {
    if (correctImageUrl && !imageError && !imageLoading && onImagePress) {
      onImagePress(correctImageUrl);
    }
  };

  if (loadingServerUrl) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={[styles.cardImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={customStyles.loadingText}>در حال بارگذاری تنظیمات سرور...</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
          <Text style={customStyles.serverLoadingText}>منتظر دریافت آدرس سرور</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* 🔥 بخش تصویر محصول - با TouchableOpacity جداگانه */}
      <TouchableOpacity 
        style={styles.cardImage} 
        onPress={handleImageClick}
        activeOpacity={0.8}
        disabled={imageError || imageLoading || !correctImageUrl}
      >
        {correctImageUrl && !imageError ? (
          <>
            {imageLoading && (
              <View style={customStyles.imageLoaderOverlay}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={customStyles.imageLoadingText}>در حال بارگذاری تصویر...</Text>
                <Text style={customStyles.serverInfoText}>
                  از: {serverBaseUrl}
                </Text>
              </View>
            )}
            
            <Image 
              source={{ uri: correctImageUrl }}
              style={[styles.cardImage, imageLoading && { opacity: 0 }]} 
              resizeMode="contain"
              onLoadStart={handleImageLoadStart}
              onLoadEnd={handleImageLoadEnd}
              onError={handleImageError}
            />

            {imageLoading && (
              <View style={customStyles.topRightLoader}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </>
        ) : (
          <View style={customStyles.placeholderContainer}>
            <Text style={styles.cardImagePlaceholder}>📦</Text>
            {imageError ? (
              <>
                <Text style={customStyles.errorText}>تصویری تعریف نشده</Text>
                <Text style={customStyles.serverInfoText}>
                  سرور: {serverBaseUrl}
                </Text>
                <TouchableOpacity 
                  style={customStyles.retryButton}
                  onPress={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                >
                  <Text style={customStyles.retryButtonText}>🔄 تلاش مجدد</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={customStyles.errorText}> 
              تصویری تعریف نشده
              </Text>
            )}
          </View>
        )}
        
        {/* کد محصول روی عکس */}
        <View style={styles.codeOverlay}>
          <Text style={styles.codeOverlayText}>کد: {item.Code}</Text>
        </View>
      </TouchableOpacity>

      {/* بدنه کارت */}
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>

        <View style={styles.detailsContainer}>
          {item.MoenName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>تولید کننده:</Text>
              <Text style={styles.detailValue}>---</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>مبنا / جز:</Text>
            <Text style={styles.detailValue}>
              {item.MainUnit} ({item.Mbna}) / {item.SlaveUnit}
            </Text>
          </View>

          {item.Mojoodi !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>موجودی:</Text>
              <Text style={[
                styles.detailValue,
                { color: item.Mojoodi > 0 ? '#10b981' : '#ef4444' }
              ]}>
                {item.Mojoodi} {item.SlaveUnit}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>قیمت</Text>
          <Text style={styles.price}>
            {item.Price ? parseInt(item.Price).toLocaleString() : '۰'}
          </Text>
        </View>

        {isDemo && (
          <View style={[styles.demoBadge, { marginTop: 8, alignSelf: 'center' }]}>
            <Text style={styles.demoBadgeText}>حالت نمایشی</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const customStyles = {
  imageLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    zIndex: 2,
  },
  imageLoadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  topRightLoader: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(30, 58, 138, 0.95)',
    borderRadius: 16,
    padding: 8,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  errorText: {
    marginTop: 8,
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  serverLoadingText: {
    marginTop: 4,
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  serverInfoText: {
    marginTop: 4,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  // 🔥 استایل جدید: نشانگر قابلیت کلیک
  imageClickHint: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  imageClickHintText: {
    fontSize: 16,
  },
};