export function normalizeSummaryPreferences(saved, defaultOrder, availableOrder = defaultOrder) {
  const knownKeys = new Set(availableOrder);
  const validKeys = (keys) => Array.isArray(keys) ? [...new Set(keys.filter((key) => knownKeys.has(key)))] : [];
  const savedOrder = validKeys(saved?.card_order);
  const orderedKeys = new Set(savedOrder);
  return {
    cardOrder: [...savedOrder, ...defaultOrder.filter((key) => !orderedKeys.has(key))],
    hiddenCardIds: validKeys(saved?.hidden_card_ids).filter(key => orderedKeys.has(key) || defaultOrder.includes(key)),
  };
}

export function addSummaryCard(preferences, key, availableOrder) {
  if (!availableOrder.includes(key)) return preferences;
  if (preferences.cardOrder.includes(key) && !preferences.hiddenCardIds.includes(key)) return preferences;
  return {
    cardOrder: preferences.cardOrder.includes(key) ? preferences.cardOrder : [...preferences.cardOrder, key],
    hiddenCardIds: preferences.hiddenCardIds.filter(item => item !== key),
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
