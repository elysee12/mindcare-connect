import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { Button, Input, Card, Container } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

type Role = 'mhp' | 'chw' | 'family' | 'admin';

// Role detection based on email
const detectRoleFromEmail = (email: string): Role => {
  const emailLower = email.toLowerCase();
  if (emailLower.includes('mhp') || emailLower.includes('doctor') || emailLower.includes('professional')) {
    return 'mhp';
  } else if (emailLower.includes('chw') || emailLower.includes('worker') || emailLower.includes('health')) {
    return 'chw';
  } else if (emailLower.includes('admin') || emailLower.includes('administrator')) {
    return 'admin';
  }
  return 'family'; // Default to family
};

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('mhp@mindcare.com');
  const [password, setPassword] = useState('MHP123'); // Updated to match seed
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[Login] Attempting login for:', email);
      const user = await api.login(email, password);
      console.log('[Login] Success, user:', user);
      
      api.setAuthUserId(user.id);
      setUser(user); 
      
      const detectedRole = (user.role || 'family').toLowerCase();
      console.log('[Login] Redirecting to:', `/${detectedRole}`);
      
      // Use full path to ensure redirection works correctly
      router.replace(`/(${detectedRole})` as any);
    } catch (err: any) {
      const isAuthError = err?.message?.includes('401') || err?.statusCode === 401;
      const errorMessage = isAuthError
        ? 'Email or password is incorrect. Please check your credentials and try again.'
        : `Error: ${err.message || 'Something went wrong'}`;
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <LanguageSelector />
          <View style={styles.header}>

          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={60} color={colors.primary} />
          </View>
          <Text style={styles.title}>MindCare Connect</Text>
          <Text style={styles.subtitle}>{t('auth.sign_in_to_continue')}</Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          <Card.Header>
            <Text style={styles.cardTitle}>{t('auth.welcome_back')}</Text>
          </Card.Header>

          <Card.Content>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.fieldSpacing}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <Input
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
              />
            </View>

            <View style={styles.fieldSpacingLarge}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <Input
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                rightIcon={
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggleButton}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            <View style={styles.loginButton}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleLogin}
                loading={loading}
              >
                {t('auth.login')}
              </Button>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.need_help')}</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  fieldSpacing: {
    marginBottom: spacing.md,
  },
  fieldSpacingLarge: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: colors.primary,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  passwordToggleButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
