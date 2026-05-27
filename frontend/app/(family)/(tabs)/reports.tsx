import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState('Month');

  const { data: reportData } = useQuery({
    queryKey: ['reports', timeframe],
    queryFn: () => api.reports(timeframe),
    staleTime: 1000 * 30,
  });

  const stats = [
    { label: t('reports.follow_ups'), value: reportData?.total ?? 0, color: colors.primary },
    { label: t('reports.missed'), value: reportData?.missed ?? 0, color: colors.error },
    { label: t('reports.relapses'), value: reportData?.relapses ?? 0, color: colors.warning },
  ];

  const chartData = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 72 },
    { day: 'Wed', value: 60 },
    { day: 'Thu', value: 85 },
    { day: 'Fri', value: 40 },
    { day: 'Sat', value: 30 },
    { day: 'Sun', value: 25 },
  ];

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
            <Text style={styles.chartSubtitle}>Avg. 68% this week</Text>
          </View>
          <View style={styles.barChart}>
            {chartData.map((d) => (
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
              <PieLegendItem label={t('reports.stable')} color={colors.success} value="75%" />
              <PieLegendItem label={t('reports.at_risk')} color={colors.warning} value="15%" />
              <PieLegendItem label={t('reports.relapsed')} color={colors.error} value="10%" />
            </View>
            <View style={styles.pieCircle}>
              <View style={[styles.pieInner, { borderColor: colors.success, borderTopColor: colors.error, borderRightColor: colors.warning }]} />
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterValue}>120</Text>
                <Text style={styles.pieCenterLabel}>{t('reports.total')}</Text>
              </View>
            </View>
          </View>
        </Card>

        <Button
          variant="outline"
          size="lg"
          leftIcon={<Ionicons name="download-outline" size={20} />}
          onPress={() => {}}
          style={styles.downloadBtn}
        >
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
  container: {
    backgroundColor: colors.backgroundAlt,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  filterText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  chartCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.xl,
  },
  chartHeader: {
    marginBottom: spacing.xl,
  },
  chartTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  chartSubtitle: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    width: (width - 120) / 7,
  },
  barBackground: {
    width: 12,
    height: 120,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  barLabel: {
    ...typography.tiny,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  pieSimulation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pieStats: {
    gap: spacing.md,
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  pieCircle: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 15,
    borderColor: 'transparent',
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterValue: {
    ...typography.h2,
    color: colors.text,
  },
  pieCenterLabel: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  downloadBtn: {
    marginTop: spacing.md,
  },
});
