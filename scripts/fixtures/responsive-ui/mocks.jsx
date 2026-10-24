import { createContext, useContext, useEffect, useState } from 'react';
import { subjects, codeQuestions, practiceQuestions } from '../../../src/data/studyData';
import { defaultSummaryOrder } from '../../../src/data/examSummaryCatalog';
const noop = () => {};
const identity = createContext(null);
export const AUTH_RETURN_TO_KEY = 'responsive-fixture-return-only';
export const ACCOUNT_DELETION_NOTICE_KEY = 'responsive-fixture-deletion-only';
export const getSafeReturnPath = value => value?.startsWith('/') ? value : '/study';
const store = { subscribe: () => noop, getSnapshot: () => 3599 };
export function FixtureIdentity({ children }) {
  const [role, setRole] = useState('pro');
  const auth = { user: role === 'guest' ? null : { id: 'fixture-user', email: 'responsive-only@example.invalid' }, appRole: role, isLoading: false, isLoggedIn: role !== 'guest', hasNickname: true, nickname: '반응형확인긴닉네임', idleSessionStore: role === 'admin' || role === 'guest' ? null : store,
    checkNicknameAvailability: async () => ({ available: true }), updateNickname: async () => ({}), loginWithGoogle: async () => ({ error: new Error('검증 화면은 실제 로그인을 하지 않습니다.') }), logout: async () => setRole('guest'), deleteAccount: async () => { throw new Error('실제 계정 작업은 금지됩니다.'); } };
  return <identity.Provider value={auth}><div className="responsive-fixture-controls"><label>검증 권한 <select value={role} onChange={event => setRole(event.target.value)}><option value="pro">Pro</option><option value="user">User</option><option value="admin">Admin</option><option value="guest">비로그인</option></select></label></div>{children}</identity.Provider>;
}
export const useAuth = () => useContext(identity);
const favorites = subjects.map(subject => ({ subject_id: subject.id, material_id: subject.materials.find(m => m.studyRole !== 'overview')?.id }));
export const useFavorites = () => ({ favorites, isLoading: false, error: '', isReordering: false, isFavorite: id => favorites.some(f => f.material_id === id), toggleFavorite: noop, reorderFavorites: noop });
const attempts = [...Object.entries(codeQuestions).flatMap(([type, questions]) => questions.slice(0, 3).map((q, i) => ({ id: `${type}-${i}`, practice_type: type, question_id: q.id, is_correct: i % 2 === 0, created_at: '2026-10-20T01:00:00Z' }))), ...practiceQuestions.slice(0, 3).map((q, i) => ({ id: `exam-${i}`, practice_type: 'exam', question_id: q.id, is_correct: false, created_at: '2026-10-20T01:00:00Z' }))];
const savedAttempts = [];
export const usePracticeAttempts = () => {
  const [, update] = useState(0);
  useEffect(() => {
    const refresh = () => update(n => n + 1);
    window.addEventListener('study:practice-attempt-saved', refresh);
    return () => window.removeEventListener('study:practice-attempt-saved', refresh);
  }, []);
  const records = [...savedAttempts, ...attempts];
  return { attempts: records, completedKeys: new Set(records.map(a => `${a.practice_type}:${a.question_id}`)), isLoading: false, error: '', refresh: noop };
};
const preferences = { cardOrder: defaultSummaryOrder, hiddenCardIds: [] };
export const useExamSummaryPreferences = () => ({ preferences, isLoading: false, isSaving: false, hasLoaded: true, canEdit: true, saved: false, error: '', persistPreferences: noop, reload: noop });
const inquiries = [{ id: 'fixture-inquiry', title: '모바일 화면에서 긴 제목과 문의 내용을 확인하기 위한 검증 문의', body: '긴단어withoutbreak0123456789012345678901234567890123456789\n학습 표와 버튼이 화면 밖으로 나가지 않는지 확인합니다.', category: 'general', status: 'answered', created_at: '2026-10-20T01:00:00Z', updated_at: '2026-10-20T01:00:00Z', answer: '모바일 반응형 화면 확인용 답변입니다.', author_email: 'responsive-only-with-a-long-email@example.invalid', author_nickname: '반응형확인긴닉네임' }];
export const useInquiries = () => ({ items: inquiries, loading: false, error: '', status: 'all', page: 1, hasNext: false, filter: noop, reload: noop, move: noop });
const accounts = Array.from({ length: 10 }, (_, i) => ({ user_id: `fixture-user-${i}`, nickname: '반응형확인긴닉네임', email: `responsive-long-email-${i}@example.invalid`, app_role: i % 2 ? 'user' : 'pro', created_at: '2026-09-20T01:00:00Z', last_active_at: '2026-10-20T01:00:00Z', deletion_scheduled_for: null }));
export const supabase = { from(name) {
  if (name !== 'practice_attempts') throw new Error('검증용 풀이 기록 이외에는 접근할 수 없습니다.');
  return { insert(row) {
    if (row.user_id !== 'fixture-user') throw new Error('검증용 사용자만 저장할 수 있습니다.');
    return { select() { return { async single() {
      const saved = { ...row, created_at: new Date().toISOString() };
      savedAttempts.unshift(saved);
      return { data: saved, error: null };
    } }; } };
  } };
}, rpc: async name => {
  if (name === 'get_managed_users_page') return { data: { accounts, counts: { total: 12, user: 6, pro: 5, admin: 1 }, has_more: true }, error: null };
  throw new Error(`검증용 서버에서는 실제 DB 작업을 허용하지 않습니다: ${name}`);
} };
