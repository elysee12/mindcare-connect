import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Text, Alert, Image } from 'react-native';
import { Container, Card, Avatar, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { formatPatientId } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function PatientsScreen() {
  const { role: paramRole, userId: paramUserId } = useLocalSearchParams<{ role: string; userId?: string }>();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'tracked' | 'untracked'>('all');

  // Use paramRole first, then authUser.role, then default to 'chw'
  const userRole = (paramRole || authUser?.role || 'chw').toLowerCase();
  const userId = paramUserId || authUser?.id;
  
  const canRegister = ['mhp', 'admin'].includes(userRole);

  const handleAddPatient = () => {
    if (userRole === 'admin') {
      router.push('/features/add-user');
      return;
    }
    if (canRegister) {
      router.push(`/features/register-patient?role=${userRole}`);
    }
  };

  const handleEditUser = (user: any) => {
    router.push(`/features/add-user?userId=${user.id}&edit=1`);
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        t('patients.delete_user_title'),
        t('patients.delete_user_confirm'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true }
      );
    });

    if (!confirmed) return;

    try {
      await api.deleteUser(userId);
      // refetch will update items
      refetch();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Unable to delete user.');
    }
  };

  const isAdmin = userRole === 'admin';

  const handleViewPatient = (item: any) => {
    router.push(`/(shared)/patient/${item.id}?role=${userRole}`);
  };

  const handleTrackPatient = (item: any) => {
    router.push(`/(chw)/features/track-patient?patientId=${item.id}`);
  };

  const { isLoading, refetch, data: allItems = [] } = useQuery({
    queryKey: ['patients', userRole, searchQuery, userId],
    queryFn: async () => {
      let patients = [];
      if (userRole === 'chw') {
        // CHW should only see their assigned patients
        patients = await api.patients(searchQuery, userRole, undefined, userId?.toString());
      } else {
        patients = await api.patients(searchQuery, userRole);
      }
      return (patients || []).map((p: any) => ({
        ...p,
        status: p.status || 'Stable',
      }));
    },
    staleTime: 1000 * 30,
    enabled: !!userRole && !!userId,
  });

  const filteredItems = React.useMemo(() => {
    if (userRole === 'admin') return allItems;
    if (filter === 'all') return allItems;
    if (filter === 'tracked') return allItems.filter((p: any) => p.tracked);
    if (filter === 'untracked') return allItems.filter((p: any) => !p.tracked);
    return allItems;
  }, [allItems, filter, userRole]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'stable': return colors.success;
      case 'risk': return colors.warning;
      case 'missed': return colors.error;
      default: return colors.primary;
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        t('patients.delete_patient_title'),
        t('patients.delete_patient_confirm'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('common.delete'), style: 'destructive', onPress: () => resolve(true) },
        ],
        { cancelable: true }
      );
    });

    if (!confirmed) return;

    try {
      await api.deletePatient(patientId);
      refetch();
      Alert.alert(t('common.success'), t('patients.delete_success'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Unable to delete patient.');
    }
  };

  const handleEditPatient = (patient: any) => {
    router.push(`/(mhp)/features/register-patient?patientId=${patient.id}&edit=1`);
  };

  const renderPatientItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.patientCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.patientInfo}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.patientImage} />
          ) : (
            <View style={styles.patientImagePlaceholder}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.patientName}>{item.fullName || item.full_name || t('patients.unknown')}</Text>
            <Text style={styles.patientDetail}>ID: {formatPatientId(item.id)}</Text>
            <Text style={styles.patientDetail}>{t('patients.status')}: {t(`status_values.${item.status}`, { defaultValue: item.status })}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleViewPatient(item)}>
            <Ionicons name="eye-outline" size={20} color={colors.primary} />
            <Text style={styles.actionText}>{t('patients.action_view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleTrackPatient(item)}>
            <Ionicons name="navigate-outline" size={20} color={colors.success} />
            <Text style={styles.actionText}>{t('patients.action_track')}</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
    </Card>
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={styles.patientCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.patientInfo}>
          <Avatar
            source={null}
            fallback={item.fullName?.substring(0, 1) || '?'}
            size="md"
            style={{ backgroundColor: colors.primaryTint }}
          />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={styles.patientName}>{item.fullName || item.email}</Text>
            <Text style={styles.patientDetail}>{(item.role || '').toUpperCase()} • {item.email}</Text>
            {item.phone ? <Text style={styles.patientDetail}>{t('patients.phone')}: {item.phone}</Text> : null}
            {item.workplace ? <Text style={styles.patientDetail}>{t('patients.workplace')}: {item.workplace}</Text> : null}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditUser(item)}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.errorTint }]} onPress={() => handleDeleteUser(item.id)}>
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{userRole === 'admin' ? t('dashboard.user_management') : t('patients.title')}</Text>
        {canRegister && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddPatient}>
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          placeholder={isAdmin ? t('patients.search_users_placeholder') : t('patients.search_patients_placeholder')}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {userRole !== 'admin' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>{t('patients.filter_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'tracked' && styles.filterBtnActive]} 
            onPress={() => setFilter('tracked')}
          >
            <Text style={[styles.filterBtnText, filter === 'tracked' && styles.filterBtnTextActive]}>{t('patients.filter_tracked')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterBtn, filter === 'untracked' && styles.filterBtnActive]} 
            onPress={() => setFilter('untracked')}
          >
            <Text style={[styles.filterBtnText, filter === 'untracked' && styles.filterBtnTextActive]}>{t('patients.filter_untracked')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={userRole === 'admin' ? renderUserItem : renderPatientItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>No {userRole === 'admin' ? t('dashboard.user_management') : t('patients.title')} found</Text>
          </View>
        }
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundAlt,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 50,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  patientCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  patientImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryTint,
  },
  patientImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 4,
  },
  patientName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  patientDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  actionText: {
    ...typography.captionBold,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
