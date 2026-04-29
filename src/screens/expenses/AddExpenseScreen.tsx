import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useCreateExpense } from '../../hooks/useExpenses';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: '🍖', color: '#ff7a5c' },
  { id: 'vet', name: 'Vet', icon: '🏥', color: '#60a5fa' },
  { id: 'grooming', name: 'Grooming', icon: '✂️', color: '#a78bfa' },
  { id: 'medicine', name: 'Medicine', icon: '💊', color: '#34d399' },
  { id: 'supplies', name: 'Supplies', icon: '🎒', color: '#fb923c' },
  { id: 'other', name: 'Other', icon: '📦', color: '#9ca3af' },
];

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function AddExpenseScreen() {
  const navigation = useNavigation();
  const createExpense = useCreateExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = 'Date format: YYYY-MM-DD';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    createExpense.mutate(
      {
        amount_bdt: Number(amount),
        description: description.trim() || undefined,
        date,
        category_id: categoryId || undefined,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: (e) =>
          Alert.alert(
            'Error',
            e instanceof Error ? e.message : 'Failed to log expense'
          ),
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount (BDT)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>৳</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
              style={styles.amountInput}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  categoryId === cat.id && styles.categoryBtnActive,
                  categoryId === cat.id && { borderColor: cat.color },
                ]}
                onPress={() =>
                  setCategoryId(categoryId === cat.id ? null : cat.id)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    categoryId === cat.id && { color: cat.color },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Input
            label="Description"
            placeholder="What was this expense for?"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Input
            label="Date (YYYY-MM-DD)"
            placeholder="2024-01-15"
            value={date}
            onChangeText={setDate}
            error={errors.date}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          loading={createExpense.isPending}
          style={styles.submitBtn}
        >
          Log expense
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: 24, paddingBottom: 20 },
  amountSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: 12,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBtn: {
    width: '30%',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  categoryIcon: { fontSize: 22 },
  categoryName: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: { flex: 1 },
});
