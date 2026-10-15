import { designSupplements, developmentSupplements } from './supplementSoftwareMaterials';
import { databaseSupplements } from './supplementDatabaseMaterials';
import { programmingSupplements, systemsConceptSupplements } from './supplementProgrammingAndSystems';
import { securitySupplements } from './supplementSecurityMaterials';

export const supplementStudyMaterials = {
  'software-design': designSupplements,
  'software-development': developmentSupplements,
  database: databaseSupplements,
  programming: programmingSupplements,
  systems: [...systemsConceptSupplements, ...securitySupplements],
};

// 그룹 순서는 안정적으로 유지하여 기존 개인 삭제·정렬 설정에 영향을 주지 않습니다.
export const supplementSummaryCardIds = Object.fromEntries(Object.entries(supplementStudyMaterials).map(([subjectId, materials]) => [
  subjectId,
  materials.flatMap((material) => material.detail.groups.flatMap((group, index) => group.practical ? [`${material.id}--g${index + 1}-p1`] : [])),
]));
