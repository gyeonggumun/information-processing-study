export function normalizeSummaryPreferences(saved, defaultOrder) {
  const knownKeys = new Set(defaultOrder);
  const validKeys = (keys) => Array.isArray(keys) ? [...new Set(keys.filter((key) => knownKeys.has(key)))] : [];
  const savedOrder = validKeys(saved?.card_order);
  const orderedKeys = new Set(savedOrder);
  return {
    cardOrder: [...savedOrder, ...defaultOrder.filter((key) => !orderedKeys.has(key))],
    hiddenCardIds: validKeys(saved?.hidden_card_ids),
  };
}

export function moveSummaryCard(cardOrder, visibleKeys, fromKey, toKey) {
  if (!fromKey || fromKey === toKey || !visibleKeys.includes(fromKey) || !visibleKeys.includes(toKey)) return cardOrder;
  const nextVisibleKeys = [...visibleKeys];
  nextVisibleKeys.splice(nextVisibleKeys.indexOf(fromKey), 1);
  nextVisibleKeys.splice(visibleKeys.indexOf(toKey), 0, fromKey);
  const replacements = new Map(visibleKeys.map((key, index) => [key, nextVisibleKeys[index]]));
  return cardOrder.map((key) => replacements.get(key) ?? key);
}
