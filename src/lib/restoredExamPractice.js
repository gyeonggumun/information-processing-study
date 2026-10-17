import { getUnseenQuestions } from './practiceHistory.js';

export function pickRestoredExamQuestion(questions, completedKeys, excludeId, random = Math.random) {
  const unseen = getUnseenQuestions(questions, 'exam', completedKeys);
  const alternatives = unseen.filter((question) => question.id !== excludeId);
  const candidates = alternatives.length ? alternatives : unseen;
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}
