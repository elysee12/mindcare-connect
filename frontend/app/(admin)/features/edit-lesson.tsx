import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Container, Input } from '@/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES = [
  { key: 'Mental Health Basics', icon: 'heart' as const },
  { key: 'Patient Care', icon: 'medical' as const },
  { key: 'Communication Skills', icon: 'chatbubbles' as const },
  { key: 'Crisis Management', icon: 'alert-circle' as const },
  { key: 'Documentation', icon: 'document-text' as const },
  { key: 'Medication', icon: 'medkit' as const },
  { key: 'Other', icon: 'albums' as const },
];

export default function EditLesson() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<any>(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.lessonById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setDescription(lesson.description || '');
      setCategory(lesson.category || '');
      setExistingFileUrl(lesson.fileUrl || '');
    }
  }, [lesson]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-powerpoint',
               'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 50MB');
          return;
        }
        setFile(asset);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async () => {
    if (!file) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name,
      } as any);

      const response = await fetch(
        (await api.users()).length ? 
        api.toString().replace('/api', '') + '/api/upload' : 
        'http://localhost:3000/api/upload',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a lesson title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a lesson description');
      return;
    }

    setLoading(true);
    try {
      let fileData = null;
      if (file) {
        fileData = await uploadFile();
        if (!fileData) {
          setLoading(false);
          return;
        }
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
      };

      if (fileData) {
        payload.fileUrl = fileData.url;
        payload.fileName = fileData.originalname;
        payload.fileType = fileData.mimetype;
        payload.fileSize = fileData.size;
      }

      await api.updateLesson(Number(id), payload);

      Alert.alert('Success', 'Lesson updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update lesson');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container safeArea edges={['top']} style={S.container}>
        <View style={S.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']} style={S.container}>
      <LinearGradient colors={['#6D28D9', '#7C3AED']} style={S.header}>
        <TouchableOpacity style={S.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>Edit Lesson</Text>
          <Text style={S.headerSub}>Update training content</Text>
        </View>
        <View style={S.headerIcon}>
          <Ionicons name="create" size={22} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={S.card}>
          <Text style={S.fieldLabel}>Lesson Title <Text style={S.required}>*</Text></Text>
          <Input
            placeholder="e.g., Understanding Depression"
            value={title}
            onChangeText={setTitle}
            style={S.input}
          />

          <Text style={[S.fieldLabel, { marginTop: 16 }]}>Description <Text style={S.required}>*</Text></Text>
          <Input
            placeholder="Provide a detailed description..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            style={[S.input, S.textArea]}
          />
        </View>

        {/* Category */}
        <Text style={S.sectionLabel}>Category (Optional)</Text>
        <View style={S.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[S.categoryCard, active && S.categoryCardActive]}
                onPress={() => setCategory(active ? '' : cat.key)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={22} 
                  color={active ? '#7C3AED' : '#94A3B8'} 
                />
                <Text style={[S.categoryLabel, active && S.categoryLabelActive]}>
                  {cat.key}
                </Text>
                {active && (
                  <View style={S.categoryCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#7C3AED" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Document */}
        <Text style={S.sectionLabel}>Document</Text>
        <View style={S.card}>
          {existingFileUrl && !file && (
            <View style={S.existingFile}>
              <Ionicons name="document" size={20} color="#7C3AED" />
              <Text style={S.existingFileText} numberOfLines={1}>
                {lesson?.fileName || 'Current document attached'}
              </Text>
              <TouchableOpacity onPress={() => setExistingFileUrl('')}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {!file && !existingFileUrl && (
            <TouchableOpacity style={S.uploadBox} onPress={pickDocument}>
              <Ionicons name="cloud-upload" size={32} color="#7C3AED" />
              <Text style={S.uploadText}>Upload New Document</Text>
            </TouchableOpacity>
          )}

          {file && (
            <View style={S.filePreview}>
              <Ionicons name="document" size={20} color="#7C3AED" />
              <Text style={S.filePreviewName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {!file && existingFileUrl && (
            <TouchableOpacity style={S.changeBtn} onPress={pickDocument}>
              <Ionicons name="swap-horizontal" size={16} color="#7C3AED" />
              <Text style={S.changeBtnText}>Change Document</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[S.submitBtn, (loading || uploading) && S.submitBtnDisabled]} 
          onPress={save}
          disabled={loading || uploading}
        >
          <LinearGradient colors={['#6D28D9', '#7C3AED']} style={S.submitBtnGrad}>
            {(loading || uploading) ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={S.submitBtnText}>
                  {uploading ? 'Uploading...' : 'Updating...'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={S.submitBtnText}>Update Lesson</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  required: { color: '#EF4444' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E293B' },
  textArea: { height: 120, textAlignVertical: 'top' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#E2E8F0', position: 'relative' },
  categoryCardActive: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  categoryLabelActive: { color: '#7C3AED' },
  categoryCheck: { position: 'absolute', top: 8, right: 8 },

  existingFile: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 },
  existingFileText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },

  uploadBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  uploadText: { fontSize: 14, color: '#64748B' },

  filePreview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 },
  filePreviewName: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },

  changeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EDE9FE', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  changeBtnText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },

  submitBtn: { marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
