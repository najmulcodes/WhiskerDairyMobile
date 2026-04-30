import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';

type AuthView = 'signin' | 'signup';

const highlights = [
  '🐾  Track pet care, vaccinations & daily details',
  '💰  Keep expenses tidy in one place',
  '🔔  Get reminders for medications & vaccines',
];

export function AuthScreen() {
  const [view, setView] = useState<AuthView>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (view === 'signup' && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (view === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
          },
        });

        if (error) {
          Alert.alert('Sign up failed', error.message);
          return;
        }

        Alert.alert(
          'Check your email',
          'We sent a verification link to your email. Please verify before signing in.',
          [{ text: 'OK', onPress: () => setView('signin') }]
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Sign in failed', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter email', 'Please enter your email address first.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Reset link sent',
        'Check your email for a password reset link.'
      );
    }
  }

  function switchView(nextView: AuthView) {
    setView(nextView);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  }

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.formCard, styles.configCard]}>
          <EmptyState
            icon="settings-outline"
            title="App configuration required"
            message={SUPABASE_CONFIG_ERROR ?? 'Supabase is not configured.'}
          />
        </View>
      </SafeAreaView>
    );
  }

  const supabase = getSupabaseClient();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.appName}>🐱 Whisker Dairy</Text>
            <Text style={styles.headerTitle}>
              {view === 'signin' ? 'Welcome back!' : 'Create your account'}
            </Text>
            <Text style={styles.headerSub}>
              Your pet care workspace, organized.
            </Text>

            <View style={styles.highlights}>
              {highlights.map((h) => (
                <View key={h} style={styles.highlightRow}>
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* View toggle */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, view === 'signin' && styles.tabActive]}
                onPress={() => switchView('signin')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    view === 'signin' && styles.tabLabelActive,
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, view === 'signup' && styles.tabActive]}
                onPress={() => switchView('signup')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    view === 'signup' && styles.tabLabelActive,
                  ]}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fields}>
              {view === 'signup' && (
                <Input
                  label="Full name"
                  placeholder="Your full name"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />
              )}

              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                isPassword
                autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                returnKeyType={view === 'signup' ? 'next' : 'done'}
                onSubmitEditing={view === 'signin' ? handleSubmit : undefined}
              />

              {view === 'signin' && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotRow}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {view === 'signup' && (
                <Input
                  label="Confirm password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={errors.confirmPassword}
                  isPassword
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              )}
            </View>

            <Button
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            >
              {view === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gradientEnd,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    gap: 8,
  },
  appName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: FontSize.display,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 38,
  },
  headerSub: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 16,
  },
  highlights: {
    gap: 8,
  },
  highlightRow: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  highlightText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: 20,
    marginTop: -12,
  },
  configCard: {
    flex: 1,
    marginTop: 0,
    borderRadius: 0,
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  fields: {
    gap: 14,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 4,
  },
});
