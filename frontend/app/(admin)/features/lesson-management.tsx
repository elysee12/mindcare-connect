import React, { useState } from 'react';
import {
  View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView
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

export default function LessonManagement() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const { data: lessons = [], isLoading, refetch } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => api.lessons(),
    staleTime: 1000 * 60,
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
          <View style={S.cardIconWrap}>
            <Ionicons name="school" size={20} color="#7C3AED" />
          </View>
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
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Training Content</Text>
          <Text style={S.headerSub}>{(lessons as any[]).length} lesson{(lessons as any[]).length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={() => router.push('/(admin)/features/add-lesson' as any)}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </LinearGradient>

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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  cardHeaderText: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#DDD6FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
  cardDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  fileName: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },
  fileSize: { fontSize: 11, color: '#94A3B8' },
  
  cardMeta: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#94A3B8' },
  
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EDE9FE', paddingVertical: 10, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
