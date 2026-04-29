import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  dob: string | null;
  breed: string | null;
  color: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  notes: string | null;
  image: string | null;
  food_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePetInput {
  name: string;
  dob?: string;
  breed?: string;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  notes?: string;
  image?: string;
  food_time?: string | null;
}

async function fetchPets(): Promise<Pet[]> {
  const res = await api.get<{ success: boolean; data: Pet[] }>('/pets');
  return res.data.data;
}

async function fetchPet(id: string): Promise<Pet> {
  const res = await api.get<{ success: boolean; data: Pet }>(`/pets/${id}`);
  return res.data.data;
}

async function createPet(input: CreatePetInput): Promise<Pet> {
  const res = await api.post<{ success: boolean; data: Pet }>('/pets', input);
  return res.data.data;
}

async function updatePet({
  id,
  ...input
}: CreatePetInput & { id: string }): Promise<Pet> {
  const res = await api.patch<{ success: boolean; data: Pet }>(
    `/pets/${id}`,
    input
  );
  return res.data.data;
}

async function deletePet(id: string): Promise<void> {
  await api.delete(`/pets/${id}`);
}

export function usePets() {
  return useQuery({ queryKey: ['pets'], queryFn: fetchPets });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: ['pets', id],
    queryFn: () => fetchPet(id),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function useUpdatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePet,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pets'] });
      qc.invalidateQueries({ queryKey: ['pets', vars.id] });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  });
}

export function calcAge(dob: string | null): string {
  if (!dob) return 'Unknown age';
  const birth = new Date(dob);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) return 'Under 1 month';
  if (totalMonths < 12) return `${totalMonths} months`;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months > 0 ? `${years}y ${months}m` : `${years} years`;
}
