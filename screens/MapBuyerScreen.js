import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getVisitorLocations, getVisitors } from '../api';
import { getServerUrl } from '../config';

const { width, height } = Dimensions.get('window');

// ─── تبدیل تاریخ میلادی به شمسی ────────────────────────────────────────────
function toJalali(gy, gm, gd) {
  const g_d_no = [31,28,31,30,31,30,31,31,30,31,30,31];
  const j_d_no = [31,31,30,30,31,31,30,30,30,29,30,29];
  if (gy > 1600) { gy -= 1600; } else { gy -= 1; }
  let g_day_no = 365*gy + Math.floor((gy+3)/4) - Math.floor((gy+99)/100) + Math.floor((gy+399)/400);
  for (let i=0; i<gm-1; i++) g_day_no += g_d_no[i];
  if (gm > 2 && ((gy%4===0 && gy%100!==0)||(gy%400===0))) g_day_no++;
  g_day_no += gd-1;
  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no/12053);
  j_day_no %= 12053;
  let jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) { jy += Math.floor((j_day_no-1)/365); j_day_no = (j_day_no-1)%365; }
  let i;
  for (i=0; i<11 && j_day_no >= j_d_no[i]; i++) { j_day_no -= j_d_no[i]; }
  return [jy, i+1, j_day_no+1];
}

function getTodayJalali() {
  const now = new Date();
  const [jy, jm, jd] = toJalali(now.getFullYear(), now.getMonth()+1, now.getDate());
  return `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
}

// ─── DatePicker شمسی ─────────────────────────────────────────────────────────
function JalaliDatePicker({ value, onChange }) {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const [y, m, day] = toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
    const str = `${y}/${String(m).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
    days.push(str);
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
      {days.map(d => (
        <TouchableOpacity
          key={d}
          onPress={() => onChange(d)}
          style={[styles.dateChip, value === d && styles.dateChipActive]}
        >
          <Text style={[styles.dateChipText, value === d && styles.dateChipTextActive]}>
            {d.split('/').slice(1).join('/')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── تابع ساخت HTML نقشه (خارج از کامپوننت) ─────────────────────────────────
function buildMapHtml({ buyers, userLocation, userLocationCoords, maxDistance, proximityCheckEnabled, selectedBuyer }) {

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const buyersData = buyers.map(b => {
    const lat = parseFloat(b.Lat || b.lat || 0);
    const lng = parseFloat(b.Lng || b.lng || 0);
    let distance = null, isInRange = false;
    if (userLocationCoords && lat && lng) {
      distance  = calculateDistance(userLocationCoords.latitude, userLocationCoords.longitude, lat, lng);
      isInRange = distance <= maxDistance;
    }
    return { ...b, lat, lng, distance, isInRange };
  });

  const buyersJson   = JSON.stringify(buyersData);
  const initUser     = userLocation ? `{lat:${userLocation.lat},lng:${userLocation.lng}}` : 'null';
  const selectedCode = selectedBuyer ? JSON.stringify(String(selectedBuyer.code)) : '""';
  
  const centerLat    = (userLocation && userLocation.lat) ? userLocation.lat : 35.6892;
  const centerLng    = (userLocation && userLocation.lng) ? userLocation.lng : 51.3890;

  const script = `
(function() {
  'use strict';

  function rnPost(obj) {
    var str = JSON.stringify(obj);
    try { window.ReactNativeWebView.postMessage(str); } catch(e) {}
    try { window.parent.postMessage(str, '*'); } catch(e) {}
  }

  rnPost({ type: 'webViewReady' });

  var MAX_DISTANCE  = ${maxDistance};
  var PROX_ENABLED  = ${proximityCheckEnabled};
  var buyers        = ${buyersJson};
  var SEL           = ${selectedCode};
  var map, userMarker;
  var circles        = [];
  var visitorMarkers = [];
  var visitorPolyline = null;
  var markersList    = [];

  // ─── init نقشه ────────────────────────────────────────────────────────────
  function initMap() {
    try {
      map = new L.Map('map', {
        key: "web.ae337d64d1d049c58c496982bcf84a58",
        maptype: "dreamy",
        center: [${centerLat}, ${centerLng}],
        zoom: 13,
        zoomControl: false
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      buyers.forEach(function(b) {
        if (!b.lat || !b.lng || isNaN(b.lat) || isNaN(b.lng)) return;
        var isSel = String(b.code) === String(SEL);
        var ok    = !PROX_ENABLED || b.isInRange;
        var mc    = isSel ? '#7C3AED' : (ok ? '#10B981' : '#EF4444');

        var circle = L.circle([b.lat, b.lng], {
          color: ok ? '#10B981' : '#EF4444',
          fillColor: ok ? '#D1FAE5' : '#FEE2E2',
          fillOpacity: (b.isInRange !== undefined && b.isInRange) ? 0.15 : 0.1,
          weight: isSel ? 2 : 1,
          radius: MAX_DISTANCE
        }).addTo(map);
        circles.push({ circle: circle, code: b.code, lat: b.lat, lng: b.lng });

        var markerHtml =
          '<div style="position:relative;">' +
          '<div style="width:20px;height:20px;background:' + mc + ';border:2px solid white;' +
          'border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">' +
          '<svg style="width:10px;height:10px" fill="white" viewBox="0 0 24 24">' +
          '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' +
          'm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>' +
          '</svg></div>' +
          (isSel ? '<div style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#7C3AED;border:1px solid white;border-radius:50%;"></div>' : '') +
          '</div>';

        var icon = L.divIcon({ className:'cm', html:markerHtml, iconSize:[20,20], iconAnchor:[10,10] });

        var dist    = (b.distance !== null && b.distance !== undefined) ? Math.round(b.distance) + ' متر' : 'نامعلوم';
        var stLabel = !PROX_ENABLED ? 'چک محدوده غیرفعال' : (b.isInRange ? 'در محدوده مجاز' : 'خارج از محدوده');
        var stColor = (ok && PROX_ENABLED) ? '#10B981' : (!PROX_ENABLED ? '#6B7280' : '#EF4444');

        var m = L.marker([b.lat, b.lng], { icon: icon }).addTo(map);
        markersList.push(m);
        
        m.bindPopup(
          '<div style="text-align:center;font-family:IRANYekan;padding:8px;min-width:160px;">' +
          '<div style="font-size:14px;font-weight:600;color:#1F2937;margin-bottom:6px;">' + (b.name||'مشتری') + '</div>' +
          '<div style="font-size:11px;color:#6B7280;margin-bottom:8px;">کد: ' + b.code + '</div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:10px;background:#F9FAFB;padding:6px;border-radius:6px;">' +
          '<span style="font-size:11px;color:' + stColor + ';font-weight:500;">' + stLabel + '</span>' +
          '<span style="font-size:11px;color:#6B7280;">' + dist + '</span></div>' +
          '<button onclick="navTo(' + b.lat + ',' + b.lng + ')" style="background:' + (ok?'#10B981':'#EF4444') + ';color:white;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;width:100%;margin-bottom:6px;">مسیریابی</button>' +
          '<button onclick="togCircle(\\'' + b.code + '\\')" style="background:transparent;color:#6B7280;border:1px solid #D1D5DB;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:10px;width:100%;">نمایش/مخفی محدوده</button>' +
          '</div>',
          { closeButton:true, autoClose:true, maxWidth:200 }
        );

        if (isSel) {
          m.openPopup();
          setTimeout(function() { map.setView([b.lat, b.lng], 17, { animate:true }); }, 800);
        }
      });

      var initLoc = ${initUser};
      if (initLoc) {
        addOrMoveUser(initLoc.lat, initLoc.lng);
      }

      function handleMessage(e) {
        var raw = e.data;
        try {
          var d = JSON.parse(raw);
          if      (d.type === 'updateUserLocation') { addOrMoveUser(d.lat, d.lng); }
          else if (d.type === 'showVisitorTrack')   { showVisitorTrack(d.locations, d.visitorName, d.date); }
          else if (d.type === 'clearVisitorTrack')  { clearVisitorTrack(); }
          else if (d.type === 'focusUser')          { if (userMarker) { map.setView(userMarker.getLatLng(), 16, {animate:true}); userMarker.openPopup(); } }
          else if (d.type === 'hideAllCircles')     { circles.forEach(function(c) { if(map.hasLayer(c.circle)) map.removeLayer(c.circle); }); }
          else if (d.type === 'showAllCircles')     { circles.forEach(function(c) { if(!map.hasLayer(c.circle)) map.addLayer(c.circle); }); }
        } catch(err) {}
      }

      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);
      rnPost({ type: 'mapInitialized', center: [${centerLat}, ${centerLng}] });

    } catch(err) {
      rnPost({ type: 'mapError', message: err.message });
    }
  }

  function addOrMoveUser(lat, lng) {
    if (!map) return;

    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      var iconHtml =
        '<div style="position:relative">' +
        '<div style="width:28px;height:28px;background:#8B5CF6;border:3px solid white;border-radius:50%;' +
        'box-shadow:0 2px 8px rgba(139,92,246,.6);display:flex;align-items:center;justify-content:center;">' +
        '<svg fill="white" viewBox="0 0 24 24" width="14" height="14"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' +
        '</div>' +
        '<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;background:#22C55E;border:2px solid white;border-radius:50%;"></div>' +
        '</div>';

      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({ className:'um', html:iconHtml, iconSize:[28,28], iconAnchor:[14,14] }),
        zIndexOffset: 1000
      }).addTo(map).bindPopup(
        '<div style="text-align:center;font-family:IRANYekan;padding:8px;">' +
        '<div style="font-size:13px;font-weight:600;color:#8B5CF6;">📍 موقعیت شما</div>' +
        '<div style="font-size:10px;color:#6B7280;margin-top:4px;">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</div>' +
        '<div style="font-size:10px;color:#6B7280;">محدوده مجاز: ' + MAX_DISTANCE + ' متر</div>' +
        '</div>'
      );
      rnPost({ type: 'userMarkerAdded', lat: lat, lng: lng });
    }

    if (PROX_ENABLED) {
      circles.forEach(function(item) {
        var d  = calcDist(lat, lng, item.lat, item.lng);
        var ok = d <= MAX_DISTANCE;
        item.circle.setStyle({
          color: ok ? '#10B981' : '#EF4444',
          fillColor: ok ? '#D1FAE5' : '#FEE2E2'
        });
      });
    }
  }

  function showVisitorTrack(locations, visitorName, date) {
    clearVisitorTrack();

    if (!locations || locations.length === 0) {
      rnPost({ type: 'trackLog', message: 'هیچ لوکیشنی برای نمایش وجود ندارد' });
      return;
    }

    var latlngs = [];
    locations.forEach(function(loc) {
      var lat = parseFloat(loc.lat || loc.Lat || loc.latitude || 0);
      var lng = parseFloat(loc.lng || loc.Lng || loc.longitude || 0);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        latlngs.push([lat, lng]);
      }
    });

    if (latlngs.length === 0) {
      rnPost({ type: 'trackLog', message: 'لوکیشن‌ها معتبر نیستند' });
      return;
    }

    visitorPolyline = L.polyline(latlngs, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
      dashArray: '12, 8',
      dashOffset: -40
    }).addTo(map);

    var dashOffset = -40;
    var animationInterval = null;
    
    function startDashAnimation() {
      if (animationInterval) clearInterval(animationInterval);
      animationInterval = setInterval(function() {
        dashOffset = dashOffset - 2;
        if (dashOffset > 0) dashOffset = -40;
        if (visitorPolyline && map.hasLayer(visitorPolyline)) {
          visitorPolyline.setStyle({ dashOffset: dashOffset });
        } else {
          if (animationInterval) clearInterval(animationInterval);
        }
      }, 80);
    }
    
    startDashAnimation();
    visitorPolyline._animationInterval = animationInterval;

    locations.forEach(function(loc, idx) {
      var lat     = parseFloat(loc.lat || loc.Lat || loc.latitude || 0);
      var lng     = parseFloat(loc.lng || loc.Lng || loc.longitude || 0);
      if (isNaN(lat) || isNaN(lng) || lat === 0) return;

      var timeStr  = loc.time || loc.Time || loc.timestamp || loc.createdAt || '';
      var timeLabel = '';
      if (timeStr) {
        var t = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
        timeLabel = t ? t.substring(0,5) : '';
      }

      var isFirst = idx === 0;
      var isLast  = idx === locations.length - 1;
      var dotColor = isFirst ? '#10B981' : isLast ? '#EF4444' : '#60A5FA';
      var dotSize  = (isFirst || isLast) ? 18 : 10;

      var mHtml =
        '<div style="display:flex;flex-direction:column;align-items:center;">' +
        '<div style="width:' + dotSize + 'px;height:' + dotSize + 'px;background:' + dotColor + ';' +
        'border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4);"></div>' +
        (timeLabel ? '<div style="background:rgba(0,0,0,0.75);color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;margin-top:1px;white-space:nowrap;">' + timeLabel + '</div>' : '') +
        '</div>';

      var icon = L.divIcon({
        className: 'vt',
        html: mHtml,
        iconSize: [dotSize, dotSize + (timeLabel ? 16 : 0)],
        iconAnchor: [dotSize/2, dotSize/2]
      });

      var label = isFirst ? '🟢 نقطه شروع' : isLast ? '🔴 نقطه پایان' : ('نقطه ' + (idx+1));
      var vm = L.marker([lat, lng], { icon:icon, zIndexOffset: 500 }).addTo(map);
      vm.bindPopup(
        '<div style="text-align:center;font-family:IRANYekan;padding:6px;min-width:130px;">' +
        '<div style="font-size:12px;font-weight:600;color:#1F2937;">' + (visitorName||'ویزیتور') + '</div>' +
        '<div style="font-size:11px;color:#6B7280;margin-top:2px;">' + label + '</div>' +
        (timeLabel ? '<div style="font-size:11px;color:#F59E0B;margin-top:3px;">⏰ ' + timeLabel + '</div>' : '') +
        '<div style="font-size:9px;color:#9CA3AF;margin-top:3px;">' + lat.toFixed(5) + ', ' + lng.toFixed(5) + '</div>' +
        '</div>',
        { closeButton:true, maxWidth:160 }
      );
      visitorMarkers.push(vm);
    });

    if (visitorPolyline) {
      try {
        map.fitBounds(visitorPolyline.getBounds(), { padding:[50,50], animate:true });
      } catch(e) {}
    }

    rnPost({ type: 'trackLog', message: 'مسیر با ' + latlngs.length + ' نقطه نمایش داده شد' });
  }

  function clearVisitorTrack() {
    if (visitorPolyline && visitorPolyline._animationInterval) {
      clearInterval(visitorPolyline._animationInterval);
    }
    visitorMarkers.forEach(function(m) { try { map.removeLayer(m); } catch(e){} });
    visitorMarkers = [];
    if (visitorPolyline) { try { map.removeLayer(visitorPolyline); } catch(e){} visitorPolyline = null; }
  }

  function calcDist(la1,lo1,la2,lo2) {
    var R=6371e3, p1=la1*Math.PI/180, p2=la2*Math.PI/180;
    var dp=(la2-la1)*Math.PI/180, dl=(lo2-lo1)*Math.PI/180;
    var a=Math.sin(dp/2)*Math.sin(dp/2)+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)*Math.sin(dl/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }

  window.navTo = function(lat,lng) {
    rnPost({ type:'navigate', lat:lat, lng:lng });
  };
  window.togCircle = function(code) {
    circles.forEach(function(item) {
      if (String(item.code) === String(code)) {
        if (map.hasLayer(item.circle)) map.removeLayer(item.circle);
        else map.addLayer(item.circle);
      }
    });
  };

  var st = document.createElement('style');
  st.textContent = '.leaflet-popup-content-wrapper{border-radius:8px!important;box-shadow:0 4px 12px rgba(0,0,0,.15)!important}.leaflet-popup-content{margin:8px 12px!important}';
  document.head.appendChild(st);

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
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
  <link rel="stylesheet" href="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css"/>
  <script src="https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; overflow:hidden; }
    #map { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>${script}</script>
</body>
</html>`;
}

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

// ─── کامپوننت اصلی ───────────────────────────────────────────────────────────
export default function MapBuyerScreen({ route }) {
  const selectedBuyer = route?.params?.buyer || null;
  const [buyers, setBuyers]                         = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [mapError, setMapError]                     = useState(null);
  const [userLocation, setUserLocation]             = useState(null);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [maxDistance, setMaxDistance]               = useState(50);
  const [proximityCheckEnabled, setProximityCheckEnabled] = useState(true);
  const [webViewReady, setWebViewReady]             = useState(false);
  const [mapHtml, setMapHtml]                       = useState('');
  const [initialMapBuilt, setInitialMapBuilt]       = useState(false);

  const [isAdmin, setIsAdmin]                   = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitors, setVisitors]                 = useState([]);
  const [visitorsLoading, setVisitorsLoading]   = useState(false);
  const [selectedVisitor, setSelectedVisitor]   = useState(null);
  const [selectedDate, setSelectedDate]         = useState(getTodayJalali());
  const [trackingLoading, setTrackingLoading]   = useState(false);
  const [showingTrack, setShowingTrack]         = useState(false);

  const webRef        = useRef(null);
  const dataRef       = useRef({ buyers:[], userLocation:null, userLocationCoords:null, maxDistance:50, proximityCheckEnabled:true });
  const pendingRef    = useRef([]);
  const locationSentRef = useRef(false);
  const isSendingLocation = useRef(false); // جلوگیری از ارسال مکرر

  // ─── ارسال ایمن به WebView ──────────────────────────────────────────────
  const safePost = (msg, delay = 0) => {
    const send = () => {
      if (webRef.current && webViewReady) {
        const str = JSON.stringify(msg);
        webRef.current.postMessage(str);
        return true;
      } else if (webRef.current && !webViewReady) {
        pendingRef.current.push(msg);
        return false;
      }
      return false;
    };
    if (delay > 0) setTimeout(send, delay);
    else return send();
  };

  // ─── پردازش پیام‌های صف (با جلوگیری از لوپ) ──────────────────────────────
  const processPendingMessages = () => {
    // فقط یک بار پردازش کن
    if (isSendingLocation.current) return;
    
    isSendingLocation.current = true;
    
    // فقط آخرین پیام updateUserLocation را نگه دار
    const uniqueMessages = [];
    const seenTypes = new Set();
    
    for (let i = pendingRef.current.length - 1; i >= 0; i--) {
      const msg = pendingRef.current[i];
      if (msg.type === 'updateUserLocation' && seenTypes.has('updateUserLocation')) {
        continue;
      }
      seenTypes.add(msg.type);
      uniqueMessages.unshift(msg);
    }
    
    pendingRef.current = uniqueMessages;
    
    while (pendingRef.current.length > 0) {
      const msg = pendingRef.current.shift();
      if (webRef.current && webViewReady) {
        webRef.current.postMessage(JSON.stringify(msg));
      }
    }
    
    setTimeout(() => {
      isSendingLocation.current = false;
    }, 100);
  };

  const rebuildMap = (buyers, userLocation, userLocationCoords, maxDistance, proximityCheckEnabled, isInitial = false) => {
    const html = buildMapHtml({ buyers, userLocation, userLocationCoords, maxDistance, proximityCheckEnabled, selectedBuyer });
    setMapHtml(html);
    setWebViewReady(false);
    if (isInitial) {
      setInitialMapBuilt(true);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.NOF || user.id || user.UserID || user.userId || user.Code;
          if (String(userId) === '1') { setIsAdmin(true); }
        }
      } catch (e) {}
    })();
  }, []);

  const fetchProximitySettings = async () => {
    try {
      const token   = await AsyncStorage.getItem('token');
      const baseUrl = await getServerUrl();
      const ctrl    = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${baseUrl}/api/proximity-check`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: ctrl.signal
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const md = json.data.maxDistance || 50;
          const pe = json.data.proximityCheckEnabled !== false;
          setMaxDistance(md);
          setProximityCheckEnabled(pe);
          dataRef.current.maxDistance           = md;
          dataRef.current.proximityCheckEnabled = pe;
          return { md, pe };
        }
      }
    } catch { }
    return { md: 50, pe: true };
  };

 const fetchUserLocation = async () => {
  try {
    // ─── اول چک کن کاربر seller هست یا نه ───
    const userStr = await AsyncStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const isSeller = userData?.role === 'seller' || userData?.UserType === 'seller';

    if (!isSeller) {
      console.log('📌 MapBuyer: کاربر seller نیست — GPS اجباری نیست');
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({ 
      accuracy: Location.Accuracy.Balanced, 
      timeout: 10000 
    });
    const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    return { location: coords, fullCoords: loc.coords };
  } catch (e) {
    console.log('⚠️ MapBuyer fetchUserLocation error:', e.message);
    return null;
  }
};

  const getCachedBuyers = async () => {
    try {
      const cached    = await AsyncStorage.getItem('cached_buyers');
      const cacheTime = await AsyncStorage.getItem('cached_buyers_time');
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 10 * 60 * 1000)
        return JSON.parse(cached);
    } catch {}
    return null;
  };

  const cacheBuyers = async (data) => {
    try {
      await AsyncStorage.setItem('cached_buyers', JSON.stringify(data));
      await AsyncStorage.setItem('cached_buyers_time', Date.now().toString());
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        const { md, pe } = await fetchProximitySettings();

        let buyersList = [];
        const cached = await getCachedBuyers();
        if (cached && cached.length > 0) {
          buyersList = cached;
          setBuyers(cached);
          dataRef.current.buyers = cached;
          rebuildMap(cached, null, null, md, pe, true);
        }

        fetchUserLocation().then(gpsResult => {
          if (gpsResult && !locationSentRef.current) {
            const loc = gpsResult.location;
            const fCoords = gpsResult.fullCoords;
            setUserLocation(loc);
            setUserLocationCoords(fCoords);
            dataRef.current.userLocation = loc;
            dataRef.current.userLocationCoords = fCoords;
            locationSentRef.current = true;
            
            if (webViewReady) {
              safePost({ type: 'updateUserLocation', lat: loc.lat, lng: loc.lng });
            }
            
            const updatedBuyers = buyersList.map(b => {
              const lat = parseFloat(b.Lat || b.lat || 0);
              const lng = parseFloat(b.Lng || b.lng || 0);
              let distance = null, isInRange = false;
              if (lat && lng) {
                const R = 6371e3;
                const p1 = fCoords.latitude * Math.PI / 180;
                const p2 = lat * Math.PI / 180;
                const dp = (lat - fCoords.latitude) * Math.PI / 180;
                const dl = (lng - fCoords.longitude) * Math.PI / 180;
                const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
                distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                isInRange = distance <= md;
              }
              return { ...b, distance, isInRange };
            });
            
            setBuyers(updatedBuyers);
            dataRef.current.buyers = updatedBuyers;
            rebuildMap(updatedBuyers, loc, fCoords, md, pe);
          }
        });

        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('توکن یافت نشد');
        const baseUrl = await getServerUrl();
        const res = await fetch(`${baseUrl}/api/rozmasir/map`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.success) {
          const raw = json.data || [];
          const valid = raw.filter(b => {
            const lat = parseFloat(b.Lat || b.lat || 0);
            const lng = parseFloat(b.Lng || b.lng || 0);
            return lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          });
          
          let finalBuyers = valid;
          if (userLocationCoords) {
            finalBuyers = valid.map(b => {
              const lat = parseFloat(b.Lat || b.lat || 0);
              const lng = parseFloat(b.Lng || b.lng || 0);
              const R = 6371e3;
              const p1 = userLocationCoords.latitude * Math.PI / 180;
              const p2 = lat * Math.PI / 180;
              const dp = (lat - userLocationCoords.latitude) * Math.PI / 180;
              const dl = (lng - userLocationCoords.longitude) * Math.PI / 180;
              const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
              const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const isInRange = distance <= md;
              return { ...b, distance, isInRange };
            });
          }
          
          setBuyers(finalBuyers);
          dataRef.current.buyers = finalBuyers;
          await cacheBuyers(finalBuyers);
          rebuildMap(finalBuyers, userLocation, userLocationCoords, md, pe);
        }
      } catch (err) {
        if (buyers.length === 0) {
          setMapError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openVisitorModal = async () => {
    setShowVisitorModal(true);
    if (visitors.length === 0) {
      setVisitorsLoading(true);
      try {
        const list = await getVisitors();
        setVisitors(list);
      } catch (e) {
      } finally {
        setVisitorsLoading(false);
      }
    }
  };

  const showVisitorTrack = async () => {
    if (!selectedVisitor) return;
    
    setTrackingLoading(true);
    try {
      const visitorId = selectedVisitor.code || selectedVisitor.NOF || selectedVisitor.id;
      const formattedDate = selectedDate;
      
      const locations = await getVisitorLocations(visitorId, formattedDate);
      
      if (locations && locations.length > 0) {
        setShowingTrack(true);
        setShowVisitorModal(false);
        
        const formattedLocations = locations.map(loc => ({
          lat: parseFloat(loc.lat || loc.Lat || loc.latitude || 0),
          lng: parseFloat(loc.lng || loc.Lng || loc.longitude || 0),
          time: loc.time || loc.Time || loc.timestamp || loc.createdAt
        }));
        
        safePost({
          type: 'showVisitorTrack',
          locations: formattedLocations,
          visitorName: selectedVisitor.NameF || selectedVisitor.name || 'ویزیتور',
          date: selectedDate
        }, 500);
      } else {
        alert('هیچ لوکیشنی برای این ویزیتور در تاریخ انتخاب شده یافت نشد');
      }
    } catch (error) {
      alert(`خطا در دریافت مسیر ویزیتور: ${error.message}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const clearVisitorTrack = () => {
    setShowingTrack(false);
    safePost({ type: 'clearVisitorTrack' });
  };

  const updateUserLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 5000 });
      const newLoc = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserLocation(newLoc);
      setUserLocationCoords(loc.coords);
      dataRef.current.userLocation = newLoc;
      dataRef.current.userLocationCoords = loc.coords;
      safePost({ type: 'updateUserLocation', lat: newLoc.lat, lng: newLoc.lng });
    } catch (e) {}
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'webViewReady') {
        setWebViewReady(true);
        processPendingMessages();
        
        const loc = dataRef.current.userLocation;
        if (loc && !locationSentRef.current) {
          safePost({ type: 'updateUserLocation', lat: loc.lat, lng: loc.lng }, 400);
          locationSentRef.current = true;
        }
      } else if (data.type === 'navigate') {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}&travelmode=driving`);
      }
    } catch (e) {}
  };

  const focusOnUser = async () => {
  // اگه لوکیشن داریم مستقیم بفرست و فوکوس کن
  if (dataRef.current.userLocation) {
    const loc = dataRef.current.userLocation;
    // اول مطمئن شو marker روی نقشه هست
    safePost({ type: 'updateUserLocation', lat: loc.lat, lng: loc.lng });
    // بعد از کمی تاخیر فوکوس کن
    setTimeout(() => {
      safePost({ type: 'focusUser' });
    }, 300);
  } else {
    // لوکیشن نداریم، بگیر
    await updateUserLocation();
    setTimeout(() => {
      safePost({ type: 'focusUser' });
    }, 500);
  }
};
  const toggleAllCircles = (show) => safePost({ type: show ? 'showAllCircles' : 'hideAllCircles' });

  if (loading && !initialMapBuilt) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0052CC" />
        <Text style={styles.loadingText}>در حال بارگذاری نقشه...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mapHtml ? (
        Platform.OS === 'web' ? (
          <View style={styles.webview}>
            <WebMapIframe ref={webRef} html={mapHtml} onMessage={onMessage} />
          </View>
        ) : (
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            onMessage={onMessage}
            source={{ html: mapHtml }}
            style={styles.webview}
            cacheEnabled={false}
          />
        )
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0052CC" />
          <Text style={styles.loadingText}>در حال آماده‌سازی نقشه...</Text>
        </View>
      )}

      <TouchableOpacity onPress={focusOnUser} style={[styles.fab, styles.fabUser]} activeOpacity={0.8}>
        <Ionicons name="locate" size={20} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={updateUserLocation} style={[styles.fab, styles.fabRefresh]} activeOpacity={0.8}>
        <Ionicons name="refresh" size={18} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleAllCircles(true)} style={[styles.fab, styles.fabShow]} activeOpacity={0.8}>
        <Ionicons name="eye" size={18} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => toggleAllCircles(false)} style={[styles.fab, styles.fabHide]} activeOpacity={0.8}>
        <Ionicons name="eye-off" size={18} color="#FFF" />
      </TouchableOpacity>

      {isAdmin && (
        <TouchableOpacity onPress={openVisitorModal} style={styles.adminBtn} activeOpacity={0.85}>
          <Ionicons name="walk" size={16} color="#FFF" />
          <Text style={styles.adminBtnText}>ردیابی</Text>
        </TouchableOpacity>
      )}

      {showingTrack && (
        <TouchableOpacity onPress={clearVisitorTrack} style={styles.trackBadge} activeOpacity={0.85}>
          <View style={styles.trackDot} />
          <Text style={styles.trackBadgeText}>
            {selectedVisitor?.NameF || selectedVisitor?.name || 'ویزیتور'} — {selectedDate}
          </Text>
          <Ionicons name="close-circle" size={16} color="#EF4444" />
        </TouchableOpacity>
      )}

      <View style={styles.infoBadge}>
        <Ionicons name="people" size={14} color="#0052CC" />
        <Text style={styles.infoBadgeText}>{buyers.length} مشتری</Text>
        <View style={styles.distBadge}>
          <Text style={styles.distText}>محدوده: {maxDistance}m</Text>
        </View>
        <View style={[styles.gpsBadge, userLocation ? styles.gpsOn : styles.gpsOff]}>
          <Ionicons name={userLocation ? 'location' : 'location-outline'} size={10} color={userLocation ? '#10B981' : '#9CA3AF'} />
          <Text style={[styles.gpsText, { color: userLocation ? '#10B981' : '#9CA3AF' }]}>
            {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'دریافت موقعیت...'}
          </Text>
        </View>
      </View>

      <Modal visible={showVisitorModal} transparent animationType="slide" onRequestClose={() => setShowVisitorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ردیابی مسیر ویزیتور</Text>
              <TouchableOpacity onPress={() => setShowVisitorModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.modalSectionLabel}>انتخاب ویزیتور</Text>
              {visitorsLoading ? (
                <View style={{ flexDirection:'row', alignItems:'center', gap:8, padding:16 }}>
                  <ActivityIndicator size="small" color="#0052CC" />
                  <Text style={{ fontSize:13, color:'#6B7280', fontFamily:'IRANYekan' }}>در حال بارگذاری...</Text>
                </View>
              ) : visitors.length === 0 ? (
                <Text style={{ fontSize:13, color:'#9CA3AF', textAlign:'center', padding:16, fontFamily:'IRANYekan' }}>ویزیتوری یافت نشد</Text>
              ) : (
                <View style={styles.visitorGrid}>
                  {visitors.map((v, idx) => {
                    const vCode = v.code || v.NOF || v.id || idx;
                    const isSel = selectedVisitor && (selectedVisitor.code || selectedVisitor.NOF || selectedVisitor.id) === vCode;
                    return (
                      <TouchableOpacity
                        key={vCode}
                        onPress={() => setSelectedVisitor(v)}
                        style={[styles.visitorCard, isSel && styles.visitorCardActive]}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.visitorAvatar, isSel && styles.visitorAvatarActive]}>
                          <Ionicons name="person" size={18} color={isSel ? '#FFF' : '#6B7280'} />
                        </View>
                        <Text style={[styles.visitorName, isSel && styles.visitorNameActive]} numberOfLines={2}>
                          {v.NameF || v.name || `ویزیتور ${idx+1}`}
                        </Text>
                        <Text style={styles.visitorCode}>کد: {vCode}</Text>
                        {isSel && <View style={styles.visitorCheck}><Ionicons name="checkmark-circle" size={16} color="#0052CC" /></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={[styles.modalSectionLabel, { marginTop:18 }]}>انتخاب تاریخ</Text>
              <JalaliDatePicker value={selectedDate} onChange={setSelectedDate} />
              <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginTop:6, marginBottom:16 }}>
                <Ionicons name="calendar" size={14} color="#0052CC" />
                <Text style={{ fontSize:12, color:'#0052CC', fontFamily:'IRANYekan' }}>تاریخ انتخابی: {selectedDate}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={showVisitorTrack}
                disabled={!selectedVisitor || trackingLoading}
                style={[styles.showTrackBtn, (!selectedVisitor || trackingLoading) && styles.showTrackBtnDis]}
                activeOpacity={0.85}
              >
                {trackingLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <><Ionicons name="map" size={18} color="#FFF" /><Text style={styles.showTrackBtnText}>نمایش مسیر روی نقشه</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000' },
  webview:   { flex:1 },
  center:    { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F5F7FA', padding:32 },
  loadingText: { fontSize:15, color:'#0052CC', marginTop:12, fontFamily:'IRANYekan' },
  errorTitle:  { fontSize:16, color:'#EF4444', fontWeight:'600', marginTop:12, fontFamily:'IRANYekan-Bold' },
  errorMsg:    { fontSize:13, color:'#6B7280', marginTop:6, textAlign:'center', fontFamily:'IRANYekan' },
  retryBtn:    { marginTop:20, backgroundColor:'#0052CC', paddingHorizontal:20, paddingVertical:10, borderRadius:10 },
  retryBtnText: { color:'#FFF', fontSize:14, fontFamily:'IRANYekan-Bold' },

  fab:        { position:'absolute', width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center', elevation:6, shadowOffset:{width:0,height:2}, shadowOpacity:0.3, shadowRadius:4 },
  fabUser:    { bottom:180, left:16, backgroundColor:'#8B5CF6', shadowColor:'#8B5CF6' },
  fabRefresh: { bottom:120, left:16, backgroundColor:'#F59E0B', shadowColor:'#F59E0B' },
  fabShow:    { bottom:60,  left:16, backgroundColor:'#10B981', shadowColor:'#10B981' },
  fabHide:    { bottom:240, left:16, backgroundColor:'#EF4444', shadowColor:'#EF4444' },

  adminBtn:     { position:'absolute', top:20, right:16, flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#0052CC', paddingHorizontal:14, paddingVertical:9, borderRadius:20, elevation:7, shadowColor:'#0052CC', shadowOffset:{width:0,height:3}, shadowOpacity:0.4, shadowRadius:6 },
  adminBtnText: { color:'#FFF', fontSize:13, fontWeight:'600', fontFamily:'IRANYekan-Bold' },

  trackBadge:     { position:'absolute', top:70, right:16, flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#FFF', paddingHorizontal:10, paddingVertical:6, borderRadius:12, borderWidth:1.5, borderColor:'#F59E0B', elevation:3, maxWidth:200 },
  trackDot:       { width:8, height:8, borderRadius:4, backgroundColor:'#F59E0B' },
  trackBadgeText: { fontSize:10, color:'#1F2937', fontFamily:'IRANYekan', flex:1 },

  infoBadge:     { position:'absolute', top:20, left:16, backgroundColor:'#FFF', alignItems:'center', paddingHorizontal:12, paddingVertical:8, borderRadius:12, gap:5, elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.1, shadowRadius:4, minWidth:130 },
  infoBadgeText: { fontSize:12, color:'#0052CC', fontWeight:'600', fontFamily:'IRANYekan-Bold' },
  distBadge:     { backgroundColor:'#EFF6FF', paddingHorizontal:8, paddingVertical:4, borderRadius:6 },
  distText:      { fontSize:10, color:'#0052CC', fontWeight:'500', fontFamily:'IRANYekan' },
  gpsBadge:      { flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:6, paddingVertical:3, borderRadius:6 },
  gpsOn:         { backgroundColor:'#D1FAE5' },
  gpsOff:        { backgroundColor:'#F3F4F6' },
  gpsText:       { fontSize:9, fontFamily:'IRANYekan' },

  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'flex-end' },
  modalSheet:   { backgroundColor:'#FFF', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:height*0.82, paddingBottom:24, elevation:20 },
  modalHeader:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  modalTitle:   { fontSize:16, fontWeight:'700', color:'#111827', fontFamily:'IRANYekan-Bold' },
  modalCloseBtn:{ width:32, height:32, borderRadius:16, backgroundColor:'#F3F4F6', justifyContent:'center', alignItems:'center' },
  modalBody:    { paddingHorizontal:20, paddingTop:16 },
  modalSectionLabel: { fontSize:13, fontWeight:'600', color:'#374151', fontFamily:'IRANYekan-Bold', marginBottom:10 },
  modalFooter:  { paddingHorizontal:20, paddingTop:12, borderTopWidth:1, borderTopColor:'#F3F4F6' },

  visitorGrid:        { flexDirection:'row', flexWrap:'wrap', gap:10 },
  visitorCard:        { width:(width-60)/3, alignItems:'center', padding:10, borderRadius:14, borderWidth:1.5, borderColor:'#E5E7EB', backgroundColor:'#FAFAFA', position:'relative' },
  visitorCardActive:  { borderColor:'#0052CC', backgroundColor:'#EFF6FF' },
  visitorAvatar:      { width:40, height:40, borderRadius:20, backgroundColor:'#F3F4F6', justifyContent:'center', alignItems:'center', marginBottom:6 },
  visitorAvatarActive:{ backgroundColor:'#0052CC' },
  visitorName:        { fontSize:11, color:'#374151', fontFamily:'IRANYekan', textAlign:'center', lineHeight:16 },
  visitorNameActive:  { color:'#0052CC', fontFamily:'IRANYekan-Bold' },
  visitorCode:        { fontSize:10, color:'#9CA3AF', fontFamily:'IRANYekan', marginTop:2 },
  visitorCheck:       { position:'absolute', top:6, right:6 },

  dateScroll:         { marginBottom:8 },
  dateChip:           { paddingHorizontal:14, paddingVertical:7, borderRadius:20, borderWidth:1.5, borderColor:'#E5E7EB', backgroundColor:'#F9FAFB', marginRight:8 },
  dateChipActive:     { borderColor:'#0052CC', backgroundColor:'#0052CC' },
  dateChipText:       { fontSize:12, color:'#6B7280', fontFamily:'IRANYekan' },
  dateChipTextActive: { color:'#FFF', fontFamily:'IRANYekan-Bold' },

  showTrackBtn:    { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#0052CC', paddingVertical:14, borderRadius:14, elevation:5, shadowColor:'#0052CC', shadowOffset:{width:0,height:3}, shadowOpacity:0.3, shadowRadius:6 },
  showTrackBtnDis: { backgroundColor:'#9CA3AF', elevation:0, shadowOpacity:0 },
  showTrackBtnText:{ color:'#FFF', fontSize:15, fontWeight:'700', fontFamily:'IRANYekan-Bold' },
});