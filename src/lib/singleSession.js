export const SESSION_CHECK_INTERVAL_MS = 15_000;

// 접속 권한은 로컬 저장소가 아닌 서버의 세션 확인 결과로 결정합니다.
export function createSingleSessionStore({ checkSession, onExpire, windowTarget = globalThis.window, documentTarget = globalThis.document, setIntervalFn = globalThis.setInterval, clearIntervalFn = globalThis.clearInterval }) {
  let state = 'checking';
  let generation = 0;
  let running = false;
  let pending = false;
  let timer;
  const listeners = new Set();
  const publish = (next) => { state = next; listeners.forEach((listener) => listener()); };
  const check = async () => {
    if (!running || pending || state === 'expired') return;
    pending = true;
    const requestGeneration = generation;
    try {
      const { data, error } = await checkSession();
      if (!running || requestGeneration !== generation) return;
      if (error || data !== true) {
        publish('expired');
        clearIntervalFn(timer);
        onExpire(error && error.message !== 'SESSION_REPLACED' ? 'check-failed' : 'replaced');
      } else if (state !== 'active') publish('active');
    } catch {
      if (running && requestGeneration === generation) {
        publish('expired');
        clearIntervalFn(timer);
        onExpire('check-failed');
      }
    } finally {
      if (requestGeneration === generation) pending = false;
    }
  };
  const onResume = () => { if (documentTarget.visibilityState === 'visible') void check(); };
  const stop = () => {
    running = false;
    generation++;
    pending = false;
    clearIntervalFn(timer);
    windowTarget.removeEventListener('focus', onResume);
    windowTarget.removeEventListener('pageshow', onResume);
    documentTarget.removeEventListener('visibilitychange', onResume);
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    start: () => {
      if (running) return stop;
      running = true;
      publish('checking');
      windowTarget.addEventListener('focus', onResume);
      windowTarget.addEventListener('pageshow', onResume);
      documentTarget.addEventListener('visibilitychange', onResume);
      timer = setIntervalFn(onResume, SESSION_CHECK_INTERVAL_MS);
      void check();
      return stop;
    },
  };
}
