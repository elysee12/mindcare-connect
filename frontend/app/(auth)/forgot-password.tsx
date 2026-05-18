import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { Button, Input, Card, Container } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

type ForgotPasswordStep = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      setError(t('auth.email_required'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!email.includes('@')) {
      setError(t('auth.valid_email_error'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.requestOtp(email);
      setStep('otp');
      setTimer(60);
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError(t('auth.otp_required'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.verifyOtp(email, otp);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('auth.fill_all_fields'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.password_min_length'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwords_dont_match'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(email, otp, newPassword);
      Alert.alert(t('common.success'), t('auth.password_reset_success'), [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="mail-open" size={40} color={colors.primary} />
              </View>
              <Text style={styles.title}>{t('auth.forgot_password')}</Text>
              <Text style={styles.subtitle}>{t('auth.enter_email_to_reset')}</Text>
            </View>

            <Card variant="elevated" style={styles.card}>
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

                <View style={styles.buttonContainer}>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleRequestOtp}
                    loading={loading}
                  >
                    {t('auth.send_otp')}
                  </Button>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                  <Text style={styles.backButtonText}>{t('auth.back_to_login')}</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </>
        );

      case 'otp':
        return (
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="keypad" size={40} color={colors.primary} />
              </View>
              <Text style={styles.title}>{t('auth.enter_otp')}</Text>
              <Text style={styles.subtitle}>{t('auth.enter_otp_description')}</Text>
            </View>

            <Card variant="elevated" style={styles.card}>
              <Card.Content>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <View style={styles.fieldSpacing}>
                  <Text style={styles.inputLabel}>{t('auth.enter_otp')}</Text>
                  <Input
                    placeholder="••••••"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    leftIcon={<Ionicons name="key-outline" size={20} color={colors.textSecondary} />}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleVerifyOtp}
                    loading={loading}
                  >
                    {t('auth.verify_otp')}
                  </Button>
                </View>

                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => setStep('email')}
                  disabled={loading}
                >
                  <Text style={styles.backButtonText}>{t('auth.back_to_login')}</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </>
        );

      case 'reset':
        return (
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="lock-open" size={40} color={colors.primary} />
              </View>
              <Text style={styles.title}>{t('auth.reset_password')}</Text>
              <Text style={styles.subtitle}>{t('auth.set_new_password')}</Text>
            </View>

            <Card variant="elevated" style={styles.card}>
              <Card.Content>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                
                <View style={styles.fieldSpacing}>
                  <Text style={styles.inputLabel}>{t('auth.new_password')}</Text>
                  <Input
                    placeholder="••••••••"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons 
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    }
                  />
                </View>

                <View style={styles.fieldSpacingLarge}>
                  <Text style={styles.inputLabel}>{t('auth.confirm_password')}</Text>
                  <Input
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleResetPassword}
                    loading={loading}
                  >
                    {t('auth.reset_password')}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </>
        );
    }
  };

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderStep()}
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
    position: 'relative',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
    zIndex: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: {
    ...typography.h2,
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
    padding: spacing.lg,
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
  otpContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
  },
  otpInstructions: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  otpEmail: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resendText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  buttonWrapper: {
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.errorTint,
    borderRadius: borderRadius.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerLink: {
    color: colors.primary,
    ...typography.captionBold,
  },
});
