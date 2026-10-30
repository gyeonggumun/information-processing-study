export function getCodeProblemTitle(language) {
  return language === 'SQL' ? 'SQL 쿼리 문제' : `${language} 코드 문제`;
}

export function normalizeCodeOutput(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

export function isCodeOutputCorrect(answer, expected) {
  return normalizeCodeOutput(answer) === normalizeCodeOutput(expected);
}
