import { subjects } from '../src/data/studyData.js';
import { examSummaryCardIds } from '../src/data/examSummaryCards.js';
import { studyComparisonNotes } from '../src/data/studyComparisonNotes.js';
import { processes, nonPreemptiveSchedules, preemptiveSchedules, subnetAddressExamples, splitSubnets } from '../src/components/CalculationGuide.jsx';

const sections = subjects.map((subject) => ({
  id: subject.id,
  title: subject.short,
  cards: (examSummaryCardIds[subject.id] ?? []).map((id) => {
    const material = subject.materials.find((item) => item.id === id);
    if (!material || material.kind !== '세부 학습') throw new Error(`PDF 자료를 찾을 수 없습니다: ${id}`);
    const group = material.detail.groups[0];
    const comparison = studyComparisonNotes[`${group.name}:${group.patterns[0]?.[0]}`] ?? studyComparisonNotes[group.name];
    return {
      id, title: material.title, memory: group.memory, caution: comparison?.caution,
      items: group.patterns.map(([name, meaning]) => {
        const normalize = (text) => text.toLowerCase().replace(/\s+/g, '');
        const aliases = [name.replace(/\s*\([^)]*\)/g, '').trim(), ...[...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1])].map(normalize);
        const matched = comparison?.clues.find(([, answer]) => {
          const term = normalize(answer);
          return aliases.some((alias) => alias === term || alias === `${term}응집도` || alias === `${term}결합도`);
        });
        return { name, summary: matched?.[0] ?? meaning };
      }),
    };
  }),
}));

const payload = {
  title: '정보처리기사 실기 - 시험 직전 핵심 요약',
  sections,
  calculations: { processes, schedules: [...nonPreemptiveSchedules, ...preemptiveSchedules], subnetAddressExamples, splitSubnets },
};
process.stdout.write(JSON.stringify(payload));
