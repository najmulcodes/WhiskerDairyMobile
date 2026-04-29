import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface HealthAlert {
  petId: string;
  petName: string;
  type: 'vaccination' | 'medication';
  name: string;
  dueDate: string;
  status: 'overdue' | 'due_today' | 'due_soon';
  daysUntilDue: number;
}

export interface HealthSummary {
  overdue: HealthAlert[];
  dueToday: HealthAlert[];
  dueSoon: HealthAlert[];
  totalAlerts: number;
}

export function useHealthSummary() {
  return useQuery<HealthSummary>({
    queryKey: ['health-summary'],
    queryFn: async () => {
      const res = await api.get('/health-summary');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
