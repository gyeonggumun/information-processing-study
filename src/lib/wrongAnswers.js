export function summarizeWrongAnswers(attempts, questionMap) {
  const latest = new Map();
  const everWrong = new Set();
  let totalWrongAttempts = 0;

  for (const attempt of attempts) {
    const key = `${attempt.practice_type}:${attempt.question_id}`;
    if (!latest.has(key)) latest.set(key, attempt);
    if (!attempt.is_correct) {
      everWrong.add(key);
      totalWrongAttempts += 1;
    }
  }

  const pending = [...latest.entries()]
    .filter(([key, attempt]) => !attempt.is_correct && questionMap.has(key))
    .map(([key, attempt]) => ({ key, type: attempt.practice_type, question: questionMap.get(key) }));
  const resolvedCount = [...everWrong].filter((key) => latest.get(key)?.is_correct).length;
  const unavailableCount = [...latest.entries()].filter(([key, attempt]) => !attempt.is_correct && !questionMap.has(key)).length;

  return { pending, resolvedCount, totalWrongAttempts, unavailableCount };
}
