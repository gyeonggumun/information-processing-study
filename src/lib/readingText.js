// 문장을 바꾸거나 숫자·코드를 해석하지 않고 두 문장 단위로 읽는 구간을 나눕니다.
// 반환 구간을 합치면 공백·줄바꿈까지 원문과 정확히 같아야 합니다.
export function readingPassages(value) {
  const text = String(value ?? '');
  if (!text) return [];
  const parts = text.split(/(?<=[.!?。！？])(?=\s+\S)|(?<=\n)(?=\S)/u);
  const result = [];
  let current = '';
  let sentences = 0;
  for (const part of parts) {
    if (current && (sentences >= 2 || current.trim().length >= 95 || current.endsWith('\n'))) {
      result.push(current); current = ''; sentences = 0;
    }
    current += part;
    sentences++;
  }
  if (current) result.push(current);
  return result;
}
