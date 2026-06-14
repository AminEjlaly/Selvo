// screens/ManagerVisitorOrdersScreen.styles.js

import { Platform, StyleSheet } from 'react-native';

// ─────────────────────────────────────────────────────────
// پالت رنگی — تم روشن (سفید / آبی تیره)
// ─────────────────────────────────────────────────────────
export const C = {
  bg:          '#0f172a',
  card:        '#1e2937',
  inputBg:     '#334155',
  rowAlt:      '#252f3d',
  accent:      '#11a6bc',
  accentSoft:  'rgba(34,211,238,0.15)',
  accentBorder:'rgba(34,211,238,0.35)',
  textPrimary: '#e2e8f0',
  textSecond:  '#d4d7dc',
  textMuted:   '#64748b',
  green:       '#34d399',
  greenSoft:   'rgba(52,211,153,0.15)',
  greenBorder: 'rgba(52,211,153,0.35)',
  amber:       '#fbbf24',
  amberSoft:   'rgba(251,191,36,0.15)',
  amberBorder: 'rgba(251,191,36,0.35)',
  divider:     'rgba(51,65,85,0.6)',
  white:       '#ffffff',
  w70:         '#94a3b8',
  w50:         '#64748b',
  w25:         '#475569',
  w10:         'rgba(15,23,42,0.8)',
};

// ─── صفحه اصلی ───
export const sc = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },
  header: {
    backgroundColor: '#032992',
    paddingTop: Platform.OS==='android' ? 5 : 5,
    paddingBottom: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'IRANYekan-Bold',
    textAlign: 'center',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    fontFamily: 'IRANYekan',
    textAlign: 'center',
    marginTop: 3,
  },
  scroll: { flex:1, paddingHorizontal:16 },

  filterCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.divider,
    shadowColor: '#000',
    shadowOffset: {width:0, height:2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    color: C.textSecond,
    fontSize: 12,
    fontFamily: 'IRANYekan',
    textAlign: 'right',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.divider,
    marginBottom: 4,
  },
  dropdownTxt:   { color:C.textPrimary, fontSize:14, fontFamily:'IRANYekan' },
  dropdownArrow: { color:C.textMuted,   fontSize:11 },

  searchBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  searchBtnTxt: { color:C.white, fontSize:15, fontFamily:'IRANYekan-Bold' },

  // دکمه انتخاب دوره جدید (حالت بسته)
  newPeriodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  newPeriodIcon: { fontSize:18 },
  newPeriodTxt:  { color:C.accent, fontSize:14, fontFamily:'IRANYekan-Bold', flex:1 },
  newPeriodDate: { color:C.textMuted, fontSize:11, fontFamily:'IRANYekan' },

  errorBox: {
    backgroundColor: 'rgba(220,53,69,0.10)',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.28)',
  },
  errorTxt: { color:'#DC2626', fontSize:13, fontFamily:'IRANYekan', textAlign:'right' },

  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.divider,
  },
  tab:         { flex:1, paddingVertical:11, borderRadius:10, alignItems:'center' },
  tabActive:   { backgroundColor: C.accent },
  tabTxt:      { color:C.textSecond,  fontSize:13, fontFamily:'IRANYekan' },
  tabTxtActive:{ color:'#FFFFFF', fontFamily:'IRANYekan-Bold' },

  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.divider,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width:0, height:2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  emptyBox: { alignItems:'center', paddingVertical:52 },
  emptyIcon:{ fontSize:46, marginBottom:12 },
  emptyTxt: { color:C.textMuted, fontSize:15, fontFamily:'IRANYekan' },
  guideBox: { alignItems:'center', paddingVertical:48, opacity:0.55 },
  guideIcon:{ fontSize:42, marginBottom:12 },
  guideTxt: { color:C.textMuted, fontSize:14, fontFamily:'IRANYekan', textAlign:'center', lineHeight:28 },
});

// ─── کارت آمار ───
export const stSt = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.divider,
    borderTopWidth: 3,
  },
  icon:  { fontSize:14, marginBottom:2 },
  value: { fontSize:12, fontFamily:'IRANYekan-Bold', textAlign:'center' },
  label: { color:C.textSecond, fontSize:9, fontFamily:'IRANYekan', marginTop:2, textAlign:'center' },
});

// ─── کارت سفارش ───
export const ocSt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.divider,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width:0, height:2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInvoiced:    { borderColor: C.greenBorder },
  statusBar:       { height: 3 },
  statusBarGreen:  { backgroundColor: C.green },
  statusBarAmber:  { backgroundColor: C.amber },

  header:    { padding: 14 },
  row1:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  row1Right: { flex:1 },

  orderNum: { color:C.textPrimary, fontSize:14, fontFamily:'IRANYekan-Bold', textAlign:'right', marginBottom:6 },

  badgeInvoiced: {
    alignSelf: 'flex-end',
    backgroundColor: C.greenSoft,
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.greenBorder,
  },
  badgeInvoicedTxt: { color:C.green, fontSize:11, fontFamily:'IRANYekan-Bold' },

  badgePending: {
    alignSelf: 'flex-end',
    backgroundColor: C.amberSoft,
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.amberBorder,
  },
  badgePendingTxt: { color:C.amber, fontSize:11, fontFamily:'IRANYekan' },

  amountWrap:  { alignItems:'flex-start' },
  amount:      { color:C.textPrimary, fontSize:17, fontFamily:'IRANYekan-Bold', textAlign:'left' },
  amountGreen: { color:C.green },
  amountUnit:  { color:C.textMuted, fontSize:10, fontFamily:'IRANYekan', marginTop:1 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginBottom: 10,
  },
  metaChipRight:  { flex:1, flexDirection:'row', alignItems:'center', gap:4, justifyContent:'flex-end' },
  metaChipCenter: { flex:1, flexDirection:'row', alignItems:'center', gap:4, justifyContent:'center' },
  metaChipLeft:   { flex:1, flexDirection:'row', alignItems:'center', gap:4, justifyContent:'flex-start' },
  metaChip: { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:2 },
  metaIcon: { fontSize:12 },
  metaVal:  { color:C.textSecond, fontSize:11, fontFamily:'IRANYekan' },
  metaDot:  { width:3, height:3, borderRadius:2, backgroundColor:C.textMuted, marginHorizontal:6 },

  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    backgroundColor: C.greenSoft,
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    marginBottom: 10,
  },
  factorLabel: { color:C.textSecond, fontSize:11, fontFamily:'IRANYekan' },
  factorVal:   { color:C.green,      fontSize:12, fontFamily:'IRANYekan-Bold' },

  expandBar:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  itemCount:  { color:C.textMuted, fontSize:11, fontFamily:'IRANYekan' },
  expandHint: { color:C.accent,    fontSize:11, fontFamily:'IRANYekan' },

  expandedBody: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    backgroundColor: C.inputBg,
    padding: 12,
  },
  descRow:   { flexDirection:'row', marginBottom:10, justifyContent:'flex-end' },
  descLabel: { color:C.textSecond,  fontSize:12, fontFamily:'IRANYekan' },
  descVal:   { color:C.textPrimary, fontSize:12, fontFamily:'IRANYekan', flex:1, textAlign:'right' },
});

// ─── جدول کالاها ───
export const itemSt = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.divider,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#E8EEFA',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  headerCell: {
    color: C.textSecond,
    fontSize: 11,
    fontFamily: 'IRANYekan-Bold',
    textAlign: 'center',
  },

  colName:   { flex:2.2, textAlign:'right' },
  colMaster: { flex:1,   textAlign:'center' },
  colSlave:  { flex:1,   textAlign:'center' },
  colPrice:  { flex:1.5, textAlign:'left' },

  row:    { flexDirection:'row', paddingVertical:10, paddingHorizontal:10, alignItems:'center' },
  rowAlt: { backgroundColor: C.rowAlt },

  cellCenter: { alignItems:'center', justifyContent:'center' },
  cellLeft:   { alignItems:'flex-start' },
  alignLeft:  { textAlign:'left' },

  itemName: { color:C.textPrimary, fontSize:12, fontFamily:'IRANYekan-Bold', textAlign:'right' },
  itemCode: { color:C.textMuted,   fontSize:10, fontFamily:'IRANYekan', marginTop:2, textAlign:'right' },

  masterVal: { color:C.textPrimary, fontSize:13, fontFamily:'IRANYekan-Bold' },
  slaveVal:  { color:C.textSecond,  fontSize:13, fontFamily:'IRANYekan-Bold' },
  priceVal:  { color:C.green,       fontSize:13, fontFamily:'IRANYekan-Bold' },
  unitHint:  { color:C.textMuted,   fontSize:9,  fontFamily:'IRANYekan', marginTop:1 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#E8EEFA',
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  totalLabel: { color:C.textSecond, fontSize:12, fontFamily:'IRANYekan' },
  totalValue: { color:C.green,      fontSize:13, fontFamily:'IRANYekan-Bold' },

  emptyRow: { padding:18, alignItems:'center' },
  emptyTxt: { color:C.textMuted, fontSize:12, fontFamily:'IRANYekan' },
});

// ─── خلاصه ویزیتور ───
export const sumSt = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: '#11a6bc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  headerTxt: { flex:1, color:C.textSecond, fontSize:12, fontFamily:'IRANYekan-Bold', textAlign:'center' },

  row:    { flexDirection:'row', paddingVertical:13, paddingHorizontal:14, alignItems:'center' },
  rowAlt: { backgroundColor: C.rowAlt },

  rank: { color:C.accent, fontSize:14, fontFamily:'IRANYekan-Bold', width:30, textAlign:'center' },
  info: { flex:1.4, paddingHorizontal:8 },
  name: { color:C.textPrimary, fontSize:13, fontFamily:'IRANYekan', textAlign:'right' },

  pills:        { flexDirection:'row', flexWrap:'wrap', marginTop:4, gap:4 },
  greenPill:    { backgroundColor:C.greenSoft, borderRadius:10, paddingHorizontal:7, paddingVertical:2, borderWidth:1, borderColor:C.greenBorder },
  greenPillTxt: { color:C.green, fontSize:10, fontFamily:'IRANYekan' },
  amberPill:    { backgroundColor:C.amberSoft, borderRadius:10, paddingHorizontal:7, paddingVertical:2, borderWidth:1, borderColor:C.amberBorder },
  amberPillTxt: { color:C.amber, fontSize:10, fontFamily:'IRANYekan' },

  numbers: { flex:1, alignItems:'flex-end' },
  amount:  { color:C.green,      fontSize:12, fontFamily:'IRANYekan-Bold' },
  count:   { color:C.textSecond, fontSize:11, fontFamily:'IRANYekan', marginTop:2 },
});

// ─── تقویم ───
export const calSt = StyleSheet.create({
  overlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.80)', justifyContent:'center', alignItems:'center', padding:16 },
  container: { backgroundColor:C.card, borderRadius:20, width:'100%', borderWidth:1, borderColor:C.divider, overflow:'hidden' },

  header:      { backgroundColor:'#1D4ED8', paddingVertical:16, paddingHorizontal:20, alignItems:'center', borderBottomWidth:0 },
  headerTitle: { color:'#FFFFFF', fontSize:15, fontFamily:'IRANYekan-Bold' },
  headerHint:  { color:'rgba(255,255,255,0.75)', fontSize:12, fontFamily:'IRANYekan', marginTop:4 },

  selBar:        { flexDirection:'row', alignItems:'center', borderBottomWidth:1, borderBottomColor:C.divider },
  selItem:       { flex:1, alignItems:'center', paddingVertical:12, paddingHorizontal:10 },
  selItemActive: { backgroundColor:C.accentSoft },
  selDivider:    { width:1, height:40, backgroundColor:C.divider },
  selLabel:      { color:C.textPrimary, fontSize:10, fontFamily:'IRANYekan', marginBottom:3 },
  selDate:       { color:C.textPrimary, fontSize:13, fontFamily:'IRANYekan-Bold' },

  nav:       { flexDirection:'row', alignItems:'center', paddingVertical:12, paddingHorizontal:14, borderBottomWidth:1, borderBottomColor:C.divider },
  navBtn:    { width:36, height:36, backgroundColor:C.inputBg, borderRadius:10, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.divider },
  navBtnTxt: { color:C.textPrimary, fontSize:22, lineHeight:28 },
  navCenter: { flex:1, alignItems:'center' },
  navMonth:  { color:C.textPrimary, fontSize:15, fontFamily:'IRANYekan-Bold' },
  navYear:   { color:C.textSecond,  fontSize:12, fontFamily:'IRANYekan', marginTop:2 },

  weekRow:  { flexDirection:'row', paddingHorizontal:8, paddingVertical:8, backgroundColor:C.rowAlt },
  weekCell: { flex:1, alignItems:'center' },
  weekTxt:  { color:C.textPrimary, fontSize:12, fontFamily:'IRANYekan-Bold' },
  friday:   { color:'#DC2626' },

  daysGrid: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:8, paddingVertical:8 },
  dayCell:  { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center', position:'relative' },
  inRange:  { backgroundColor:'rgba(29,78,216,0.12)' },
  selected: { backgroundColor:C.accent, borderRadius:999 },

  dayTxt:      { color:C.textPrimary, fontSize:13, fontFamily:'IRANYekan' },
  dayInRange:  { color:C.textPrimary },
  daySelected: { color:C.white, fontFamily:'IRANYekan-Bold' },
  dayFriday:   { color:'#DC2626' },
  dayToday:    { color:C.green, fontFamily:'IRANYekan-Bold' },
  todayDot:    { position:'absolute', bottom:3, width:4, height:4, borderRadius:2, backgroundColor:C.green },

  shortcuts:   { flexDirection:'row', paddingHorizontal:10, paddingVertical:10, gap:6, borderTopWidth:1, borderTopColor:C.divider },
  shortcutBtn: { flex:1, backgroundColor:C.inputBg, borderRadius:8, paddingVertical:8, alignItems:'center', borderWidth:1, borderColor:C.divider },
  shortcutTxt: { color:C.accent, fontSize:11, fontFamily:'IRANYekan' },

  actions:    { flexDirection:'row', gap:10, padding:14, borderTopWidth:1, borderTopColor:C.divider },
  cancelBtn:  { flex:1, backgroundColor:C.inputBg, borderRadius:10, paddingVertical:13, alignItems:'center', borderWidth:1, borderColor:C.divider },
  cancelTxt:  { color:C.textSecond, fontSize:14, fontFamily:'IRANYekan' },
  confirmBtn: { flex:2, backgroundColor:C.accent, borderRadius:10, paddingVertical:13, alignItems:'center' },
  confirmTxt: { color:C.white, fontSize:14, fontFamily:'IRANYekan-Bold' },
});

// ─── DateRangePicker ───
export const drSt = StyleSheet.create({
  row: { flexDirection:'row', gap:8, marginBottom:10 },
  btn: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.divider,
  },
  btnActive:   { backgroundColor:C.accentSoft, borderColor:C.accent },
  icon:        { fontSize:18, marginBottom:3 },
  label:       { color:C.w50,   fontSize:11, fontFamily:'IRANYekan' },
  labelActive: { color:C.white, fontFamily:'IRANYekan-Bold' },

  display: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.divider,
    marginBottom: 14,
  },
  displayIcon:  { fontSize:14, marginLeft:8 },
  displayDates: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center' },
  displayTxt:   { color:C.textPrimary, fontSize:12, fontFamily:'IRANYekan' },
  arrow:        { color:C.accent, fontSize:13 },
  editTxt:      { color:C.accent, fontSize:11, fontFamily:'IRANYekan' },
});

// ─── VisitorPickerModal ───
export const vpSt = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.50)', justifyContent:'flex-end' },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '72%',
    paddingBottom: Platform.OS==='ios' ? 34 : 16,
    borderTopWidth: 1,
    borderColor: C.divider,
    shadowColor: '#000',
    shadowOffset: {width:0, height:-4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width:38, height:4, borderRadius:2,
    backgroundColor: C.divider,
    alignSelf: 'center',
    marginTop:10, marginBottom:6,
  },
  title: {
    color: C.textPrimary,
    fontSize: 15,
    fontFamily: 'IRANYekan-Bold',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  itemSelected:     { backgroundColor: C.accentSoft },
  itemLeft:         { flex:1 },
  itemName:         { color:C.textPrimary, fontSize:14, fontFamily:'IRANYekan', textAlign:'right' },
  itemNameSelected: { color:C.accent, fontFamily:'IRANYekan-Bold' },
  itemCode:         { color:C.textMuted, fontSize:11, fontFamily:'IRANYekan', textAlign:'right', marginTop:2 },
  check:            { color:C.green, fontSize:16, marginLeft:10 },
  closeBtn: {
    backgroundColor: C.inputBg,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.divider,
  },
  closeTxt: { color:C.textSecond, fontSize:14, fontFamily:'IRANYekan' },
});