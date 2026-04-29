import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  useExpenses,
  useDeleteExpense,
  getMonthString,
  stepMonth,
  formatMonthLabel,
  formatBDT,
  Expense,
} from '../../hooks/useExpenses';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Loader } from '../../components/Loader';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff7a5c',
  Vet: '#60a5fa',
  Grooming: '#a78bfa',
  Medicine: '#34d399',
  Supplies: '#fb923c',
  Other: '#9ca3af',
};

function getCategoryColor(name: string | null): string {
  if (!name) return CATEGORY_COLORS.Other;
  return CATEGORY_COLORS[name] || CATEGORY_COLORS.Other;
}

function ExpenseItem({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: () => void;
}) {
  const categoryColor = getCategoryColor(expense.category?.name ?? null);

  return (
    <View style={styles.expenseItem}>
      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDesc} numberOfLines={1}>
          {expense.description || 'Untitled expense'}
        </Text>
        <Text style={styles.expenseMeta}>
          {expense.category?.name || 'Uncategorized'} · {expense.date}
        </Text>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>
          {formatBDT(Number(expense.amount_bdt))}
        </Text>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ExpensesScreen() {
  const navigation = useNavigation<NavProp>();
  const [month, setMonth] = useState(getMonthString(new Date()));
  const { data: expenses, isLoading, error, refetch } = useExpenses(month);
  const deleteExpense = useDeleteExpense();

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount_bdt), 0) ?? 0;

  function handleDelete(id: string, description: string | null) {
    Alert.alert(
      'Delete expense?',
      description || 'This expense will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteExpense.mutate(id, {
              onError: () => Alert.alert('Error', 'Failed to delete expense.'),
            }),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
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
          <View style={styles.headerWrapper}>
            {/* Screen header */}
            <View style={styles.screenHeader}>
              <View>
                <Text style={styles.screenLabel}>Spendly</Text>
                <Text style={styles.screenTitle}>Expenses</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddExpense')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={22} color={Colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Month picker */}
            <View style={styles.monthPicker}>
              <TouchableOpacity
                onPress={() => setMonth(stepMonth(month, -1))}
                style={styles.monthArrow}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{formatMonthLabel(month)}</Text>
              <TouchableOpacity
                onPress={() => setMonth(stepMonth(month, 1))}
                style={styles.monthArrow}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total spending</Text>
                <Text style={styles.summaryValue}>{formatBDT(total)}</Text>
                <Text style={styles.summaryHint}>{formatMonthLabel(month)}</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>
                  {expenses?.length ?? 0}
                </Text>
                <Text style={styles.summaryHint}>logged this month</Text>
              </Card>
            </View>

            {/* Error state */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={Colors.error}
                />
                <Text style={styles.errorText}>
                  Failed to load expenses. Pull to retry.
                </Text>
              </View>
            )}

            {/* Loading state */}
            {isLoading && <Loader size="small" />}

            {/* Section header */}
            {!isLoading && (expenses?.length ?? 0) > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transactions</Text>
                <Text style={styles.sectionCount}>{expenses?.length}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="wallet-outline"
              title="No expenses this month"
              message="Log food, care, or household spending to build your monthly picture."
              action={
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('AddExpense')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>Log first expense</Text>
                </TouchableOpacity>
              }
            />
          ) : null
        }
        renderItem={({ item: expense, index }) => (
          <View
            style={[
              styles.expenseCardWrapper,
              index === 0 && styles.firstItem,
            ]}
          >
            <ExpenseItem
              expense={expense}
              onDelete={() =>
                handleDelete(expense.id, expense.description)
              }
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingBottom: 40,
  },
  headerWrapper: {
    gap: 12,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
  },
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
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryHint: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.lg,
    padding: 12,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  expenseCardWrapper: {
    marginHorizontal: Spacing.xl,
  },
  firstItem: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  expenseInfo: {
    flex: 1,
    gap: 3,
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
  expenseRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  expenseAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.xl + 22,
    marginRight: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.white,
  },
});
