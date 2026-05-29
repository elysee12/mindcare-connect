import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Text, TextInput, Alert, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type DateFilter = 'all' | 'day' | 'week' | 'month' | 'custom';
const { width } = Dimensions.get('window');

// ── helpers ───────────────────────────────────────────────────────────────────
const startOfDay   = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const endOfDay     = (d: Date) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };
const startOfWeek  = (d: Date) => { const r = new Date(d); r.setDate(r.getDate()-r.getDay()); return startOfDay(r); };
const endOfWeek    = (d: Date) => { const r = new Date(d); r.setDate(r.getDate()+(6-r.getDay())); return endOfDay(r); };
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth   = (d: Date) => new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59, 999);
const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month:'short', day:'2-digit', year:'numeric' });
const fmtTime = (d: Date) => d.toLocaleString(undefined, { month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });

// ── PDF builder ───────────────────────────────────────────────────────────────
function buildPdfHtml(reports: any[], type: string, filterLabel: string, dateRangeLabel: string): string {
  const rows = reports.map((item: any) => {
    const patient = item.patient?.fullName || 'N/A';
    const date    = fmtTime(new Date(item.createdAt));
    const by      = item.createdByChw?.fullName || item.createdBy?.fullName || 'CHW';
    const village = item.createdByChw?.village || item.createdBy?.village || '';
    if (type === 'followup') {
      const statusColor = item.mentalStatus === 'Stable' ? '#2EB67D' : item.mentalStatus === 'Relapse' ? '#EF4444' : '#F59E0B';
      return `<tr>
        <td><strong>${patient}</strong></td>
        <td><span style="color:${statusColor};font-weight:700">${item.mentalStatus||'N/A'}</span></td>
        <td>${item.notes||'—'}</td>
        <td>${item.relapseSigns?'<span style="color:#EF4444;font-weight:700">⚠ Yes</span>':'No'}</td>
        <td>${by}${village?`<br/><small style="color:#94A3B8">${village}</small>`:''}</td>
        <td style="white-space:nowrap">${date}</td></tr>`;
    }
    return `<tr>
      <td><strong>${patient}</strong></td>
      <td><strong>${item.title||''}</strong></td>
      <td style="color:#64748B">${item.details||'—'}</td>
      <td>${by}${village?`<br/><small style="color:#94A3B8">${village}</small>`:''}</td>
      <td style="white-space:nowrap">${date}</td></tr>`;
  }).join('');
  const headers = type==='followup'
    ? '<th>Patient</th><th>Status</th><th>Notes</th><th>Relapse</th><th>By</th><th>Date</th>'
    : '<th>Patient</th><th>Title</th><th>Details</th><th>By</th><th>Date</th>';
  const colspan = type==='followup' ? 6 : 5;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1E293B}
    .cover{background:linear-gradient(135deg,#1a6b4a 0%,#2EB67D 100%);padding:40px 40px 32px;color:#fff}
    .brand{font-size:28px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:13px;opacity:.75;margin-top:4px}
    .cover-meta{margin-top:24px;display:flex;gap:32px}
    .meta-item{font-size:12px;opacity:.85}
    .meta-item strong{display:block;font-size:18px;font-weight:700;opacity:1;margin-bottom:2px}
    .body{padding:32px 40px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:12px;margin-top:28px}
    .period-bar{background:#F1F5F9;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .period-label{font-size:13px;color:#64748B}
    .period-value{font-size:14px;font-weight:700;color:#1E293B}
    table{width:100%;border-collapse:collapse;font-size:12px}
    thead tr{background:#2EB67D}
    th{color:#fff;padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    td{padding:10px 14px;border-bottom:1px solid #F1F5F9;vertical-align:top;line-height:1.5}
    tr:nth-child(even) td{background:#FAFBFC}
    tr:hover td{background:#F0FDF9}
    .empty{text-align:center;color:#94A3B8;padding:40px;font-style:italic}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:11px;color:#94A3B8}
  </style></head><body>
  <div class="cover">
    <div class="brand">MindCare Connect</div>
    <div class="brand-sub">Community Mental Health Follow-Up System</div>
    <div class="cover-meta">
      <div class="meta-item"><strong>${reports.length}</strong>Records</div>
      <div class="meta-item"><strong>${filterLabel}</strong>Filter</div>
      <div class="meta-item"><strong>${type==='followup'?'Follow-up':'Regular'}</strong>Report Type</div>
    </div>
  </div>
  <div class="body">
    <div class="section-title">Report Period</div>
    <div class="period-bar">
      <span class="period-label">Date Range</span>
      <span class="period-value">${dateRangeLabel}</span>
    </div>
    <div class="section-title">Records (${reports.length})</div>
    <table><thead><tr>${headers}</tr></thead>
    <tbody>${rows||`<tr><td colspan="${colspan}" class="empty">No records found for this period</td></tr>`}</tbody></table>
    <div class="footer">
      <span>&copy; 2026 MindCare Connect. All rights reserved.</span>
      <span>Generated: ${new Date().toLocaleString()}</span>
    </div>
  </div></body></html>`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ViewReports() {
  const router = useRouter();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: 'regular' | 'followup' }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter]   = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState({ start: new Date(), end: new Date() });
  const [showPicker, setShowPicker]   = useState<'start' | 'end' | null>(null);
  const [exporting, setExporting]     = useState(false);

  const dateParams = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'day':    return { startDate: startOfDay(now).toISOString(),          endDate: endOfDay(now).toISOString() };
      case 'week':   return { startDate: startOfWeek(now).toISOString(),         endDate: endOfWeek(now).toISOString() };
      case 'month':  return { startDate: startOfMonth(now).toISOString(),        endDate: endOfMonth(now).toISOString() };
      case 'custom': return { startDate: startOfDay(customRange.start).toISOString(), endDate: endOfDay(customRange.end).toISOString() };
      default:       return {};
    }
  }, [dateFilter, customRange]);

  const dateRangeLabel = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'day':    return fmtDate(now);
      case 'week':   return `${fmtDate(startOfWeek(now))} – ${fmtDate(endOfWeek(now))}`;
      case 'month':  return now.toLocaleDateString(undefined, { month:'long', year:'numeric' });
      case 'custom': return `${fmtDate(customRange.start)} – ${fmtDate(customRange.end)}`;
      default:       return 'All time';
    }
  }, [dateFilter, customRange]);

  const filterLabel = useMemo(() => ({
    all: t('view_reports.filter_all'), day: t('view_reports.filter_today'),
    week: t('view_reports.filter_week'), month: t('view_reports.filter_month'),
    custom: t('view_reports.filter_custom'),
  }[dateFilter]), [dateFilter, t]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', searchQuery, dateParams, type],
    queryFn: () => type === 'followup'
      ? api.globalFollowups({ search: searchQuery || undefined, ...dateParams })
      : api.reports({ search: searchQuery || undefined, ...dateParams }),
  });

  const handleExport = async () => {
    if (!reports.length) { Alert.alert('No Data', 'No reports to export for the selected filter.'); return; }
    setExporting(true);
    try {
      const html = buildPdfHtml(reports, type || 'regular', filterLabel || 'All', dateRangeLabel);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType:'application/pdf', dialogTitle:'Export MindCare Report', UTI:'com.adobe.pdf' });
      else Alert.alert('Saved', `PDF saved to:\n${uri}`);
    } catch (err: any) { Alert.alert('Export Failed', err?.message || 'Could not generate PDF.'); }
    finally { setExporting(false); }
  };

  const filters: { label: string; value: DateFilter; icon: any }[] = [
    { label: t('view_reports.filter_all'),    value: 'all',    icon: 'apps-outline' },
    { label: t('view_reports.filter_today'),  value: 'day',    icon: 'today-outline' },
    { label: t('view_reports.filter_week'),   value: 'week',   icon: 'calendar-outline' },
    { label: t('view_reports.filter_month'),  value: 'month',  icon: 'calendar-number-outline' },
    { label: t('view_reports.filter_custom'), value: 'custom', icon: 'options-outline' },
  ];

  const isFollowupScreen = type === 'followup';
  const accentGrad: [string, string] = isFollowupScreen ? ['#1a6b4a','#2EB67D'] : ['#1a6b4a','#2EB67D'];

  return (
    <Container safeArea edges={['top']} style={styles.container}>

      {/* ── Gradient Header ── */}
      <LinearGradient colors={accentGrad} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <View style={styles.backCircle}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isFollowupScreen ? t('view_reports.followup_title') : t('view_reports.regular_title')}
            </Text>
            <Text style={styles.headerSub}>
              {reports.length} {reports.length === 1 ? 'record' : 'records'} · {dateRangeLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
            onPress={handleExport} disabled={exporting}
          >
            {exporting
              ? <ActivityIndicator size="small" color="#2EB67D" />
              : <><Ionicons name="share-outline" size={16} color="#2EB67D" /><Text style={styles.exportBtnText}>PDF</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Search bar inside header */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder={isFollowupScreen ? t('view_reports.search_followup') : t('view_reports.search_regular')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Filter chips ── */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.chip, dateFilter === f.value && styles.chipActive]}
              onPress={() => setDateFilter(f.value)}
            >
              <Ionicons name={f.icon} size={12} color={dateFilter === f.value ? '#fff' : colors.textSecondary} />
              <Text style={[styles.chipText, dateFilter === f.value && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Custom date pickers ── */}
      {dateFilter === 'custom' && (
        <View style={styles.customRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <View>
              <Text style={styles.dateBtnLabel}>{t('view_reports.from')}</Text>
              <Text style={styles.dateBtnValue}>{fmtDate(customRange.start)}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.dateSep}><Ionicons name="arrow-forward" size={14} color={colors.textTertiary} /></View>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <View>
              <Text style={styles.dateBtnLabel}>{t('view_reports.to')}</Text>
              <Text style={styles.dateBtnValue}>{fmtDate(customRange.end)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.infoText}>{t('view_reports.loading')}</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.centered}>
            <LinearGradient colors={['#EAF7F3','#D1FAE5']} style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={44} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>{t('view_reports.no_reports')}</Text>
            <Text style={styles.emptySubtitle}>
              {dateFilter !== 'all' ? `No reports found for ${filterLabel?.toLowerCase()}` : 'No reports submitted yet'}
            </Text>
          </View>
        ) : (
          reports.map((item: any, idx: number) => (
            <ReportCard key={`${item.id}-${idx}`} item={item} type={type || 'regular'} t={t} />
          ))
        )}
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? customRange.start : customRange.end}
          mode="date" display="default"
          onChange={(_, date) => {
            setShowPicker(null);
            if (date && showPicker) setCustomRange(prev => ({ ...prev, [showPicker]: date }));
          }}
        />
      )}
    </Container>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ item, type, t }: { item: any; type: string; t: any }) {
  const isFollowup = type === 'followup' || item.type === 'followup';
  const patientName = item.patient?.fullName || 'Unknown Patient';
  const submittedBy = item.createdByChw?.fullName || item.createdBy?.fullName || 'CHW';
  const village     = item.createdByChw?.village  || item.createdBy?.village;
  const date        = fmtTime(new Date(item.createdAt));
  const accent      = isFollowup ? colors.success : colors.primary;

  const statusMeta = item.mentalStatus === 'Stable'  ? { color: '#2EB67D', bg: '#EAF7F3', icon: 'checkmark-circle' as const }
                   : item.mentalStatus === 'Relapse' ? { color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle' as const }
                   : item.mentalStatus               ? { color: '#F59E0B', bg: '#FEF3C7', icon: 'warning' as const }
                   : null;

  return (
    <View style={card.wrap}>
      {/* left accent bar */}
      <View style={[card.bar, { backgroundColor: accent }]} />

      <View style={card.body}>
        {/* top row */}
        <View style={card.topRow}>
          <View style={card.avatarWrap}>
            <LinearGradient colors={[accent + 'CC', accent]} style={card.avatar}>
              <Text style={card.avatarLetter}>{patientName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View style={card.topMid}>
            <Text style={card.patientName} numberOfLines={1}>{patientName}</Text>
            <Text style={card.patientId}>ID: {item.patient?.id || 'N/A'}</Text>
          </View>
          <View style={card.topRight}>
            <View style={[card.typePill, { backgroundColor: accent + '18' }]}>
              <Text style={[card.typePillText, { color: accent }]}>
                {isFollowup ? t('submit_report.followup_badge') : t('submit_report.regular_badge')}
              </Text>
            </View>
            <Text style={card.dateText}>{date}</Text>
          </View>
        </View>

        {/* divider */}
        <View style={card.divider} />

        {/* content */}
        {isFollowup ? (
          <View style={card.content}>
            {statusMeta && (
              <View style={[card.statusPill, { backgroundColor: statusMeta.bg }]}>
                <Ionicons name={statusMeta.icon} size={13} color={statusMeta.color} />
                <Text style={[card.statusText, { color: statusMeta.color }]}>
                  {t(`status_values.${item.mentalStatus}`, { defaultValue: item.mentalStatus })}
                </Text>
                {item.relapseSigns && (
                  <View style={card.relapsePill}>
                    <Ionicons name="warning" size={10} color="#EF4444" />
                    <Text style={card.relapseText}>{t('view_reports.relapse_signs')}</Text>
                  </View>
                )}
              </View>
            )}
            {item.notes ? <Text style={card.notes} numberOfLines={3}>{item.notes}</Text> : null}
          </View>
        ) : (
          <View style={card.content}>
            <Text style={[card.reportTitle, { color: accent }]} numberOfLines={1}>{item.title}</Text>
            {item.details ? <Text style={card.notes} numberOfLines={3}>{item.details}</Text> : null}
          </View>
        )}

        {/* footer */}
        <View style={card.footer}>
          <View style={card.footerLeft}>
            <View style={[card.byDot, { backgroundColor: accent }]} />
            <Text style={card.byText}>{submittedBy}{village ? ` · ${village}` : ''}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { flexDirection:'row', backgroundColor:'#fff', borderRadius:16, marginBottom:12, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.08, shadowRadius:8, elevation:3 },
  bar: { width:4 },
  body: { flex:1, padding:14, gap:10 },
  topRow: { flexDirection:'row', alignItems:'center', gap:10 },
  avatarWrap: {},
  avatar: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  avatarLetter: { fontSize:16, fontWeight:'800', color:'#fff' },
  topMid: { flex:1 },
  patientName: { fontSize:15, fontWeight:'700', color:'#1E293B' },
  patientId: { fontSize:11, color:'#94A3B8', marginTop:1 },
  topRight: { alignItems:'flex-end', gap:4 },
  typePill: { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  typePillText: { fontSize:10, fontWeight:'700' },
  dateText: { fontSize:10, color:'#94A3B8' },
  divider: { height:1, backgroundColor:'#F1F5F9' },
  content: { gap:6 },
  statusPill: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:6, borderRadius:10, alignSelf:'flex-start' },
  statusText: { fontSize:13, fontWeight:'700' },
  relapsePill: { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'#FEE2E2', paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginLeft:4 },
  relapseText: { fontSize:10, fontWeight:'700', color:'#EF4444' },
  reportTitle: { fontSize:14, fontWeight:'700' },
  notes: { fontSize:13, color:'#64748B', lineHeight:19 },
  footer: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  footerLeft: { flexDirection:'row', alignItems:'center', gap:6 },
  byDot: { width:6, height:6, borderRadius:3 },
  byText: { fontSize:11, color:'#94A3B8', fontStyle:'italic' },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F1F5F9' },

  // Header
  header: { paddingBottom:16 },
  headerTop: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:8, paddingBottom:12, gap:10 },
  backCircle: { width:34, height:34, borderRadius:17, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  backBtn: {},
  headerCenter: { flex:1 },
  headerTitle: { fontSize:18, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  headerSub: { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 },
  exportBtn: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#fff', paddingHorizontal:12, paddingVertical:7, borderRadius:20 },
  exportBtnText: { fontSize:12, fontWeight:'700', color:'#2EB67D' },

  // Search
  searchWrap: { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:16,
    backgroundColor:'rgba(255,255,255,0.18)', borderRadius:12, paddingHorizontal:12, height:40,
    borderWidth:1, borderColor:'rgba(255,255,255,0.25)' },
  searchInput: { flex:1, fontSize:14, color:'#fff' },

  // Filter bar
  filterBar: { backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  filterScroll: { paddingHorizontal:16, paddingVertical:10, gap:8 },
  chip: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6,
    borderRadius:20, backgroundColor:'#F8FAFC', borderWidth:1, borderColor:'#E2E8F0' },
  chipActive: { backgroundColor:'#2EB67D', borderColor:'#2EB67D' },
  chipText: { fontSize:12, fontWeight:'600', color:'#64748B' },
  chipTextActive: { color:'#fff' },

  // Custom date
  customRow: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:10,
    backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  dateBtn: { flex:1, flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#F8FAFC',
    borderRadius:10, padding:10, borderWidth:1, borderColor:'#2EB67D40' },
  dateBtnLabel: { fontSize:10, color:'#94A3B8' },
  dateBtnValue: { fontSize:13, fontWeight:'600', color:'#1E293B' },
  dateSep: { alignItems:'center' },

  // List
  list: { flex:1 },
  listContent: { padding:16, paddingBottom:80, gap:0 },

  // Empty / loading
  centered: { alignItems:'center', paddingVertical:60, gap:16 },
  emptyIconWrap: { width:88, height:88, borderRadius:44, justifyContent:'center', alignItems:'center' },
  emptyTitle: { fontSize:17, fontWeight:'700', color:'#1E293B' },
  emptySubtitle: { fontSize:13, color:'#94A3B8', textAlign:'center', paddingHorizontal:32 },
  infoText: { fontSize:13, color:'#94A3B8' },
});
