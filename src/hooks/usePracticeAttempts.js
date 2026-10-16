import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { loadPracticeAttempts, mergeAttempts, practiceKey, PRACTICE_CHANGED_EVENT, PRACTICE_STORAGE_KEY } from '../lib/practiceHistory';

const EMPTY_ATTEMPTS = [];

export function usePracticeAttempts() {
  const { user } = useAuth();
  const userId = user?.id;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ userId: null, attempts: null, error: '' });

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const savedDuringLoad = [];
    const onSaved = ({ detail }) => {
      if (detail?.user_id !== userId) return;
      savedDuringLoad.push(detail);
      setState((previous) => previous.userId === userId && previous.attempts
        ? { ...previous, attempts: mergeAttempts(previous.attempts, [detail]) } : previous);
    };
    const refresh = () => { if (document.visibilityState === 'visible') setRevision((value) => value + 1); };
    const onStorage = (event) => { if (event.key === PRACTICE_STORAGE_KEY) refresh(); };
    window.addEventListener(PRACTICE_CHANGED_EVENT, onSaved);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', refresh);
    loadPracticeAttempts(supabase, userId, controller.signal).then((attempts) => {
      if (!controller.signal.aborted) setState({ userId, attempts: mergeAttempts(attempts, savedDuringLoad), error: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setState((previous) => ({ userId, attempts: previous.userId === userId ? previous.attempts : null, error: '풀이 기록을 불러오지 못했습니다. 다시 불러온 후 진행해주세요.' }));
    });
    return () => {
      controller.abort();
      window.removeEventListener(PRACTICE_CHANGED_EVENT, onSaved);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [userId, revision]);

  const attempts = state.userId === userId ? state.attempts : null;
  const completedKeys = useMemo(() => new Set((attempts ?? EMPTY_ATTEMPTS).map((attempt) => practiceKey(attempt.practice_type, attempt.question_id))), [attempts]);
  return { attempts: attempts ?? EMPTY_ATTEMPTS, completedKeys, isLoading: attempts === null, error: state.userId === userId ? state.error : '', refresh: () => setRevision((value) => value + 1) };
}
