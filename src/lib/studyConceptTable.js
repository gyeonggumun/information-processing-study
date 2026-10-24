import { getPlainConcept } from '../data/plainConceptNotes.js';

const CAUTION_WORDS = '(?:될|할|가질) 수 없[가-힣]*|허용되지 않[가-힣]*|금지|불가능|불가';
const KEY_WORDS = '\\b(?:NULL|PK|FK|LIFO|FIFO|RIP|OSPF|BGP|TCP|UDP|DFS|BFS|ACID|JOIN|WHERE|GROUP BY|HAVING|ORDER BY)\\b|기본키|외래키|후보키|슈퍼키|유일성|최소성|도메인|인덱스|후입선출|선입선출|상속|인터페이스|캡슐화|알고리즘|단일 책임|트랜잭션|원자성|일관성|격리성|지속성|기밀성|무결성|가용성';
const HIGHLIGHT = new RegExp(`(${CAUTION_WORDS}|${KEY_WORDS})`, 'giu');
const IS_CAUTION = new RegExp(`^(?:${CAUTION_WORDS})$`, 'iu');
const IS_KEY = new RegExp(`^(?:${KEY_WORDS})$`, 'iu');

export function conceptTextParts(text) {
  return String(text ?? '').split(HIGHLIGHT).filter(Boolean).map((value) => ({
    text: value, kind: IS_CAUTION.test(value) ? 'caution' : IS_KEY.test(value) ? 'key' : null,
  }));
}

const TERM_ALIASES = {
  '정규형 단계': { '제1정규형': '1nf', '제2정규형': '2nf', '제3정규형': '3nf', '제4정규형': '4nf', '제5정규형': '5nf' },
  '블랙박스 테스트': { '동치 분할 테스트': '동치 분할', '결정 테이블 테스트': '결정 테이블' },
  '화이트박스와 결함 관리': { '조건/결정 커버리지': 'c/dc', '변경 조건/결정 커버리지': 'mc/dc' },
};

const termKey = (value, groupName) => {
  const key = value.split(/[（(:]/u, 1)[0].trim().toLowerCase();
  if (groupName === '응집도') return key.replace(/ 응집도$/u, '');
  if (groupName === '결합도') return key.replace(/ 결합도$/u, '');
  return TERM_ALIASES[groupName]?.[key] ?? key;
};

export function buildConceptSections({ groups = [], visual, notes = {}, understanding = {} }) {
  if (!groups.length) return visual?.items?.length ? [{ name: visual.title, flow: visual.flow, items: visual.items }] : [];
  return groups.map((group) => {
    const note = notes[`${group.name}:${group.patterns[0]?.[0]}`] ?? notes[group.name];
    const hints = new Map((note?.clues ?? []).map(([hint, term]) => [termKey(term, group.name), hint]));
    const reading = understanding[group.name];
    const explanations = new Map(Object.entries(reading?.terms ?? {}).map(([term, value]) => [termKey(term, group.name), value]));
    return {
      name: group.name,
      question: group.question,
      memory: group.memory,
      intro: reading?.scenario ?? note?.lead ?? group.memory,
      caution: note?.caution,
      items: group.patterns.map(([name, meaning, detailText, example]) => {
        const key = termKey(name, group.name);
        const [explanation = detailText, contrast = hints.get(key)] = explanations.get(key) ?? [];
        const plain = getPlainConcept(name);
        return { name, meaning, detailText, explanation, hint: contrast ?? plain?.contrast, example, ...(plain ? { plainMeaning: plain.meaning } : {}) };
      }),
    };
  });
}
