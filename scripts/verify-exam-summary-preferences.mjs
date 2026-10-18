import assert from 'node:assert/strict';
import { addSummaryCard, normalizeSummaryPreferences, moveSummaryCard } from '../src/lib/examSummaryPreferences.js';

const defaults = ['design:a', 'db:a', 'design:b', 'systems:a'];
const saved = normalizeSummaryPreferences({
  card_order: ['systems:a', 'design:b', 'design:b', 'old:card'],
  hidden_card_ids: ['design:b', 'design:b', 'old:card'],
}, defaults);
assert.deepEqual(saved.cardOrder, ['systems:a', 'design:b', 'design:a', 'db:a']);
assert.deepEqual(saved.hiddenCardIds, ['design:b']);
assert.deepEqual(normalizeSummaryPreferences(null, defaults), { cardOrder: defaults, hiddenCardIds: [] });
assert.deepEqual(normalizeSummaryPreferences({ card_order: 'invalid', hidden_card_ids: [null] }, defaults), { cardOrder: defaults, hiddenCardIds: [] });

// 선택한 과목의 표시 카드만 정렬하며 다른 과목과 삭제 카드의 위치는 유지합니다.
const filtered = moveSummaryCard(defaults, ['design:a', 'design:b'], 'design:a', 'design:b');
assert.deepEqual(filtered, ['design:b', 'db:a', 'design:a', 'systems:a']);
assert.deepEqual(defaults, ['design:a', 'db:a', 'design:b', 'systems:a']);
assert.equal(moveSummaryCard(defaults, ['design:a'], 'design:a', 'db:a'), defaults);
assert.equal(moveSummaryCard(defaults, defaults, 'design:a', 'design:a'), defaults);

const visible = saved.cardOrder.filter((key) => !saved.hiddenCardIds.includes(key));
assert.deepEqual(visible, ['systems:a', 'design:a', 'db:a']);
const reordered = moveSummaryCard(saved.cardOrder, visible, 'db:a', 'systems:a');
const reloaded = normalizeSummaryPreferences({ card_order: reordered, hidden_card_ids: saved.hiddenCardIds }, defaults);
assert.deepEqual(reloaded.cardOrder, ['db:a', 'design:b', 'systems:a', 'design:a']);
assert.deepEqual(reloaded.hiddenCardIds, ['design:b']);
const restored = normalizeSummaryPreferences({ card_order: reloaded.cardOrder, hidden_card_ids: [] }, defaults);
assert.deepEqual(restored.cardOrder, reloaded.cardOrder);
assert.equal(restored.hiddenCardIds.length, 0);

const expanded = normalizeSummaryPreferences({ card_order: reordered, hidden_card_ids: ['design:b'] }, [...defaults, 'db:new']);
assert.equal(expanded.cardOrder.at(-1), 'db:new');
assert.deepEqual(expanded.hiddenCardIds, ['design:b']);
const available = [...defaults, 'db:optional', 'systems:optional'];
const initial = normalizeSummaryPreferences(null, defaults, available);
assert.deepEqual(initial.cardOrder, defaults, '추가 가능한 카드는 자동으로 포함하지 않음');
const added = addSummaryCard(initial, 'db:optional', available);
assert.deepEqual(initial.cardOrder, defaults, '기존 목록 불변');
assert.equal(added.cardOrder.at(-1), 'db:optional');
assert.equal(addSummaryCard(added, 'db:optional', available), added, '중복 추가 방지');
assert.equal(addSummaryCard(added, 'unknown:key', available), added, '존재하지 않는 카드 제외');
const addedReloaded = normalizeSummaryPreferences({ card_order: added.cardOrder, hidden_card_ids: ['db:optional', 'unknown:key', 'systems:optional'] }, defaults, available);
assert.deepEqual(addedReloaded.hiddenCardIds, ['db:optional'], '담은 카드만 삭제 목록에 포함');
assert.equal(addedReloaded.cardOrder.at(-1), 'db:optional', '학습에서 추가한 카드가 재조회 후에도 남음');
const unhidden = addSummaryCard(addedReloaded, 'db:optional', available);
assert.deepEqual(unhidden.cardOrder, addedReloaded.cardOrder, '다시 추가는 기존 개인 순서 유지');
assert.deepEqual(unhidden.hiddenCardIds, []);
assert.deepEqual(addSummaryCard(saved, 'design:b', available).hiddenCardIds, [], '기본 카드도 학습에서 복원 가능');
const otherAccount = normalizeSummaryPreferences(null, defaults, available);
assert(!otherAccount.cardOrder.includes('db:optional'), '다른 계정 기본 목록에는 영향 없음');
console.log('실기 요약: 삭제·복원, 저장 후 재로드, 과목 필터 정렬, 신규 카드 추가 검증 완료');
