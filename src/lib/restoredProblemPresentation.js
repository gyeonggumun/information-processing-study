// 원문과 해설은 보존하고, 풀이 전에는 필요한 전제만 별도로 제시합니다.
const normalizationCondition = '모든 속성 값은 원자값입니다. 함수 종속은 (고객, 강좌)→강사와 강사→강좌 및 이들로부터 유도되는 종속만 있다고 가정합니다. 만족하는 가장 높은 정규형을 작성하세요.';
const problemNotes = {
  'past-2026-2-q20': normalizationCondition,
  'past-2024-1-q6': normalizationCondition,
  'past-2025-1-q7': 'SQL의 incentive와 표의 incentives는 같은 열을 가리킵니다.',
  'past-2025-1-q15': '실제 실행 결과가 아니라 제시된 코드의 제어 흐름도와 문장 커버리지 경로를 작성하는 문제입니다.',
  'past-2024-2-q11': 'A에서 F까지 RIP이 선택하는 경로를 작성하세요. 모든 링크는 기본 설정으로 가정합니다.',
  'past-2024-1-q10': 'this y는 this.y, extend는 extends로 해석하며 원문 코드의 번호 표시는 문법에 포함하지 않습니다.',
  'past-2023-3-q8': 'stdio.h가 포함된 정상적인 C 프로그램으로 가정합니다.',
  'past-2023-3-q10': 'ASCII 호환 문자 집합을 사용하며 stdio.h가 포함된 C 프로그램으로 가정합니다.',
  'past-2023-3-q14': '마지막 print문에서 덧셈으로 연결하는 값은 문자열로 변환했다고 가정합니다.',
  'past-2023-2-q2': 'm·a·b·c·d는 정수형으로 선언되었다고 가정합니다. a·b·c·d에 들어갈 식을 차례대로 작성하세요.',
  'past-2023-2-q3': 'stdlio.h는 stdio.h로, 누락된 따옴표는 정상적인 입력문으로 해석합니다.',
  'past-2023-2-q14': 'Java 문자열은 큰따옴표로, 출력문은 System.out.println(...)으로 해석하며 필요한 세미콜론은 있다고 가정합니다.',
  'past-2023-1-q9': 'break 뒤의 세미콜론은 있다고 가정하며 입력 숫자의 각 자릿수는 0 또는 1입니다.',
  'past-2023-1-q17': '복원 코드의 abstact는 abstract로 해석합니다.',
};

export function getRestoredProblemNote(question) {
  return problemNotes[question.id] ?? (question.blocks.some(block => block.type === 'code' && /^#include\s*$/mu.test(block.text))
    ? '생략된 표준 헤더는 포함되어 있다고 가정합니다.' : '');
}

export function getRestoredProblemBlocks(question) {
  if (question.id === 'past-2025-1-q4') {
    // 정답을 알려주는 검수 안내 대신, 지문의 잘못된 악성코드 분류만 바로잡습니다.
    return question.blocks.map(block => block.type === 'text'
      ? { ...block, text: block.text.replace('랜섬웨어이다.', '악성 소프트웨어이다.') } : block);
  }
  if (question.id === 'past-2024-2-q7') {
    return question.blocks.map(block => block.type === 'text'
      ? { ...block, text: block.text.replace('대칭키 알고리즘으로 1997년 NIST(미국 국립기술표준원)에서 DES를 대체하기 위해 생성되었다.', 'DES를 대체하기 위한 NIST(미국 국립기술표준원)의 대칭키 암호 표준이다.') } : block);
  }
  if (question.id !== 'past-2023-2-q2') return question.blocks;
  // 동전 단위는 식의 대응 조건이므로 유지하고, 주석에 적힌 출력값만 제거합니다.
  const labels = { a: '1000원 개수', b: '500원 개수', c: '100원 개수', d: '10원 개수' };
  return question.blocks.map(block => block.type === 'code'
    ? { ...block, text: block.text.replace(/(System\.out\.println\(([abcd])\);)\s*\/\/[^\n]*/gu, (_, statement, variable) => `${statement} // ${labels[variable]}`) }
    : block);
}
