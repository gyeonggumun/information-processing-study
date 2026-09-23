import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'jeongcheogi-lab-demo-user-v1';
const DEMO_ACCOUNT = { email: 'study@jeongcheogi.dev', password: 'practice2026', name: '학습자' };

function getStoredUser() {
  try {
    const storedUser = window.localStorage.getItem(STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = ({ email, password }) => {
    if (email.trim().toLowerCase() !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
      return { ok: false, message: '체험 계정 정보를 다시 확인해주세요.' };
    }

    const nextUser = { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return { ok: true };
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoggedIn: Boolean(user), login, logout, demoAccount: DEMO_ACCOUNT }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  return context;
}
