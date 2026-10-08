import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export const AUTH_RETURN_TO_KEY = 'study:auth-return-to';
export const ACCOUNT_DELETION_NOTICE_KEY = 'study:account-deletion-notice';

export function getSafeReturnPath(path) {
  const target = typeof path === 'string' ? path : '/study';
  const pathname = target.split(/[?#]/, 1)[0];
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\') || pathname === '/profile/setup') return '/study';
  return target;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState('');
  const [appRole, setAppRole] = useState('user');
  const [nicknameUserId, setNicknameUserId] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [accountStateUserId, setAccountStateUserId] = useState(null);
  const [accountRestorationState, setAccountRestorationState] = useState('idle');
  const [accountRestored, setAccountRestored] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const isAccountStateLoading = Boolean(userId && (accountStateUserId !== userId || accountRestorationState === 'checking' || accountRestorationState === 'expired'));
  const isLoading = isAuthLoading || isAccountStateLoading || Boolean(userId && nicknameUserId !== userId);
  const currentNickname = userId && nicknameUserId === userId ? nickname : '';
  const hasNickname = Boolean(currentNickname);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setNickname('');
      setAppRole('user');
      setNicknameUserId(null);
      return () => { isMounted = false; };
    }

    setNickname('');
    setAppRole('user');
    setNicknameUserId(null);
    const loadNickname = async () => {
      const [{ data, error }, roleResult] = await Promise.all([
        supabase.rpc('get_my_nickname'),
        supabase.rpc('get_my_app_role'),
      ]);
      if (!isMounted) return;
      setNickname(error || typeof data !== 'string' ? '' : data);
      setAppRole(!roleResult.error && roleResult.data === 'admin' ? 'admin' : 'user');
      setNicknameUserId(userId);
    };
    loadNickname().catch(() => {
      if (!isMounted) return;
      setNickname('');
      setAppRole('user');
      setNicknameUserId(userId);
    });

    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setAccountStateUserId(null);
      setAccountRestorationState('idle');
      setAccountRestored(false);
      return () => { isMounted = false; };
    }

    setAccountRestorationState('checking');
    const restoreAccount = async () => {
      try {
        const { data, error } = await supabase.rpc('restore_account_deletion');
        if (!isMounted) return;
        if (error) throw error;

        if (data === 'expired' || data === 'inactive-expired') {
          setAccountStateUserId(userId);
          setAccountRestorationState('expired');
          window.sessionStorage.setItem(ACCOUNT_DELETION_NOTICE_KEY, data);
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
          if (signOutError) await supabase.auth.signOut({ scope: 'local' });
          return;
        }

        setAccountStateUserId(userId);
        setAccountRestorationState(data === 'restored' ? 'restored' : 'none');
        if (data === 'restored') setAccountRestored(true);
      } catch {
        if (!isMounted) return;
        window.sessionStorage.setItem(ACCOUNT_DELETION_NOTICE_KEY, 'check-failed');
        await supabase.auth.signOut({ scope: 'local' });
      }
    };

    restoreAccount();
    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || isAccountStateLoading) return undefined;
    let lastAttempt = Date.now(); // The restoration RPC has already recorded this visit.
    let pending = false;
    let isMounted = true;

    const recordActivity = async () => {
      if (document.visibilityState !== 'visible' || pending || Date.now() - lastAttempt < 60 * 60 * 1000) return;
      lastAttempt = Date.now();
      pending = true;
      const { data, error } = await supabase.rpc('touch_account_activity');
      pending = false;
      if (!isMounted) return;
      if (error) {
        lastAttempt = Date.now() - 59 * 60 * 1000; // Retry after one minute.
      } else if (data === false) {
        window.sessionStorage.setItem(ACCOUNT_DELETION_NOTICE_KEY, 'inactive-expired');
        await supabase.auth.signOut({ scope: 'local' });
      }
    };

    document.addEventListener('visibilitychange', recordActivity);
    document.addEventListener('pointerdown', recordActivity);
    document.addEventListener('keydown', recordActivity);
    window.addEventListener('focus', recordActivity);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', recordActivity);
      document.removeEventListener('pointerdown', recordActivity);
      document.removeEventListener('keydown', recordActivity);
      window.removeEventListener('focus', recordActivity);
    };
  }, [userId, isAccountStateLoading]);

  const loginWithGoogle = async (returnTo = '/study') => {
    window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, getSafeReturnPath(returnTo));
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (result.error) window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return result;
  };

  const checkNicknameAvailability = async (nextNickname) => {
    const { data, error } = await supabase.rpc('check_nickname_availability', { p_nickname: nextNickname });
    return { available: data === true, error };
  };

  const updateNickname = async (nextNickname) => {
    const { data, error } = await supabase.rpc('save_nickname', { p_nickname: nextNickname });
    if (!error && typeof data === 'string') setNickname(data);
    return { error };
  };

  const deleteAccount = async () => {
    const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return { error };
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    return { error: signOutError, scheduledFor: data?.scheduledFor };
  };

  const logout = () => {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, nickname: currentNickname, appRole: userId && nicknameUserId === userId ? appRole : 'user', hasNickname, isLoggedIn: Boolean(session), isLoading, accountRestored, dismissAccountRestored: () => setAccountRestored(false), loginWithGoogle, checkNicknameAvailability, updateNickname, deleteAccount, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  return context;
}
