import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Expense {
  id: string;
  date: string;
  amount_bdt: number;
  description: string | null;
  created_at: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export interface CreateExpenseInput {
  date: string;
  amount_bdt: number;
  description?: string;
  category_id?: string;
}

async function fetchExpenses(month?: string): Promise<Expense[]> {
  const res = await api.get<{ success: boolean; data: Expense[] }>(
    '/expenses',
    { params: month ? { month } : {} }
  );
  return res.data.data;
}

async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const res = await api.post<{ success: boolean; data: Expense }>(
    '/expenses',
    input
  );
  return res.data.data;
}

async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export function useExpenses(month?: string) {
  return useQuery({
    queryKey: ['expenses', month ?? 'all'],
    queryFn: () => fetchExpenses(month),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function stepMonth(current: string, dir: -1 | 1): string {
  const [y, m] = current.split('-').map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  return getMonthString(d);
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatBDT(amount: number): string {
  return `৳${Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
