import { useState } from 'react';
import { BookOpenCheck, Download, FileText, GripVertical, RotateCcw, Trash2 } from 'lucide-react';
import { subjects } from '../data/studyData';
import { examSummaryCardIds } from '../data/examSummaryCards';
import { useAuth } from '../contexts/AuthContext';
import { useExamSummaryPreferences } from '../hooks/useExamSummaryPreferences';
import { moveSummaryCard } from '../lib/examSummaryPreferences';
import { MaterialStudyModal } from './StudyPage';

const summaryCards = subjects.flatMap((subject) =>
  (examSummaryCardIds[subject.id] ?? [])
    .map((id) => subject.materials.find((material) => material.id === id && material.kind === '세부 학습'))
    .filter(Boolean)
    .map((material) => ({ subject, material })),
);
const cardKey = ({ subject, material }) => `${subject.id}:${material.id}`;
const defaultOrder = summaryCards.map(cardKey);
const cardByKey = new Map(summaryCards.map((card) => [cardKey(card), card]));

export default function ExamSummaryPage() {
  const { user } = useAuth();
  const [activeSubject, setActiveSubject] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studyView, setStudyView] = useState(null);
  const { preferences, isLoading, isSaving, hasLoaded, canEdit, error, saved, persistPreferences, reload } = useExamSummaryPreferences(user?.id, defaultOrder);
  const { cardOrder, hiddenCardIds } = preferences;
  const [draggedKey, setDraggedKey] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const hiddenKeys = new Set(hiddenCardIds);
  const orderedCards = cardOrder.filter((key) => !hiddenKeys.has(key)).map((key) => cardByKey.get(key)).filter(Boolean);
  const deletedCards = cardOrder.filter((key) => hiddenKeys.has(key)).map((key) => cardByKey.get(key)).filter(Boolean);
  const visibleCards = activeSubject === 'all'
    ? orderedCards
    : orderedCards.filter(({ subject }) => subject.id === activeSubject);
  const visibleKeys = visibleCards.map(cardKey);
  const canReorder = canEdit && visibleCards.length > 1;
  const moveCard = (fromKey, toKey) => {
    if (!canReorder) return;
    const nextOrder = moveSummaryCard(cardOrder, visibleKeys, fromKey, toKey);
    if (nextOrder !== cardOrder) persistPreferences({ ...preferences, cardOrder: nextOrder });
  };
  const deleteCard = (key) => {
    if (!canEdit || hiddenKeys.has(key)) return;
    persistPreferences({ ...preferences, hiddenCardIds: [...hiddenCardIds, key] });
  };
  const restoreCard = (key) => {
    if (!canEdit) return;
    persistPreferences({ ...preferences, hiddenCardIds: hiddenCardIds.filter((item) => item !== key) });
  };

  return (
    <div className="subpage">
      <div className="subpage-header">
        <div>
          <p className="eyebrow">EXAM STUDY</p>
          <h1>실기 요약</h1>
          <p>사이트의 기출 유형·코드 연습과 연결되는 세부 학습 카드만 모았습니다.</p>
        </div>
        <div className="favorites-count"><BookOpenCheck size={23} /><strong>{hasLoaded ? orderedCards.length : '—'}</strong><span>개 카드</span></div>
      </div>
      <section className="exam-summary-pdf panel" aria-labelledby="exam-summary-pdf-title">
        <FileText size={30} aria-hidden="true" />
        <div><h2 id="exam-summary-pdf-title">시험 직전 핵심 요약 PDF</h2><p>5과목의 핵심 용어·비교 기준과 계산 공식·예제를 A4 복습 자료로 모았습니다.</p><small>PDF는 전체 {summaryCards.length}개 자료를 과목별로 정리한 공통 요약본입니다.</small></div>
        <a className="primary-button" href="/downloads/exam-summary-quick-review.pdf" download="정보처리기사_실기_핵심요약.pdf"><Download size={17} aria-hidden="true" /> PDF 받기</a>
      </section>
      <div className="exam-summary-tabs" aria-label="실기 요약 과목 선택">
        <button type="button" className={activeSubject === 'all' ? 'active' : ''} onClick={() => setActiveSubject('all')} aria-pressed={activeSubject === 'all'}>전체</button>
        {subjects.map((subject) => (
          <button key={subject.id} type="button" className={activeSubject === subject.id ? 'active' : ''} onClick={() => setActiveSubject(subject.id)} aria-pressed={activeSubject === subject.id}>
            {subject.short} <span>{hasLoaded ? orderedCards.filter((card) => card.subject.id === subject.id).length : '—'}</span>
          </button>
        ))}
      </div>
      {hasLoaded && <p className="exam-summary-count">{visibleCards.length}개 세부 학습 카드</p>}
      {error && <div className="save-error" role="alert">{error} <button type="button" className="row-action" disabled={isSaving} onClick={reload}>다시 불러오기</button></div>}
      {hasLoaded && <p className="exam-summary-save-status" role="status">{isSaving ? '변경 내용을 저장하고 있습니다…' : saved ? '내 계정에 저장했습니다.' : '카드 순서와 삭제 목록은 내 계정에 저장됩니다.'}</p>}
      {hasLoaded && visibleCards.length > 1 && <p id="exam-summary-reorder-help" className="favorite-reorder-hint">카드를 드래그해 순서를 바꿀 수 있습니다. 키보드는 카드에서 Alt+↑/↓를 누르세요.</p>}
      {isLoading && <div className="empty-review panel"><h2>실기 요약 목록을 불러오는 중입니다.</h2><p>내 계정에 저장된 카드 순서와 삭제 목록을 확인합니다.</p></div>}
      {hasLoaded && visibleCards.length === 0 && <div className="empty-review panel"><h2>표시할 카드가 없습니다.</h2><p>아래 삭제한 카드 목록에서 필요한 카드를 복원할 수 있습니다.</p></div>}
      {hasLoaded && <div className="material-grid exam-summary-grid" aria-busy={isSaving}>
        {visibleCards.map((card, index) => {
          const { subject, material } = card;
          const key = cardKey(card);
          return (
            <article className={`material-card exam-summary-card${selectedMaterial?.id === material.id ? ' selected' : ''}${draggedKey === key ? ' dragging' : ''}${dropTargetKey === key ? ' drop-target' : ''}`} key={key} draggable={canReorder} tabIndex={canReorder ? 0 : undefined} aria-label={`${material.title} 실기 요약 카드, ${index + 1}번째`} aria-describedby={canReorder ? 'exam-summary-reorder-help' : undefined} onDragStart={(event) => { if (!canReorder || event.target.closest('button')) { event.preventDefault(); return; } event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', key); setDraggedKey(key); }} onDragOver={(event) => { if (canReorder && draggedKey && draggedKey !== key) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTargetKey(key); } }} onDrop={(event) => { event.preventDefault(); moveCard(draggedKey, key); setDraggedKey(null); setDropTargetKey(null); }} onDragEnd={() => { setDraggedKey(null); setDropTargetKey(null); }} onKeyDown={(event) => { if (!canReorder || event.target !== event.currentTarget || !event.altKey) return; const neighborKey = event.key === 'ArrowUp' ? visibleKeys[index - 1] : event.key === 'ArrowDown' ? visibleKeys[index + 1] : null; if (neighborKey) { event.preventDefault(); moveCard(key, neighborKey); } }}>
              <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <div className="exam-summary-card-heading"><span className="favorite-drag-label"><GripVertical size={15} aria-hidden="true" /><span className="material-kind">{subject.short} · 세부 학습</span></span><button type="button" className="exam-summary-delete" disabled={!canEdit} draggable={false} onClick={() => deleteCard(key)} aria-label={`${material.title} 실기 요약에서 삭제`}><Trash2 size={15} aria-hidden="true" /> 삭제</button></div>
                <h2>{material.title}</h2>
                <p>{material.description}</p>
                <div className="material-card-actions">
                  <button type="button" className={selectedMaterial?.id === material.id && studyView === 'summary' ? 'active' : ''} onClick={() => { setSelectedMaterial(material); setStudyView('summary'); }}>빠른 요약</button>
                  <button type="button" className={selectedMaterial?.id === material.id && studyView === 'detail' ? 'active' : ''} onClick={() => { setSelectedMaterial(material); setStudyView('detail'); }}>상세 정리</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>}
      {hasLoaded && deletedCards.length > 0 && <details className="exam-summary-deleted panel"><summary>삭제한 카드 {deletedCards.length}개 · 복원하기</summary><p>삭제는 내 실기 요약 목록에만 적용됩니다. 원래 학습 자료는 학습하기에서 계속 볼 수 있습니다.</p><ul>{deletedCards.map((card) => <li key={cardKey(card)}><div><strong>{card.material.title}</strong><span>{card.subject.short}</span></div><button type="button" className="secondary-button" disabled={!canEdit} onClick={() => restoreCard(cardKey(card))}><RotateCcw size={14} aria-hidden="true" /> 복원</button></li>)}</ul></details>}
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={() => { setSelectedMaterial(null); setStudyView(null); }} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>기출 유형에 맞춰 선별한 복습 목록입니다. 특정 회차의 실제 시험 원문을 수록한 페이지는 아닙니다.</span></div>
    </div>
  );
}
