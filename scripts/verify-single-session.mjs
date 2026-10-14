import assert from 'node:assert/strict';
import { createSingleSessionStore, SESSION_CHECK_INTERVAL_MS } from '../src/lib/singleSession.js';

class Events {
  visibilityState = 'visible';
  handlers = new Map();
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name).add(fn); }
  removeEventListener(name, fn) { this.handlers.get(name)?.delete(fn); }
  fire(name) { this.handlers.get(name)?.forEach((fn) => fn()); }
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const fixture = (checkSession) => {
  const windowTarget = new Events();
  const documentTarget = new Events();
  const timers = new Set();
  const expired = [];
  const store = createSingleSessionStore({ checkSession, onExpire: (reason) => expired.push(reason), windowTarget, documentTarget, setIntervalFn: (fn, ms) => { assert.equal(ms, SESSION_CHECK_INTERVAL_MS); timers.add(fn); return fn; }, clearIntervalFn: (fn) => timers.delete(fn) });
  return { store, windowTarget, documentTarget, timers, expired, tick: () => [...timers].forEach((fn) => fn()) };
};

assert.equal(SESSION_CHECK_INTERVAL_MS, 15_000);
let current = true;
const env = fixture(async () => ({ data: current, error: null }));
assert.equal(env.store.getSnapshot(), 'checking');
const stop = env.store.start();
await flush();
assert.equal(env.store.getSnapshot(), 'active');
current = false;
env.tick();
await flush();
assert.equal(env.store.getSnapshot(), 'expired');
assert.deepEqual(env.expired, ['replaced']);
env.windowTarget.fire('focus');
await flush();
assert.equal(env.expired.length, 1);
stop();
assert.equal(env.timers.size, 0);
assert([...env.windowTarget.handlers.values()].every((handlers) => !handlers.size));

for (const check of [async () => ({ data: null, error: { message: 'Network error' } }), async () => { throw new Error('Network error'); }, async () => ({ data: null, error: { message: 'SESSION_REPLACED' } })]) {
  const failed = fixture(check);
  const cleanup = failed.store.start();
  await flush();
  assert.equal(failed.store.getSnapshot(), 'expired');
  assert.equal(failed.expired.length, 1);
  cleanup();
}

let resolveOld;
let calls = 0;
const deferred = fixture(() => { calls++; return new Promise((resolve) => { resolveOld = resolve; }); });
const cleanupOld = deferred.store.start();
deferred.tick();
deferred.windowTarget.fire('focus');
assert.equal(calls, 1);
cleanupOld();
resolveOld({ data: false, error: null });
await flush();
assert.equal(deferred.expired.length, 0);

// React StrictMode의 정리 후 재시작도 이전 응답에 영향을 받지 않습니다.
const requests = [];
const restarted = fixture(() => new Promise((resolve) => requests.push(resolve)));
restarted.store.start()();
const cleanupRestarted = restarted.store.start();
requests[0]({ data: false, error: null });
requests[1]({ data: true, error: null });
await flush();
assert.equal(restarted.store.getSnapshot(), 'active');
assert.equal(restarted.expired.length, 0);
restarted.documentTarget.visibilityState = 'hidden';
restarted.tick();
assert.equal(requests.length, 2);
restarted.documentTarget.visibilityState = 'visible';
restarted.documentTarget.fire('visibilitychange');
assert.equal(requests.length, 3);
requests[2]({ data: false, error: null });
await flush();
assert.deepEqual(restarted.expired, ['replaced']);
cleanupRestarted();
console.log('PASS: 세션 교체·초기 차단·중복 확인 방지·오류 차단·탭 복귀·늦은 응답·StrictMode 정리');
