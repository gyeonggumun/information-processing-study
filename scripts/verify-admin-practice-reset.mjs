import assert from 'node:assert/strict';
import { resetManagedUserPractice } from '../src/lib/adminPracticeReset.js';

const account = { user_id: 'target-a', email: 'target@example.invalid' };
let calls = 0;
const client = { rpc: async (name, args) => {
  calls++;
  assert.equal(name, 'reset_managed_user_practice');
  assert.deepEqual(args, { p_user_id: account.user_id, p_confirm_email: account.email });
  return { data: { user_id: account.user_id, deleted_count: 12 } };
} };
for (const email of ['', 'wrong@example.invalid', ' target@example.invalid.evil ']) {
  await assert.rejects(resetManagedUserPractice(client, account, email), /이메일/);
}
assert.equal(calls, 0, '이메일이 틀리면 서버 요청을 보내지 않음');
assert.equal((await resetManagedUserPractice(client, account, ' TARGET@EXAMPLE.INVALID ')).deleted_count, 12);
for (const data of [null, {}, { user_id: 'target-b', deleted_count: 1 }, { user_id: account.user_id, deleted_count: -1 }, { user_id: account.user_id, deleted_count: '3' }]) {
  await assert.rejects(resetManagedUserPractice({ rpc: async () => ({ data }) }, account, account.email), /초기화하지 못했습니다/);
}
for (const code of ['42501', '22023', 'other']) {
  await assert.rejects(resetManagedUserPractice({ rpc: async () => ({ error: { code } }) }, account, account.email));
}
const empty = await resetManagedUserPractice({ rpc: async () => ({ data: { user_id: account.user_id, deleted_count: 0 } }) }, account, account.email);
assert.equal(empty.deleted_count, 0, '이미 빈 계정도 정상 초기화');
console.log('PASS: 대상 이메일 확인, 계정별 RPC 인자, 응답 대상·삭제 건수 검증, 권한·접속 실패 및 빈 기록 처리');
