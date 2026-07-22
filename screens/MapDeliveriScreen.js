import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getServerUrl } from '../config';

const { width, height } = Dimensions.get('window');

// ─── کامپوننت جایگزین WebView برای وب ────────────────────────────────────────
const WebMapIframe = forwardRef(({ html, onMessage }, ref) => {
  const iframeRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useImperativeHandle(ref, () => ({
    postMessage: (msg) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(msg, '*');
      }
    }
  }));

  useEffect(() => {
    const handler = (event) => {
      if (onMessageRef.current) {
        onMessageRef.current({ nativeEvent: { data: event.data } });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!html) return null;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ width: '100%', height: '100%', border: 'none' }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
});

export default function MapDeliveryScreen({ route }) {
  const filterExit = route?.params?.filterExit || null;

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationCoords, setUserLocationCoords] = useState(null);

  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCalculating, setRouteCalculating] = useState(false);

  const webRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('توکن معتبر یافت نشد');

        const baseUrl = await getServerUrl();

        let locationsUrl = `${baseUrl}/api/delivery/delivery-locations`;
        if (filterExit) {
          locationsUrl += `?exitCode=${encodeURIComponent(filterExit)}`;
        }

        const locationsRes = await fetch(locationsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!locationsRes.ok) throw new Error(`HTTP Error: ${locationsRes.status}`);

        const locationsJson = await locationsRes.json();

        if (locationsJson.success) {
          const allLocations = locationsJson.data?.locations?.filter(loc =>
            loc.latitude && loc.longitude &&
            !isNaN(loc.latitude) && !isNaN(loc.longitude)
          ) || [];

          const uniqueLocations = removeDuplicateBuyers(allLocations);
          setLocations(uniqueLocations);
        } else {
          throw new Error(locationsJson.message || 'خطا در دریافت اطلاعات لوکیشن‌ها');
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('خطا', 'دسترسی موقعیت مکانی رد شد');
        } else {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000
          });
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setUserLocationCoords(loc.coords);
        }

      } catch (err) {
        console.error('❌ خطا در بارگذاری نقشه:', err);
        setMapError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterExit]);

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
        let minDistance = calculateDistance(currentLat, currentLng, unvisited[0].latitude, unvisited[0].longitude);

        for (let i = 1; i < unvisited.length; i++) {
          const distance = calculateDistance(currentLat, currentLng, unvisited[i].latitude, unvisited[i].longitude);
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = i;
          }
        }

        const nearest = unvisited.splice(nearestIndex, 1)[0];
        route.push({ ...nearest, order: route.length + 1, distanceFromPrevious: Math.round(minDistance) });
        currentLat = nearest.latitude;
        currentLng = nearest.longitude;
      }

      const totalDistance = route.reduce((sum, loc) => sum + loc.distanceFromPrevious, 0);
      setOptimizedRoute(route);
      setShowRoute(true);

      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({
          type: 'showOptimizedRoute',
          route: route,
          userLocation: userLocation
        }));
      }

      Alert.alert(
        '🗺️ مسیر بهینه محاسبه شد',
        `تعداد ایستگاه: ${route.length}\nمسافت کل: ${(totalDistance / 1000).toFixed(1)} کیلومتر\nخروجی: ${filterExit || 'آخرین خروجی'}`,
        [{ text: 'باشه' }]
      );
    } catch (error) {
      console.error('❌ خطا در محاسبه مسیر:', error);
      Alert.alert('خطا', 'خطا در محاسبه مسیر بهینه');
    } finally {
      setRouteCalculating(false);
    }
  };

  const toggleRoute = () => {
    if (showRoute) {
      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
      }
      setShowRoute(false);
      setOptimizedRoute(null);
    } else {
      calculateOptimizedRoute();
    }
  };

  const getMapHtml = () => {
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css"/>
          <script src="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js"></script>
          <style>
              body { margin: 0; padding: 0; height: 100vh; width: 100vw; font-family: system-ui; }
              #map { width: 100%; height: 100%; }
              .leaflet-popup-content-wrapper {
                  border-radius: 8px !important;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
              }
              .leaflet-popup-tip { box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; }
              @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.3); opacity: 0.7; }
              }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script>
              const userLoc = ${user};
              const locations = ${locationsJson};

              // ✅ تعریف نقشه با SDK نشان - فقط یه بار
              let defaultCenter = [35.6892, 51.3890];
              if (userLoc) {
                  defaultCenter = [userLoc.lat, userLoc.lng];
              } else if (locations.length > 0) {
                  defaultCenter = [locations[0].lat, locations[0].lng];
              }

              let map = new L.Map('map', {
                  key: "web.ae337d64d1d049c58c496982bcf84a58",
                  maptype: "dreamy",
                  center: defaultCenter,
                  zoom: userLoc ? 15 : 13,
                  zoomControl: false
              });

              // ✅ zoom control
              L.control.zoom({ position: 'bottomright' }).addTo(map);

              let userMarker = null;
              let routePolyline = null;
              let routeMarkers = [];

              // ✅ مارکر کاربر
              if (userLoc) {
                  const userIcon = L.divIcon({
                      className: 'user-marker',
                      html: \`
                          <div style="position: relative;">
                              <div style="
                                  width: 24px; height: 24px;
                                  background: #8B5CF6;
                                  border: 2px solid white;
                                  border-radius: 50%;
                                  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
                                  display: flex; align-items: center; justify-content: center;
                              ">
                                  <svg stroke="currentColor" fill="white" stroke-width="0" viewBox="0 0 16 16" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M0 16h8v-16h-8v16zM5 2h2v2h-2v-2zM5 6h2v2h-2v-2zM5 10h2v2h-2v-2zM1 2h2v2h-2v-2zM1 6h2v2h-2v-2zM1 10h2v2h-2v-2zM9 5h7v1h-7zM9 16h2v-4h3v4h2v-9h-7z"></path>
                                  </svg>
                              </div>
                              <div style="
                                  position: absolute; top: -2px; right: -2px;
                                  width: 8px; height: 8px;
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
                      .bindPopup('موقعیت شما');
              }

              // ✅ مارکرهای مشتری‌ها
              locations.forEach((loc, index) => {
                  const icon = L.divIcon({
                      className: 'customer-marker',
                      html: \`
                          <div style="
                              width: 20px; height: 20px;
                              background: #3B82F6;
                              border: 2px solid white;
                              border-radius: 50%;
                              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                              display: flex; align-items: center; justify-content: center;
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
                                  background: #3B82F6; color: white; border: none;
                                  border-radius: 6px; padding: 8px 12px; cursor: pointer;
                                  font-size: 12px; font-weight: 500; width: 100%;
                                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                              ">
                              مسیر‌یابی
                          </button>
                      </div>
                  \`;

                  marker.bindPopup(popupHtml);
              });

              // ✅ تابع مسیریابی
              window.navigateTo = function(lat, lng) {
                  var msg = JSON.stringify({
                      type: 'navigate',
                      lat: lat,
                      lng: lng,
                      url: \`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}&travelmode=driving\`
                  });
                  try { window.ReactNativeWebView.postMessage(msg); } catch(e) {}
                  try { window.parent.postMessage(msg, '*'); } catch(e) {}
              };

              // ✅ نمایش مسیر بهینه
              window.showOptimizedRoute = function(route, userLoc) {
                  if (routePolyline) map.removeLayer(routePolyline);
                  routeMarkers.forEach(m => map.removeLayer(m));
                  routeMarkers = [];

                  const routeCoords = [[userLoc.lat, userLoc.lng]];
                  route.forEach(stop => routeCoords.push([stop.latitude, stop.longitude]));

                  routePolyline = L.polyline(routeCoords, {
                      color: '#8B5CF6', weight: 4, opacity: 0.7,
                      dashArray: '10, 5', lineJoin: 'round'
                  }).addTo(map);

                  route.forEach(stop => {
                      const orderIcon = L.divIcon({
                          className: 'route-order-marker',
                          html: \`
                              <div style="
                                  width: 28px; height: 28px;
                                  background: #8B5CF6;
                                  border: 3px solid white; border-radius: 50%;
                                  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
                                  display: flex; align-items: center; justify-content: center;
                                  color: white; font-weight: bold; font-size: 12px;
                              ">\${stop.order}</div>
                          \`,
                          iconSize: [28, 28],
                          iconAnchor: [14, 14],
                      });

                      const orderMarker = L.marker([stop.latitude, stop.longitude], {
                          icon: orderIcon, zIndexOffset: 1000
                      }).addTo(map);

                      orderMarker.bindPopup(\`
                          <div style="text-align:center; padding:8px; min-width:200px;">
                              <div style="font-size:14px; font-weight:600; color:#8B5CF6; margin-bottom:4px;">
                                  ایستگاه \${stop.order}
                              </div>
                              <div style="font-size:12px; color:#1F2937; margin-bottom:4px;">
                                  \${stop.buyerName}
                              </div>
                              <div style="font-size:10px; color:#6B7280; margin-bottom:12px;">
                                  فاصله از قبلی: \${(stop.distanceFromPrevious / 1000).toFixed(1)} کیلومتر
                              </div>
                              <button onclick="navigateTo(\${stop.latitude}, \${stop.longitude})"
                                  style="
                                      background: #8B5CF6; color: white; border: none;
                                      border-radius: 6px; padding: 8px 12px; cursor: pointer;
                                      font-size: 12px; font-weight: 500; width: 100%;
                                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                                  ">
                                  مسیر‌یابی
                              </button>
                          </div>
                      \`);

                      routeMarkers.push(orderMarker);
                  });

                  map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
              };

              // ✅ پاک کردن مسیر
              window.clearRoute = function() {
                  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
                  routeMarkers.forEach(m => map.removeLayer(m));
                  routeMarkers = [];
              };

              // ✅ هندلر پیام‌های React Native
              function handleMessage(event) {
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
              }
              document.addEventListener("message", handleMessage);
              window.addEventListener("message", handleMessage);
          </script>
      </body>
      </html>
    `;
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'navigate') {
        Linking.openURL(data.url);
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
      {Platform.OS === 'web' ? (
        <View style={styles.webview}>
          <WebMapIframe ref={webRef} html={getMapHtml()} onMessage={onMessage} />
        </View>
      ) : (
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          onMessage={onMessage}
          onError={(syntheticEvent) => {
            console.error('❌ WebView Error:', syntheticEvent.nativeEvent);
          }}
          source={{ html: getMapHtml(), baseUrl: '' }}
          style={styles.webview}
        />
      )}

      <TouchableOpacity onPress={focusOnUser} style={[styles.fabButton, styles.fabUser]} activeOpacity={0.8}>
        <Ionicons name="locate" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity onPress={updateUserLocation} style={[styles.fabButton, styles.fabRefresh]} activeOpacity={0.8}>
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  webview: { width, height },

  loadingContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center', padding: 32 },
  loadingText: { fontSize: 16, color: '#0052CC', marginTop: 16, fontWeight: '600', fontFamily: 'IRANYekan-Bold' },
  loadingSubtext: { fontSize: 13, color: '#8C9BAB', marginTop: 6, fontFamily: 'IRANYekan' },

  errorContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  errorContent: { alignItems: 'center', padding: 32, maxWidth: 300 },
  errorIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 16, color: '#EF4444', fontWeight: '600', marginBottom: 8, textAlign: 'center', fontFamily: 'IRANYekan-Bold' },
  errorMessage: { fontSize: 13, color: '#8C9BAB', textAlign: 'center', lineHeight: 20, fontFamily: 'IRANYekan' },

  fabButton: { position: 'absolute', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  fabUser: { bottom: 180, left: 16, backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6' },
  fabRefresh: { bottom: 120, left: 16, backgroundColor: '#F59E0B', shadowColor: '#F59E0B' },
  fabRoute: { bottom: 60, left: 16, backgroundColor: '#10B981', shadowColor: '#10B981' },
  fabRouteActive: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
});