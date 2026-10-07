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

function getUserNickname(user) {
  const nickname = user?.user_metadata?.nickname;
  return typeof nickname === 'string' ? nickname.trim() : '';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const nickname = getUserNickname(user);
  const hasNickname = Boolean(nickname);

  const loginWithGoogle = async (returnTo = '/study') => {
    window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, getSafeReturnPath(returnTo));
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (result.error) window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return result;
  };

  const updateNickname = async (nextNickname) => {
    const { data, error } = await supabase.auth.updateUser({ data: { nickname: nextNickname } });
    if (!error && data.user) {
      setSession((current) => current ? { ...current, user: data.user } : current);
    }
    return { error };
  };

  const logout = () => {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, nickname, hasNickname, isLoggedIn: Boolean(session), isLoading, loginWithGoogle, updateNickname, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  return context;
}
