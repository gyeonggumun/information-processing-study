const MAX_ITEMS_PER_CARD = 4;

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
      detail: {
        ...material.detail,
        groups: [{
          name: '전체 흐름',
          color: groups[0].color,
          question: '어떤 주제부터 공부할까요?',
          memory: material.detail.quickDescription ?? material.detail.definition,
          patterns: groups.map((group) => [group.name, group.memory, group.question]),
        }],
      },
    };

    const focusedCards = groups.flatMap((group, groupIndex) => {
      const partCount = Math.ceil(group.patterns.length / MAX_ITEMS_PER_CARD);
      return Array.from({ length: partCount }, (_, partIndex) => {
        const start = Math.floor(partIndex * group.patterns.length / partCount);
        const end = Math.floor((partIndex + 1) * group.patterns.length / partCount);
        const patterns = group.patterns.slice(start, end);
        const title = partCount > 1 ? `${group.name} · ${partIndex + 1}/${partCount}` : group.name;
        return {
          id: `${material.id}--g${groupIndex + 1}-p${partIndex + 1}`,
          title,
          kind: '세부 학습',
          description: `${material.title}에서 ${group.memory}`,
          points: patterns.map(([name]) => name),
          detail: {
            definition: group.memory,
            quickDescription: group.memory,
            memoryTip: group.question,
            concept: patterns.slice(0, 2).map(([, meaning]) => meaning).join(' '),
            learningSteps: [],
            groups: [{ ...group, name: title, patterns }],
            visual: { title, color: group.color, items: patterns.map(([name, meaning]) => ({ name, meaning })) },
          },
        };
      });
    });

    return [overview, ...focusedCards];
  });
}
