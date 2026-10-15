// 제공된 추가 요약자료를 기존 자료와 대조한 뒤 새로 작성한 보강 카드입니다.
// practical은 복습 목록 선정용이며 특정 회차 출제 사실이나 출제 보장을 뜻하지 않습니다.
export function supplement({ id, title, color, concept, pages, groups }) {
  const normalizedGroups = groups.map((group) => ({ ...group, color: group.color ?? color }));
  const overview = normalizedGroups.map((group) => group.memory).join(' ');
  return {
    id, title, kind: '핵심 학습', description: concept,
    points: normalizedGroups.map((group) => group.name),
    sourceReview: { document: 'additional-practical-summary', pages },
    detail: {
      definition: concept, quickDescription: overview, memoryTip: normalizedGroups[0].question,
      concept, learningSteps: [], groups: normalizedGroups,
      visual: { title, color, items: normalizedGroups.flatMap((group) => group.patterns.map(([name, meaning]) => ({ name, meaning }))) },
    },
  };
}
