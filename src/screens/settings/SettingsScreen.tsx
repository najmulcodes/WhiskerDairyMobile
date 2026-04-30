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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useAuth,
  getUserDisplayName,
  getUserAvatarUrl,
} from '../../context/AuthContext';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '../../lib/supabase';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
  isLast?: boolean;
};

function Row({ icon, label, value, onPress, destructive, rightElement, isLast }: RowProps) {
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
          <Ionicons
            name={icon}
            size={17}
            color={destructive ? Colors.error : Colors.primary}
          />
        </View>
        <View style={styles.rowText}>
          <Text
            style={[styles.rowLabel, destructive && styles.rowLabelDanger]}
          >
            {label}
          </Text>
          {value && <Text style={styles.rowValue}>{value}</Text>}
        </View>
      </View>
      {rightElement ?? (
        onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textMuted}
          />
        ) : null
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export function SettingsScreen() {
  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon="settings-outline"
          title="App configuration required"
          message={SUPABASE_CONFIG_ERROR ?? 'Supabase is not configured.'}
        />
      </SafeAreaView>
    );
  }

  const supabase = getSupabaseClient();
  const { user, signOut } = useAuth();
  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [notifications, setNotifications] = useState(true);

  async function handleSaveName() {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a valid name.');
      return;
    }
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: newName.trim() },
    });
    setSavingName(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEditingName(false);
      Alert.alert('Saved', 'Your name has been updated.');
    }
  }

  async function handleChangePassword() {
    const email = user?.email;
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'A password reset link has been sent to your email address.'
      );
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data including pets, expenses, and records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Contact support',
              'To delete your account, please contact support@whiskerdairy.com'
            ),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenLabel}>Account</Text>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>

        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar
              src={avatarUrl}
              name={displayName}
              size={60}
              borderRadius={18}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberText}>
                  Member since{' '}
                  {user?.created_at
                    ? new Date(user.created_at).getFullYear()
                    : '—'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Edit name inline */}
        {editingName ? (
          <Card style={styles.editNameCard}>
            <Text style={styles.editNameTitle}>Update display name</Text>
            <Input
              value={newName}
              onChangeText={setNewName}
              placeholder="Your name"
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.editNameActions}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  setEditingName(false);
                  setNewName(displayName);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={savingName}
                onPress={handleSaveName}
                style={{ flex: 1 }}
              >
                Save name
              </Button>
            </View>
          </Card>
        ) : null}

        {/* Profile section */}
        <Section title="Profile">
          <Row
            icon="person-outline"
            label="Display name"
            value={displayName}
            onPress={() => setEditingName(true)}
          />
          <Row
            icon="mail-outline"
            label="Email"
            value={user?.email}
            isLast
          />
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            icon="lock-closed-outline"
            label="Change password"
            onPress={handleChangePassword}
          />
          <Row
            icon="shield-checkmark-outline"
            label="Two-factor authentication"
            value="Not available in app"
            isLast
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <Row
            icon="notifications-outline"
            label="Push notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.gray200, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            }
          />
          <Row
            icon="globe-outline"
            label="Currency"
            value="BDT (Bangladeshi Taka)"
            isLast
          />
        </Section>

        {/* About */}
        <Section title="About">
          <Row
            icon="information-circle-outline"
            label="App version"
            value="1.0.0"
          />
          <Row
            icon="document-text-outline"
            label="Privacy policy"
            onPress={() =>
              Alert.alert('Privacy Policy', 'Visit our website for the full privacy policy.')
            }
          />
          <Row
            icon="help-circle-outline"
            label="Support"
            value="support@whiskerdairy.com"
            onPress={() =>
              Alert.alert('Support', 'Email us at support@whiskerdairy.com')
            }
            isLast
          />
        </Section>

        {/* Danger zone */}
        <Section title="Account actions">
          <Row
            icon="log-out-outline"
            label="Sign out"
            onPress={handleSignOut}
          />
          <Row
            icon="trash-outline"
            label="Delete account"
            onPress={handleDeleteAccount}
            destructive
            isLast
          />
        </Section>

        <Text style={styles.footer}>Whisker Dairy · Made with ❤️ for pet owners</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, gap: 20, paddingBottom: 48 },
  screenHeader: { gap: 4 },
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
  },
  profileCard: { padding: 16 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  memberText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  editNameCard: {
    padding: 16,
    gap: 12,
  },
  editNameTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editNameActions: {
    flexDirection: 'row',
    gap: 10,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: Colors.errorBg,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rowLabelDanger: { color: Colors.error },
  rowValue: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
