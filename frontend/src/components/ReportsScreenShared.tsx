import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Text, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const fmtTime = (d: Date) =>
  d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

// ── PDF builder ───────────────────────────────────────────────────────────────
function buildPdfHtml(reports: any[], stats: any, timeframe: string): string {
  const now = new Date();
  const rows = reports.map((r: any) => {
    const isF = r.type === 'followup';
    const patient = r.patient?.fullName || 'N/A';
    const by = r.createdByChw?.fullName || r.createdBy?.fullName || 'CHW';
    const village = r.createdByChw?.village || r.createdBy?.village || '';
    const date = fmtTime(new Date(r.createdAt));
    const sc = r.mentalStatus === 'Stable' ? '#2EB67D' : r.mentalStatus === 'Relapse' ? '#EF4444' : '#F59E0B';
    const content = isF
      ? `<span style="color:${sc};font-weight:700">${r.mentalStatus || 'N/A'}</span>${r.relapseSigns ? ' <span style="color:#EF4444">⚠ Relapse</span>' : ''}${r.notes ? `<br/><small style="color:#64748B">${r.notes}</small>` : ''}`
      : `<strong>${r.title || ''}</strong>${r.details ? `<br/><small style="color:#64748B">${r.details}</small>` : ''}`;
    const badge = isF
      ? `<span style="background:#EAF7F3;color:#2EB67D;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">Follow-up</span>`
      : `<span style="background:#DBEAFE;color:#3B82F6;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">Regular</span>`;
    return `<tr>
      <td><strong>${patient}</strong></td>
      <td>${badge}</td>
      <td>${content}</td>
      <td>${by}${village ? `<br/><small style="color:#94A3B8">${village}</small>` : ''}</td>
      <td style="white-space:nowrap;color:#64748B">${date}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1E293B}
    .cover{background:linear-gradient(135deg,#1a6b4a 0%,#2EB67D 100%);padding:40px;color:#fff}
    .brand{font-size:26px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:12px;opacity:.7;margin-top:3px}
    .cover-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px}
    .cover-stat{text-align:center}
    .cover-stat-val{font-size:32px;font-weight:800}
    .cover-stat-lbl{font-size:11px;opacity:.75;margin-top:2px}
    .body{padding:32px 40px}
    .meta-bar{background:#F8FAFC;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;margin-bottom:28px;border-left:4px solid #2EB67D}
    .meta-item{font-size:12px;color:#64748B}
    .meta-item strong{color:#1E293B}
    .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:10px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    thead tr{background:linear-gradient(90deg,#1a6b4a,#2EB67D)}
    th{color:#fff;padding:11px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    td{padding:10px 14px;border-bottom:1px solid #F1F5F9;vertical-align:top;line-height:1.6}
    tr:nth-child(even) td{background:#FAFBFC}
    .empty{text-align:center;color:#94A3B8;padding:40px;font-style:italic}
    .footer{margin-top:36px;padding-top:14px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;font-size:11px;color:#94A3B8}
  </style></head><body>
  <div class="cover">
    <div class="brand">MindCare Connect</div>
    <div class="brand-sub">Community Mental Health Follow-Up System</div>
    <div class="cover-row">
      <div class="cover-stat"><div class="cover-stat-val">${reports.length}</div><div class="cover-stat-lbl">Total Records</div></div>
      <div class="cover-stat"><div class="cover-stat-val">${stats?.appointments ?? 0}</div><div class="cover-stat-lbl">Appointments</div></div>
      <div class="cover-stat"><div class="cover-stat-val">${stats?.relapses ?? 0}</div><div class="cover-stat-lbl">Relapses</div></div>
      <div class="cover-stat"><div class="cover-stat-val">${timeframe}</div><div class="cover-stat-lbl">Period</div></div>
    </div>
  </div>
  <div class="body">
    <div class="meta-bar">
      <div class="meta-item">Generated: <strong>${now.toLocaleString()}</strong></div>
      <div class="meta-item">Stable: <strong>${stats?.riskDistribution?.stable ?? 0}%</strong></div>
      <div class="meta-item">At Risk: <strong>${stats?.riskDistribution?.atRisk ?? 0}%</strong></div>
      <div class="meta-item">Relapsed: <strong>${stats?.riskDistribution?.relapsed ?? 0}%</strong></div>
    </div>
    <div class="section-label">All Records (${reports.length})</div>
    <table>
      <thead><tr><th>Patient</th><th>Type</th><th>Content</th><th>Submitted By</th><th>Date</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="empty">No records found</td></tr>'}</tbody>
    </table>
    <div class="footer">
      <span>&copy; 2026 MindCare Connect</span>
      <span>Exported ${now.toLocaleDateString()}</span>
    </div>
  </div></body></html>`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function HeroStat({ label, value, icon, highlight }: { label: string; value: number; icon: any; highlight?: boolean }) {
  return (
    <View style={HS.wrap}>
      <Ionicons name={icon} size={18} color={highlight ? '#FCA5A5' : 'rgba(255,255,255,0.8)'} />
      <Text style={[HS.val, highlight && { color: '#FCA5A5' }]}>{value}</Text>
      <Text style={HS.lbl}>{label}</Text>
    </View>
  );
}
const HS = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  val: { fontSize: 24, fontWeight: '800', color: '#fff' },
  lbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});

function RiskCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon: any }) {
  return (
    <View style={[RC.card, { backgroundColor: bg }]}>
      <View style={[RC.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[RC.val, { color }]}>{value}%</Text>
      <Text style={RC.lbl}>{label}</Text>
      <View style={RC.track}>
        <View style={[RC.fill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const RC = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, padding: 14, gap: 6, alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  val: { fontSize: 22, fontWeight: '800' },
  lbl: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  track: { width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

function ReportRow({ report, t }: { report: any; t: any }) {
  const isF = report.type === 'followup';
  const accent = isF ? '#2EB67D' : '#3B82F6';
  const name = report.patient?.fullName || `#${report.patientId}`;
  const by = report.createdByChw?.fullName || report.createdBy?.fullName || 'CHW';
  const village = report.createdByChw?.village || report.createdBy?.village;
  const date = fmtTime(new Date(report.createdAt));
  const sc = report.mentalStatus === 'Stable' ? '#2EB67D' : report.mentalStatus === 'Relapse' ? '#EF4444' : '#F59E0B';

  return (
    <View style={RR.card}>
      <View style={[RR.bar, { backgroundColor: accent }]} />
      <View style={RR.body}>
        <View style={RR.row}>
          <LinearGradient colors={[accent + 'CC', accent]} style={RR.avatar}>
            <Text style={RR.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={RR.mid}>
            <Text style={RR.name} numberOfLines={1}>{name}</Text>
            {isF && report.mentalStatus
              ? <Text style={[RR.status, { color: sc }]}>{t(`status_values.${report.mentalStatus}`, { defaultValue: report.mentalStatus })}</Text>
              : <Text style={[RR.status, { color: accent }]} numberOfLines={1}>{report.title}</Text>
            }
          </View>
          <View style={RR.right}>
            <View style={[RR.badge, { backgroundColor: accent + '18' }]}>
              <Text style={[RR.badgeText, { color: accent }]}>{isF ? 'Follow-up' : 'Regular'}</Text>
            </View>
            <Text style={RR.date}>{date}</Text>
          </View>
        </View>
        {(report.details || report.notes) && (
          <Text style={RR.details} numberOfLines={2}>{report.details || report.notes}</Text>
        )}
        <View style={RR.footer}>
          <View style={[RR.dot, { backgroundColor: accent }]} />
          <Text style={RR.by}>{by}{village ? ` · ${village}` : ''}</Text>
        </View>
      </View>
    </View>
  );
}
const RR = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  bar: { width: 4 },
  body: { flex: 1, padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 15, fontWeight: '800', color: '#fff' },
  mid: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  status: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  date: { fontSize: 10, color: '#94A3B8' },
  details: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  by: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
});

// ── Main exported component ───────────────────────────────────────────────────
export default function ReportsScreenShared() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('Month');
  const [exporting, setExporting] = useState(false);

  const { data: reportData } = useQuery({
    queryKey: ['reports', timeframe, user?.id],
    queryFn: () => api.reports({ timeframe, mhpId: user?.id?.toString() }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: reportList = [], isLoading } = useQuery({
    queryKey: ['reportList', user?.id],
    queryFn: () => api.reports({ mhpId: user?.id?.toString() }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const chartData = reportData?.chartData || [
    { day: 'Mon', value: 0 }, { day: 'Tue', value: 0 }, { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 }, { day: 'Fri', value: 0 }, { day: 'Sat', value: 0 }, { day: 'Sun', value: 0 },
  ];
  const maxVal = Math.max(...chartData.map((d: any) => d.value), 1);
  const avgRate = chartData.length
    ? Math.round(chartData.reduce((a: number, c: any) => a + c.value, 0) / chartData.length)
    : 0;

  const handleExport = async () => {
    if (!reportList.length) { Alert.alert('No Data', 'No reports to export.'); return; }
    setExporting(true);
    try {
      const html = buildPdfHtml(reportList, reportData, timeframe);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Report', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Saved', uri);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Error');
    } finally {
      setExporting(false);
    }
  };

  const tfs = ['Week', 'Month', 'Year'];
  const dist = reportData?.riskDistribution;

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ── Hero ── */}
        <LinearGradient colors={['#1a6b4a', '#2EB67D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.hero}>
          <View style={S.heroTop}>
            <View>
              <Text style={S.heroTitle}>{t('reports.title')}</Text>
              <Text style={S.heroSub}>Analytics & insights</Text>
            </View>
            <TouchableOpacity
              style={[S.exportBtn, exporting && { opacity: 0.6 }]}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#2EB67D" />
                : <><Ionicons name="share-outline" size={15} color="#2EB67D" /><Text style={S.exportBtnText}>Export PDF</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* Timeframe pills */}
          <View style={S.tfRow}>
            {tfs.map(tf => (
              <TouchableOpacity
                key={tf}
                style={[S.tfPill, timeframe === tf && S.tfPillActive]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[S.tfText, timeframe === tf && S.tfTextActive]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats row */}
          <View style={S.heroStats}>
            <HeroStat label={t('reports.follow_ups')} value={reportData?.total ?? 0} icon="document-text" />
            <View style={S.heroStatDivider} />
            <HeroStat label="Appointments" value={reportData?.appointments ?? 0} icon="calendar" />
            <View style={S.heroStatDivider} />
            <HeroStat label={t('reports.relapses')} value={reportData?.relapses ?? 0} icon="warning" highlight />
          </View>
        </LinearGradient>

        {/* ── Weekly chart ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View>
              <Text style={S.sectionTitle}>{t('reports.appointment_compliance')}</Text>
              <Text style={S.sectionSub}>{t('reports.weekly_success')}</Text>
            </View>
            <View style={S.avgChip}>
              <Text style={S.avgChipText}>Avg {avgRate}%</Text>
            </View>
          </View>
          <View style={S.chart}>
            {chartData.map((d: any) => {
              const pct = Math.round((d.value / maxVal) * 100);
              const isHigh = d.value >= 70;
              return (
                <View key={d.day} style={S.barCol}>
                  {d.value > 0 && <Text style={S.barValText}>{d.value}%</Text>}
                  <View style={S.barTrack}>
                    <LinearGradient
                      colors={isHigh ? ['#4BD19B', '#2EB67D'] : pct > 0 ? ['#93C5FD', '#3B82F6'] : ['#F1F5F9', '#F1F5F9']}
                      style={[S.barFill, { height: `${Math.max(pct, 4)}%` as any }]}
                    />
                  </View>
                  <Text style={S.barDayText}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Risk distribution ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View>
              <Text style={S.sectionTitle}>{t('reports.relapse_distribution')}</Text>
              <Text style={S.sectionSub}>{dist?.total ?? 0} patients tracked</Text>
            </View>
          </View>
          <View style={S.riskCards}>
            <RiskCard label={t('reports.stable')}   value={dist?.stable ?? 0}   color="#2EB67D" bg="#EAF7F3" icon="checkmark-circle" />
            <RiskCard label={t('reports.at_risk')}  value={dist?.atRisk ?? 0}   color="#F59E0B" bg="#FEF3C7" icon="warning" />
            <RiskCard label={t('reports.relapsed')} value={dist?.relapsed ?? 0} color="#EF4444" bg="#FEE2E2" icon="alert-circle" />
          </View>
        </View>

        {/* ── Report list ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View>
              <Text style={S.sectionTitle}>{t('dashboard.submitted_reports')}</Text>
              <Text style={S.sectionSub}>{reportList.length} total records</Text>
            </View>
            {reportList.length > 0 && (
              <View style={S.countBadge}>
                <Text style={S.countText}>{reportList.length}</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View style={S.centered}>
              <ActivityIndicator size="large" color="#2EB67D" />
            </View>
          ) : reportList.length === 0 ? (
            <View style={S.emptyWrap}>
              <LinearGradient colors={['#EAF7F3', '#D1FAE5']} style={S.emptyIcon}>
                <Ionicons name="document-text-outline" size={36} color="#2EB67D" />
              </LinearGradient>
              <Text style={S.emptyText}>{t('dashboard.no_reports_yet')}</Text>
            </View>
          ) : (
            reportList.map((r: any) => (
              <ReportRow key={`${r.type}-${r.id}`} report={r} t={t} />
            ))
          )}
        </View>

      </ScrollView>
    </Container>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingBottom: 80 },
  hero: { paddingTop: 8, paddingBottom: 24, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: '#2EB67D' },
  tfRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tfPill: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  tfPillActive: { backgroundColor: '#fff' },
  tfText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tfTextActive: { color: '#2EB67D' },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 16,
  },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  section: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sectionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  avgChip: { backgroundColor: '#EAF7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  avgChipText: { fontSize: 12, fontWeight: '700', color: '#2EB67D' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValText: { fontSize: 9, color: '#94A3B8' },
  barTrack: { width: 16, height: 90, backgroundColor: '#F1F5F9', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barDayText: { fontSize: 10, color: '#94A3B8' },
  riskCards: { flexDirection: 'row', gap: 10 },
  countBadge: { backgroundColor: '#EAF7F3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countText: { fontSize: 12, fontWeight: '700', color: '#2EB67D' },
  centered: { alignItems: 'center', paddingVertical: 32 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8' },
});
