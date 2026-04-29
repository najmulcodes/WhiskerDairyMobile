import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePet, calcAge } from '../../hooks/usePets';
import {
  useMedications,
  useCreateMedication,
  useDeleteMedication,
  useToggleMedication,
  Medication,
} from '../../hooks/useMedications';
import {
  useVaccinations,
  useCreateVaccination,
  useDeleteVaccination,
  Vaccination,
  isDueSoon,
  isOverdue,
} from '../../hooks/useVaccinations';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Loader } from '../../components/Loader';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'PetDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Medication Modal ──────────────────────────────────────────
function AddMedModal({
  petId,
  visible,
  onClose,
}: {
  petId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const create = useCreateMedication(petId);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setName(''); setDosage(''); setFrequency('daily');
    setStartDate(''); setEndDate(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit() {
    if (!name.trim()) { setError('Medicine name is required'); return; }
    if (!dosage.trim()) { setError('Dosage is required'); return; }
    if (!startDate) { setError('Start date is required'); return; }

    setError('');
    create.mutate(
      { name, dosage, frequency, start_date: startDate, end_date: endDate || undefined, is_active: true },
      {
        onSuccess: handleClose,
        onError: (e) => setError(e instanceof Error ? e.message : 'Failed to add'),
      }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={modal.safe}>
        <View style={modal.header}>
          <Text style={modal.title}>Add medication</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.scroll} contentContainerStyle={modal.content} keyboardShouldPersistTaps="handled">
          <Input label="Medicine name *" placeholder="Amoxicillin" value={name} onChangeText={setName} />
          <Input label="Dosage *" placeholder="250mg twice daily" value={dosage} onChangeText={setDosage} />
          
          <View style={modal.field}>
            <Text style={modal.label}>Frequency *</Text>
            <View style={modal.freqRow}>
              {(['daily', 'weekly', 'custom'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[modal.freqBtn, frequency === f && modal.freqBtnActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[modal.freqBtnText, frequency === f && modal.freqBtnTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="Start date * (YYYY-MM-DD)" placeholder="2024-01-01" value={startDate} onChangeText={setStartDate} keyboardType="numbers-and-punctuation" />
          <Input label="End date (YYYY-MM-DD)" placeholder="Optional" value={endDate} onChangeText={setEndDate} keyboardType="numbers-and-punctuation" />

          {!!error && <Text style={modal.error}>{error}</Text>}
        </ScrollView>
        <View style={modal.footer}>
          <Button variant="secondary" onPress={handleClose}>Cancel</Button>
          <Button onPress={handleSubmit} loading={create.isPending} style={modal.submitBtn}>Add medication</Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Vaccination Modal ─────────────────────────────────────────
function AddVaccModal({
  petId,
  visible,
  onClose,
}: {
  petId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const create = useCreateVaccination(petId);
  const [vaccineName, setVaccineName] = useState('');
  const [administeredAt, setAdministeredAt] = useState('');
  const [nextDueAt, setNextDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setVaccineName(''); setAdministeredAt(''); setNextDueAt(''); setNotes(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  function handleSubmit() {
    if (!vaccineName.trim()) { setError('Vaccine name is required'); return; }
    if (!administeredAt) { setError('Administered date is required'); return; }

    setError('');
    create.mutate(
      {
        vaccine_name: vaccineName,
        administered_at: administeredAt,
        next_due_at: nextDueAt || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: handleClose,
        onError: (e) => setError(e instanceof Error ? e.message : 'Failed to add'),
      }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={modal.safe}>
        <View style={modal.header}>
          <Text style={modal.title}>Add vaccination</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modal.scroll} contentContainerStyle={modal.content} keyboardShouldPersistTaps="handled">
          <Input label="Vaccine name *" placeholder="Rabies, DHPP…" value={vaccineName} onChangeText={setVaccineName} />
          <Input label="Administered date * (YYYY-MM-DD)" placeholder="2024-01-01" value={administeredAt} onChangeText={setAdministeredAt} keyboardType="numbers-and-punctuation" />
          <Input label="Next due date (YYYY-MM-DD)" placeholder="Optional" value={nextDueAt} onChangeText={setNextDueAt} keyboardType="numbers-and-punctuation" />
          
          <View style={modal.field}>
            <Text style={modal.label}>Notes</Text>
            <TextInput
              style={modal.textarea}
              placeholder="Additional notes..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {!!error && <Text style={modal.error}>{error}</Text>}
        </ScrollView>
        <View style={modal.footer}>
          <Button variant="secondary" onPress={handleClose}>Cancel</Button>
          <Button onPress={handleSubmit} loading={create.isPending} style={modal.submitBtn}>Add record</Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export function PetDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { id } = route.params;

  const { data: pet, isLoading, error, refetch } = usePet(id);
  const { data: meds, isLoading: medsLoading, refetch: refetchMeds } = useMedications(id);
  const { data: vaccs, isLoading: vaccsLoading, refetch: refetchVaccs } = useVaccinations(id);
  const deleteMed = useDeleteMedication(id);
  const toggleMed = useToggleMedication(id);
  const deleteVacc = useDeleteVaccination(id);

  const [showMedModal, setShowMedModal] = useState(false);
  const [showVaccModal, setShowVaccModal] = useState(false);

  if (isLoading) return <Loader fullScreen message="Loading pet..." />;

  if (error || !pet) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Pet not found"
        message="This pet could not be loaded."
        action={<Button onPress={() => navigation.goBack()} variant="secondary">Go back</Button>}
      />
    );
  }

  function handleDeleteMed(med: Medication) {
    Alert.alert('Delete medication?', med.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteMed.mutate(med.id),
      },
    ]);
  }

  function handleDeleteVacc(vacc: Vaccination) {
    Alert.alert('Delete vaccination record?', vacc.vaccine_name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteVacc.mutate(vacc.id),
      },
    ]);
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { refetch(); refetchMeds(); refetchVaccs(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar src={pet.image} name={pet.name} size={80} borderRadius={22} />
            <View style={styles.profileInfo}>
              <Text style={styles.petLabel}>Pet profile</Text>
              <Text style={styles.petName}>{pet.name}</Text>
              <View style={styles.badgeRow}>
                <Badge label={calcAge(pet.dob)} variant="primary" />
                {pet.gender && (
                  <Badge
                    label={pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                    variant="success"
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('PetForm', { mode: 'edit', id: pet.id })}
            >
              <Ionicons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            {[
              { label: 'Age', value: calcAge(pet.dob) },
              { label: 'Birthdate', value: pet.dob || 'Not set' },
              { label: 'Breed', value: pet.breed || 'Not set' },
              { label: 'Color', value: pet.color || 'Not set' },
            ].map((item) => (
              <View key={item.label} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {pet.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{pet.notes}</Text>
            </View>
          )}
        </Card>

        {/* Medications */}
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionLabel}>Medication</Text>
              <Text style={styles.sectionTitle}>Current routines</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowMedModal(true)}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {medsLoading ? (
            <Loader size="small" />
          ) : !meds || meds.length === 0 ? (
            <EmptyState
              icon="medical-outline"
              title="No medications"
              message="Track dosage, frequency, and dates for this pet."
            />
          ) : (
            <View style={styles.itemList}>
              {meds.map((med) => (
                <View key={med.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.itemName}>{med.name}</Text>
                        <Badge
                          label={med.is_active ? 'Active' : 'Inactive'}
                          variant={med.is_active ? 'success' : 'neutral'}
                        />
                      </View>
                      <Text style={styles.itemMeta}>{med.dosage}</Text>
                      <Text style={styles.itemMeta}>
                        {med.frequency} · {med.start_date}
                        {med.end_date ? ` → ${med.end_date}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.itemBtn}
                      onPress={() =>
                        toggleMed.mutate({ id: med.id, is_active: !med.is_active })
                      }
                    >
                      <Text style={styles.itemBtnText}>
                        {med.is_active ? 'Pause' : 'Resume'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.itemBtn, styles.itemBtnDanger]}
                      onPress={() => handleDeleteMed(med)}
                    >
                      <Text style={[styles.itemBtnText, { color: Colors.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Vaccinations */}
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionLabel}>Vaccinations</Text>
              <Text style={styles.sectionTitle}>Records & due dates</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowVaccModal(true)}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {vaccsLoading ? (
            <Loader size="small" />
          ) : !vaccs || vaccs.length === 0 ? (
            <EmptyState
              icon="shield-checkmark-outline"
              title="No vaccinations"
              message="Add records to track administered dates and upcoming due dates."
            />
          ) : (
            <View style={styles.itemList}>
              {vaccs.map((vacc) => (
                <View key={vacc.id} style={styles.itemCard}>
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.itemName}>{vacc.vaccine_name}</Text>
                      {isOverdue(vacc.next_due_at) && (
                        <Badge label="Overdue" variant="error" />
                      )}
                      {!isOverdue(vacc.next_due_at) && isDueSoon(vacc.next_due_at) && (
                        <Badge label="Due soon" variant="warning" />
                      )}
                    </View>
                    <Text style={styles.itemMeta}>Given on {vacc.administered_at}</Text>
                    {vacc.next_due_at && (
                      <Text style={styles.itemMeta}>Next due {vacc.next_due_at}</Text>
                    )}
                    {vacc.notes && (
                      <Text style={[styles.itemMeta, { marginTop: 4 }]}>{vacc.notes}</Text>
                    )}
                  </View>
                  <View style={[styles.itemActions, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={[styles.itemBtn, styles.itemBtnDanger]}
                      onPress={() => handleDeleteVacc(vacc)}
                    >
                      <Text style={[styles.itemBtnText, { color: Colors.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <AddMedModal petId={id} visible={showMedModal} onClose={() => setShowMedModal(false)} />
      <AddVaccModal petId={id} visible={showVaccModal} onClose={() => setShowVaccModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: 16, paddingBottom: 40 },
  profileCard: { gap: 16 },
  profileTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  profileInfo: { flex: 1, gap: 6 },
  petLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  petName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  editBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoItem: { flex: 1, minWidth: '45%', backgroundColor: Colors.background, borderRadius: Radius.lg, padding: 12, gap: 4 },
  infoLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  notesBox: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: 12, gap: 6 },
  notesLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  notesText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },
  itemList: { gap: 10 },
  itemCard: { backgroundColor: Colors.background, borderRadius: Radius.xl, padding: 14, gap: 8 },
  itemTop: { flexDirection: 'row', gap: 8 },
  itemName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  itemMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  itemActions: { flexDirection: 'row', gap: 8 },
  itemBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  itemBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  itemBtnDanger: { backgroundColor: Colors.errorBg, borderColor: '#fecaca' },
});

const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: 16, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: Colors.textSecondary },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  freqBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  freqBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  freqBtnTextActive: { color: Colors.primary },
  textarea: { borderWidth: 1.5, borderColor: Colors.borderStrong, borderRadius: Radius.xl, padding: 14, minHeight: 80, backgroundColor: '#f6eee9', fontSize: FontSize.base, color: Colors.textPrimary, textAlignVertical: 'top' },
  error: { fontSize: FontSize.sm, color: Colors.error, backgroundColor: Colors.errorBg, padding: 12, borderRadius: Radius.lg },
  footer: { flexDirection: 'row', gap: 12, padding: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { flex: 1 },
});
