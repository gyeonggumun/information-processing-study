import { studyComparisonNotes } from '../data/studyComparisonNotes.js';

// 웹의 개인 PDF와 사전 조판 자료가 같은 요점·비교 설명을 사용합니다.
export function getSummaryPdfCard(material) {
  const group = material.detail.groups[0];
  const comparison = studyComparisonNotes[`${group.name}:${group.patterns[0]?.[0]}`] ?? studyComparisonNotes[group.name];
  const normalize = (text) => text.toLowerCase().replace(/\s+/g, '');
  return {
    id: material.id, title: material.title, memory: group.memory, caution: comparison?.caution,
    items: group.patterns.map(([name, meaning]) => {
      const aliases = [name.replace(/\s*\([^)]*\)/g, '').trim(), ...[...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1])].map(normalize);
      const matched = comparison?.clues.find(([, answer]) => {
        const term = normalize(answer);
        return aliases.some((alias) => alias === term || alias === `${term}응집도` || alias === `${term}결합도`);
      });
      return { name, summary: matched?.[0] ?? meaning };
    }),
  };
}

export function snapshotSummaryPdfCards(cards) {
  return cards.map(({ subject, material }) => ({ id: material.id, subject: subject.short, signature: JSON.stringify(getSummaryPdfCard(material)) }));
}
