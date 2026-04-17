import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { Button, Input, Card, Container } from '@/components/ui';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

type ForgotPasswordStep = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      setError('Please enter your email address');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
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
      setError(err.message || 'Failed to send OTP. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.verifyOtp(email, otp);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please check and try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(email, otp, newPassword);
      Alert.alert('Success', 'Your password has been reset successfully.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer === 0) {
      setLoading(true);
      setError('');
      try {
        await api.requestOtp(email);
        setTimer(60);
        Alert.alert('Success', 'OTP has been resent to your email.');
      } catch (err: any) {
        setError(err.message || 'Failed to resend OTP.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'email') {
      router.back();
    } else if (step === 'otp') {
      setStep('email');
      setOtp('');
      setError('');
    } else {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  };

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  return (
    <Container safeArea edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Ionicons name="lock-closed-outline" size={50} color={colors.primary} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 'email' && 'Enter your email to receive an OTP'}
              {step === 'otp' && 'Enter the OTP sent to your email'}
              {step === 'reset' && 'Create a new password'}
            </Text>
          </View>

          <Card variant="elevated" style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {step === 'email' && (
              <>
                <View style={styles.fieldSpacing}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <Input
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                  />
                </View>

                <View style={styles.buttonWrapper}>
                  <Button variant="primary" size="lg" onPress={handleRequestOtp} fullWidth loading={loading}>
                    Request OTP
                  </Button>
                </View>
              </>
            )}

            {step === 'otp' && (
              <>
                <View style={styles.otpContainer}>
                  <Text style={styles.otpInstructions}>
                    We've sent a 6-digit OTP to{'\n'}
                    <Text style={styles.otpEmail}>{email}</Text>
                  </Text>
                </View>

                <View style={styles.fieldSpacing}>
                  <Text style={styles.inputLabel}>One-Time Password (OTP)</Text>
                  <Input
                    placeholder="000000"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    leftIcon={<Ionicons name="key-outline" size={20} color={colors.textSecondary} />}
                  />
                </View>

                <View style={styles.timerContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                      <Text style={[styles.resendText, loading && { opacity: 0.5 }]}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.buttonWrapper}>
                  <Button variant="primary" size="lg" onPress={handleVerifyOtp} fullWidth loading={loading}>
                    Verify OTP
                  </Button>
                </View>
              </>
            )}

            {step === 'reset' && (
              <>
                <View style={styles.fieldSpacing}>
                  <Text style={styles.inputLabel}>New Password</Text>
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
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <Input
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                  />
                </View>

                <View style={styles.buttonWrapper}>
                  <Button variant="primary" size="lg" onPress={handleResetPassword} fullWidth loading={loading}>
                    Reset Password
                  </Button>
                </View>
              </>
            )}
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Remembered your password?{' '}
              <Text style={styles.footerLink} onPress={() => router.replace('/login')}>
                Login here
              </Text>
            </Text>
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
