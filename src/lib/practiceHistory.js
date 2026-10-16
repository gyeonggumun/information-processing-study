export const PRACTICE_CHANGED_EVENT = 'study:practice-attempt-saved';
export const PRACTICE_STORAGE_KEY = 'study:practice-updated:v1';
const ATTEMPT_COLUMNS = 'id, user_id, practice_type, question_id, is_correct, created_at';

export const practiceKey = (type, questionId) => `${type}:${questionId}`;

export function mergeAttempts(...groups) {
  return [...new Map(groups.flat().map((attempt) => [attempt.id, attempt])).values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}

export function getUnseenQuestions(questions, type, completedKeys, excludeId) {
  return questions.filter((question) => question.id !== excludeId && !completedKeys.has(practiceKey(type, question.id)));
}

// 입력은 최신순이며, 복습을 포함해 같은 문제의 가장 최근 풀이 한 건을 보여줍니다.
export function summarizePracticeHistory(attempts) {
  const latest = new Map();
  for (const attempt of attempts) {
    const key = practiceKey(attempt.practice_type, attempt.question_id);
    if (!latest.has(key)) latest.set(key, { key, attempt, count: 0 });
    latest.get(key).count++;
  }
  return [...latest.values()];
}

export async function loadPracticeAttempts(client, userId, signal) {
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('practice_attempts').select(ATTEMPT_COLUMNS)
      .eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(offset, offset + 499).abortSignal(signal);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < 500) return mergeAttempts(all);
  }
}

export async function savePracticeAttempt(client, attempt) {
  let result = await client.from('practice_attempts').insert(attempt).select(ATTEMPT_COLUMNS).single();
  // 저장 응답만 유실된 재시도는 본인의 동일 UUID 기록을 확인합니다.
  if (result.error?.code === '23505') {
    result = await client.from('practice_attempts').select(ATTEMPT_COLUMNS).eq('user_id', attempt.user_id).eq('id', attempt.id).single();
  }
  if (result.error) throw result.error;
  if (!result.data) throw new Error('풀이 기록 저장 결과가 없습니다.');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PRACTICE_CHANGED_EVENT, { detail: result.data }));
    try { window.localStorage.setItem(PRACTICE_STORAGE_KEY, crypto.randomUUID()); } catch { /* 탭 간 알림 실패는 저장 결과에 영향을 주지 않습니다. */ }
  }
  return result.data;
}
