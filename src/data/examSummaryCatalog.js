import { subjects } from './studyData';
import { examSummaryCardIds } from './examSummaryCards';

export const summaryCardKey = ({ subject, material }) => `${subject.id}:${material.id}`;
export const availableSummaryCards = subjects.flatMap(subject => subject.materials
  .filter(material => material.kind === '세부 학습' && material.detail)
  .map(material => ({ subject, material })));
export const summaryCardByKey = new Map(availableSummaryCards.map(card => [summaryCardKey(card), card]));
export const availableSummaryOrder = availableSummaryCards.map(summaryCardKey);
export const defaultSummaryOrder = subjects.flatMap(subject => (examSummaryCardIds[subject.id] ?? [])
  .map(id => `${subject.id}:${id}`).filter(key => summaryCardByKey.has(key)));
