import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { createIdleSessionStore, getIdleSessionId } from '../lib/idleSession';
import { createSingleSessionStore } from '../lib/singleSession';

const AuthContext = createContext(null);
export const AUTH_RETURN_TO_KEY = 'study:auth-return-to';
export const ACCOUNT_DELETION_NOTICE_KEY = 'study:account-deletion-notice';
const IDLE_LOGOUT_NOTICE_KEY = 'study:idle-logout-notice';
const EMPTY_IDLE_STORE = { subscribe: () => () => {}, getSnapshot: () => 3600 };
const SINGLE_SESSION_NOTICE_KEY = 'study:single-session-notice';
const EMPTY_SINGLE_SESSION_STORE = { subscribe: () => () => {}, getSnapshot: () => 'none' };

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
  const [idleLogoutNotice, setIdleLogoutNotice] = useState(() => {
    try { return window.sessionStorage.getItem(IDLE_LOGOUT_NOTICE_KEY) === 'expired'; } catch { return false; }
  });
  const [singleSessionNotice, setSingleSessionNotice] = useState(() => {
    try { return window.sessionStorage.getItem(SINGLE_SESSION_NOTICE_KEY) ?? ''; } catch { return ''; }
  });

  useEffect(() => {
    let isMounted = true;
    let hasAuthEvent = false;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted || hasAuthEvent) return;
      setSession(currentSession);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hasAuthEvent = true;
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const expireIdleSession = useCallback(() => {
    // 서버 응답을 기다리지 않고 앱의 로그인 상태와 보호 화면을 먼저 차단합니다.
    setSession(null);
    setIdleLogoutNotice(true);
    try {
      window.sessionStorage.setItem(IDLE_LOGOUT_NOTICE_KEY, 'expired');
      window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    } catch { /* 브라우저 저장소가 제한돼도 로그아웃은 계속 진행합니다. */ }
    void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }, []);
  const sessionUserId = session?.user?.id ?? null;
  const idleSessionId = session ? getIdleSessionId(session) : null;
  const expireSingleSession = useCallback((reason) => {
    setSession(null);
    setSingleSessionNotice(reason);
    try {
      window.sessionStorage.setItem(SINGLE_SESSION_NOTICE_KEY, reason);
      window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    } catch { /* 저장소가 제한돼도 보호 화면은 차단합니다. */ }
    // 이전 기기의 종료가 새 기기까지 로그아웃시키지 않도록 local 범위만 사용합니다.
    void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }, []);
  const singleSessionStore = useMemo(() => sessionUserId ? createSingleSessionStore({ checkSession: () => supabase.rpc('check_single_session').abortSignal(AbortSignal.timeout(10_000)), onExpire: expireSingleSession }) : null, [sessionUserId, idleSessionId, expireSingleSession]);
  const singleAuthStore = singleSessionStore ?? EMPTY_SINGLE_SESSION_STORE;
  const singleSessionState = useSyncExternalStore(singleAuthStore.subscribe, singleAuthStore.getSnapshot, singleAuthStore.getSnapshot);
  useEffect(() => singleSessionStore?.start(), [singleSessionStore]);
  const idleSessionStore = useMemo(() => sessionUserId ? createIdleSessionStore({ userId: sessionUserId, sessionId: idleSessionId, onExpire: expireIdleSession }) : null, [sessionUserId, idleSessionId, expireIdleSession]);
  const idleAuthStore = idleSessionStore ?? EMPTY_IDLE_STORE;
  const getIsIdleExpired = useCallback(() => idleAuthStore.getSnapshot() === 0, [idleAuthStore]);
  const isIdleExpired = useSyncExternalStore(idleAuthStore.subscribe, getIsIdleExpired, getIsIdleExpired);

  useEffect(() => idleSessionStore?.start(), [idleSessionStore]);

  // 새로고침 시 이미 만료된 세션은 닉네임·계정 확인 RPC에도 사용하지 않습니다.
  const user = isIdleExpired || singleSessionState !== 'active' ? null : session?.user ?? null;
  const userId = user?.id ?? null;
  const isAccountStateLoading = Boolean(userId && (accountStateUserId !== userId || accountRestorationState === 'checking' || accountRestorationState === 'expired'));
  const isLoading = isAuthLoading || Boolean(sessionUserId && singleSessionState === 'checking') || isAccountStateLoading || Boolean(userId && nicknameUserId !== userId);
  const currentNickname = userId && nicknameUserId === userId ? nickname : '';
  const hasNickname = Boolean(currentNickname);

  useEffect(() => {
    if (!userId || idleSessionStore?.getSnapshot() === 0) return;
    setIdleLogoutNotice(false);
    try { window.sessionStorage.removeItem(IDLE_LOGOUT_NOTICE_KEY); } catch { /* 안내 저장은 선택 사항입니다. */ }
  }, [userId, idleSessionStore]);

  const dismissIdleLogoutNotice = () => {
    setIdleLogoutNotice(false);
    try { window.sessionStorage.removeItem(IDLE_LOGOUT_NOTICE_KEY); } catch { /* 안내 저장은 선택 사항입니다. */ }
  };
  const dismissSingleSessionNotice = () => {
    setSingleSessionNotice('');
    try { window.sessionStorage.removeItem(SINGLE_SESSION_NOTICE_KEY); } catch { /* 안내 저장은 선택 사항입니다. */ }
  };
  useEffect(() => {
    if (!userId) return;
    setSingleSessionNotice('');
    try { window.sessionStorage.removeItem(SINGLE_SESSION_NOTICE_KEY); } catch { /* 안내 저장은 선택 사항입니다. */ }
  }, [userId]);

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
    return supabase.auth.signOut({ scope: 'local' });
  };

  return <AuthContext.Provider value={{ user, nickname: currentNickname, appRole: userId && nicknameUserId === userId ? appRole : 'user', hasNickname, isLoggedIn: Boolean(user), isLoading, idleSessionStore, idleLogoutNotice, dismissIdleLogoutNotice, singleSessionNotice, dismissSingleSessionNotice, accountRestored, dismissAccountRestored: () => setAccountRestored(false), loginWithGoogle, checkNicknameAvailability, updateNickname, deleteAccount, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  return context;
}
