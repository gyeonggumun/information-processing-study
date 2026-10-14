import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeSummaryPreferences } from '../lib/examSummaryPreferences';

const readPreferences = (userId) => supabase.from('exam_summary_preferences')
  .select('card_order, hidden_card_ids').eq('user_id', userId).maybeSingle();

function legacyOrder(userId) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(`exam-summary-order:${userId}`));
    return Array.isArray(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function useExamSummaryPreferences(userId, defaultOrder) {
  const [state, setState] = useState({ userId: null, status: 'loading', preferences: normalizeSummaryPreferences(null, defaultOrder), error: '', saved: false });
  const [isSaving, setIsSaving] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);
  const generation = useRef(0);
  const activeUserId = useRef(userId);
  const savePending = useRef(false);
  activeUserId.current = userId;

  useEffect(() => {
    const requestGeneration = ++generation.current;
    const isCurrent = () => generation.current === requestGeneration && activeUserId.current === userId;
    savePending.current = false;
    setIsSaving(false);
    setState({ userId, status: 'loading', preferences: normalizeSummaryPreferences(null, defaultOrder), error: '', saved: false });

    async function load() {
      try {
        if (!userId) return;
        let result = await readPreferences(userId);
        if (result.error) throw result.error;
        if (!isCurrent()) return;
        const previousOrder = !result.data ? legacyOrder(userId) : null;
        if (previousOrder) {
          const migrated = normalizeSummaryPreferences({ card_order: previousOrder }, defaultOrder);
          // 다른 기기에서 이미 생성한 설정은 덮어쓰지 않습니다.
          const { error } = await supabase.from('exam_summary_preferences').upsert({
            user_id: userId, card_order: migrated.cardOrder, hidden_card_ids: [],
          }, { onConflict: 'user_id', ignoreDuplicates: true });
          if (error) throw error;
          if (!isCurrent()) return;
          result = await readPreferences(userId);
          if (result.error) throw result.error;
        }
        if (isCurrent()) setState({ userId, status: 'ready', preferences: normalizeSummaryPreferences(result.data, defaultOrder), error: '', saved: false });
      } catch {
        if (isCurrent()) setState((current) => ({ ...current, status: 'error', error: '실기 요약 목록을 불러오지 못했습니다. 다시 불러와 주세요.' }));
      }
    }
    load();
    return () => { generation.current += 1; };
  }, [userId, defaultOrder, reloadVersion]);

  const ready = Boolean(userId) && state.userId === userId && state.status === 'ready';
  const persistPreferences = async (next) => {
    if (!ready || savePending.current) return false;
    const requestGeneration = generation.current;
    const isCurrent = () => generation.current === requestGeneration && activeUserId.current === userId;
    const previous = state.preferences;
    savePending.current = true;
    setIsSaving(true);
    setState((current) => ({ ...current, preferences: next, error: '', saved: false }));
    try {
      const { data, error } = await supabase.from('exam_summary_preferences').upsert({
        user_id: userId, card_order: next.cardOrder, hidden_card_ids: next.hiddenCardIds,
      }, { onConflict: 'user_id' }).select('card_order, hidden_card_ids').single();
      if (error) throw error;
      if (!isCurrent()) return false;
      setState((current) => ({ ...current, preferences: normalizeSummaryPreferences(data, defaultOrder), saved: true }));
      return true;
    } catch {
      if (isCurrent()) setState((current) => ({ ...current, preferences: previous, error: '변경을 저장하지 못해 기존 목록으로 되돌렸습니다. 다시 시도해 주세요.' }));
      return false;
    } finally {
      if (isCurrent()) { savePending.current = false; setIsSaving(false); }
    }
  };

  return {
    preferences: state.userId === userId ? state.preferences : normalizeSummaryPreferences(null, defaultOrder),
    isLoading: state.userId !== userId || state.status === 'loading',
    isSaving, hasLoaded: ready, canEdit: ready && !isSaving, error: state.userId === userId ? state.error : '',
    saved: state.userId === userId && state.saved,
    persistPreferences, reload: () => setReloadVersion((version) => version + 1),
  };
}
