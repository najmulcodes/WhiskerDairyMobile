import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useReminders, Reminder } from '../../hooks/useReminders';
import { Card } from '../../components/Card';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUpcoming(scheduledFor: string): boolean {
  return new Date(scheduledFor) > new Date();
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const upcoming = isUpcoming(reminder.scheduled_for);

  return (
    <Card style={styles.reminderCard}>
      <View style={styles.reminderTop}>
        <View
          style={[
            styles.reminderIconBg,
            { backgroundColor: upcoming ? Colors.primaryLight : Colors.gray100 },
          ]}
        >
          <Ionicons
            name={upcoming ? 'notifications' : 'notifications-outline'}
            size={18}
            color={upcoming ? Colors.primary : Colors.gray500}
          />
        </View>
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderTitle}>{reminder.title}</Text>
          {reminder.body && (
            <Text style={styles.reminderBody}>{reminder.body}</Text>
          )}
        </View>
        {upcoming && (
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingText}>Upcoming</Text>
          </View>
        )}
      </View>
      <View style={styles.reminderFooter}>
        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.reminderTime}>
          {formatDateTime(reminder.scheduled_for)}
        </Text>
      </View>
    </Card>
  );
}

export function RemindersScreen() {
  const { data: reminders, isLoading, error, refetch } = useReminders();

  if (isLoading) return <Loader fullScreen message="Loading reminders..." />;

  const upcomingReminders = reminders?.filter((r) =>
    isUpcoming(r.scheduled_for)
  ) ?? [];
  const pastReminders = reminders?.filter(
    (r) => !isUpcoming(r.scheduled_for)
  ) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={reminders}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.infoText}>
              Reminders are automatically created based on your pets' vaccination
              and medication schedules. Manage care records in each pet's profile
              to see them here.
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={Colors.error}
                />
                <Text style={styles.errorText}>
                  Failed to load reminders. Pull to retry.
                </Text>
              </View>
            )}

            {!isLoading && upcomingReminders.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionRow}>
                  <Ionicons
                    name="notifications"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    Upcoming ({upcomingReminders.length})
                  </Text>
                </View>
                {upcomingReminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} />
                ))}
              </View>
            )}

            {!isLoading && pastReminders.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.textMuted}
                  />
                  <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>
                    Past ({pastReminders.length})
                  </Text>
                </View>
                {pastReminders.map((r) => (
                  <ReminderCard key={r.id} reminder={r} />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="notifications-outline"
              title="No reminders yet"
              message="Reminders appear automatically when your pets have upcoming vaccinations or medication schedules. Add care records to get started."
            />
          ) : null
        }
        renderItem={() => null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.xl, gap: 16, paddingBottom: 40 },
  listHeader: { gap: 20 },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.lg,
    padding: 12,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, flex: 1 },
  sectionGroup: { gap: 10 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reminderCard: { gap: 10 },
  reminderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reminderIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reminderInfo: { flex: 1, gap: 3 },
  reminderTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reminderBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  upcomingBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upcomingText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reminderTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
