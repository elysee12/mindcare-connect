import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { Container, Button } from '@/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const ONBOARDING_DATA = [
    {
      title: t('onboarding.welcome_title'),
      description: t('onboarding.welcome_desc'),
      icon: 'heart',
    },
    {
      title: t('onboarding.followup_title'),
      description: t('onboarding.followup_desc'),
      icon: 'heart',
    },
    {
      title: t('onboarding.collaborative_title'),
      description: t('onboarding.collaborative_desc'),
      icon: 'heart',
    },
  ];

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <Container safeArea style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      >
        {ONBOARDING_DATA.map((item, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={100} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const dotWidth = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { opacity, width: dotWidth, backgroundColor: colors.primary },
                ]}
              />
            );
          })}
        </View>

        <Button
          variant="primary"
          size="lg"
          onPress={handleNext}
          style={styles.nextButton}
        >
          {currentIndex === ONBOARDING_DATA.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
        </Button>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 4,
    borderColor: colors.primary,
    ...shadows.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 10,
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    width: '100%',
    height: 56,
  },
});
