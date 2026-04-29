import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useHealthSummary, HealthAlert } from '../../hooks/useHealthSummary';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';

type AlertSectionProps = {
  title: string;
  alerts: HealthAlert[];
  variant: 'error' | 'warning' | 'primary';
  iconName: React.ComponentProps<typeof Ionicons>['name'];
};

const STATUS_CONFIG = {
  overdue: { variant: 'error' as const, label: 'Overdue', bg: Colors.errorBg, border: '#fecaca', icon: 'alert-circle' as const },
  due_today: { variant: 'warning' as const, label: 'Due today', bg: Colors.warningBg, border: '#fde68a', icon: 'time' as const },
  due_soon: { variant: 'primary' as const, label: 'Due soon', bg: Colors.primaryLight, border: Colors.borderStrong, icon: 'calendar' as const },
};

function AlertCard({ alert }: { alert: HealthAlert }) {
  const config = STATUS_CONFIG[alert.status];

  return (
    <View style={[styles.alertCard, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.alertLeft}>
        <View style={styles.alertIconWrapper}>
          <Ionicons name={config.icon} size={18} color={
            alert.status === 'overdue' ? Colors.error :
            alert.status === 'due_today' ? Colors.warning :
            Colors.primary
          } />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{alert.name}</Text>
          <Text style={styles.alertPet}>{alert.petName}</Text>
          <Text style={styles.alertMeta}>
            {alert.type === 'vaccination' ? '💉 Vaccination' : '💊 Medication'} · {alert.dueDate}
          </Text>
        </View>
      </View>
      <Badge label={config.label} variant={config.variant} />
    </View>
  );
}

function AlertSection({ title, alerts, variant, iconName }: AlertSectionProps) {
  if (alerts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={iconName} size={18} color={
          variant === 'error' ? Colors.error :
          variant === 'warning' ? Colors.warning :
          Colors.primary
        } />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.countBadge, {
          backgroundColor: variant === 'error' ? Colors.errorBg :
            variant === 'warning' ? Colors.warningBg :
            Colors.primaryLight
        }]}>
          <Text style={[styles.countText, {
            color: variant === 'error' ? Colors.error :
              variant === 'warning' ? Colors.warning :
              Colors.primary
          }]}>{alerts.length}</Text>
        </View>
      </View>
      <View style={styles.alertList}>
        {alerts.map((alert, i) => (
          <AlertCard key={`${alert.petId}-${alert.type}-${i}`} alert={alert} />
        ))}
      </View>
    </View>
  );
}

export function HealthSummaryScreen() {
  const { data: summary, isLoading, error, refetch } = useHealthSummary();

  if (isLoading) return <Loader fullScreen message="Checking health alerts…" />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenLabel}>Health</Text>
          <Text style={styles.screenTitle}>Health Summary</Text>
          <Text style={styles.screenSub}>
            Upcoming and overdue vaccinations & medications across all your pets.
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>Failed to load health summary. Pull to retry.</Text>
          </View>
        )}

        {/* Summary stats */}
        {summary && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>{summary.overdue.length}</Text>
              <Text style={[styles.statLabel, { color: Colors.error }]}>Overdue</Text>
            </Card>
            <Card style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>{summary.dueToday.length}</Text>
              <Text style={[styles.statLabel, { color: Colors.warning }]}>Due today</Text>
            </Card>
            <Card style={styles.statCard} padding={14}>
              <Text style={styles.statValue}>{summary.dueSoon.length}</Text>
              <Text style={[styles.statLabel, { color: Colors.primary }]}>Due soon</Text>
            </Card>
          </View>
        )}

        {/* All clear */}
        {summary && summary.totalAlerts === 0 && (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All clear! 🎉"
            message="No overdue or upcoming health tasks right now. Your pets are up to date."
          />
        )}

        {/* Alert sections */}
        {summary && summary.overdue.length > 0 && (
          <AlertSection
            title="Overdue"
            alerts={summary.overdue}
            variant="error"
            iconName="alert-circle"
          />
        )}
        {summary && summary.dueToday.length > 0 && (
          <AlertSection
            title="Due today"
            alerts={summary.dueToday}
            variant="warning"
            iconName="time"
          />
        )}
        {summary && summary.dueSoon.length > 0 && (
          <AlertSection
            title="Due in the next 14 days"
            alerts={summary.dueSoon}
            variant="primary"
            iconName="calendar-outline"
          />
        )}

        {/* Tips */}
        <Card style={styles.tipsCard} padding={16}>
          <Text style={styles.tipsTitle}>💡 Stay ahead of care</Text>
          <Text style={styles.tipsText}>
            Add vaccinations and medications in each pet's profile to automatically
            surface due dates here. Set up reminders from the Reminders tab.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: 20, paddingBottom: 40 },
  screenHeader: { gap: 6 },
  screenLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  screenSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  alertList: { gap: 10 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 14,
  },
  alertLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  alertIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertInfo: { flex: 1, gap: 3 },
  alertTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  alertPet: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  alertMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  tipsCard: { gap: 8 },
  tipsTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tipsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
