import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Reminder {
  id: string;
  owner_id: string;
  title: string;
  body: string | null;
  scheduled_for: string;
  is_active: boolean;
  created_at: string;
}

export function useReminders() {
  return useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      const res = await api.get('/reminders');
      return res.data.data;
    },
  });
}
