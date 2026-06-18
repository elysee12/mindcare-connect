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

export default function Lessons() {
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

  const openDocument = async (lesson: any) => {
    if (!lesson.fileUrl) {
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(lesson.fileUrl);
    } catch (error) {
      console.error('Failed to open document');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
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
      <TouchableOpacity 
        style={S.card}
        onPress={() => hasFile ? openDocument(item) : null}
        activeOpacity={hasFile ? 0.7 : 1}
      >
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
            <Ionicons name={getFileIcon(item.fileType)} size={18} color="#7C3AED" />
            <Text style={S.fileName} numberOfLines={1}>{item.fileName || 'Document'}</Text>
            {item.fileSize && (
              <Text style={S.fileSize}>{formatFileSize(item.fileSize)}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </View>
        )}

        <View style={S.cardFooter}>
          <View style={S.metaItem}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={S.metaText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {hasFile && (
            <View style={S.viewBtn}>
              <Ionicons name="eye" size={14} color="#7C3AED" />
              <Text style={S.viewBtnText}>View</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Container safeArea edges={['top']} style={S.container}>
      {/* Header */}
      <LinearGradient colors={['#6D28D9', '#7C3AED']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Training Content</Text>
          <Text style={S.headerSub}>
            {(lessons as any[]).length} lesson{(lessons as any[]).length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
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

        {/* Category Filter */}
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
              <Text style={S.emptyTitle}>No lessons found</Text>
              <Text style={S.emptyText}>
                {search || selectedCategory 
                  ? 'Try adjusting your filters' 
                  : 'New training content will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  searchSection: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },

  categoryScroll: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
  cardDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },

  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 },
  fileName: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },
  fileSize: { fontSize: 11, color: '#94A3B8' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: '#7C3AED' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
