import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { setAccessToken } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        const s = data.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
        setAccessToken(s?.access_token ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        setAccessToken(s?.access_token ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      setAccessToken(null);
      return;
    }

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function getUserDisplayName(user: User | null): string {
  return (
    (user?.user_metadata?.name as string) ||
    user?.email?.split('@')[0] ||
    'User'
  );
}

export function getUserAvatarUrl(user: User | null): string | null {
  return (
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null
  );
}
