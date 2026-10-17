import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Colors, FontSize, Radius, Spacing } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { RESET_OTP_LENGTH, SIGNUP_OTP_LENGTH } from '../../lib/otp';

type AuthView = 'signin' | 'signup' | 'verify' | 'reset';
const RESEND_COOLDOWN_SECONDS = 60;

const NETWORK_ERROR_MESSAGE = 'Network error. Check your connection and try again.';
const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a minute and try again.';

function isNetworkError(error: unknown): boolean {
  return (
    isAuthRetryableFetchError(error) ||
    (error instanceof Error && /network request failed|failed to fetch/i.test(error.message))
  );
}

function isRateLimited(error: AuthError): boolean {
  return (
    error.status === 429 ||
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit'
  );
}

function describeAuthError(error: AuthError): string {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  if (isRateLimited(error)) return RATE_LIMIT_MESSAGE;
  return error.message;
}

const highlights = [
  '🐾  Track pet care, vaccinations & daily details',
  '💰  Keep expenses tidy in one place',
  '🔔  Get reminders for medications & vaccines',
];

export function AuthScreen() {
  const { beginRecovery, endRecovery } = useAuth();
  const [view, setView] = useState<AuthView>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [originView, setOriginView] = useState<'signin' | 'signup'>('signup');

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Android hardware back on the verify step returns to the form
  useEffect(() => {
    if (view !== 'verify' && view !== 'reset') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'reset') leaveReset();
      else handleChangeEmail();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, originView]);

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
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
          },
        });

        if (error) {
          if (error.code === 'user_already_exists' || error.code === 'email_exists') {
            showAlreadyRegistered();
          } else {
            Alert.alert('Sign up failed', describeAuthError(error));
          }
          return;
        }

        // Email confirmation off: a session exists and auth state takes over.
        if (data.session) return;

        // Supabase hides existing accounts: a repeat signup returns a user with no identities.
        if (data.user && data.user.identities?.length === 0) {
          showAlreadyRegistered();
          return;
        }

        startVerify('signup', RESEND_COOLDOWN_SECONDS);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email.trim(),
            });
            startVerify('signin', resendError && !isRateLimited(resendError) ? 0 : RESEND_COOLDOWN_SECONDS);
            if (resendError) {
              Alert.alert(
                'Code not sent',
                isRateLimited(resendError)
                  ? 'A code was sent recently. Check your inbox, or wait before requesting another.'
                  : describeAuthError(resendError)
              );
            }
          } else {
            Alert.alert('Sign in failed', describeAuthError(error));
          }
        }
      }
    } catch {
      Alert.alert('Something went wrong', NETWORK_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  function showAlreadyRegistered() {
    Alert.alert(
      'Account already exists',
      'An account with this email already exists. Please sign in instead.',
      [{ text: 'OK', onPress: () => switchView('signin') }]
    );
  }

  function startVerify(origin: 'signin' | 'signup', cooldownSeconds: number) {
    setOriginView(origin);
    setCode('');
    setErrors({});
    setCooldown(cooldownSeconds);
    setView('verify');
  }

  function handleChangeEmail() {
    setCode('');
    setErrors({});
    setCooldown(0);
    setView(originView);
  }

  async function handleVerify() {
    if (code.length !== SIGNUP_OTP_LENGTH) {
      setErrors({ code: `Enter the ${SIGNUP_OTP_LENGTH}-digit code` });
      return;
    }
    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'signup',
      });

      if (error) {
        // Supabase returns the same error for a wrong and an expired code.
        const message =
          isNetworkError(error) || isRateLimited(error)
            ? describeAuthError(error)
            : 'That code is incorrect or has expired. Check the code or request a new one.';
        setErrors({ code: message });
      }
      // On success AuthContext receives the session and navigation switches automatically.
    } catch {
      setErrors({ code: NETWORK_ERROR_MESSAGE });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);

    try {
      const { error } =
        view === 'reset'
          ? await supabase.auth.resetPasswordForEmail(email.trim())
          : await supabase.auth.resend({ type: 'signup', email: email.trim() });

      if (error) {
        if (isRateLimited(error)) setCooldown(RESEND_COOLDOWN_SECONDS);
        Alert.alert('Could not resend code', describeAuthError(error));
        return;
      }

      setCode('');
      setErrors({});
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Code sent', 'We sent a new code to your email.');
    } catch {
      Alert.alert('Could not resend code', NETWORK_ERROR_MESSAGE);
    } finally {
      setResending(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        Alert.alert('Could not send code', describeAuthError(error));
        return;
      }
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setView('reset');
    } catch {
      Alert.alert('Could not send code', NETWORK_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  function leaveReset() {
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setCooldown(0);
    setView('signin');
  }

  async function handleResetPassword() {
    const newErrors: Record<string, string> = {};
    if (code.length !== RESET_OTP_LENGTH) {
      newErrors.code = `Enter the ${RESET_OTP_LENGTH}-digit code`;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    // verifyOtp opens a session; keep the app gated until the new password is saved.
    beginRecovery();
    let verified = false;

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'recovery',
      });

      if (verifyError) {
        setErrors({
          code:
            isNetworkError(verifyError) || isRateLimited(verifyError)
              ? describeAuthError(verifyError)
              : 'That code is incorrect or has expired. Check the code or request a new one.',
        });
        return;
      }
      verified = true;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        await supabase.auth.signOut();
        verified = false;
        setErrors({
          password:
            updateError.code === 'same_password'
              ? 'New password must be different from your old password.'
              : describeAuthError(updateError),
        });
        return;
      }

      Alert.alert('Password updated', 'You are now signed in with your new password.');
    } catch {
      if (verified) await supabase.auth.signOut().catch(() => undefined);
      setErrors({ code: NETWORK_ERROR_MESSAGE });
      verified = false;
    } finally {
      // Releases the gate; on success the session opens the app, otherwise the user stays here.
      await endRecovery();
      setLoading(false);
    }
  }

  function switchView(nextView: 'signin' | 'signup') {
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
              {view === 'signin'
                ? 'Welcome back!'
                : view === 'signup'
                ? 'Create your account'
                : view === 'reset'
                ? 'Reset your password'
                : 'Verify your email'}
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
          {view === 'reset' ? (
            <View style={styles.formCard}>
              <Text style={styles.verifyText}>
                {`We sent a ${RESET_OTP_LENGTH}-digit code to ${email.trim()}. Enter it below and choose a new password.`}
              </Text>

              <Input
                label="Reset code"
                placeholder={'0'.repeat(RESET_OTP_LENGTH)}
                value={code}
                onChangeText={(t) =>
                  setCode(t.replace(/\D/g, '').slice(0, RESET_OTP_LENGTH))
                }
                error={errors.code}
                keyboardType="number-pad"
                maxLength={RESET_OTP_LENGTH}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoFocus
                returnKeyType="next"
                style={styles.codeInput}
              />

              <Input
                label="New password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                isPassword
                autoComplete="new-password"
                returnKeyType="next"
              />

              <Input
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                isPassword
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />

              <Button
                onPress={handleResetPassword}
                loading={loading}
                size="lg"
                style={styles.submitBtn}
              >
                Reset password
              </Button>

              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0 || resending}
                style={styles.verifyLinkRow}
              >
                <Text
                  style={[
                    styles.verifyLink,
                    (cooldown > 0 || resending) && styles.verifyLinkDisabled,
                  ]}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={leaveReset} style={styles.verifyLinkRow}>
                <Text style={styles.verifyLink}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : view === 'verify' ? (
            <View style={styles.formCard}>
              <Text style={styles.verifyText}>
                {`We sent a ${SIGNUP_OTP_LENGTH}-digit code to ${email.trim()}. Enter it below to verify your email.`}
              </Text>

              <Input
                label="Verification code"
                placeholder={'0'.repeat(SIGNUP_OTP_LENGTH)}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, SIGNUP_OTP_LENGTH))}
                error={errors.code}
                keyboardType="number-pad"
                maxLength={SIGNUP_OTP_LENGTH}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                style={styles.codeInput}
              />

              <Button
                onPress={handleVerify}
                loading={loading}
                size="lg"
                style={styles.submitBtn}
              >
                Verify
              </Button>

              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0 || resending}
                style={styles.verifyLinkRow}
              >
                <Text
                  style={[
                    styles.verifyLink,
                    (cooldown > 0 || resending) && styles.verifyLinkDisabled,
                  ]}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleChangeEmail} style={styles.verifyLinkRow}>
                <Text style={styles.verifyLink}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
          )}
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
  verifyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  verifyLinkRow: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  verifyLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  verifyLinkDisabled: {
    color: Colors.textMuted,
  },
});
