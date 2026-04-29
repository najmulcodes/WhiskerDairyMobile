import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth, getUserDisplayName } from '../../context/AuthContext';
import { usePets, calcAge } from '../../hooks/usePets';
import { useExpenses, getMonthString, formatBDT } from '../../hooks/useExpenses';
import { useHealthSummary } from '../../hooks/useHealthSummary';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { Loader } from '../../components/Loader';
import { Badge } from '../../components/Badge';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </Card>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);

  const currentMonth = getMonthString(new Date());
  const { data: pets, isLoading: petsLoading, refetch: refetchPets } = usePets();
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses(currentMonth);
  const { data: healthSummary } = useHealthSummary();

  const isLoading = petsLoading || expensesLoading;

  function onRefresh() {
    refetchPets();
    refetchExpenses();
  }

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount_bdt), 0) ?? 0;
  const recentExpenses = expenses?.slice(0, 5) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero Header */}
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Dashboard</Text>
              <Text style={styles.heroName}>Hi, {displayName} 👋</Text>
              <Text style={styles.heroSub}>
                Keep an eye on your pets and spending.
              </Text>
            </View>
            <Avatar
              src={null}
              name={displayName}
              size={52}
              borderRadius={16}
              style={styles.avatar}
            />
          </View>

          {/* Health alerts banner */}
          {healthSummary && healthSummary.totalAlerts > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => navigation.navigate('Reminders')}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={styles.alertText}>
                {healthSummary.totalAlerts} health alert
                {healthSummary.totalAlerts > 1 ? 's' : ''} need attention
              </Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Pets"
            value={String(pets?.length ?? 0)}
            sub="active profiles"
          />
          <StatCard
            label="This month"
            value={formatBDT(total)}
            sub="tracked expenses"
          />
          <StatCard
            label="Transactions"
            value={String(expenses?.length ?? 0)}
            sub="logged so far"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickActions}>
            {[
              {
                icon: 'paw',
                label: 'Add pet',
                onPress: () => navigation.navigate('PetForm', { mode: 'add' }),
              },
              {
                icon: 'wallet',
                label: 'Log expense',
                onPress: () => navigation.navigate('AddExpense'),
              },
              {
                icon: 'notifications',
                label: 'Reminders',
                onPress: () => navigation.navigate('Reminders'),
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickAction}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons
                    name={action.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Your Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your pets</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.getParent()?.navigate('Pets')
              }
            >
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {petsLoading ? (
            <Loader size="small" />
          ) : !pets || pets.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No pets yet</Text>
              <Text style={styles.emptyText}>
                Add your first pet to get started.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('PetForm', { mode: 'add' })}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Add pet</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.petList}>
              {pets.slice(0, 4).map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petRow}
                  onPress={() =>
                    navigation.navigate('PetDetail', {
                      id: pet.id,
                      name: pet.name,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Avatar
                    src={pet.image}
                    name={pet.name}
                    size={44}
                    borderRadius={12}
                  />
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petMeta}>
                      {[pet.breed, calcAge(pet.dob)]
                        .filter(Boolean)
                        .join(' · ') || 'No details yet'}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddExpense')}
            >
              <Text style={styles.seeAll}>Add</Text>
            </TouchableOpacity>
          </View>

          {expensesLoading ? (
            <Loader size="small" />
          ) : recentExpenses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No expenses logged</Text>
              <Text style={styles.emptyText}>
                Start tracking your monthly spending.
              </Text>
            </Card>
          ) : (
            <Card>
              {recentExpenses.map((expense, index) => (
                <View
                  key={expense.id}
                  style={[
                    styles.expenseRow,
                    index < recentExpenses.length - 1 && styles.expenseDivider,
                  ]}
                >
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>
                      {expense.description || 'Untitled expense'}
                    </Text>
                    <Text style={styles.expenseMeta}>
                      {expense.category?.name || 'Uncategorized'} · {expense.date}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatBDT(Number(expense.amount_bdt))}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  alertText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  petList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  petMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  expenseDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expenseLeft: {
    flex: 1,
    gap: 2,
  },
  expenseDesc: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  expenseMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  expenseAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
});
