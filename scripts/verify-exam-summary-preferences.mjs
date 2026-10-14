import assert from 'node:assert/strict';
import { normalizeSummaryPreferences, moveSummaryCard } from '../src/lib/examSummaryPreferences.js';

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
console.log('실기 요약: 삭제·복원, 저장 후 재로드, 과목 필터 정렬, 신규 카드 추가 검증 완료');
