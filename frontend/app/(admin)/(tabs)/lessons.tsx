import React, { useState } from 'react';
import {
  View, StyleSheet, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';

export default function AdminLessons() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: lessons = [], isLoading, refetch } = useQuery({
    queryKey: ['lessons', search, selectedCategory],
    queryFn: () => api.lessons(search, selectedCategory),
    staleTime: 1000 * 60,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['lessonCategories'],
    queryFn: () => api.lessonCategories(),
    staleTime: 1000 * 60 * 5,
  });

  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  const handleDelete = (lessonId: number, lessonTitle: string) => Alert.alert(
    'Delete Lesson',
    `Are you sure you want to delete "${lessonTitle}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteLesson(lessonId);
          refetch();
          Alert.alert('Success', 'Lesson deleted successfully');
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Failed to delete lesson');
        }
      }},
    ]
  );

  const openDocument = async (lesson: any) => {
    if (!lesson.fileUrl) {
      Alert.alert('No Document', 'This lesson does not have an attached document');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(lesson.fileUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return 'document-outline';
    if (fileType.includes('pdf')) return 'document-text';
    if (fileType.includes('image')) return 'image';
    if (fileType.includes('video')) return 'videocam';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document-text';
    return 'document-outline';
  };

  const renderItem = ({ item }: { item: any }) => {
    const hasFile = !!item.fileUrl;
    return (
      <View style={S.card}>
        <View style={S.cardHeader}>
          <LinearGradient colors={['#6D28D9', '#7C3AED']} style={S.cardIcon}>
            <Ionicons name="school" size={20} color="#fff" />
          </LinearGradient>
          <View style={S.cardHeaderText}>
            <Text style={S.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.category && (
              <View style={S.categoryBadge}>
                <Text style={S.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={S.cardDesc} numberOfLines={3}>{item.description}</Text>

        {hasFile && (
          <View style={S.fileInfo}>
            <Ionicons name={getFileIcon(item.fileType)} size={16} color="#64748B" />
            <Text style={S.fileName} numberOfLines={1}>{item.fileName || 'Attached file'}</Text>
            <Text style={S.fileSize}>{formatFileSize(item.fileSize)}</Text>
          </View>
        )}

        <View style={S.cardMeta}>
          <View style={S.metaItem}>
            <Ionicons name="person-outline" size={12} color="#94A3B8" />
            <Text style={S.metaText}>{item.creator?.fullName || 'Admin'}</Text>
          </View>
          <View style={S.metaItem}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={S.metaText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={S.cardActions}>
          {hasFile && (
            <TouchableOpacity style={S.actionBtn} onPress={() => openDocument(item)}>
              <Ionicons name="eye-outline" size={18} color="#7C3AED" />
              <Text style={S.actionText}>View</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[S.actionBtn, { backgroundColor: '#FEF3C7' }]} 
            onPress={() => router.push(`/(admin)/features/edit-lesson?id=${encodeURIComponent(item.id)}` as any)}
          >
            <Ionicons name="create-outline" size={18} color="#B45309" />
            <Text style={[S.actionText, { color: '#B45309' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[S.actionBtn, { backgroundColor: '#FEE2E2' }]} 
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[S.actionText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#6D28D9', '#7C3AED']} style={S.header}>
        <View style={S.headerLeft}>
          <Text style={S.headerTitle}>Training Content</Text>
          <Text style={S.headerSub}>{(lessons as any[]).length} lesson{(lessons as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => router.push('/(admin)/features/add-lesson' as any)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search & Filters */}
      <View style={S.searchSection}>
        <View style={S.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={S.searchInput}
            placeholder="Search lessons..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {(categories as any[]).length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.categoryScroll}
          >
            <TouchableOpacity
              style={[S.filterChip, !selectedCategory && S.filterChipActive]}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={[S.filterChipText, !selectedCategory && S.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {(categories as any[]).map((cat: string) => (
              <TouchableOpacity
                key={cat}
                style={[S.filterChip, selectedCategory === cat && S.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[S.filterChipText, selectedCategory === cat && S.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <View style={S.centered}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <FlatList
          data={lessons as any[]}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.empty}>
              <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={S.emptyIcon}>
                <Ionicons name="school-outline" size={44} color="#7C3AED" />
              </LinearGradient>
              <Text style={S.emptyTitle}>No lessons yet</Text>
              <Text style={S.emptyText}>Create your first training content</Text>
              <TouchableOpacity 
                style={S.emptyBtn}
                onPress={() => router.push('/(admin)/features/add-lesson' as any)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={S.emptyBtnText}>Add Lesson</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 18 },
  headerLeft: { flex: 1 },
  headerTitle: { ...typography.h2, color: '#fff', fontWeight: '800' },
  headerSub: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...shadows.md },

  searchSection: { backgroundColor: '#fff', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  categoryScroll: { flexDirection: 'row', gap: spacing.xs },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterChipText: { ...typography.captionBold, color: colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxxl },

  card: { backgroundColor: colors.background, borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.md, ...shadows.sm },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  cardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1, gap: 6 },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.md },
  categoryText: { ...typography.tiny, fontWeight: '600', color: '#7C3AED' },
  cardDesc: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },

  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#F8FAFC', padding: spacing.sm, borderRadius: borderRadius.md },
  fileName: { flex: 1, ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  fileSize: { ...typography.tiny, color: colors.textTertiary },

  cardMeta: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...typography.tiny, color: colors.textTertiary },

  cardActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  actionText: { ...typography.captionBold, color: '#7C3AED' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xxl },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xl },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: '#7C3AED', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  emptyBtnText: { ...typography.bodyBold, color: '#fff' },
});
