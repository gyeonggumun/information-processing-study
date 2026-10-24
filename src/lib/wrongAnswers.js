const examSubjects = new Set(['소프트웨어 설계', '소프트웨어 개발', '데이터베이스 구축', '정보시스템 구축관리', '정보시스템 구축 관리']);

function examReference(examId, number, suffix) {
  const match = /^(\d{4})-([1-9]\d*)$/.exec(examId ?? '');
  if (!match || !Number.isInteger(number) || number < 1) return null;
  return `${match[1]}년 ${Number(match[2])}회 · ${number}번 ${suffix}`;
}

// 오답 목록의 표시만 바꿉니다. 문제 ID·원래 제목·재풀이 데이터는 유지합니다.
export function wrongAnswerPresentation(type, question) {
  if (type !== 'exam') return { label: type, title: question.title };
  if (question.restored) {
    const id = /^past-(\d{4}-[1-9]\d*)-q([1-9]\d*)$/.exec(question.id ?? '');
    const title = examReference(question.examId, question.number, '문제')
      ?? (id && examReference(id[1], Number(id[2]), '문제'));
    return { label: '실기 복원 문제', title: title || '실기 복원 문제' };
  }
  if (question.similar) {
    const reference = /^past-(\d{4}-[1-9]\d*)-q([1-9]\d*)$/.exec(question.sourceQuestionId ?? '');
    const title = reference && examReference(reference[1], Number(reference[2]), '유형');
    return { label: '실기 유사 문제', title: title || '실기 유사 문제' };
  }
  return { label: '기출문제', title: examSubjects.has(question.subject) ? `${question.subject} 문제` : '기출문제' };
}

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
