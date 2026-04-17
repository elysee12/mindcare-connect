import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

type User = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  workplace?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
};

export default function EditUser() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [status, setStatus] = useState('');

  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => api.userById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || '');
      setWorkplace(user.workplace || '');
      setDistrict(user.district || '');
      setSector(user.sector || '');
      setCell(user.cell || '');
      setVillage(user.village || '');
    }
  }, [user]);

  const save = async () => {
    if (!id) return;

    if (!fullName || !email || !phone || !role) {
      setStatus('Please fill in all required fields.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    if (role === 'MHP' && !workplace) {
      setStatus('Please enter workplace for MHP.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    if (role === 'CHW' && (!district || !sector || !cell || !village)) {
      setStatus('Please fill in all CHW address fields.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    try {
      await api.updateUser(id, {
        fullName,
        email,
        phone,
        role,
        workplace: role === 'MHP' ? workplace : undefined,
        district: role === 'CHW' ? district : undefined,
        sector: role === 'CHW' ? sector : undefined,
        cell: role === 'CHW' ? cell : undefined,
        village: role === 'CHW' ? village : undefined,
      });

      Alert.alert('Saved', 'User details updated successfully.');
      router.back();
    } catch (error: any) {
      setStatus(error?.message || 'Unable to update user.');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit User</Text>
        <Text style={styles.subtitle}>Update this user account</Text>

        <Card style={styles.card} variant="elevated">
          {isLoading ? (
            <Text style={styles.loadingText}>Loading user information...</Text>
          ) : isError ? (
            <Text style={styles.errorText}>Unable to load user information.</Text>
          ) : (
            <>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <Input value={fullName} onChangeText={setFullName} placeholder="Full Name" />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Input value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Role</Text>
                <Input value={role} onChangeText={setRole} placeholder="Role (e.g. MHP or CHW)" autoCapitalize="characters" />
              </View>
              {role === 'MHP' && (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>Workplace</Text>
                  <Input value={workplace} onChangeText={setWorkplace} placeholder="Hospital or Health Center" />
                </View>
              )}
              {role === 'CHW' && (
                <>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>District</Text>
                    <Input value={district} onChangeText={setDistrict} placeholder="District" />
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Sector</Text>
                    <Input value={sector} onChangeText={setSector} placeholder="Sector" />
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Cell</Text>
                    <Input value={cell} onChangeText={setCell} placeholder="Cell" />
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Village</Text>
                    <Input value={village} onChangeText={setVillage} placeholder="Village" />
                  </View>
                </>
              )}
              <View style={styles.buttonWrapper}>
                <Button variant="primary" fullWidth onPress={save}>
                  Save Changes
                </Button>
              </View>
            </>
          )}
        </Card>

        {status ? <Text style={styles.toast}>{status}</Text> : null}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.backgroundSecondary, flex: 1 },
  headbar: { padding: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { ...typography.body, color: colors.primary, marginLeft: spacing.xs },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h2, color: colors.primaryDark, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.sm },
  loadingText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  errorText: { ...typography.bodyBold, color: colors.error, textAlign: 'center' },
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  buttonWrapper: { marginTop: spacing.md },
  toast: { marginTop: spacing.sm, ...typography.captionBold, color: colors.error },
});
