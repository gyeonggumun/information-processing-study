import sources from './restoredExamsSource.json';
import { restoredExamSolutions } from './restoredExamSolutions';

const answerCorrections = {
  'past-2023-2-q4': (value) => value.replace('INSTER', 'INSERT'),
  'past-2023-3-q5': () => '->',
  'past-2023-3-q12': () => 'NAT (Network Address Translation)',
  'past-2023-3-q17': (value) => value.replace('laas', 'IaaS'),
  'past-2025-1-q15': (value) => value.replace('③ → ④ → ⑤ → ② → ⑥', '① → ② → ③ → ④ → ⑤ → ② → ⑥'),
};

export const restoredExams = sources.map((exam) => ({
  ...exam,
  title: `${exam.year}년 ${exam.session}회`,
  questions: exam.questions.map((question) => {
    const solution = restoredExamSolutions[exam.id]?.[question.number - 1];
    if (!solution) throw new Error(`${question.id}: 검수한 해설이 없습니다.`);
    const [topic, explanation, correction] = solution;
    return {
      ...question, restored: true, examId: exam.id, sourceUrl: exam.sourceUrl,
      answerBlocks: question.answerBlocks.map((block) => block.type === 'text' && answerCorrections[question.id]
        ? { ...block, text: answerCorrections[question.id](block.text) } : block),
      author: exam.author, license: exam.license,
      title: `${exam.year}년 ${exam.session}회 ${question.number}번 · ${topic}`,
      explanation: explanation.split(' | '),
      correction: correction ?? (question.blocks.some((block) => block.type === 'code' && /^#include\s*$/mu.test(block.text))
        ? '복원 코드에서 #include 헤더명이 누락되어 있습니다. 필요한 표준 헤더를 포함했다는 의도로 풀이하되 원문 그대로의 컴파일을 보장하지 않습니다.' : undefined),
    };
  }),
}));

export const restoredExamQuestions = restoredExams.flatMap((exam) => exam.questions);
