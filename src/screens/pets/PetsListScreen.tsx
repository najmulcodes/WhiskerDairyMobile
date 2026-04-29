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


import { usePets, useDeletePet, Pet, calcAge } from '../../hooks/usePets';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Loader } from '../../components/Loader';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { TabScreenNavProp } from '../../navigation/types';

type NavProp = TabScreenNavProp<'Pets'>;

function PetCard({ pet, onView, onEdit, onDelete }: {
  pet: Pet;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.petCard}
      onPress={onView}
      activeOpacity={0.8}
    >
      <View style={styles.petCardHeader}>
        <Avatar
          src={pet.image}
          name={pet.name}
          size={56}
          borderRadius={16}
        />
        <View style={styles.petCardInfo}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>
            {pet.breed || 'No breed specified'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={calcAge(pet.dob)} variant="primary" />
            {pet.gender && (
              <Badge
                label={pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}
                variant="success"
              />
            )}
            {pet.color && (
              <Badge label={pet.color} variant="neutral" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>

      {pet.notes && (
        <Text style={styles.petNotes} numberOfLines={2}>
          {pet.notes}
        </Text>
      )}

      <View style={styles.petActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={15} color={Colors.error} />
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function PetsListScreen() {
  const navigation = useNavigation<NavProp>();
  const { data: pets, isLoading, error, refetch } = usePets();
  const deletePet = useDeletePet();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(pet: Pet) {
    Alert.alert(
      `Delete ${pet.name}?`,
      `All records, photos, and history for ${pet.name} will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeletingId(pet.id);
            deletePet.mutate(pet.id, {
              onSettled: () => setDeletingId(null),
              onError: () => Alert.alert('Error', 'Failed to delete pet.'),
            });
          },
        },
      ]
    );
  }

  if (isLoading) return <Loader fullScreen message="Loading pets..." />;

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="alert-circle-outline"
          title="Failed to load pets"
          message="Check your connection and try again."
          action={
            <Button onPress={() => refetch()} variant="secondary">
              Retry
            </Button>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={pets}
        keyExtractor={(pet) => pet.id}
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
          <View style={styles.header}>
            <View>
              <Text style={styles.screenLabel}>Pets</Text>
              <Text style={styles.screenTitle}>Pet profiles</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('PetForm', { mode: 'add' })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={Colors.white} />
              <Text style={styles.addButtonText}>Add pet</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title="No pets yet"
            message="Add your first pet to start tracking care records, vaccinations, and notes."
            action={
              <Button
                onPress={() => navigation.navigate('PetForm', { mode: 'add' })}
              >
                Add first pet
              </Button>
            }
          />
        }
        renderItem={({ item: pet }) => (
          <PetCard
            pet={pet}
            onView={() =>
              navigation.navigate('PetDetail', {
                id: pet.id,
                name: pet.name,
              })
            }
            onEdit={() =>
              navigation.navigate('PetForm', {
                mode: 'edit',
                id: pet.id,
              })
            }
            onDelete={() => handleDelete(pet)}
          />
        )}
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
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
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
  petCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    padding: 16,
    gap: 12,
    shadowColor: '#221a16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  petCardInfo: {
    flex: 1,
    gap: 4,
  },
  petName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  petBreed: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  petNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: 12,
  },
  petActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteBtn: {
    backgroundColor: Colors.errorBg,
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    color: Colors.error,
  },
});
