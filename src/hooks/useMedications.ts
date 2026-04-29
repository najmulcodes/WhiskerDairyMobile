import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Medication {
  id: string;
  pet_id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'custom';
  schedule_config: Record<string, unknown>;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'custom';
  start_date: string;
  end_date?: string;
  is_active?: boolean;
  schedule_config?: Record<string, unknown>;
}

async function fetchMedications(petId: string): Promise<Medication[]> {
  const res = await api.get<{ success: boolean; data: Medication[] }>(
    `/pets/${petId}/medications`
  );
  return res.data.data;
}

async function createMedication({
  petId,
  ...input
}: CreateMedicationInput & { petId: string }): Promise<Medication> {
  const res = await api.post<{ success: boolean; data: Medication }>(
    `/pets/${petId}/medications`,
    input
  );
  return res.data.data;
}

async function deleteMedication({
  petId,
  id,
}: {
  petId: string;
  id: string;
}): Promise<void> {
  await api.delete(`/pets/${petId}/medications/${id}`);
}

async function toggleMedication({
  petId,
  id,
  is_active,
}: {
  petId: string;
  id: string;
  is_active: boolean;
}): Promise<Medication> {
  const res = await api.patch<{ success: boolean; data: Medication }>(
    `/pets/${petId}/medications/${id}`,
    { is_active }
  );
  return res.data.data;
}

export function useMedications(petId: string) {
  return useQuery({
    queryKey: ['medications', petId],
    queryFn: () => fetchMedications(petId),
    enabled: !!petId,
  });
}

export function useCreateMedication(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMedicationInput) =>
      createMedication({ petId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['medications', petId] }),
  });
}

export function useDeleteMedication(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedication({ petId, id }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['medications', petId] }),
  });
}

export function useToggleMedication(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleMedication({ petId, id, is_active }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['medications', petId] }),
  });
}
