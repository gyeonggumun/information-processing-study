import { subjects } from '../src/data/studyData.js';
import { examSummaryCardIds } from '../src/data/examSummaryCards.js';
import { getSummaryPdfCard } from '../src/lib/summaryPdfCard.js';
import { processes, nonPreemptiveSchedules, preemptiveSchedules, subnetAddressExamples, splitSubnets } from '../src/components/CalculationGuide.jsx';

const sections = subjects.map((subject) => ({
  id: subject.id,
  title: subject.short,
  cards: (examSummaryCardIds[subject.id] ?? []).map((id) => {
    const material = subject.materials.find((item) => item.id === id);
    if (!material || material.kind !== '세부 학습') throw new Error(`PDF 자료를 찾을 수 없습니다: ${id}`);
    return getSummaryPdfCard(material);
  }),
}));

const payload = {
  title: '정보처리기사 실기 - 시험 직전 핵심 요약',
  sections,
  calculations: { processes, schedules: [...nonPreemptiveSchedules, ...preemptiveSchedules], subnetAddressExamples, splitSubnets },
};
process.stdout.write(JSON.stringify(payload));
