import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('Month');

  const { data: reportData } = useQuery({
    queryKey: ['reports', timeframe, user?.id],
    queryFn: () => api.reports({ timeframe, mhpId: user?.id?.toString() }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const { data: reportList = [], isLoading: isReportListLoading } = useQuery({
    queryKey: ['reportList', user?.id],
    queryFn: () => api.reports({ mhpId: user?.id?.toString() }),
    staleTime: 1000 * 30,
    enabled: !!user?.id,
  });

  const stats = [
    { label: t('reports.follow_ups'), value: reportData?.total ?? 0, color: colors.primary },
    { label: t('dashboard.total_appointments'), value: reportData?.appointments ?? 0, color: colors.primaryDark },
    { label: t('reports.relapses'), value: reportData?.relapses ?? 0, color: colors.warning },
  ];

  const chartData = reportData?.chartData || [
    { day: 'Mon', value: 0 }, { day: 'Tue', value: 0 }, { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 }, { day: 'Fri', value: 0 }, { day: 'Sat', value: 0 }, { day: 'Sun', value: 0 },
  ];

  const avgSuccessRate = chartData.length > 0
    ? Math.round(chartData.reduce((acc: number, curr: any) => acc + curr.value, 0) / chartData.length)
    : 0;

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('reports.title')}</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter" size={20} color={colors.primary} />
            <Text style={styles.filterText}>{timeframe}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s) => (
            <Card key={s.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('reports.appointment_compliance')}</Text>
        <Card variant="elevated" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('reports.weekly_success')}</Text>
            <Text style={styles.chartSubtitle}>Avg. {avgSuccessRate}%</Text>
          </View>
          <View style={styles.barChart}>
            {chartData.map((d: any) => (
              <View key={d.day} style={styles.barContainer}>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { height: `${d.value}%` }]} />
                </View>
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('reports.relapse_distribution')}</Text>
        <Card variant="elevated" style={styles.chartCard}>
          <View style={styles.pieSimulation}>
            <View style={styles.pieStats}>
              <PieLegendItem label={t('reports.stable')} color={colors.success} value={`${reportData?.riskDistribution?.stable ?? 0}%`} />
              <PieLegendItem label={t('reports.at_risk')} color={colors.warning} value={`${reportData?.riskDistribution?.atRisk ?? 0}%`} />
              <PieLegendItem label={t('reports.relapsed')} color={colors.error} value={`${reportData?.riskDistribution?.relapsed ?? 0}%`} />
            </View>
            <View style={styles.pieCircle}>
              <View style={[styles.pieInner, { borderColor: colors.success, borderTopColor: colors.error, borderRightColor: colors.warning }]} />
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterValue}>{reportData?.riskDistribution?.total ?? 0}</Text>
                <Text style={styles.pieCenterLabel}>{t('reports.total')}</Text>
              </View>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('dashboard.submitted_reports')}</Text>
        {isReportListLoading ? (
          <Text style={styles.infoText}>{t('view_reports.loading')}</Text>
        ) : reportList?.length ? (
          reportList.map((report: any) => (
            <Card key={report.id} style={styles.reportCard} variant="outlined">
              <View style={styles.reportHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.reportTypeRow}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: report.type === 'followup' ? colors.successTint : colors.primaryTint }]}>
                      <Text style={[styles.typeBadgeText, { color: report.type === 'followup' ? colors.success : colors.primary }]}>
                        {report.type === 'followup' ? t('submit_report.followup_badge') : t('submit_report.regular_badge')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportMeta}>{new Date(report.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              {/* Patient name is real data — display as-is */}
              <Text style={styles.reportPatient}>{t('dashboard.patient_label')}: {report.patient?.fullName || `#${report.patientId}`}</Text>
              <Text style={styles.reportPatient}>{t('view_reports.by_label')}: {report.createdByChw?.fullName || t('status_values.CHW')}{report.createdByChw?.village ? ` (${report.createdByChw.village})` : ''}</Text>
              <Text style={styles.reportDetails} numberOfLines={2}>{report.details}</Text>
            </Card>
          ))
        ) : (
          <Text style={styles.infoText}>{t('dashboard.no_reports_yet')}</Text>
        )}

        <Button variant="outline" size="lg" leftIcon={<Ionicons name="download-outline" size={20} />} onPress={() => {}} style={styles.downloadBtn}>
          {t('reports.export_pdf')}
        </Button>
      </ScrollView>
    </Container>
  );
}

function PieLegendItem({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundAlt, flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryTint, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, gap: spacing.xs },
  filterText: { ...typography.captionBold, color: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: borderRadius.xl },
  statLabel: { ...typography.tiny, color: colors.textSecondary, marginBottom: spacing.xs },
  statValue: { ...typography.h3, fontWeight: '700' },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  chartCard: { padding: spacing.xl, borderRadius: borderRadius.xxl, marginBottom: spacing.xl },
  chartHeader: { marginBottom: spacing.xl },
  chartTitle: { ...typography.bodyBold, color: colors.text },
  chartSubtitle: { ...typography.tiny, color: colors.textSecondary },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barContainer: { alignItems: 'center', width: (width - 120) / 7 },
  barBackground: { width: 12, height: 120, backgroundColor: colors.borderLight, borderRadius: borderRadius.full, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full },
  barLabel: { ...typography.tiny, color: colors.textTertiary, marginTop: spacing.sm },
  pieSimulation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pieStats: { gap: spacing.md, flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  legendValue: { ...typography.captionBold, color: colors.text },
  pieCircle: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  pieInner: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 15, borderColor: 'transparent' },
  pieCenter: { alignItems: 'center' },
  pieCenterValue: { ...typography.h2, color: colors.text },
  pieCenterLabel: { ...typography.tiny, color: colors.textTertiary },
  reportCard: { padding: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.sm },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  reportTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  typeBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  typeBadgeText: { ...typography.tiny, fontWeight: '700' },
  reportTitle: { ...typography.bodyBold, color: colors.text },
  reportMeta: { ...typography.tiny, color: colors.textSecondary },
  reportPatient: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  reportDetails: { ...typography.caption, color: colors.text },
  infoText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  downloadBtn: { marginTop: spacing.md },
});
