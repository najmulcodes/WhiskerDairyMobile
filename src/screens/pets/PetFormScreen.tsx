import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import {
  usePet,
  useCreatePet,
  useUpdatePet,
  CreatePetInput,
} from '../../hooks/usePets';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Loader } from '../../components/Loader';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'PetForm'>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export function PetFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const isEdit = route.params.mode === 'edit';
  const petId = isEdit ? route.params.id : undefined;

  const { data: existingPet, isLoading: petLoading } = usePet(petId ?? '');
  const createPet = useCreatePet();
  const updatePet = useUpdatePet();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown' | ''>('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingPet && isEdit) {
      setName(existingPet.name ?? '');
      setDob(existingPet.dob ?? '');
      setBreed(existingPet.breed ?? '');
      setColor(existingPet.color ?? '');
      setGender((existingPet.gender as typeof gender) ?? '');
      setNotes(existingPet.notes ?? '');
      setImageUrl(existingPet.image ?? null);
    }
  }, [existingPet, isEdit]);

  async function pickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to upload pet photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function showImageOptions() {
    Alert.alert('Pet photo', 'Choose image source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Pet name is required';
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob))
      newErrors.dob = 'Date format must be YYYY-MM-DD';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    let finalImageUrl: string | null = imageUrl;

    if (imageUri) {
      try {
        setUploading(true);
        finalImageUrl = await uploadImageToCloudinary(imageUri);
      } catch (e) {
        Alert.alert(
          'Upload failed',
          e instanceof Error ? e.message : 'Could not upload image'
        );
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const input: CreatePetInput = {
      name: name.trim(),
      dob: dob || undefined,
      breed: breed || undefined,
      color: color || undefined,
      gender: (gender as CreatePetInput['gender']) || undefined,
      notes: notes || undefined,
      image: finalImageUrl || undefined,
    };

    if (isEdit && petId) {
      updatePet.mutate(
        { id: petId, ...input },
        {
          onSuccess: () => navigation.goBack(),
          onError: (e) =>
            Alert.alert(
              'Error',
              e instanceof Error ? e.message : 'Failed to update pet'
            ),
        }
      );
    } else {
      createPet.mutate(input, {
        onSuccess: () => navigation.goBack(),
        onError: (e) =>
          Alert.alert(
            'Error',
            e instanceof Error ? e.message : 'Failed to create pet'
          ),
      });
    }
  }

  if (isEdit && petLoading) {
    return <Loader fullScreen message="Loading pet..." />;
  }

  const isBusy = uploading || createPet.isPending || updatePet.isPending;
  const avatarSrc = imageUri ?? imageUrl ?? null;

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
        {/* Image picker */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            onPress={showImageOptions}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Avatar
              src={avatarSrc}
              name={name || 'Pet'}
              size={100}
              borderRadius={28}
            />
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={18} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>
            {avatarSrc ? 'Tap to change photo' : 'Add pet photo'}
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <Input
            label="Name *"
            placeholder="Milo"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Date of birth (YYYY-MM-DD)"
            placeholder="2022-01-15"
            value={dob}
            onChangeText={setDob}
            error={errors.dob}
            keyboardType="numbers-and-punctuation"
          />

          <Input
            label="Breed"
            placeholder="Labrador"
            value={breed}
            onChangeText={setBreed}
            autoCapitalize="words"
          />

          <Input
            label="Color"
            placeholder="Golden"
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
          />

          {/* Gender selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.genderBtn,
                    gender === opt.value && styles.genderBtnActive,
                  ]}
                  onPress={() =>
                    setGender(gender === opt.value ? '' : opt.value)
                  }
                >
                  <Text
                    style={[
                      styles.genderBtnText,
                      gender === opt.value && styles.genderBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Input
              placeholder="Add anything useful for future reference…"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.textareaInput}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          loading={isBusy}
          style={styles.submitBtn}
        >
          {isEdit ? 'Save changes' : 'Create pet'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: 24, paddingBottom: 20 },
  imageSection: { alignItems: 'center', gap: 8 },
  avatarWrapper: { position: 'relative' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  imageHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  fields: { gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.xl,
    backgroundColor: '#f6eee9',
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  genderBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderBtnTextActive: { color: Colors.primary },
  textareaInput: { minHeight: 100, textAlignVertical: 'top' },
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
