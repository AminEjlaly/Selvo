import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getServerUrl } from '../config';

const { width, height } = Dimensions.get('window');

export default function MapBuyerScreen({ route }) {
  const selectedBuyer = route?.params?.buyer || null;
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [maxDistance, setMaxDistance] = useState(50); // 🔥 حالت پیش‌فرض
  const [proximityCheckEnabled, setProximityCheckEnabled] = useState(true); // 🔥 وضعیت فعال/غیرفعال
  const webRef = useRef(null);

  // 🔥 تابع دریافت تنظیمات proximity از سرور
  const fetchProximitySettings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const baseUrl = await getServerUrl();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseUrl}/api/proximity-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ تنظیمات proximity دریافت شد:', data.data);
          setMaxDistance(data.data.maxDistance || 50);
          setProximityCheckEnabled(data.data.proximityCheckEnabled !== false);
          return data.data;
        }
      }
      
      console.log('⚠️ استفاده از مقادیر پیش‌فرض');
      return { maxDistance: 50, proximityCheckEnabled: true };
    } catch (error) {
      console.error('❌ خطا در دریافت تنظیمات proximity:', error);
      return { maxDistance: 50, proximityCheckEnabled: true };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 اول تنظیمات proximity را بگیر
        await fetchProximitySettings();

        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('توکن معتبر یافت نشد');

        const baseUrl = await getServerUrl();
        const res = await fetch(`${baseUrl}/api/rozmasir/map`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const json = await res.json();

        if (json.success) {
          const validBuyers = json.data.filter(b => b.Lat && b.Lng && !isNaN(b.Lat) && !isNaN(b.Lng));
          setBuyers(validBuyers);
        } else {
          throw new Error(json.message || 'خطا در دریافت اطلاعات مشتری‌ها');
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('خطا', 'دسترسی موقعیت مکانی رد شد');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setUserLocationCoords(loc.coords);
      } catch (err) {
        console.error(err);
        setMapError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // تابع محاسبه فاصله
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getMapHtml = () => {
    // 🔥 استفاده از maxDistance از state
    const currentMaxDistance = maxDistance;

    const buyersWithDistance = buyers.map(b => {
      let distance = null;
      let isInRange = false;
      
      if (userLocationCoords) {
        distance = calculateDistance(
          userLocationCoords.latitude,
          userLocationCoords.longitude,
          parseFloat(b.Lat),
          parseFloat(b.Lng)
        );
        // 🔥 استفاده از maxDistance دینامیک
        isInRange = distance <= currentMaxDistance;
      }

      return {
        ...b,
        lat: parseFloat(b.Lat),
        lng: parseFloat(b.Lng),
        distance,
        isInRange
      };
    });

    const buyersJson = JSON.stringify(buyersWithDistance);

    const user = userLocation
      ? `{ lat: ${userLocation.lat}, lng: ${userLocation.lng} }`
      : 'null';

    const selectedCode = selectedBuyer ? selectedBuyer.code : null;

    // 🔥 پاس دادن maxDistance به JavaScript نقشه
    return `
      const MAX_DISTANCE = ${currentMaxDistance}; // 🔥 متغیر دینامیک
      const PROXIMITY_CHECK_ENABLED = ${proximityCheckEnabled}; // 🔥 وضعیت فعال/غیرفعال

      let map = L.map('map', {
        zoomControl: false
      }).setView([37.55, 45.07], 13);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const buyers = ${buyersJson};
      const selectedBuyer = '${selectedCode ?? ''}';
      let userMarker = null;
      let circles = [];

      // تابع برای ایجاد دایره محدوده
      function createProximityCircle(buyer) {
        const isSelected = buyer.code === selectedBuyer;
        const isInRange = buyer.isInRange;
        
        // 🔥 اگر چک غیرفعال باشد، همه محدوده‌ها سبز
        const circleColor = !PROXIMITY_CHECK_ENABLED ? '#10B981' : (isInRange ? '#10B981' : '#EF4444');
        const fillColor = !PROXIMITY_CHECK_ENABLED ? '#D1FAE5' : (isInRange ? '#D1FAE5' : '#FEE2E2');
        const fillOpacity = isInRange ? 0.15 : 0.1;
        
        const circle = L.circle([buyer.lat, buyer.lng], {
          color: circleColor,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          weight: isSelected ? 2 : 1,
          radius: MAX_DISTANCE // 🔥 استفاده از متغیر دینامیک
        }).addTo(map);
        
        circles.push(circle);
        return circle;
      }

      buyers.forEach(b => {
        const isSelected = b.code === selectedBuyer;
        
        // ایجاد دایره محدوده
        const circle = createProximityCircle(b);
        
        // 🔥 اگر چک غیرفعال باشد، همه مارکرها سبز
        const markerColor = !PROXIMITY_CHECK_ENABLED ? '#10B981' : (isSelected ? '#7C3AED' : (b.isInRange ? '#10B981' : '#EF4444'));
        
        const icon = L.divIcon({
          className: 'custom-marker',
          html: \`
            <div style="position: relative;">
              <div style="
                width: 20px;
                height: 20px;
                background: \${markerColor};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg style="width: 10px; height: 10px;" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              \${isSelected ? \`
                <div style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 8px;
                  height: 8px;
                  background: #7C3AED;
                  border: 1px solid white;
                  border-radius: 50%;
                  animation: pulse 1.5s infinite;
                "></div>
              \` : ''}
            </div>
          \`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);

        const distanceText = b.distance ? \`\${Math.round(b.distance)} متر\` : 'نامعلوم';
        // 🔥 نمایش وضعیت بر اساس تنظیمات
        const statusText = !PROXIMITY_CHECK_ENABLED ? 'چک محدوده غیرفعال' : (b.isInRange ? 'در محدوده مجاز' : 'خارج از محدوده');
        const statusColor = !PROXIMITY_CHECK_ENABLED ? '#10B981' : (b.isInRange ? '#10B981' : '#EF4444');

        const popupHtml = \`
          <div style="text-align:center; font-family:IRANYekan; padding:8px; min-width:160px;">
            <div style="font-size:14px; font-weight:600; color:#1F2937; margin-bottom:6px;">
              \${b.name || 'مشتری'}
            </div>
            <div style="font-size:11px; color:#6B7280; margin-bottom:8px;">
              کد: \${b.code}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:10px; background:#F9FAFB; padding:6px; border-radius:6px;">
              <div style="display:flex; align-items:center; gap:4px;">
                <svg width="12" height="12" fill="\${statusColor}" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span style="font-size:11px; color:\${statusColor}; font-weight:500;">\${statusText}</span>
              </div>
              <div style="font-size:11px; color:#6B7280; direction:ltr;">
                \${distanceText}
              </div>
            </div>
            \${!PROXIMITY_CHECK_ENABLED ? \`
              <div style="font-size:10px; color:#F59E0B; background:#FEF3C7; padding:4px; border-radius:4px; margin-bottom:8px;">
                ⚠️ چک محدوده غیرفعال است
              </div>
            \` : ''}
            <button onclick="navigateTo(\${b.lat}, \${b.lng})"
              style="
                background: linear-gradient(135deg, \${!PROXIMITY_CHECK_ENABLED || b.isInRange ? '#10B981' : '#EF4444'} 0%, \${!PROXIMITY_CHECK_ENABLED || b.isInRange ? '#059669' : '#DC2626'} 100%);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 4px;
                justify-content: center;
                width: 100%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                margin-bottom: 6px;
              ">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              مسیر‌یابی
            </button>
            <button onclick="toggleCircle('\${b.code}')"
              style="
                background: transparent;
                color: #6B7280;
                border: 1px solid #D1D5DB;
                border-radius: 6px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 10px;
                font-weight: 500;
                width: 100%;
              ">
              نمایش/مخفی محدوده
            </button>
          </div>
        \`;

        marker.bindPopup(popupHtml, { 
          closeButton: true, 
          autoClose: true,
          className: 'custom-popup',
          maxWidth: 200
        });

        if (isSelected) {
          marker.openPopup();
          setTimeout(() => {
            map.setView([b.lat, b.lng], 17, { animate: true });
          }, 800);
        }
      });

      const userLoc = ${user};
      if (userLoc) {
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: \`
            <div style="position: relative;">
              <div style="
                width: 24px;
                height: 24px;
                background: #8B5CF6;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg stroke="currentColor" fill="white" stroke-width="0" viewBox="0 0 16 16" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 16h8v-16h-8v16zM5 2h2v2h-2v-2zM5 6h2v2h-2v-2zM5 10h2v2h-2v-2zM1 2h2v2h-2v-2zM1 6h2v2h-2v-2zM1 10h2v2h-2v-2zM9 5h7v1h-7zM9 16h2v-4h3v4h2v-9h-7z"></path>
                </svg>
              </div>
              <div style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                background: #22C55E;
                border: 1px solid white;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
            </div>
          \`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(\`
            <div style="text-align:center; font-family:IRANYekan; padding:8px;">
              <div style="font-size:13px; font-weight:600; color:#8B5CF6;">
                موقعیت شما
              </div>
              <div style="font-size:10px; color:#6B7280; margin-top:4px;">
                محدوده مجاز: \${MAX_DISTANCE} متر
              </div>
              \${!PROXIMITY_CHECK_ENABLED ? \`
                <div style="font-size:9px; color:#F59E0B; margin-top:4px;">
                  ⚠️ چک محدوده غیرفعال
                </div>
              \` : ''}
            </div>
          \`);
      }

      window.toggleCircle = function(buyerCode) {
        const circle = circles.find(c => {
          const latLng = c.getLatLng();
          const buyer = buyers.find(b => b.code === buyerCode);
          return buyer && latLng.lat === buyer.lat && latLng.lng === buyer.lng;
        });
        
        if (circle) {
          if (map.hasLayer(circle)) {
            map.removeLayer(circle);
          } else {
            map.addLayer(circle);
          }
        }
      };

      window.hideAllCircles = function() {
        circles.forEach(circle => {
          if (map.hasLayer(circle)) {
            map.removeLayer(circle);
          }
        });
      };

      window.showAllCircles = function() {
        circles.forEach(circle => {
          if (!map.hasLayer(circle)) {
            map.addLayer(circle);
          }
        });
      };

      // 🔥 بروزرسانی با maxDistance دینامیک
      window.updateUserLocation = function(lat, lng) {
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        }
        
        buyers.forEach((buyer, index) => {
          const distance = calculateDistance(lat, lng, buyer.lat, buyer.lng);
          const isInRange = distance <= MAX_DISTANCE; // 🔥 استفاده از متغیر دینامیک
          
          if (circles[index]) {
            const circleColor = !PROXIMITY_CHECK_ENABLED ? '#10B981' : (isInRange ? '#10B981' : '#EF4444');
            const fillColor = !PROXIMITY_CHECK_ENABLED ? '#D1FAE5' : (isInRange ? '#D1FAE5' : '#FEE2E2');
            
            circles[index].setStyle({
              color: circleColor,
              fillColor: fillColor
            });
          }
        });
      };

      function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
      }

      const style = document.createElement('style');
      style.textContent = \`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        .leaflet-popup-content {
          margin: 8px 12px !important;
        }
      \`;
      document.head.appendChild(style);

      window.navigateTo = function(lat, lng) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'navigate',
          lat,
          lng
        }));
      };

      document.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'focusUser' && userMarker) {
          map.setView(userMarker.getLatLng(), 16, { animate: true });
          userMarker.openPopup();
        } else if (data.type === 'hideAllCircles') {
          window.hideAllCircles();
        } else if (data.type === 'showAllCircles') {
          window.showAllCircles();
        } else if (data.type === 'updateUserLocation') {
          window.updateUserLocation(data.lat, data.lng);
        }
      });
    `;
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigate') {
        const { lat, lng } = data;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        Linking.openURL(url);
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  };

  const focusOnUser = () => {
    if (webRef.current) {
      webRef.current.postMessage(JSON.stringify({ type: 'focusUser' }));
    }
  };

  const toggleAllCircles = (show) => {
    if (webRef.current) {
      webRef.current.postMessage(JSON.stringify({ 
        type: show ? 'showAllCircles' : 'hideAllCircles' 
      }));
    }
  };

  const updateUserLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000 
      });
      
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setUserLocationCoords(loc.coords);
      
      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({
          type: 'updateUserLocation',
          lat: loc.coords.latitude,
          lng: loc.coords.longitude
        }));
      }
    } catch (error) {
      console.error('خطا در بروزرسانی موقعیت:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0052CC" />
          <Text style={styles.loadingText}>در حال بارگذاری نقشه</Text>
          <Text style={styles.loadingSubtext}>لطفاً صبر کنید...</Text>
        </View>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="warning-outline" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>خطا در بارگذاری نقشه</Text>
          <Text style={styles.errorMessage}>{mapError}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={onMessage}
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"/>
                <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
              </head>
              <body style="margin:0; padding:0; height:100%;">
                <div id="map" style="width:100%;height:100%;"></div>
                <script>${getMapHtml()}</script>
              </body>
            </html>
          `,
        }}
        style={styles.webview}
      />

      {/* Floating Action Buttons */}
      <TouchableOpacity
        onPress={focusOnUser}
        style={[styles.fabButton, styles.fabUser]}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={updateUserLocation}
        style={[styles.fabButton, styles.fabRefresh]}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleAllCircles(true)}
        style={[styles.fabButton, styles.fabShow]}
        activeOpacity={0.8}
      >
        <Ionicons name="eye" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleAllCircles(false)}
        style={[styles.fabButton, styles.fabHide]}
        activeOpacity={0.8}
      >
        <Ionicons name="eye-off" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Info Badge */}
      {buyers.length > 0 && (
        <View style={styles.infoBadge}>
          <Ionicons name="people" size={14} color="#0052CC" />
          <Text style={styles.infoBadgeText}>
            {buyers.length} مشتری
          </Text>
          {/* 🔥 نمایش محدوده فعلی */}
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>محدوده: {maxDistance}m</Text>
          </View>
          {/* 🔥 نمایش وضعیت چک */}
          {!proximityCheckEnabled && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={10} color="#F59E0B" />
              <Text style={styles.warningText}>چک غیرفعال</Text>
            </View>
          )}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.circleSample, styles.inRange]} />
              <Text style={styles.legendText}>در محدوده</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.circleSample, styles.outOfRange]} />
              <Text style={styles.legendText}>خارج محدوده</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  webview: {
    width,
    height,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#0052CC',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'IRANYekan-Bold',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#8C9BAB',
    marginTop: 6,
    fontFamily: 'IRANYekan',
  },
  
  // Error
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 300,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'IRANYekan-Bold',
  },
  errorMessage: {
    fontSize: 13,
    color: '#8C9BAB',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'IRANYekan',
  },
  
  // FAB Buttons
  fabButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabUser: {
    bottom: 180,
    left: 16,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  fabRefresh: {
    bottom: 120,
    left: 16,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  fabShow: {
    bottom: 60,
    left: 16,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  fabHide: {
    bottom: 240,
    left: 16,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  
  // Info Badge
  infoBadge: {
    position: 'absolute',
    top: 20,
    left: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 130,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#0052CC',
    fontWeight: '600',
    fontFamily: 'IRANYekan-Bold',
  },
  legend: {
    gap: 4,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleSample: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  inRange: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  outOfRange: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
  },
});