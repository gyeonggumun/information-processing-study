const normalizeAnswer = (value) => value.normalize('NFKC').toLowerCase().replace(/[\s().·ㆍ,/_-]/g, '');

export const matchesWrittenAnswer = (question, answerInput) =>
  question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(answerInput));
