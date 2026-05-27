import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

type DateFilter = 'day' | 'week' | 'month' | 'all' | 'custom';

const formatDate = (date: Date, fmt: string) => {
  if (fmt === 'MMM dd, yyyy') return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  if (fmt === 'MMM dd, HH:mm') return date.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  return date.toLocaleDateString();
};
const startOfDay = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const endOfDay = (d: Date) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };
const startOfWeek = (d: Date) => { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return startOfDay(r); };
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export default function ViewReports() {
  const router = useRouter();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: 'regular' | 'followup' }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({ start: new Date(), end: new Date() });
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const dateParams = useMemo(() => {
    let startDate: Date | undefined;
    let endDate: Date | undefined = endOfDay(new Date());
    switch (dateFilter) {
      case 'day': startDate = startOfDay(new Date()); break;
      case 'week': startDate = startOfWeek(new Date()); break;
      case 'month': startDate = startOfMonth(new Date()); break;
      case 'custom': startDate = startOfDay(customRange.start); endDate = endOfDay(customRange.end); break;
      default: startDate = undefined; endDate = undefined;
    }
    return { startDate: startDate?.toISOString(), endDate: endDate?.toISOString() };
  }, [dateFilter, customRange]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', searchQuery, dateParams, type],
    queryFn: () => type === 'followup'
      ? api.globalFollowups({ search: searchQuery, ...dateParams })
      : api.reports({ search: searchQuery, ...dateParams }),
  });

  const filterBtn = (label: string, value: DateFilter) => (
    <TouchableOpacity key={value} style={[styles.filterBtn, dateFilter === value && styles.filterBtnActive]} onPress={() => setDateFilter(value)}>
      <Text style={[styles.filterText, dateFilter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'followup' ? t('view_reports.followup_title') : t('view_reports.regular_title')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={type === 'followup' ? t('view_reports.search_followup') : t('view_reports.search_regular')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {filterBtn(t('view_reports.filter_all'), 'all')}
          {filterBtn(t('view_reports.filter_today'), 'day')}
          {filterBtn(t('view_reports.filter_week'), 'week')}
          {filterBtn(t('view_reports.filter_month'), 'month')}
          {filterBtn(t('view_reports.filter_custom'), 'custom')}
        </ScrollView>
      </View>

      {dateFilter === 'custom' && (
        <View style={styles.customRangeContainer}>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPicker('start')}>
            <Text style={styles.dateSelectorLabel}>{t('view_reports.from')}:</Text>
            <Text style={styles.dateSelectorValue}>{formatDate(customRange.start, 'MMM dd, yyyy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPicker('end')}>
            <Text style={styles.dateSelectorLabel}>{t('view_reports.to')}:</Text>
            <Text style={styles.dateSelectorValue}>{formatDate(customRange.end, 'MMM dd, yyyy')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <Text style={styles.infoText}>{t('view_reports.loading')}</Text>
        ) : !reports?.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('view_reports.no_reports')}</Text>
          </View>
        ) : (
          reports.map((item: any) => (
            <Card key={item.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.patientInfo}>
                  {/* Patient name is user data — display as-is, never translate */}
                  <Text style={styles.patientName}>{item.patient?.fullName || t('view_reports.unknown_patient')}</Text>
                  <Text style={styles.patientId}>ID: {item.patient?.id || t('common.na')}</Text>
                </View>
                <Text style={styles.reportDate}>{formatDate(new Date(item.createdAt), 'MMM dd, HH:mm')}</Text>
              </View>

              {type === 'followup' ? (
                <View style={styles.reportDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('view_reports.status_label')}:</Text>
                    <Text style={styles.detailValue}>{t(`status_values.${item.mentalStatus}`, { defaultValue: item.mentalStatus })}</Text>
                  </View>
                  <Text style={styles.reportNotes} numberOfLines={2}>{item.notes}</Text>
                  {item.relapseSigns && (
                    <View style={styles.alertBadge}>
                      <Ionicons name="warning" size={14} color={colors.error} />
                      <Text style={styles.alertText}>{t('view_reports.relapse_signs')}</Text>
                    </View>
                  )}
                  <View style={styles.reportFooter}>
                    <Text style={styles.submittedBy}>
                      {t('view_reports.by_label')}: {item.createdBy?.fullName || t('status_values.CHW')}{item.createdBy?.village ? ` (${item.createdBy.village})` : ''}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle}>{item.title}</Text>
                  <Text style={styles.reportDesc} numberOfLines={2}>{item.details}</Text>
                  <View style={styles.reportFooter}>
                    <Text style={styles.submittedBy}>
                      {t('view_reports.by_label')}: {item.createdByChw?.fullName || t('status_values.CHW')}{item.createdByChw?.village ? ` (${item.createdByChw.village})` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? customRange.start : customRange.end}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) setCustomRange(prev => ({ ...prev, [showPicker]: date }));
          }}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.h2, color: colors.text },
  searchContainer: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 48, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  filtersWrapper: { marginBottom: spacing.sm },
  filtersScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.captionBold, color: colors.textSecondary },
  filterTextActive: { color: colors.background },
  customRangeContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.md },
  dateSelector: { flex: 1, backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.md, padding: spacing.sm },
  dateSelectorLabel: { ...typography.tiny, color: colors.textTertiary },
  dateSelectorValue: { ...typography.captionBold, color: colors.text },
  content: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  reportCard: { marginBottom: spacing.md, padding: spacing.md },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  patientInfo: { flex: 1 },
  patientName: { ...typography.bodyBold, color: colors.text },
  patientId: { ...typography.tiny, color: colors.textTertiary },
  reportDate: { ...typography.tiny, color: colors.textTertiary },
  reportDetails: { gap: spacing.xs },
  reportTitle: { ...typography.bodyBold, color: colors.primary },
  reportDesc: { ...typography.caption, color: colors.textSecondary },
  reportFooter: { marginTop: spacing.xs },
  submittedBy: { ...typography.tiny, color: colors.textTertiary, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  detailLabel: { ...typography.captionBold, color: colors.textSecondary },
  detailValue: { ...typography.caption, color: colors.text },
  reportNotes: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic', backgroundColor: colors.backgroundSecondary, padding: spacing.xs, borderRadius: borderRadius.sm },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorTint, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, alignSelf: 'flex-start', gap: 4 },
  alertText: { ...typography.tinyBold, color: colors.error },
  infoText: { textAlign: 'center', ...typography.body, color: colors.textTertiary, marginTop: spacing.xl },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxxxl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textTertiary },
});
