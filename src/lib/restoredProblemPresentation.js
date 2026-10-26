// 원문과 해설은 보존하고, 풀이 전에는 필요한 전제만 별도로 제시합니다.
import { correctRestoredProblemBlock } from '../data/restoredQuestionCorrections.js';
const normalizationCondition = '모든 속성 값은 원자값입니다. 함수 종속은 (고객, 강좌)→강사와 강사→강좌 및 이들로부터 유도되는 종속만 있다고 가정합니다. 만족하는 가장 높은 정규형을 작성하세요.';
const problemNotes = {
  'past-2026-2-q20': normalizationCondition,
  'past-2024-1-q6': normalizationCondition,
  'past-2025-1-q7': '복원 SQL의 열 이름 오타를 표의 incentives로 통일했습니다.',
  'past-2025-1-q15': '실제 실행 결과가 아니라 제시된 코드의 제어 흐름도와 문장 커버리지 경로를 작성하는 문제입니다.',
  'past-2024-2-q11': 'A에서 F까지 RIP이 선택하는 경로를 작성하세요. 모든 링크는 기본 설정으로 가정합니다.',
  'past-2024-1-q10': '복원 코드의 문법 오타를 보정했습니다. ①~⑦은 호출 위치를 구분하는 번호입니다.',
  'past-2023-3-q8': 'stdio.h가 포함된 정상적인 C 프로그램으로 가정합니다.',
  'past-2023-3-q10': 'ASCII 호환 문자 집합을 사용하며 stdio.h가 포함된 C 프로그램으로 가정합니다.',
  'past-2023-3-q14': '복원 코드의 문자열 결합 오류를 보정했습니다. 입력문에 있는 빈칸은 그대로 유지했습니다.',
  'past-2023-2-q2': 'm·a·b·c·d는 정수형 변수입니다. a·b·c·d에 들어갈 식을 차례대로 작성하세요.',
  'past-2023-2-q3': '헤더·따옴표 오타를 보정하고 gets를 길이 제한 입력으로 바꿨습니다. 제시된 이름에는 공백이 없습니다.',
  'past-2023-2-q14': '복원 코드의 문자열 따옴표·출력문 표기·누락된 세미콜론을 보정했습니다.',
  'past-2023-1-q9': '누락된 세미콜론을 보정했습니다. 입력 숫자의 각 자릿수는 0 또는 1입니다.',
  'past-2023-1-q17': '복원 코드의 예약어 오타를 보정했습니다.',
  'past-2024-2-q3': '복원 자료의 스키마와 열 목록을 서로 일치하도록 보정했습니다. 제시된 네 SQL 빈칸을 작성하세요.',
};

export function getRestoredProblemNote(question) {
  return problemNotes[question.id] ?? (question.blocks.some(block => block.type === 'code' && /^#include\s*$/mu.test(block.text))
    ? '생략된 표준 헤더는 포함되어 있다고 가정합니다.' : '');
}

export function getRestoredProblemBlocks(question) {
  const blocks = question.blocks.map(block => correctRestoredProblemBlock(question.id,block));
  if (question.id === 'past-2025-1-q2') return blocks.map(block => block.type === 'image' ? {
    type: 'table', caption: '무결성 제약의 검사 기준과 위반 예시 · 원본 비교표 재구성',
    rows: [['구분', '검사 기준', '위반 예시'],
      ['ㄱ', '속성값은 지정된 자료형과 허용 범위에 속해야 한다.', '0~100점만 허용한 점수에 120을 입력'],
      ['ㄴ', '기본키의 어떤 구성 속성도 NULL일 수 없고 기본키 전체 값은 유일해야 한다.', '기본키 학번에 중복값 또는 NULL을 입력'],
      ['ㄷ', 'NULL이 아닌 단일 열 외래키 값은 참조 대상 키에 존재해야 한다.', '고객 표에 없는 고객번호를 주문에 입력']],
  } : block);
  if (question.id === 'past-2025-1-q4') {
    // 정답을 알려주는 검수 안내 대신, 지문의 잘못된 악성코드 분류만 바로잡습니다.
    return blocks.map(block => block.type === 'text'
      ? { ...block, text: block.text.replace('랜섬웨어이다.', '악성 소프트웨어이다.') } : block);
  }
  if (question.id === 'past-2024-2-q7') {
    return blocks.map(block => block.type === 'text'
      ? { ...block, text: block.text.replace('대칭키 알고리즘으로 1997년 NIST(미국 국립기술표준원)에서 DES를 대체하기 위해 생성되었다.', 'DES를 대체하기 위한 NIST(미국 국립기술표준원)의 대칭키 암호 표준이다.') } : block);
  }
  if (question.id === 'past-2023-3-q6') {
    const start = blocks.findIndex(block => block.text === '[쿼리]');
    const end = blocks.findIndex(block => block.text === '결과 테이블');
    return [...blocks.slice(0, start + 1), { type: 'code', text: 'SELECT A FROM T1\nUNION\nSELECT A FROM T2\nORDER BY A DESC;' }, ...blocks.slice(end)]
      .map(block => block.type === 'table' ? { ...block, rows: [['A'], ...block.rows] } : block);
  }
  if (question.id !== 'past-2023-2-q2') return blocks;
  // 동전 단위는 식의 대응 조건이므로 유지하고, 주석에 적힌 출력값만 제거합니다.
  const labels = { a: '1000원 개수', b: '500원 개수', c: '100원 개수', d: '10원 개수' };
  return blocks.map(block => block.type === 'code'
    ? { ...block, text: block.text.replace(/(System\.out\.println\(([abcd])\);)\s*\/\/[^\n]*/gu, (_, statement, variable) => `${statement} // ${labels[variable]}`) }
    : block);
}
