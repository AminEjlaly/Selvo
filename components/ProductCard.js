import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { getServerUrl } from '../config';
import styles from '../styles/ProductListScreen.styles';

// ==================== کش حافظه‌ای عکس‌های لود شده ====================
// این Set بیرون از کامپوننته، یعنی بین mount/unmount های مختلف
// (وقتی FlatList آیتم‌ها رو recycle می‌کنه) زنده می‌مونه.
// اگه یه آدرس عکس قبلاً یه‌بار موفق لود شده باشه، دیگه لودر رو نشون نمی‌دیم
// چون مرورگر خودش از کش HTTP (که تو نگینکس تنظیم کردیم) خیلی سریع میاره.
const loadedImageCache = new Set();

// ==================== کامپوننت badge جایزه ====================

function GiftBadge({ giftInfo }) {
  if (!giftInfo) return null;

  const isPercent = giftInfo.type === 'percent';
  const label = isPercent ? 'تخفیف:' : 'جایزه:';
  const value = isPercent
    ? `بیش از ${Number(giftInfo.minQty).toLocaleString('fa-IR')} عدد ${giftInfo.value}٪`
    : `بیش از ${Number(giftInfo.minQty).toLocaleString('fa-IR')} عدد ${giftInfo.value} جایزه`;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: '#b45309', fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
  );
}

// ==================== کامپوننت اصلی ====================

export default function ProductCard({ item, onPress, onImagePress, isDemo }) {
  const [serverBaseUrl, setServerBaseUrl] = useState(null);
  const [loadingServerUrl, setLoadingServerUrl] = useState(true);

  // آدرس عکس رو یه‌بار محاسبه و نگه می‌داریم (وابسته به serverBaseUrl و item.imageUrl)
  const correctImageUrlRef = useRef(null);

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
      return `${serverBaseUrl}/Gallery/${fileName}`;
    } catch (error) {
      console.error('❌ Error creating correct URL:', error);
      return item.imageUrl;
    }
  };

  const correctImageUrl = getCorrectImageUrl();
  correctImageUrlRef.current = correctImageUrl;

  // 🔥 اگه این عکس قبلاً یه‌بار لود شده، از همون اول لودر رو نشون نده
  const alreadyLoaded = correctImageUrl ? loadedImageCache.has(correctImageUrl) : false;

  const [imageLoading, setImageLoading] = useState(!alreadyLoaded);
  const [imageError, setImageError] = useState(false);

  // اگه آدرس عکس عوض شد (مثلاً آیتم دیگه‌ای recycle شد تو همین اسلات)
  // وضعیت رو با کش هماهنگ کن
  useEffect(() => {
    if (!correctImageUrl) return;
    if (loadedImageCache.has(correctImageUrl)) {
      setImageLoading(false);
    } else {
      setImageLoading(true);
    }
    setImageError(false);
  }, [correctImageUrl]);

  const handleImageLoadStart = () => {
    // اگه از قبل تو کش داریمش، لودر رو نشون نده (فقط تو بک‌گراند لود میشه ولی سریعه)
    if (correctImageUrlRef.current && loadedImageCache.has(correctImageUrlRef.current)) {
      return;
    }
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoadEnd = () => {
    setImageLoading(false);
    if (correctImageUrlRef.current) {
      loadedImageCache.add(correctImageUrlRef.current);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

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

      {/* بخش تصویر محصول */}
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
          </>
        ) : (
          <View style={customStyles.placeholderContainer}>
            <Text style={styles.cardImagePlaceholder}>📦</Text>
            {imageError ? (
              <>
                <Text style={customStyles.errorText}>تصویری تعریف نشده</Text>
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
              <Text style={customStyles.errorText}>تصویری تعریف نشده</Text>
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

          {/* 🎁 جایزه / تخفیف - جایگزین ردیف تولیدکننده */}
          <GiftBadge giftInfo={item.giftInfo} />

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

          <View style={[styles.detailRow, styles.consumerPriceRow, { justifyContent: 'flex-end' }]}>
            <Text style={styles.detailLabel}>قیمت مصرف‌کننده:</Text>
            <Text style={[
              styles.detailValue,
              { textAlign: 'left', marginLeft: 12, fontSize: 11, fontWeight: '600' }
            ]}>
              {item?.ConsumerPrice && parseFloat(item.ConsumerPrice) > 0
                ? parseInt(item.ConsumerPrice).toLocaleString('fa-IR')
                : '۰'}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>قیمت</Text>
          <Text
            style={styles.price}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
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

// ==================== استایل‌های سفارشی ====================

const customStyles = {
  imageLoaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
};