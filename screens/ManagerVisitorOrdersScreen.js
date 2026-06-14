// screens/ManagerVisitorOrdersScreen.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { getServerUrl } from '../config';
import {
  C,
  calSt,
  drSt,
  itemSt,
  ocSt,
  sc,
  stSt,
  sumSt,
  vpSt,
} from '../styles/ManagerVisitorOrdersScreen.styles';

// ─────────────────────────────────────────────────────────
// تبدیل جلالی
// ─────────────────────────────────────────────────────────
const JALALI_MONTHS     = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const JALALI_DAYS_SHORT = ['ش','ی','د','س','چ','پ','ج'];

function toJalali(gy, gm, gd) {
  const g_d_no = [0,31,(gy%4===0&&gy%100!==0)||(gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  let jy = gy <= 1600 ? 0 : 979;
  gy  = gy <= 1600 ? gy - 621 : gy - 1600;
  let gy2 = gm > 2 ? gy + 1 : gy;
  let g_day_no = 365*gy + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400);
  for (let i=0; i<gm-1; i++) g_day_no += g_d_no[i+1];
  g_day_no += gd - 1;
  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no/12053); j_day_no %= 12053;
  jy += 33*j_np + 4*Math.floor(j_day_no/1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) { jy += Math.floor((j_day_no-1)/365); j_day_no = (j_day_no-1)%365; }
  let jm=1, jd;
  const ml = [31,31,31,31,31,31,30,30,30,30,30];
  for (let i=0; i<11 && j_day_no >= ml[i]; i++) { j_day_no -= ml[i]; jm = i+2; }
  jd = j_day_no + 1;
  return { jy, jm, jd };
}
function isJalaliLeap(y) {
  return [1,5,9,13,17,22,26,30].indexOf(((y-474)%2820+474+38)%2820%128) > -1;
}
function daysInJalaliMonth(m, y) {
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  return isJalaliLeap(y) ? 30 : 29;
}
function jalaliMonthStartWeekday(jy, jm) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const d = new Date(gy, gm-1, gd).getDay();
  return (d+1)%7;
}
function jalaliToGregorian(jy, jm, jd) {
  function isJLeap(y){ return [1,5,9,13,17,22,26,30].indexOf(((y-474)%2820+474+38)%2820%128)>-1; }
  function jDIM(m,y){ return m<=6?31:m<=11?30:isJLeap(y)?30:29; }
  const ref_gy=1969, ref_gm=3, ref_gd=21, ref_jy=1348;
  let total=0;
  if(jy>=ref_jy){ for(let y=ref_jy;y<jy;y++) total+=isJLeap(y)?366:365; }
  else { for(let y=jy;y<ref_jy;y++) total-=isJLeap(y)?366:365; }
  for(let m=1;m<jm;m++) total+=jDIM(m,jy);
  total+=jd-1;
  const d=new Date(ref_gy,ref_gm-1,ref_gd);
  d.setDate(d.getDate()+total);
  return {gy:d.getFullYear(),gm:d.getMonth()+1,gd:d.getDate()};
}
function todayJalali() {
  const n=new Date(); return toJalali(n.getFullYear(),n.getMonth()+1,n.getDate());
}
function parseJalaliStr(str) {
  if(!str) return todayJalali();
  const p=str.split('/'); return {jy:+p[0],jm:+p[1],jd:+p[2]};
}
function jalaliToStr({jy,jm,jd}) {
  return `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
}
function compareJalali(a,b) {
  if(a.jy!==b.jy) return a.jy-b.jy;
  if(a.jm!==b.jm) return a.jm-b.jm;
  return a.jd-b.jd;
}
function addDaysJalali(obj,days) {
  const {gy,gm,gd}=jalaliToGregorian(obj.jy,obj.jm,obj.jd);
  const d=new Date(gy,gm-1,gd); d.setDate(d.getDate()+days);
  return toJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
}

// ─────────────────────────────────────────────────────────
// فرمت
// ─────────────────────────────────────────────────────────
const formatCurrency = (v) => {
  if (!v && v!==0) return '۰';
  return Math.round(v).toLocaleString('fa-IR');
};

// ─────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────
const fetchVisitorsList = async () => {
  const token   = await AsyncStorage.getItem('token');
  const baseUrl = await getServerUrl();
  const res  = await fetch(`${baseUrl}/api/manager/visitors-list`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطا در دریافت لیست ویزیتورها');
  return data.data || [];
};

const fetchVisitorOrders = async ({ visitorCode, startDate, endDate }) => {
  const token   = await AsyncStorage.getItem('token');
  const baseUrl = await getServerUrl();
  let url = `${baseUrl}/api/manager/visitor-orders?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  if (visitorCode && visitorCode !== 'all') url += `&visitorCode=${encodeURIComponent(visitorCode)}`;
  const res  = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'خطا در دریافت گزارش');
  return data.data;
};

// ─────────────────────────────────────────────────────────
// تقویم شمسی
// ─────────────────────────────────────────────────────────
const JalaliCalendar = ({ visible, onConfirm, onClose, initialStart, initialEnd }) => {
  const today = todayJalali();
  const [viewYear,  setViewYear]  = useState(today.jy);
  const [viewMonth, setViewMonth] = useState(today.jm);
  const [selecting, setSelecting] = useState('start');
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd,   setTempEnd]   = useState(null);

  useEffect(() => {
    if (visible) {
      const s = initialStart ? parseJalaliStr(initialStart) : today;
      const e = initialEnd   ? parseJalaliStr(initialEnd)   : today;
      setTempStart(s); setTempEnd(e);
      setViewYear(s.jy); setViewMonth(s.jm);
      setSelecting('start');
    }
  }, [visible]);

  const prevMonth = () => { if(viewMonth===1){setViewYear(y=>y-1);setViewMonth(12);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if(viewMonth===12){setViewYear(y=>y+1);setViewMonth(1);}else setViewMonth(m=>m+1); };

  const handleDayPress = (jy,jm,jd) => {
    const pressed={jy,jm,jd};
    if(selecting==='start'){
      setTempStart(pressed); setTempEnd(null); setSelecting('end');
    } else {
      if(compareJalali(pressed,tempStart)<0){ setTempStart(pressed); setTempEnd(tempStart); }
      else setTempEnd(pressed);
      setSelecting('start');
    }
  };

  const isInRange = (jy,jm,jd) => {
    if(!tempStart||!tempEnd) return false;
    const d={jy,jm,jd};
    return compareJalali(d,tempStart)>=0 && compareJalali(d,tempEnd)<=0;
  };
  const isStart = (jy,jm,jd) => tempStart&&tempStart.jy===jy&&tempStart.jm===jm&&tempStart.jd===jd;
  const isEnd   = (jy,jm,jd) => tempEnd  &&tempEnd.jy===jy  &&tempEnd.jm===jm  &&tempEnd.jd===jd;
  const isToday = (jy,jm,jd) => today.jy===jy&&today.jm===jm&&today.jd===jd;

  const totalDays = daysInJalaliMonth(viewMonth,viewYear);
  const startWd   = jalaliMonthStartWeekday(viewYear,viewMonth);
  const cells=[];
  for(let i=0;i<startWd;i++) cells.push(null);
  for(let d=1;d<=totalDays;d++) cells.push(d);

  const handleConfirm = () => {
    if(!tempStart) return;
    onConfirm(jalaliToStr(tempStart), tempEnd ? jalaliToStr(tempEnd) : jalaliToStr(tempStart));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={calSt.overlay}>
        <View style={calSt.container}>
          {/* هدر */}
          <View style={calSt.header}>
            <Text style={calSt.headerTitle}>انتخاب بازه تاریخ</Text>
            <Text style={calSt.headerHint}>
              {selecting==='start' ? 'تاریخ شروع را انتخاب کنید' : 'تاریخ پایان را انتخاب کنید'}
            </Text>
          </View>

          {/* نوار انتخاب شروع / پایان */}
          <View style={calSt.selBar}>
            <View style={[calSt.selItem, selecting==='start' && calSt.selItemActive]}>
              <Text style={calSt.selLabel}>از</Text>
              <Text style={calSt.selDate}>
                {tempStart ? `${tempStart.jd} ${JALALI_MONTHS[tempStart.jm-1]} ${tempStart.jy}` : '—'}
              </Text>
            </View>
            <View style={calSt.selDivider}/>
            <View style={[calSt.selItem, selecting==='end' && calSt.selItemActive]}>
              <Text style={calSt.selLabel}>تا</Text>
              <Text style={calSt.selDate}>
                {tempEnd ? `${tempEnd.jd} ${JALALI_MONTHS[tempEnd.jm-1]} ${tempEnd.jy}` : '—'}
              </Text>
            </View>
          </View>

          {/* ناوبری ماه */}
          <View style={calSt.nav}>
            <TouchableOpacity style={calSt.navBtn} onPress={nextMonth}>
              <Text style={calSt.navBtnTxt}>›</Text>
            </TouchableOpacity>
            <View style={calSt.navCenter}>
              <Text style={calSt.navMonth}>{JALALI_MONTHS[viewMonth-1]}</Text>
              <Text style={calSt.navYear}>{viewYear}</Text>
            </View>
            <TouchableOpacity style={calSt.navBtn} onPress={prevMonth}>
              <Text style={calSt.navBtnTxt}>‹</Text>
            </TouchableOpacity>
          </View>

          {/* روزهای هفته */}
          <View style={calSt.weekRow}>
            {JALALI_DAYS_SHORT.map((d,i) => (
              <View key={i} style={calSt.weekCell}>
                <Text style={[calSt.weekTxt, i===6 && calSt.friday]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* شبکه روزها */}
          <View style={calSt.daysGrid}>
            {cells.map((day,idx) => {
              if(!day) return <View key={`e${idx}`} style={calSt.dayCell}/>;
              const inR=isInRange(viewYear,viewMonth,day);
              const iS=isStart(viewYear,viewMonth,day);
              const iE=isEnd(viewYear,viewMonth,day);
              const iT=isToday(viewYear,viewMonth,day);
              const isFri=idx%7===6;
              return (
                <TouchableOpacity
                  key={day}
                  style={[calSt.dayCell, inR&&calSt.inRange, (iS||iE)&&calSt.selected]}
                  onPress={()=>handleDayPress(viewYear,viewMonth,day)}
                  activeOpacity={0.7}>
                  {iT&&!iS&&!iE&&<View style={calSt.todayDot}/>}
                  <Text style={[
                    calSt.dayTxt,
                    inR&&calSt.dayInRange,
                    (iS||iE)&&calSt.daySelected,
                    isFri&&!iS&&!iE&&calSt.dayFriday,
                    iT&&!iS&&!iE&&calSt.dayToday,
                  ]}>
                    {String(day).toLocaleString('fa-IR')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* میانبرها */}
          <View style={calSt.shortcuts}>
            {[
              {label:'امروز', action:()=>{setTempStart(today);setTempEnd(today);setSelecting('start');setViewYear(today.jy);setViewMonth(today.jm);}},
              {label:'۷ روز', action:()=>{const s=addDaysJalali(today,-6);setTempStart(s);setTempEnd(today);setSelecting('start');setViewYear(s.jy);setViewMonth(s.jm);}},
              {label:'این ماه', action:()=>{const s={jy:today.jy,jm:today.jm,jd:1};setTempStart(s);setTempEnd(today);setSelecting('start');setViewYear(s.jy);setViewMonth(s.jm);}},
              {label:'ماه قبل', action:()=>{const pm=today.jm===1?12:today.jm-1,py=today.jm===1?today.jy-1:today.jy;const s={jy:py,jm:pm,jd:1};const e={jy:py,jm:pm,jd:daysInJalaliMonth(pm,py)};setTempStart(s);setTempEnd(e);setSelecting('start');setViewYear(py);setViewMonth(pm);}},
            ].map(({label,action})=>(
              <TouchableOpacity key={label} style={calSt.shortcutBtn} onPress={action}>
                <Text style={calSt.shortcutTxt}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* دکمه‌ها */}
          <View style={calSt.actions}>
            <TouchableOpacity style={calSt.cancelBtn} onPress={onClose}>
              <Text style={calSt.cancelTxt}>انصراف</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[calSt.confirmBtn, !tempStart&&{opacity:0.4}]}
              onPress={handleConfirm}
              disabled={!tempStart}>
              <Text style={calSt.confirmTxt}>تأیید</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
// انتخاب‌گر بازه تاریخ
// ─────────────────────────────────────────────────────────
const DateRangePicker = ({ startDate, endDate, onDateChange }) => {
  const [showCal,      setShowCal]      = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const today = todayJalali();

  const applyPreset = (preset) => {
    setActivePreset(preset);
    const t = jalaliToStr(today);
    if (preset==='today') { onDateChange(t,t); }
    else if (preset==='week') { onDateChange(jalaliToStr(addDaysJalali(today,-6)),t); }
    else if (preset==='custom') { setShowCal(true); }
  };

  return (
    <View>
      <View style={drSt.row}>
        {[
          {key:'today',  icon:'☀️', label:'امروز'},
          {key:'week',   icon:'📆', label:'هفته اخیر'},
          {key:'custom', icon:'🗓', label:'دوره دلخواه'},
        ].map(({key,icon,label})=>(
          <TouchableOpacity
            key={key}
            style={[drSt.btn, activePreset===key && drSt.btnActive]}
            onPress={()=>applyPreset(key)}>
            <Text style={drSt.icon}>{icon}</Text>
            <Text style={[drSt.label, activePreset===key && drSt.labelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {startDate && (
        <TouchableOpacity
          style={drSt.display}
          onPress={()=>{setActivePreset('custom');setShowCal(true);}}>
          <Text style={drSt.displayIcon}>📅</Text>
          <View style={drSt.displayDates}>
            {startDate===endDate
              ? <Text style={drSt.displayTxt}>{startDate}</Text>
              : <>
                  <Text style={drSt.displayTxt}>{startDate}</Text>
                  <Text style={drSt.arrow}> ← </Text>
                  <Text style={drSt.displayTxt}>{endDate}</Text>
                </>
            }
          </View>
          <Text style={drSt.editTxt}>ویرایش</Text>
        </TouchableOpacity>
      )}

      <JalaliCalendar
        visible={showCal}
        onConfirm={(s,e)=>{ onDateChange(s,e); setShowCal(false); }}
        onClose={()=>setShowCal(false)}
        initialStart={startDate}
        initialEnd={endDate}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// جدول کالاهای سفارش
// ─────────────────────────────────────────────────────────
const ItemsTable = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <View style={itemSt.emptyRow}>
        <Text style={itemSt.emptyTxt}>کالایی ثبت نشده</Text>
      </View>
    );
  }

  const grandTotal = items.reduce((s,i)=>s+parseFloat(i.totalPrice||0),0);

  return (
    <View style={itemSt.container}>
      <View style={itemSt.headerRow}>
        <Text style={[itemSt.headerCell, itemSt.colPrice, itemSt.alignLeft]}>قیمت کل</Text>
        <Text style={[itemSt.headerCell, itemSt.colMaster]}>مبنا</Text>
        <Text style={[itemSt.headerCell, itemSt.colSlave]}>جز</Text>
        <Text style={[itemSt.headerCell, itemSt.colName]}>نام کالا</Text>
      </View>

      {items.map((item, idx) => (
        <View key={idx} style={[itemSt.row, idx%2===0 && itemSt.rowAlt]}>
          <View style={[itemSt.colPrice, itemSt.cellLeft]}>
            <Text style={itemSt.priceVal}>{formatCurrency(item.totalPrice)}</Text>
            <Text style={itemSt.unitHint}></Text>
          </View>
          <View style={[itemSt.colMaster, itemSt.cellCenter]}>
            <Text style={itemSt.masterVal}>{String(item.masterT||0).toLocaleString('fa-IR')}</Text>
            <Text style={itemSt.unitHint}>مبنا</Text>
          </View>
          <View style={[itemSt.colSlave, itemSt.cellCenter]}>
            <Text style={itemSt.slaveVal}>{String(item.slaveT||0).toLocaleString('fa-IR')}</Text>
            <Text style={itemSt.unitHint}>جز</Text>
          </View>
          <View style={itemSt.colName}>
            <Text style={itemSt.itemName} numberOfLines={2}>{item.itemName}</Text>
            <Text style={itemSt.itemCode}>کد {item.itemCode}</Text>
          </View>
        </View>
      ))}

      <View style={itemSt.totalRow}>
        <Text style={itemSt.totalValue}>{formatCurrency(grandTotal)}</Text>
        <Text style={itemSt.totalLabel}>جمع کل</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// کارت سفارش
// ─────────────────────────────────────────────────────────
const OrderCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const isInvoiced = item.isInvoiced;

  return (
    <View style={[ocSt.card, isInvoiced && ocSt.cardInvoiced]}>
      <View style={[ocSt.statusBar, isInvoiced ? ocSt.statusBarGreen : ocSt.statusBarAmber]}/>

      <TouchableOpacity style={ocSt.header} onPress={()=>setExpanded(e=>!e)} activeOpacity={0.85}>
        <View style={ocSt.row1}>
          {/* چپ: مبلغ کل */}
          <View style={ocSt.amountWrap}>
            <Text style={[ocSt.amount, isInvoiced && ocSt.amountGreen]}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>

          {/* راست: شماره + وضعیت */}
          <View style={ocSt.row1Right}>
            <Text style={ocSt.orderNum}>سفارش  {item.orderNumber}#</Text>
            {isInvoiced
              ? <View style={ocSt.badgeInvoiced}><Text style={ocSt.badgeInvoicedTxt}>فاکتور شده</Text></View>
              : <View style={ocSt.badgePending}><Text style={ocSt.badgePendingTxt}>در انتظار فاکتور</Text></View>
            }
          </View>
        </View>

        <View style={ocSt.metaRow}>
          <View style={ocSt.metaChipLeft}>
            <Text style={ocSt.metaIcon}>🏪</Text>
            <Text style={ocSt.metaVal} numberOfLines={1}>{item.buyerName}</Text>
          </View>
          <View style={ocSt.metaChipCenter}>
            <Text style={ocSt.metaIcon}>👤</Text>
            <Text style={ocSt.metaVal} numberOfLines={1}>{item.visitorName}</Text>
          </View>
          <View style={ocSt.metaChipRight}>
            <Text style={ocSt.metaIcon}>📅</Text>
            <Text style={ocSt.metaVal}>{item.orderDate}</Text>
          </View>
        </View>

        {isInvoiced && !!item.factorNo && (
          <View style={ocSt.factorRow}>
            <Text style={ocSt.factorLabel}>شماره فاکتور</Text>
            <Text style={ocSt.factorVal}>#{item.factorNo}</Text>
          </View>
        )}

        <View style={ocSt.expandBar}>
          <Text style={ocSt.itemCount}>{item.items?.length || 0} قلم کالا</Text>
          <Text style={ocSt.expandHint}>{expanded ? '▲ بستن' : '▼ جزئیات'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={ocSt.expandedBody}>
          {!!item.description && (
            <View style={ocSt.descRow}>
              <Text style={ocSt.descLabel}>توضیحات:  </Text>
              <Text style={ocSt.descVal}>{item.description}</Text>
            </View>
          )}
          <ItemsTable items={item.items}/>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// کارت آمار
// ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent, icon }) => (
  <View style={[stSt.card, {borderTopColor: accent}]}>
    <Text style={stSt.icon}>{icon}</Text>
    <Text style={[stSt.value, {color: accent}]}>{value}</Text>
    <Text style={stSt.label}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────
// ردیف خلاصه ویزیتور
// ─────────────────────────────────────────────────────────
const SummaryRow = ({ item, index }) => (
  <View style={[sumSt.row, index%2===0 && sumSt.rowAlt]}>
    <Text style={sumSt.rank}>{index+1}</Text>
    <View style={sumSt.info}>
      <Text style={sumSt.name}>{item.visitorName}</Text>
      <View style={sumSt.pills}>
        <View style={sumSt.greenPill}>
          <Text style={sumSt.greenPillTxt}>{item.invoicedCount} فاکتور</Text>
        </View>
        {item.pendingCount>0 && (
          <View style={sumSt.amberPill}>
            <Text style={sumSt.amberPillTxt}>{item.pendingCount} در انتظار</Text>
          </View>
        )}
      </View>
    </View>
    <View style={sumSt.numbers}>
      <Text style={sumSt.amount}>{formatCurrency(item.totalAmount)}</Text>
      <Text style={sumSt.count}>{item.orderCount} سفارش</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────
// مودال انتخاب ویزیتور
// ─────────────────────────────────────────────────────────
const VisitorPickerModal = ({ visible, visitors, selectedCode, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={vpSt.overlay}>
      <View style={vpSt.sheet}>
        <View style={vpSt.handle}/>
        <Text style={vpSt.title}>انتخاب ویزیتور</Text>
        <FlatList
          data={[{visitorCode:'all',visitorName:'همه ویزیتورها'},...visitors]}
          keyExtractor={item=>String(item.visitorCode)}
          renderItem={({item})=>(
            <TouchableOpacity
              style={[vpSt.item, item.visitorCode===selectedCode && vpSt.itemSelected]}
              onPress={()=>{onSelect(item.visitorCode,item.visitorName);onClose();}}>
              <View style={vpSt.itemLeft}>
                <Text style={[vpSt.itemName, item.visitorCode===selectedCode && vpSt.itemNameSelected]}>
                  {item.visitorName}
                </Text>
                {item.visitorCode!=='all' && (
                  <Text style={vpSt.itemCode}>کد: {item.visitorCode}</Text>
                )}
              </View>
              {item.visitorCode===selectedCode && (
                <Text style={vpSt.check}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={vpSt.closeBtn} onPress={onClose}>
          <Text style={vpSt.closeTxt}>بستن</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─────────────────────────────────────────────────────────
// صفحه اصلی
// ─────────────────────────────────────────────────────────
export default function ManagerVisitorOrdersScreen() {
  const [visitors,             setVisitors]             = useState([]);
  const [selectedVisitorCode,  setSelectedVisitorCode]  = useState('all');
  const [selectedVisitorName,  setSelectedVisitorName]  = useState('همه ویزیتورها');
  const today = todayJalali();
  const [startDate, setStartDate] = useState(jalaliToStr({jy:today.jy,jm:today.jm,jd:1}));
  const [endDate,   setEndDate]   = useState(jalaliToStr(today));
  const [orders,    setOrders]    = useState([]);
  const [summary,   setSummary]   = useState([]);
  const [totals,    setTotals]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [error,     setError]     = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // فعال‌سازی LayoutAnimation روی اندروید
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterOpen(o => !o);
  };

  useEffect(()=>{
    (async()=>{
      try { const list=await fetchVisitorsList(); setVisitors(list); }
      catch(e){ Alert.alert('خطا',e.message); }
      finally { setLoadingVisitors(false); }
    })();
    Animated.timing(fadeAnim,{toValue:1,duration:500,useNativeDriver:true}).start();
  },[]);

  const handleSearch = useCallback(async()=>{
    if(!startDate||!endDate){ Alert.alert('خطا','بازه تاریخ را انتخاب کنید'); return; }
    setLoading(true); setError(null);
    try {
      const result = await fetchVisitorOrders({visitorCode:selectedVisitorCode,startDate,endDate});
      setOrders(result.orders||[]);
      setSummary(result.summary||[]);
      setTotals(result.totals||null);
      // بستن پنل فیلتر بعد از جستجو
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFilterOpen(false);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  },[selectedVisitorCode,startDate,endDate]);

  const hasResults = orders.length > 0;

  return (
    <View style={sc.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>

      <ScrollView style={sc.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:40}}>

        {/* ─── کارت فیلتر ─── */}
        <View style={sc.filterCard}>
          {filterOpen ? (
            <>
              <Text style={sc.sectionLabel}>ویزیتور</Text>
              <TouchableOpacity
                style={sc.dropdown}
                onPress={()=>setShowVisitorModal(true)}
                disabled={loadingVisitors}>
                {loadingVisitors
                  ? <ActivityIndicator size="small" color={C.accent}/>
                  : <>
                      <Text style={sc.dropdownTxt}>{selectedVisitorName}</Text>
                      <Text style={sc.dropdownArrow}>▼</Text>
                    </>
                }
              </TouchableOpacity>

              <Text style={[sc.sectionLabel, {marginTop:14}]}>بازه زمانی</Text>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={(s,e)=>{setStartDate(s);setEndDate(e);}}/>

              <TouchableOpacity
                style={[sc.searchBtn, loading && {opacity:0.65}]}
                onPress={handleSearch}
                disabled={loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator size="small" color={C.white}/>
                  : <Text style={sc.searchBtnTxt}>نمایش گزارش</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={sc.newPeriodBtn} onPress={toggleFilter} activeOpacity={0.85}>
              <Text style={sc.newPeriodIcon}>🗓</Text>
              <Text style={sc.newPeriodTxt}>انتخاب دوره جدید</Text>
              {startDate && <Text style={sc.newPeriodDate}>{startDate} ← {endDate}</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ─── خطا ─── */}
        {!!error && (
          <View style={sc.errorBox}>
            <Text style={sc.errorTxt}>⚠️  {error}</Text>
          </View>
        )}

        {/* ─── آمار ─── */}
        {totals && (
          <Animated.View style={[sc.statsGrid, {opacity:fadeAnim}]}>
            <StatCard label="کل سفارش"        value={totals.totalOrders.toLocaleString('fa-IR')}  accent={C.accent}  icon="📋"/>
            <StatCard label="مجموع"            value={formatCurrency(totals.totalAmount)}           accent={C.green}   icon="💰"/>
            <StatCard label="فاکتور شده"       value={totals.invoicedCount.toLocaleString('fa-IR')} accent={C.green}   icon="✅"/>
            <StatCard label="در انتظار"        value={totals.pendingCount.toLocaleString('fa-IR')}  accent={C.amber}   icon="⏳"/>
          </Animated.View>
        )}

        {/* ─── تب‌ها ─── */}
        {hasResults && (
          <View style={sc.tabBar}>
            {[
              {key:'orders',  label:`سفارش‌ها (${orders.length})`},
              {key:'summary', label:`خلاصه ویزیتورها (${summary.length})`},
            ].map(({key,label})=>(
              <TouchableOpacity
                key={key}
                style={[sc.tab, activeTab===key && sc.tabActive]}
                onPress={()=>setActiveTab(key)}>
                <Text style={[sc.tabTxt, activeTab===key && sc.tabTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── خلاصه ویزیتورها ─── */}
        {hasResults && activeTab==='summary' && (
          <View style={sc.summaryCard}>
            <View style={sumSt.header}>
              <Text style={[sumSt.headerTxt, {flex:0.3}]}>رتبه</Text>
              <Text style={[sumSt.headerTxt, {flex:1.4}]}>ویزیتور</Text>
              <Text style={[sumSt.headerTxt, {textAlign:'right'}]}>فروش</Text>
            </View>
            {summary.map((item,idx)=>(
              <SummaryRow key={item.visitorCode} item={item} index={idx}/>
            ))}
          </View>
        )}

        {/* ─── لیست سفارش‌ها ─── */}
        {hasResults && activeTab==='orders' && (
          <View style={{marginTop:4}}>
            {orders.map((item,idx)=>(
              <OrderCard key={`${item.orderNumber}_${idx}`} item={item}/>
            ))}
          </View>
        )}

        {/* ─── حالت‌های خالی ─── */}
        {!loading&&!error&&totals&&orders.length===0 && (
          <View style={sc.emptyBox}>
            <Text style={sc.emptyIcon}>📭</Text>
            <Text style={sc.emptyTxt}>سفارشی در این بازه یافت نشد</Text>
          </View>
        )}
        {!loading&&!error&&!totals && (
          <View style={sc.guideBox}>
            <Text style={sc.guideIcon}>📊</Text>
            <Text style={sc.guideTxt}>ویزیتور و بازه تاریخ را انتخاب کنید{'\n'}سپس «نمایش گزارش» را بزنید</Text>
          </View>
        )}

      </ScrollView>

      <VisitorPickerModal
        visible={showVisitorModal}
        visitors={visitors}
        selectedCode={selectedVisitorCode}
        onSelect={(code,name)=>{setSelectedVisitorCode(code);setSelectedVisitorName(name);}}
        onClose={()=>setShowVisitorModal(false)}/>
    </View>
  );
}