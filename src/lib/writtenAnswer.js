// 숫자를 먼저 분리해야 1.33/13.3, -2/2, 4 2/42, 서로 다른 IP를
// 띄어쓰기 정리 과정에서 같은 답으로 합쳐 버리지 않습니다.
const numericPart = /[+-]?(?:\d+(?:\.\d+)*|\.\d+)(?:\s*\/\s*[+-]?(?:\d+(?:\.\d+)*|\.\d+))?/gu;

function normalizeNumber(value) {
  const compact = value.replace(/\s/gu, '');
  if (compact.includes('/')) return `fraction:${compact.split('/').map(normalizeNumber).join('/')}`;
  if ((compact.match(/\./gu) || []).length > 1) return `address:${compact}`;
  const negative = compact.startsWith('-');
  const [whole, decimal = ''] = compact.replace(/^[+-]/u, '').split('.');
  const integer = (whole || '0').replace(/^0+(?=\d)/u, '');
  const fraction = decimal.replace(/0+$/u, '');
  return `number:${negative ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`;
}

function normalizeAnswer(value) {
  const normalized = value.normalize('NFKC').toLowerCase().replace(/−/gu, '-');
  const parts = [];
  let offset = 0;
  const addText = text => {
    const compact = text.replace(/\s/gu, '').replace(/(?<=\p{L})-(?=\p{L})/gu, '').replace(/[().·ㆍ,/_]/gu, '');
    if (compact) parts.push(compact);
  };
  for (const match of normalized.matchAll(numericPart)) {
    addText(normalized.slice(offset, match.index));
    parts.push(normalizeNumber(match[0]));
    offset = match.index + match[0].length;
  }
  addText(normalized.slice(offset));
  return JSON.stringify(parts);
}

export const matchesWrittenAnswer = (question, answerInput) =>
  typeof answerInput === 'string' && Boolean(answerInput.trim())
  && question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(answerInput));
