export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = 'study:idle-session:v1:';
const ACTIVITY_EVENTS = ['pointerdown', 'click', 'pointermove', 'keydown', 'wheel', 'touchstart'];

export function getIdleSessionId(session) {
  try {
    const payload = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { session_id: id } = JSON.parse(atob(payload));
    if (typeof id === 'string' && id) return id;
  } catch { /* 오래된 세션도 토큰 갱신만으로 활동 시간이 초기화되지 않게 합니다. */ }
  return session?.user?.last_sign_in_at ?? 'legacy';
}

export function formatIdleTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return undefined; }
}

// 시간 변화는 이 저장소의 구독자만 다시 렌더링하므로 학습 화면은 매초 갱신되지 않습니다.
export function createIdleSessionStore({ userId, sessionId, onExpire, now = Date.now, storage = browserStorage(), windowTarget = globalThis.window, documentTarget = globalThis.document, setIntervalFn = globalThis.setInterval, clearIntervalFn = globalThis.clearInterval }) {
  const key = `${STORAGE_PREFIX}${userId}`;
  const readActivity = () => {
    try {
      const record = JSON.parse(storage?.getItem(key) ?? 'null');
      if (record?.sessionId === sessionId && Number.isFinite(record.lastActivityAt) && record.lastActivityAt >= 0) return Math.min(record.lastActivityAt, now());
    } catch { /* 저장소 사용이 제한된 브라우저에서는 현재 탭의 메모리로 동작합니다. */ }
    return null;
  };
  let lastActivityAt = readActivity() ?? now();
  let lastPersistedAt = 0;
  let remaining = Math.max(0, Math.ceil((lastActivityAt + IDLE_TIMEOUT_MS - now()) / 1000));
  let expired = false;
  let started = false;
  let interval;
  const listeners = new Set();
  const syncActivity = () => {
    const latest = readActivity();
    if (latest !== null) lastActivityAt = Math.max(lastActivityAt, latest);
  };
  const publish = () => {
    const next = expired ? 0 : Math.max(0, Math.ceil((lastActivityAt + IDLE_TIMEOUT_MS - now()) / 1000));
    if (remaining === next) return;
    remaining = next;
    listeners.forEach((listener) => listener());
  };
  const persist = () => {
    try {
      // 다른 탭에서 새로 로그인한 세션의 기록을 이전 세션이 덮어쓰지 않습니다.
      const record = JSON.parse(storage?.getItem(key) ?? 'null');
      if (started && record?.sessionId && record.sessionId !== sessionId) return;
      syncActivity();
      storage?.setItem(key, JSON.stringify({ sessionId, lastActivityAt }));
      lastPersistedAt = now();
    } catch { /* 저장 실패가 카운트다운이나 자동 로그아웃을 멈추지 않게 합니다. */ }
  };
  const check = () => {
    if (expired) return true;
    if (now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
      syncActivity(); // 만료 직전 다른 탭의 활동까지 확인합니다.
      if (now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
        expired = true;
        clearIntervalFn(interval);
        publish();
        onExpire();
        return true;
      }
    }
    publish();
    return false;
  };
  const recordActivity = (event) => {
    if (event.isTrusted === false || documentTarget.visibilityState !== 'visible') return;
    // 만료 여부를 먼저 확인하며, 마우스 이동마다 저장소를 읽거나 화면을 다시 그리지 않습니다.
    if (expired || (now() - lastActivityAt >= IDLE_TIMEOUT_MS && check())) return;
    lastActivityAt = now();
    publish();
    if (now() - lastPersistedAt >= 1000) persist();
  };
  const checkAfterResume = () => { syncActivity(); check(); };
  const onVisibilityChange = () => {
    if (documentTarget.visibilityState === 'visible') checkAfterResume();
    else persist(); // 탭을 숨긴 시각이 아니라 마지막 실제 활동 시각을 저장합니다.
  };
  const onStorage = (event) => { if (event.key === key) checkAfterResume(); };
  const stop = () => {
    clearIntervalFn(interval);
    ACTIVITY_EVENTS.forEach((event) => documentTarget.removeEventListener(event, recordActivity, true));
    documentTarget.removeEventListener('visibilitychange', onVisibilityChange);
    windowTarget.removeEventListener('focus', checkAfterResume);
    windowTarget.removeEventListener('pageshow', checkAfterResume);
    windowTarget.removeEventListener('pagehide', persist);
    windowTarget.removeEventListener('storage', onStorage);
    started = false;
  };

  return {
    getSnapshot: () => remaining,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    start: () => {
      if (started) return stop;
      syncActivity();
      if (check()) return stop;
      persist();
      started = true;
      ACTIVITY_EVENTS.forEach((event) => documentTarget.addEventListener(event, recordActivity, { capture: true, passive: true }));
      documentTarget.addEventListener('visibilitychange', onVisibilityChange);
      windowTarget.addEventListener('focus', checkAfterResume);
      windowTarget.addEventListener('pageshow', checkAfterResume);
      windowTarget.addEventListener('pagehide', persist);
      windowTarget.addEventListener('storage', onStorage);
      interval = setIntervalFn(check, 1000);
      return stop;
    },
  };
}
