export function splitStudyMaterials(materials) {
  return materials.flatMap((material) => {
    const groups = material.detail?.groups ?? [];
    if (groups.length === 0) return [material];

    // 원래 ID를 개요 카드에 남겨 기존 즐겨찾기 기록을 유지합니다.
    const overview = {
      ...material,
      kind: '전체 개요',
      studyRole: 'overview',
      points: groups.map((group) => group.name),
    };

    const focusedCards = groups.map((group, groupIndex) => ({
      id: `${material.id}--g${groupIndex + 1}-p1`,
      title: group.name,
      kind: '세부 학습',
      description: `${material.title}에서 ${group.memory}`,
      points: group.patterns.map(([name]) => name),
      detail: {
        definition: group.memory,
        quickDescription: group.memory,
        memoryTip: group.question,
        concept: group.patterns.slice(0, 2).map(([, meaning]) => meaning).join(' '),
        learningSteps: [],
        groups: [group],
        visual: { title: group.name, color: group.color, items: group.patterns.map(([name, meaning]) => ({ name, meaning })) },
      },
    }));

    return [overview, ...focusedCards];
  });
}
