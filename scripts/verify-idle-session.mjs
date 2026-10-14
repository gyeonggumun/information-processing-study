import assert from 'node:assert/strict';
import { createIdleSessionStore, formatIdleTime, getIdleSessionId, IDLE_TIMEOUT_MS } from '../src/lib/idleSession.js';

class Events {
  handlers = new Map();
  visibilityState = 'visible';
  addEventListener(name, callback) {
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.handlers.get(name)?.delete(callback); }
  fire(name, extra = {}) { this.handlers.get(name)?.forEach((callback) => callback({ isTrusted: true, ...extra })); }
}
function fixture() {
  let time = 1_700_000_000_000;
  let timerId = 0;
  let writes = 0;
  const values = new Map();
  const timers = new Map();
  const windows = new Set();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { writes++; values.set(key, value); windows.forEach((window) => window.fire('storage', { key })); },
  };
  const create = (userId = 'user-a', sessionId = 'session-a', customStorage = storage) => {
    const window = new Events();
    const document = new Events();
    windows.add(window);
    let expirations = 0;
    const store = createIdleSessionStore({ userId, sessionId, storage: customStorage, windowTarget: window, documentTarget: document, now: () => time, onExpire: () => { expirations++; }, setIntervalFn: (callback) => { const id = ++timerId; timers.set(id, callback); return id; }, clearIntervalFn: (id) => timers.delete(id) });
    return { store, window, document, expirations: () => expirations };
  };
  return { create, writes: () => writes, timerCount: () => timers.size, advance: (ms, tick = true) => { time += ms; if (tick) [...timers.values()].forEach((callback) => callback()); } };
}

assert.equal(IDLE_TIMEOUT_MS, 3_600_000);
assert.equal(formatIdleTime(3600), '60:00');
assert.equal(formatIdleTime(3599), '59:59');
assert.equal(formatIdleTime(65), '01:05');
assert.equal(formatIdleTime(-1), '00:00');
const token = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
assert.equal(getIdleSessionId({ access_token: token({ session_id: 'stable-session', exp: 1 }) }), 'stable-session');
assert.equal(getIdleSessionId({ access_token: token({ session_id: 'stable-session', exp: 2 }) }), 'stable-session');
assert.equal(getIdleSessionId({ access_token: 'invalid', user: { last_sign_in_at: 'first-login' } }), 'first-login');

// 1초마다 표시가 바뀌고 클릭·키 입력·스크롤·터치·마우스 이동은 1시간을 다시 부여합니다.
{
  const env = fixture();
  const tab = env.create();
  const stop = tab.store.start();
  let notifications = 0;
  const unsubscribe = tab.store.subscribe(() => { notifications++; });
  env.advance(1000);
  assert.equal(tab.store.getSnapshot(), 3599);
  for (const event of ['pointerdown', 'click', 'keydown', 'wheel', 'touchstart', 'pointermove']) {
    env.advance(60_000);
    tab.document.fire(event);
    assert.equal(tab.store.getSnapshot(), 3600);
  }
  const before = notifications;
  const beforeWrites = env.writes();
  for (let i = 0; i < 100; i++) { env.advance(5, false); tab.document.fire('pointermove'); }
  assert.equal(notifications, before);
  assert.equal(env.writes(), beforeWrites);
  unsubscribe();
  stop();
  assert.equal(env.timerCount(), 0);
  assert([...tab.document.handlers.values()].every((listeners) => listeners.size === 0));
}

// 새로고침·탭 복귀·토큰 갱신은 남은 시간을 초기화하지 않습니다.
{
  const env = fixture();
  const original = env.create();
  const stop = original.store.start();
  env.advance(45 * 60_000);
  stop();
  const reloaded = env.create();
  const stopReloaded = reloaded.store.start();
  assert.equal(reloaded.store.getSnapshot(), 900);
  env.advance(1000);
  reloaded.window.fire('focus');
  reloaded.window.fire('pageshow');
  assert.equal(reloaded.store.getSnapshot(), 899);
  reloaded.document.fire('pointermove', { isTrusted: false });
  assert.equal(reloaded.store.getSnapshot(), 899);
  env.advance(899_000);
  assert.equal(reloaded.expirations(), 1);
  assert.equal(reloaded.store.getSnapshot(), 0);
  reloaded.document.fire('pointerdown');
  assert.equal(reloaded.expirations(), 1);
  assert.equal(reloaded.store.getSnapshot(), 0);
  stopReloaded();
  const expired = env.create();
  assert.equal(expired.store.getSnapshot(), 0);
  expired.store.start()();
  expired.store.start()();
  assert.equal(expired.expirations(), 1);
  const freshLogin = env.create('user-a', 'new-session');
  freshLogin.store.start();
  assert.equal(freshLogin.store.getSnapshot(), 3600);
}

// 같은 브라우저의 같은 세션은 탭 간 공유하되 다른 사용자의 활동은 영향을 주지 않습니다.
{
  const env = fixture();
  const first = env.create();
  first.store.start();
  const second = env.create();
  second.store.start();
  const other = env.create('user-b', 'session-b');
  other.store.start();
  env.advance(30 * 60_000);
  first.document.fire('keydown');
  assert.equal(second.store.getSnapshot(), 3600);
  assert.equal(other.store.getSnapshot(), 1800);
  env.advance(30 * 60_000);
  assert.equal(first.expirations(), 0);
  assert.equal(second.expirations(), 0);
  assert.equal(other.expirations(), 1);
}

// 숨겨진 탭의 이벤트는 활동이 아니며 절전 후 첫 입력이 만료된 세션을 되살리지 않습니다.
{
  const env = fixture();
  const tab = env.create();
  tab.store.start();
  tab.document.visibilityState = 'hidden';
  env.advance(30 * 60_000);
  tab.document.fire('pointerdown');
  assert.equal(tab.store.getSnapshot(), 1800);
  env.advance(30 * 60_000, false);
  tab.document.visibilityState = 'visible';
  tab.document.fire('keydown');
  assert.equal(tab.expirations(), 1);
  assert.equal(tab.store.getSnapshot(), 0);
}

// 저장소 오류·잘못된 기록에도 로그아웃과 StrictMode 정리/재등록이 정상 동작합니다.
{
  const env = fixture();
  const denied = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  const tab = env.create('user-a', 'session-a', denied);
  tab.store.start()();
  const stop = tab.store.start();
  assert.equal(env.timerCount(), 1);
  env.advance(IDLE_TIMEOUT_MS);
  assert.equal(tab.expirations(), 1);
  stop();
  assert.equal(env.timerCount(), 0);
  const invalid = env.create('user-c', 'session-c', { getItem: () => '{broken-json', setItem: () => {} });
  assert.equal(invalid.store.getSnapshot(), 3600);
}
console.log('PASS: 1시간 만료·활동 갱신·초 단위 표시·새로고침·절전·탭 공유·사용자 분리·저장소 오류 검증');
