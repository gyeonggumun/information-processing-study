export function normalizeCodeOutput(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

export function isCodeOutputCorrect(answer, expected) {
  return normalizeCodeOutput(answer) === normalizeCodeOutput(expected);
}
