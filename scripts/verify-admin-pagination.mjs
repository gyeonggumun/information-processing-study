import assert from 'node:assert/strict';
import { ADMIN_PAGE_SIZE, parseManagedUsersPage } from '../src/lib/adminPagination.js';

assert.equal(ADMIN_PAGE_SIZE, 10);
const accounts = Array.from({ length: 23 }, (_, index) => ({ user_id: `fixture-${index}`, created_at: '2026-10-15T00:00:00Z' }));
const counts = { total: 23, user: 15, pro: 7, admin: 1 };
const cursorHistory = [null];
const seen = [];
for (let index = 0; index < accounts.length; index += ADMIN_PAGE_SIZE) {
  const page = parseManagedUsersPage({ accounts: accounts.slice(index, index + ADMIN_PAGE_SIZE), has_more: index + ADMIN_PAGE_SIZE < accounts.length, counts });
  assert.ok(page.accounts.length <= 10);
  seen.push(...page.accounts.map(account => account.user_id));
  if (page.nextCursor) cursorHistory.push(page.nextCursor);
}
assert.equal(new Set(seen).size, 23);
assert.equal(cursorHistory.length, 3);
assert.deepEqual(cursorHistory[1], { user_id: 'fixture-9', created_at: accounts[9].created_at });
assert.deepEqual(cursorHistory.slice(0, -1).at(-1), cursorHistory[1]);
assert.deepEqual(parseManagedUsersPage({ accounts: [], has_more: false, counts }).counts, counts);
assert.equal(parseManagedUsersPage({ accounts: accounts.slice(0, 10), has_more: false, counts }).nextCursor, null);
for (const invalid of [null, {}, { accounts: [], has_more: true, counts }, { accounts, has_more: true, counts },
  { accounts: [], has_more: false, counts: { ...counts, user: -1 } },
  { accounts: [], has_more: false, counts: { ...counts, total: 24 } },
  { accounts: [], has_more: false, counts: { ...counts, pro: '7' } },
  { accounts: Array(10).fill({ user_id: 'x' }), has_more: true, counts }]) {
  assert.throws(() => parseManagedUsersPage(invalid));
}
console.log('PASS: 10-account page limit, 23-account traversal, previous cursors, empty pages, global counts and malformed response rejection');
