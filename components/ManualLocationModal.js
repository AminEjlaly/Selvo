// ManualLocationModal.js
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

function buildPickerMapHtml({ initialLat = 37.5527, initialLng = 45.0761 }) {
  const script = `
(function() {
  'use strict';

  function rnPost(obj) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
  }

  var map;
  var selectedLat = null, selectedLng = null;

  function initMap() {
    try {
      map = new L.Map('map', {
        key: "web.ae337d64d1d049c58c496982bcf84a58",
        maptype: "dreamy",
        center: [${initialLat}, ${initialLng}],
        zoom: 15,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('move', function() {
        var c = map.getCenter();
        selectedLat = c.lat;
        selectedLng = c.lng;
      });

      map.on('moveend', function() {
        var c = map.getCenter();
        selectedLat = c.lat;
        selectedLng = c.lng;
        rnPost({ type: 'locationUpdated', lat: selectedLat, lng: selectedLng });
      });

      selectedLat = ${initialLat};
      selectedLng = ${initialLng};
      rnPost({ type: 'mapReady', lat: selectedLat, lng: selectedLng });

      function handleMsg(e) {
        try {
          var d = JSON.parse(e.data);
          if (d.type === 'moveTo') {
            map.setView([d.lat, d.lng], 17, { animate: true });
          }
        } catch(err) {}
      }
      window.addEventListener('message', handleMsg);
      document.addEventListener('message', handleMsg);

    } catch(err) {
      rnPost({ type: 'mapError', message: err.message });
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMap();
  } else {
    document.addEventListener('DOMContentLoaded', initMap);
  }
})();
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css"/>
  <script src="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; overflow:hidden; }
    #map { width:100%; height:100%; }

    #crosshair {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #pin-body {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 6px 20px rgba(99,102,241,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #pin-inner {
      width: 13px;
      height: 13px;
      background: #fff;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    #pin-shadow {
      width: 16px;
      height: 6px;
      background: rgba(0,0,0,0.15);
      border-radius: 50%;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="crosshair">
    <div id="pin-body"><div id="pin-inner"></div></div>
    <div id="pin-shadow"></div>
  </div>
  <script>${script}</script>
</body>
</html>`;
}

export default function ManualLocationModal({
  visible,
  buyerName = 'مشتری',
  initialLat = 37.5527,
  initialLng = 45.0761,
  onConfirm,
  onCancel,
}) {
  const webRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const mapHtml = useMemo(
    () => buildPickerMapHtml({ initialLat, initialLng }),
    [initialLat, initialLng]
  );

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setMapReady(false);
      setSelectedCoords(null);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        setSelectedCoords({ latitude: initialLat, longitude: initialLng });
        // مثل MapBuyerScreen — یه پیام postMessage به WebView می‌فرستیم
        setTimeout(() => {
          webRef.current?.postMessage(JSON.stringify({
            type: 'moveTo',
            lat: initialLat,
            lng: initialLng
          }));
        }, 200);
      } else if (data.type === 'locationUpdated') {
        setSelectedCoords({ latitude: data.lat, longitude: data.lng });
      }
    } catch (e) {}
  };

  const handleConfirm = () => {
    if (selectedCoords && onConfirm) {
      onConfirm(selectedCoords);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── هدر ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.headerIconWrap}>
                <MaterialIcons name="add-location-alt" size={17} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.headerTitle}>انتخاب موقعیت روی نقشه</Text>
                <Text style={styles.headerSub} numberOfLines={1}>{buyerName}</Text>
              </View>
            </View>

            <View style={{ width: 36 }} />
          </View>

          {/* ── راهنما ── */}
          <View style={styles.hint}>
            <Text style={styles.hintEmoji}>👆</Text>
            <Text style={styles.hintText}>نقشه را جابجا کنید تا پین روی موقعیت مشتری قرار بگیرد</Text>
          </View>

          {/* ── نقشه ── */}
          <View style={styles.mapWrapper}>
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              source={{ html: mapHtml }}
              onMessage={onMessage}
              style={styles.webview}
              cacheEnabled={false}
            />

            {!mapReady && (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.mapLoaderText}>در حال بارگذاری نقشه...</Text>
              </View>
            )}
          </View>

          {/* ── کوردینات انتخابی ── */}
          {selectedCoords && (
            <View style={styles.coordsRow}>
              <View style={styles.coordsDot} />
              <Text style={styles.coordsLabel}>موقعیت انتخابی:</Text>
              <Text style={styles.coordsText}>
                {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
              </Text>
            </View>
          )}

          {/* ── دکمه‌ها ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>انصراف</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, !selectedCoords && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selectedCoords}
              activeOpacity={0.85}
            >
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>تأیید موقعیت</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.88,
    overflow: 'hidden',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },

  // هدر
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'IRANYekan-Bold',
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'IRANYekan',
    textAlign: 'right',
    marginTop: 1,
  },

  // راهنما
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  hintEmoji: {
    fontSize: 14,
  },
  hintText: {
    fontSize: 12,
    color: '#78350F',
    fontFamily: 'IRANYekan',
    flex: 1,
    textAlign: 'right',
  },

  // نقشه
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  mapLoaderText: {
    fontSize: 13,
    color: '#6366F1',
    fontFamily: 'IRANYekan',
  },

  // کوردینات
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EBEBEF',
  },
  coordsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  coordsLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
  },
  coordsText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: 'IRANYekan',
    flex: 1,
    textAlign: 'left',
    writingDirection: 'ltr',
  },

  // دکمه‌ها
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F4',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'IRANYekan',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#C4C5D0',
    elevation: 0,
    shadowOpacity: 0,
  },
  confirmBtnText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'IRANYekan-Bold',
    fontWeight: '700',
  },
});