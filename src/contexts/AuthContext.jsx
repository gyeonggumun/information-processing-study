import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export const AUTH_RETURN_TO_KEY = 'study:auth-return-to';

export function getSafeReturnPath(path) {
  const target = typeof path === 'string' ? path : '/study';
  const pathname = target.split(/[?#]/, 1)[0];
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\') || pathname === '/profile/setup') return '/study';
  return target;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState('');
  const [nicknameUserId, setNicknameUserId] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
  const isLoading = isAuthLoading || Boolean(userId && nicknameUserId !== userId);
  const currentNickname = userId && nicknameUserId === userId ? nickname : '';
  const hasNickname = Boolean(currentNickname);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      setNickname('');
      setNicknameUserId(null);
      return () => { isMounted = false; };
    }

    setNickname('');
    setNicknameUserId(null);
    const loadNickname = async () => {
      const { data, error } = await supabase.rpc('get_my_nickname');
      if (!isMounted) return;
      setNickname(error || typeof data !== 'string' ? '' : data);
      setNicknameUserId(userId);
    };
    loadNickname().catch(() => {
      if (!isMounted) return;
      setNickname('');
      setNicknameUserId(userId);
    });

    return () => { isMounted = false; };
  }, [userId]);

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
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return { error };
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    return { error: signOutError };
  };

  const logout = () => {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, nickname: currentNickname, hasNickname, isLoggedIn: Boolean(session), isLoading, loginWithGoogle, checkNicknameAvailability, updateNickname, deleteAccount, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  return context;
}
