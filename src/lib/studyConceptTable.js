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

const termKey = (value) => value.split(/[（(:]/u, 1)[0].trim().toLowerCase();

export function buildConceptSections({ groups = [], visual, notes = {} }) {
  if (!groups.length) return visual?.items?.length ? [{ name: visual.title, flow: visual.flow, items: visual.items }] : [];
  return groups.map((group) => {
    const note = notes[`${group.name}:${group.patterns[0]?.[0]}`] ?? notes[group.name];
    const hints = new Map((note?.clues ?? []).map(([hint, term]) => [termKey(term), hint]));
    return {
      name: group.name,
      items: group.patterns.map(([name, meaning, , example]) => ({ name, meaning, hint: hints.get(termKey(name)), example })),
    };
  });
}
