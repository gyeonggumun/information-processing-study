import { useEffect, useState } from 'react';
import { BookOpenCheck, GripVertical } from 'lucide-react';
import { subjects } from '../data/studyData';
import { examSummaryCardIds } from '../data/examSummaryCards';
import { useAuth } from '../contexts/AuthContext';
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

function savedOrderFor(userId) {
  if (!userId || typeof window === 'undefined') return defaultOrder;
  try {
    const saved = JSON.parse(window.localStorage.getItem(`exam-summary-order:${userId}`));
    if (!Array.isArray(saved)) return defaultOrder;
    const valid = [...new Set(saved.filter((key) => cardByKey.has(key)))];
    return [...valid, ...defaultOrder.filter((key) => !valid.includes(key))];
  } catch {
    return defaultOrder;
  }
}

export default function ExamSummaryPage() {
  const { user } = useAuth();
  const [activeSubject, setActiveSubject] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studyView, setStudyView] = useState(null);
  const [cardOrder, setCardOrder] = useState(() => savedOrderFor(user?.id));
  const [draggedKey, setDraggedKey] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    try { window.localStorage.setItem(`exam-summary-order:${user.id}`, JSON.stringify(cardOrder)); } catch { /* 브라우저 저장소를 사용할 수 없어도 순서 변경은 유지합니다. */ }
  }, [cardOrder, user?.id]);
  const orderedCards = cardOrder.map((key) => cardByKey.get(key)).filter(Boolean);
  const visibleCards = activeSubject === 'all'
    ? orderedCards
    : orderedCards.filter(({ subject }) => subject.id === activeSubject);
  const visibleKeys = visibleCards.map(cardKey);
  const moveCard = (fromKey, toKey) => {
    if (!fromKey || fromKey === toKey || !visibleKeys.includes(fromKey) || !visibleKeys.includes(toKey)) return;
    const nextVisibleKeys = [...visibleKeys];
    nextVisibleKeys.splice(nextVisibleKeys.indexOf(fromKey), 1);
    nextVisibleKeys.splice(visibleKeys.indexOf(toKey), 0, fromKey);
    const replacements = new Map(visibleKeys.map((key, index) => [key, nextVisibleKeys[index]]));
    setCardOrder((current) => current.map((key) => replacements.get(key) ?? key));
  };

  return (
    <div className="subpage">
      <div className="subpage-header">
        <div>
          <p className="eyebrow">EXAM STUDY</p>
          <h1>실기 요약</h1>
          <p>사이트의 기출 유형·코드 연습과 연결되는 세부 학습 카드만 모았습니다.</p>
        </div>
        <div className="favorites-count"><BookOpenCheck size={23} /><strong>{summaryCards.length}</strong><span>개 카드</span></div>
      </div>
      <div className="exam-summary-tabs" aria-label="실기 요약 과목 선택">
        <button type="button" className={activeSubject === 'all' ? 'active' : ''} onClick={() => setActiveSubject('all')} aria-pressed={activeSubject === 'all'}>전체</button>
        {subjects.map((subject) => (
          <button key={subject.id} type="button" className={activeSubject === subject.id ? 'active' : ''} onClick={() => setActiveSubject(subject.id)} aria-pressed={activeSubject === subject.id}>
            {subject.short} <span>{examSummaryCardIds[subject.id]?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <p className="exam-summary-count">{visibleCards.length}개 세부 학습 카드</p>
      {visibleCards.length > 1 && <p id="exam-summary-reorder-help" className="favorite-reorder-hint">카드를 드래그해 순서를 바꿀 수 있습니다. 키보드는 카드에서 Alt+↑/↓를 누르세요. 순서는 이 브라우저에 저장됩니다.</p>}
      <div className="material-grid exam-summary-grid">
        {visibleCards.map((card, index) => {
          const { subject, material } = card;
          const key = cardKey(card);
          return (
            <article className={`material-card exam-summary-card${selectedMaterial?.id === material.id ? ' selected' : ''}${draggedKey === key ? ' dragging' : ''}${dropTargetKey === key ? ' drop-target' : ''}`} key={key} draggable={visibleCards.length > 1} tabIndex={visibleCards.length > 1 ? 0 : undefined} aria-label={`${material.title} 실기 요약 카드, ${index + 1}번째`} aria-describedby={visibleCards.length > 1 ? 'exam-summary-reorder-help' : undefined} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', key); setDraggedKey(key); }} onDragOver={(event) => { if (draggedKey && draggedKey !== key) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTargetKey(key); } }} onDrop={(event) => { event.preventDefault(); moveCard(draggedKey, key); setDraggedKey(null); setDropTargetKey(null); }} onDragEnd={() => { setDraggedKey(null); setDropTargetKey(null); }} onKeyDown={(event) => { if (event.target !== event.currentTarget || !event.altKey) return; const neighborKey = event.key === 'ArrowUp' ? visibleKeys[index - 1] : event.key === 'ArrowDown' ? visibleKeys[index + 1] : null; if (neighborKey) { event.preventDefault(); moveCard(key, neighborKey); } }}>
              <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <span className="favorite-drag-label"><GripVertical size={15} aria-hidden="true" /><span className="material-kind">{subject.short} · 세부 학습</span></span>
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
      </div>
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={() => { setSelectedMaterial(null); setStudyView(null); }} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>기출 유형에 맞춰 선별한 복습 목록입니다. 특정 회차의 실제 시험 원문을 수록한 페이지는 아닙니다.</span></div>
    </div>
  );
}
