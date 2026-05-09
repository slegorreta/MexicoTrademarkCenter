import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => { await fetchProfile(session.user.id); })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Idle auto-logout: active only when a user session exists
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        supabase.auth.signOut();
      }, IDLE_TIMEOUT_MS);
    };

    resetTimer();
    IDLE_EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

    // Also sign out when tab/window is closed or navigated away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
          supabase.auth.signOut();
        }, IDLE_TIMEOUT_MS);
      } else {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      IDLE_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'client',
      });
    }
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const staffRoles = ['super_admin', 'admin', 'docketing_staff', 'filing_staff', 'read_only'];
  const adminRoles = ['super_admin', 'admin'];

  const isAdmin = profile ? adminRoles.includes(profile.role) : false;
  const isStaff = profile ? staffRoles.includes(profile.role) : false;

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
