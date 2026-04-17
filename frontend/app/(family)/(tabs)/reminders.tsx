import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { Container, Card } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

export default function RemindersScreen() {
  const { user } = useAuth();
  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: () => api.reminders(),
    enabled: !!user?.id,
  });
  const renderReminderItem = ({ item }: { item: any }) => (
    <Card variant="elevated" style={[styles.reminderCard, item.completed && styles.completedCard]}>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: item.completed ? colors.successTint : colors.primaryTint }]}>
          <Ionicons
            name={item.type === 'medication' ? 'medkit-outline' : item.type === 'appointment' ? 'calendar-outline' : 'walk-outline'}
            size={24}
            color={item.completed ? colors.success : colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderTime}>{item.time}</Text>
        </View>
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={item.completed ? colors.success : colors.border}
        />
      </Card.Content>
    </Card>
  );

  return (
    <Container safeArea edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Reminders</Text>
      </View>
      <FlatList
        data={reminders || []}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders available</Text>
          </View>
        )}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderReminderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  reminderCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  completedCard: {
    opacity: 0.7,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  reminderTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  reminderTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
