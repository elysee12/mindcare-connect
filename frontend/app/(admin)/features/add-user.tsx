import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Container, Card, Input, Button } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function AddUser() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showCellDropdown, setShowCellDropdown] = useState(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'warning'>('success');

  // Options
  const roles = ['MHP', 'CHW'];
  const districts = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
  const sectors = ['Remera', 'Kacyiru', 'Kimisagara'];
  const cells = ['Cell A', 'Cell B', 'Cell C'];
  const villages = ['Village 1', 'Village 2', 'Village 3'];

  const save = async () => {
    if (!selectedRole || !fullName || !email || !phone) {
      Alert.alert('Missing Required Fields', 'Please fill all required fields (Role, Full Name, Email, Phone)');
      return;
    }
    if (selectedRole === 'MHP' && !workplace) {
      Alert.alert('Missing Workplace', 'Please enter workplace (Hospital/Health Center) for MHP');
      return;
    }
    if (selectedRole === 'CHW' && (!district || !sector || !cell || !village)) {
      Alert.alert('Missing Address Fields', 'Please fill all address fields (District, Sector, Cell, Village) for CHW');
      return;
    }
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      Alert.alert('Invalid Full Name', 'Full Name must include at least first and last name');
      return;
    }
    // Use the last part as the last name (handles names with multiple parts)
    const lastName = nameParts[nameParts.length - 1];
    const password = lastName + '@123';
    
    if (password.length < 8) {
      Alert.alert('Password Error', 'Generated password is too short. Please use a longer last name.');
      return;
    }

    try {
      await api.createUser({
        fullName,
        email,
        password,
        role: selectedRole,
        phone,
        workplace: selectedRole === 'MHP' ? workplace : undefined,
        district: selectedRole === 'CHW' ? district : undefined,
        sector: selectedRole === 'CHW' ? sector : undefined,
        cell: selectedRole === 'CHW' ? cell : undefined,
        village: selectedRole === 'CHW' ? village : undefined,
      });

      // Success - show alert with password
      Alert.alert(
        'User Created Successfully',
        `Generated password: ${password}\n\nUser ${fullName} has been added successfully. A welcome email has been sent.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear fields and go back
              setSelectedRole('');
              setFullName('');
              setEmail('');
              setPhone('');
              setWorkplace('');
              setDistrict('');
              setSector('');
              setCell('');
              setVillage('');
              setStatus('');
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Unable to create user';
      
      // Check for specific error types
      if (errorMessage.includes('already exists') || errorMessage.includes('Email')) {
        Alert.alert(
          'Email Already Exists',
          'This email address is already registered in the system. Please use a different email address.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Cannot reach backend')) {
        Alert.alert(
          'Connection Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error Creating User',
          errorMessage || 'An unexpected error occurred. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <Container safeArea edges={[ 'top', 'bottom' ]} style={styles.container}>
      <View style={styles.headbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add User</Text>
        <Text style={styles.subtitle}>Create a new CHW/MHP account</Text>

        <Card style={styles.card} variant="elevated">
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Role</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowRoleDropdown(!showRoleDropdown)}>
              <Text style={styles.dropdownText}>{selectedRole || 'Select Role'}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showRoleDropdown && (
              <View style={styles.dropdownOptions}>
                {roles.map((role) => (
                  <TouchableOpacity key={role} style={styles.dropdownOption} onPress={() => { setSelectedRole(role); setShowRoleDropdown(false); }}>
                    <Text style={styles.dropdownOptionText}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {selectedRole && (
            <>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <Input placeholder="Full Name" value={fullName} onChangeText={setFullName} />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Input placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
              {selectedRole === 'MHP' && (
                <View style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel}>Hospital/Health Center</Text>
                  <Input
                    placeholder="e.g. King Faisal Hospital, Muhima Health Center, Kibagabaga Hospital"
                    value={workplace}
                    onChangeText={setWorkplace}
                    autoCapitalize="words"
                  />
                </View>
              )}
              {selectedRole === 'CHW' && (
                <>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>District</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowDistrictDropdown(!showDistrictDropdown)}>
                      <Text style={styles.dropdownText}>{district || 'Select District'}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showDistrictDropdown && (
                      <View style={styles.dropdownOptions}>
                        {districts.map((d) => (
                          <TouchableOpacity key={d} style={styles.dropdownOption} onPress={() => { setDistrict(d); setShowDistrictDropdown(false); }}>
                            <Text style={styles.dropdownOptionText}>{d}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Sector</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowSectorDropdown(!showSectorDropdown)}>
                      <Text style={styles.dropdownText}>{sector || 'Select Sector'}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showSectorDropdown && (
                      <View style={styles.dropdownOptions}>
                        {sectors.map((s) => (
                          <TouchableOpacity key={s} style={styles.dropdownOption} onPress={() => { setSector(s); setShowSectorDropdown(false); }}>
                            <Text style={styles.dropdownOptionText}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Cell</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowCellDropdown(!showCellDropdown)}>
                      <Text style={styles.dropdownText}>{cell || 'Select Cell'}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showCellDropdown && (
                      <View style={styles.dropdownOptions}>
                        {cells.map((c) => (
                          <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setCell(c); setShowCellDropdown(false); }}>
                            <Text style={styles.dropdownOptionText}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.fieldLabel}>Village</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowVillageDropdown(!showVillageDropdown)}>
                      <Text style={styles.dropdownText}>{village || 'Select Village'}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showVillageDropdown && (
                      <View style={styles.dropdownOptions}>
                        {villages.map((v) => (
                          <TouchableOpacity key={v} style={styles.dropdownOption} onPress={() => { setVillage(v); setShowVillageDropdown(false); }}>
                            <Text style={styles.dropdownOptionText}>{v}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
              <View style={styles.buttonWrapper}>
                <Button variant="primary" fullWidth onPress={save}>
                  Add User
                </Button>
              </View>
            </>
          )}
        </Card>
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
  fieldWrapper: { marginBottom: spacing.md },
  fieldLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: spacing.xs },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  dropdownText: {
    ...typography.body,
    color: colors.text,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    zIndex: 10,
    maxHeight: 150,
  },
  dropdownOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownOptionText: {
    ...typography.body,
    color: colors.text,
  },
  buttonWrapper: { marginTop: spacing.md },
});
