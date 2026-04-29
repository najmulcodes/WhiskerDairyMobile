import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Vaccination {
  id: string;
  pet_id: string;
  vaccine_name: string;
  administered_at: string;
  next_due_at: string | null;
  notes: string | null;
  card_image_url: string | null;
  ocr_text: string | null;
  created_at: string;
}

export interface CreateVaccinationInput {
  vaccine_name: string;
  administered_at: string;
  next_due_at?: string;
  notes?: string;
  card_image_url?: string;
}

export interface UpdateVaccinationInput {
  vaccine_name?: string;
  administered_at?: string;
  next_due_at?: string;
  notes?: string;
  card_image_url?: string;
}

async function fetchVaccinations(petId: string): Promise<Vaccination[]> {
  const res = await api.get<{ success: boolean; data: Vaccination[] }>(
    `/pets/${petId}/vaccinations`
  );
  return res.data.data;
}

async function createVaccination({
  petId,
  ...input
}: CreateVaccinationInput & { petId: string }): Promise<Vaccination> {
  const res = await api.post<{ success: boolean; data: Vaccination }>(
    `/pets/${petId}/vaccinations`,
    input
  );
  return res.data.data;
}

async function updateVaccination({
  petId,
  id,
  ...input
}: UpdateVaccinationInput & { petId: string; id: string }): Promise<Vaccination> {
  const res = await api.patch<{ success: boolean; data: Vaccination }>(
    `/pets/${petId}/vaccinations/${id}`,
    input
  );
  return res.data.data;
}

async function deleteVaccination({
  petId,
  id,
}: {
  petId: string;
  id: string;
}): Promise<void> {
  await api.delete(`/pets/${petId}/vaccinations/${id}`);
}

export function useVaccinations(petId: string) {
  return useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: () => fetchVaccinations(petId),
    enabled: !!petId,
  });
}

export function useCreateVaccination(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVaccinationInput) =>
      createVaccination({ petId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['vaccinations', petId] }),
  });
}

export function useUpdateVaccination(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateVaccinationInput & { id: string }) =>
      updateVaccination({ petId, id, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['vaccinations', petId] }),
  });
}

export function useDeleteVaccination(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVaccination({ petId, id }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['vaccinations', petId] }),
  });
}

export function isDueSoon(nextDue: string | null): boolean {
  if (!nextDue) return false;
  const dueDate = new Date(nextDue);
  const now = new Date();
  const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 14;
}

export function isOverdue(nextDue: string | null): boolean {
  if (!nextDue) return false;
  return new Date(nextDue) < new Date();
}
