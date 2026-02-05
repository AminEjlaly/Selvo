import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getServerUrl } from '../config';

const { width, height } = Dimensions.get('window');

export default function MapDeliveryScreen({ route }) {
  const filterExit = route?.params?.filterExit || null; // 🔥 تغییر: دریافت filterExit به جای filterDate
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCalculating, setRouteCalculating] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  
  const webRef = useRef(null);

  useEffect(() => {
    console.log('🔍 MapDeliveryScreen mounted', { filterExit });
    
    const fetchData = async () => {
      try {
        console.log('🔄 شروع بارگذاری داده‌ها...', { filterExit });
        
        const token = await AsyncStorage.getItem('token');
        console.log('🔑 توکن:', token ? 'موجود' : 'مفقود');
        
        if (!token) throw new Error('توکن معتبر یافت نشد');

        const baseUrl = await getServerUrl();
        console.log('🌐 سرور:', baseUrl);

        // 🔥 دریافت لوکیشن‌های خریداران بر اساس خروجی انتخاب شده
        let locationsUrl = `${baseUrl}/api/delivery/delivery-locations`;
        if (filterExit) {
          locationsUrl += `?exitCode=${encodeURIComponent(filterExit)}`; // 🔥 تغییر: ارسال exitCode
        }

        console.log('📍 درخواست لوکیشن‌ها:', locationsUrl);

        const locationsRes = await fetch(locationsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('📡 وضعیت پاسخ لوکیشن‌ها:', locationsRes.status);

        if (!locationsRes.ok) {
          throw new Error(`HTTP Error: ${locationsRes.status}`);
        }

        const locationsJson = await locationsRes.json();
        console.log('📊 پاسخ API لوکیشن‌ها:', locationsJson);

        if (locationsJson.success) {
          const allLocations = locationsJson.data?.locations?.filter(loc => 
            loc.latitude && loc.longitude && 
            !isNaN(loc.latitude) && !isNaN(loc.longitude)
          ) || [];

          console.log('📍 لوکیشن‌های فیلتر شده:', allLocations);

          // 🔥 حذف مشتری‌های تکراری
          const uniqueLocations = removeDuplicateBuyers(allLocations);
          
          setLocations(uniqueLocations);
          console.log('✅ تعداد لوکیشن‌های معتبر:', allLocations.length);
          console.log('🎯 تعداد مشتری‌های منحصربفرد:', uniqueLocations.length);
          console.log('📋 خروجی انتخاب شده:', filterExit);
        } else {
          throw new Error(locationsJson.message || 'خطا در دریافت اطلاعات لوکیشن‌ها');
        }

        // 🔥 دریافت موقعیت کاربر
        console.log('📍 درخواست دسترسی موقعیت...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 وضعیت دسترسی موقعیت:', status);
        
        if (status !== 'granted') {
          Alert.alert('خطا', 'دسترسی موقعیت مکانی رد شد');
          console.log('⚠️ دسترسی موقعیت رد شد، ادامه بدون موقعیت کاربر');
        } else {
          console.log('📍 دریافت موقعیت فعلی...');
          const loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000
          });
          
          console.log('📍 موقعیت کاربر دریافت شد:', {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude
          });
          
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setUserLocationCoords(loc.coords);
        }

      } catch (err) {
        console.error('❌ خطا در بارگذاری نقشه:', err);
        setMapError(err.message);
      } finally {
        console.log('🏁 پایان بارگذاری داده‌ها');
        setLoading(false);
      }
    };

    fetchData();
  }, [filterExit]); // 🔥 تغییر: وابستگی به filterExit

  // 🔥 تابع برای حذف مشتری‌های تکراری
  const removeDuplicateBuyers = (locations) => {
    const uniqueBuyers = new Map();
    
    locations.forEach(loc => {
      if (!uniqueBuyers.has(loc.buyerCode)) {
        uniqueBuyers.set(loc.buyerCode, {
          ...loc,
          allInvoices: locations
            .filter(l => l.buyerCode === loc.buyerCode)
            .map(inv => ({
              invoiceNumber: inv.invoiceNumber,
              invoiceAmount: inv.invoiceAmount,
              exitDate: inv.exitDate
            }))
        });
      }
    });
    
    return Array.from(uniqueBuyers.values());
  };

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

  // الگوریتم مسیریابی بهینه
  const calculateOptimizedRoute = () => {
    if (!userLocationCoords || locations.length === 0) {
      Alert.alert('خطا', 'موقعیت شما یا لیست مقاصد خالی است');
      return;
    }

    try {
      setRouteCalculating(true);

      const unvisited = [...locations];
      const route = [];
      let currentLat = userLocationCoords.latitude;
      let currentLng = userLocationCoords.longitude;

      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let minDistance = calculateDistance(
          currentLat,
          currentLng,
          unvisited[0].latitude,
          unvisited[0].longitude
        );

        for (let i = 1; i < unvisited.length; i++) {
          const distance = calculateDistance(
            currentLat,
            currentLng,
            unvisited[i].latitude,
            unvisited[i].longitude
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = i;
          }
        }

        const nearest = unvisited.splice(nearestIndex, 1)[0];
        route.push({
          ...nearest,
          order: route.length + 1,
          distanceFromPrevious: Math.round(minDistance)
        });

        currentLat = nearest.latitude;
        currentLng = nearest.longitude;
      }

      const totalDistance = route.reduce((sum, loc) => sum + loc.distanceFromPrevious, 0);

      setOptimizedRoute(route);
      setShowRoute(true);

      // ارسال مسیر به نقشه
      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({
          type: 'showOptimizedRoute',
          route: route,
          userLocation: userLocation
        }));
      }

      Alert.alert(
        '🗺️ مسیر بهینه محاسبه شد',
        `تعداد ایستگاه: ${route.length}
مسافت کل: ${(totalDistance / 1000).toFixed(1)} کیلومتر
خروجی: ${filterExit || 'آخرین خروجی'}`,
        [{ text: 'باشه' }]
      );

    } catch (error) {
      console.error('❌ خطا در محاسبه مسیر:', error);
      Alert.alert('خطا', 'خطا در محاسبه مسیر بهینه');
    } finally {
      setRouteCalculating(false);
    }
  };

  // تابع مدیریت مسیر بهینه
  const toggleRoute = () => {
    if (showRoute) {
      // پاک کردن مسیر
      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
      }
      setShowRoute(false);
      setOptimizedRoute(null);
    } else {
      // محاسبه و نمایش مسیر
      calculateOptimizedRoute();
    }
  };

  const getMapHtml = () => {
    console.log('🗺️ تولید HTML نقشه...', { filterExit });
    
    // پردازش داده‌ها برای نمایش در نقشه
    const locationsWithDistance = locations.map(loc => {
      let distance = null;
      
      if (userLocationCoords && loc.latitude && loc.longitude) {
        distance = calculateDistance(
          userLocationCoords.latitude,
          userLocationCoords.longitude,
          parseFloat(loc.latitude),
          parseFloat(loc.longitude)
        );
      }

      return {
        ...loc,
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude),
        distance,
        allInvoices: loc.allInvoices || []
      };
    });

    const locationsJson = JSON.stringify(locationsWithDistance);
    const user = userLocation ? `{ lat: ${userLocation.lat}, lng: ${userLocation.lng} }` : 'null';

    console.log('📍 موقعیت کاربر برای نقشه:', user);
    console.log('📍 تعداد مشتری‌ها:', locationsWithDistance.length);
    console.log('📍 خروجی انتخاب شده:', filterExit);

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"/>
          <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
          <style>
              body { 
                  margin: 0; 
                  padding: 0; 
                  height: 100vh; 
                  width: 100vw;
                  font-family: system-ui;
              }
              #map { 
                  width: 100%; 
                  height: 100%; 
              }
              .leaflet-popup-content-wrapper {
                  border-radius: 8px !important;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
              }
              .leaflet-popup-tip {
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
              }
              @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.3); opacity: 0.7; }
              }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              console.log('🗺️ شروع لود نقشه...');
              console.log('📍 خروجی انتخاب شده:', '${filterExit}');
              
              // ایجاد نقشه
              let map = L.map('map', {
                  zoomControl: false
              });

              console.log('📍 نقشه ایجاد شد');

              // تنظیم مرکز نقشه
              const userLoc = ${user};
              const locations = ${locationsJson};
              
              console.log('📍 موقعیت کاربر:', userLoc);
              console.log('📍 تعداد مشتری‌ها:', locations.length);

              if (userLoc) {
                  console.log('📍 زوم روی کاربر');
                  map.setView([userLoc.lat, userLoc.lng], 15);
              } else if (locations.length > 0) {
                  console.log('📍 زوم روی اولین مشتری');
                  map.setView([locations[0].lat, locations[0].lng], 13);
              } else {
                  console.log('📍 زوم روی تهران');
                  map.setView([35.6892, 51.3890], 10);
              }

              // کنترل زوم
              L.control.zoom({
                  position: 'bottomright'
              }).addTo(map);

              // تایل‌لیر
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
              }).addTo(map);

              console.log('📍 تایل‌لیر اضافه شد');

              let userMarker = null;
              let routePolyline = null;
              let routeMarkers = [];

              // ایجاد مارکر کاربر
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
                  
                  userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map)
                      .bindPopup('موقعیت شما');
                  
                  console.log('📍 مارکر کاربر اضافه شد');
              }

              // ایجاد مارکرهای مشتری‌ها
              if (locations.length > 0) {
                  locations.forEach((loc, index) => {
                      const icon = L.divIcon({
                          className: 'customer-marker',
                          html: \`
                              <div style="
                                  width: 20px;
                                  height: 20px;
                                  background: #3B82F6;
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
                          \`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10],
                      });

                      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
                      
                      const distanceText = loc.distance ? \`\${Math.round(loc.distance)} متر\` : 'نامعلوم';
                      
                      const popupHtml = \`
                          <div style="text-align:center; padding:8px; min-width:180px;">
                              <div style="font-size:14px; font-weight:600; color:#1F2937; margin-bottom:6px;">
                                  \${loc.buyerName}
                              </div>
                              <div style="font-size:11px; color:#6B7280; margin-bottom:8px;">
                                  کد: \${loc.buyerCode}
                              </div>
                              <div style="font-size:11px; color:#6B7280; margin-bottom:12px;">
                                  فاصله: \${distanceText}
                              </div>
                              <button onclick="navigateTo(\${loc.lat}, \${loc.lng})"
                                  style="
                                      background: #3B82F6;
                                      color: white;
                                      border: none;
                                      border-radius: 6px;
                                      padding: 8px 12px;
                                      cursor: pointer;
                                      font-size: 12px;
                                      font-weight: 500;
                                      width: 100%;
                                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                                  ">
                                  مسیر‌یابی
                              </button>
                          </div>
                      \`;

                      marker.bindPopup(popupHtml);
                  });
                  
                  console.log('📍 \${locations.length} مارکر مشتری اضافه شد');
              } else {
                  console.log('📍 هیچ مشتری برای نمایش وجود ندارد');
              }

              // تابع مسیریابی
              window.navigateTo = function(lat, lng) {
                  const url = \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}&travelmode=driving\`;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'navigate',
                      lat: lat,
                      lng: lng,
                      url: url
                  }));
              };

              // تابع نمایش مسیر بهینه
              window.showOptimizedRoute = function(route, userLoc) {
                  console.log('🔄 نمایش مسیر بهینه:', route);
                  
                  // پاک کردن مسیر قبلی
                  if (routePolyline) {
                      map.removeLayer(routePolyline);
                  }
                  routeMarkers.forEach(marker => map.removeLayer(marker));
                  routeMarkers = [];

                  // ایجاد خط مسیر
                  const routeCoords = [[userLoc.lat, userLoc.lng]];
                  route.forEach(stop => {
                      routeCoords.push([stop.latitude, stop.longitude]);
                  });

                  routePolyline = L.polyline(routeCoords, {
                      color: '#8B5CF6',
                      weight: 4,
                      opacity: 0.7,
                      dashArray: '10, 5',
                      lineJoin: 'round'
                  }).addTo(map);

                  // نمایش شماره ترتیب روی هر ایستگاه
                  route.forEach(stop => {
                      const orderIcon = L.divIcon({
                          className: 'route-order-marker',
                          html: \`
                              <div style="
                                  width: 28px;
                                  height: 28px;
                                  background: #8B5CF6;
                                  border: 3px solid white;
                                  border-radius: 50%;
                                  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: white;
                                  font-weight: bold;
                                  font-size: 12px;
                              ">\${stop.order}</div>
                          \`,
                          iconSize: [28, 28],
                          iconAnchor: [14, 14],
                      });

                      const orderMarker = L.marker([stop.latitude, stop.longitude], { 
                          icon: orderIcon,
                          zIndexOffset: 1000 
                      }).addTo(map);

                      const distanceKm = (stop.distanceFromPrevious / 1000).toFixed(1);
                      
                      const routePopupHtml = \`
                          <div style="text-align:center; padding:8px; min-width:200px;">
                              <div style="font-size:14px; font-weight:600; color:#8B5CF6; margin-bottom:4px;">
                                  ایستگاه \${stop.order}
                              </div>
                              <div style="font-size:12px; color:#1F2937; margin-bottom:4px;">
                                  \${stop.buyerName}
                              </div>
                              <div style="font-size:10px; color:#6B7280; margin-bottom:12px;">
                                  فاصله از قبلی: \${distanceKm} کیلومتر
                              </div>
                              <button onclick="navigateTo(\${stop.latitude}, \${stop.longitude})"
                                  style="
                                      background: #8B5CF6;
                                      color: white;
                                      border: none;
                                      border-radius: 6px;
                                      padding: 8px 12px;
                                      cursor: pointer;
                                      font-size: 12px;
                                      font-weight: 500;
                                      width: 100%;
                                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                                  ">
                                  مسیر‌یابی
                              </button>
                          </div>
                      \`;

                      orderMarker.bindPopup(routePopupHtml);
                      routeMarkers.push(orderMarker);
                  });

                  // تنظیم نمای نقشه برای نمایش کل مسیر
                  map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
                  
                  console.log('✅ مسیر بهینه نمایش داده شد');
              };

              // تابع پاک کردن مسیر
              window.clearRoute = function() {
                  if (routePolyline) {
                      map.removeLayer(routePolyline);
                      routePolyline = null;
                  }
                  routeMarkers.forEach(marker => map.removeLayer(marker));
                  routeMarkers = [];
                  console.log('🗑️ مسیر پاک شد');
              };

              // هندلر پیام‌های React Native
              document.addEventListener("message", (event) => {
                  console.log('📩 دریافت پیام:', event.data);
                  
                  try {
                      const data = JSON.parse(event.data);
                      
                      if (data.type === 'focusUser' && userMarker) {
                          map.setView(userMarker.getLatLng(), 16, { animate: true });
                          userMarker.openPopup();
                      } else if (data.type === 'showOptimizedRoute') {
                          window.showOptimizedRoute(data.route, data.userLocation);
                      } else if (data.type === 'clearRoute') {
                          window.clearRoute();
                      }
                  } catch (err) {
                      console.error('❌ خطا در پردازش پیام:', err);
                  }
              });

              console.log('✅ نقشه آماده است');
          </script>
      </body>
      </html>
    `;
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigate') {
        const { lat, lng, url } = data;
        console.log('🗺️ ارسال به گوگل مپس:', { lat, lng });
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

  // نمایش وضعیت لودینگ
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0052CC" />
          <Text style={styles.loadingText}>
            {filterExit ? `در حال بارگذاری نقشه خروجی ${filterExit}` : 'در حال بارگذاری نقشه تحویل‌دار'}
          </Text>
          <Text style={styles.loadingSubtext}>لطفاً صبر کنید...</Text>
        </View>
      </View>
    );
  }

  // نمایش خطا
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="warning-outline" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>خطا در بارگذاری نقشه</Text>
          <Text style={styles.errorMessage}>{mapError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>تلاش مجدد</Text>
          </TouchableOpacity>
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
        mixedContentMode="compatibility"
        onMessage={onMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView Error:', nativeEvent);
        }}
        onLoadEnd={() => console.log('✅ WebView لود شد')}
        onLoadStart={() => console.log('🔄 WebView در حال لود...')}
        source={{
          html: getMapHtml(),
          baseUrl: ''
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
        onPress={toggleRoute}
        style={[styles.fabButton, styles.fabRoute, showRoute && styles.fabRouteActive]}
        activeOpacity={0.8}
        disabled={routeCalculating}
      >
        {routeCalculating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name={showRoute ? "close" : "git-network"} size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
    bottom: 120,
    left: 16,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  fabRefresh: {
    bottom: 60,
    left: 16,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  fabRoute: {
    bottom: 180,
    left: 16,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  fabRouteActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
});