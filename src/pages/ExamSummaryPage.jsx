import { useEffect, useRef, useState } from 'react';
import { BookOpenCheck, Download, FileText, GripVertical, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subjects } from '../data/studyData';
import { availableSummaryOrder, defaultSummaryOrder, summaryCardByKey as cardByKey, summaryCardKey as cardKey } from '../data/examSummaryCatalog';
import { useAuth } from '../contexts/AuthContext';
import { useExamSummaryPreferences } from '../hooks/useExamSummaryPreferences';
import { moveSummaryCard } from '../lib/examSummaryPreferences';
import { MaterialStudyModal } from './StudyPage';
import { snapshotSummaryPdfCards } from '../lib/summaryPdfCard';
import { useStudyModal } from '../hooks/useStudyModal';

export default function ExamSummaryPage() {
  const { user } = useAuth();
  const [activeSubject, setActiveSubject] = useState('all');
  const { selectedMaterialId, studyView, openStudyModal, closeStudyModal } = useStudyModal();
  const [isExporting, setIsExporting] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const exportRequest = useRef(null);
  const activeUserId = useRef(user?.id);
  activeUserId.current = user?.id;
  useEffect(() => {
    setIsExporting(false);
    setPdfError('');
    return () => { exportRequest.current?.controller.abort(); exportRequest.current = null; };
  }, [user?.id]);
  const { preferences, isLoading, isSaving, hasLoaded, canEdit, error, saved, persistPreferences, reload } = useExamSummaryPreferences(user?.id, defaultSummaryOrder, availableSummaryOrder);
  const { cardOrder, hiddenCardIds } = preferences;
  const [draggedKey, setDraggedKey] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const hiddenKeys = new Set(hiddenCardIds);
  const orderedCards = cardOrder.filter((key) => !hiddenKeys.has(key)).map((key) => cardByKey.get(key)).filter(Boolean);
  const selectedMaterial = orderedCards.find(({ material }) => material.id === selectedMaterialId)?.material;
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

  const downloadPersonalPdf = async () => {
    if (!user?.id || !hasLoaded || isSaving || exportRequest.current || !orderedCards.length) return;
    const request = { userId: user.id, controller: new AbortController() };
    exportRequest.current = request;
    setIsExporting(true);
    setPdfError('');
    try {
      const cards = snapshotSummaryPdfCards(orderedCards);
      const { generatePersonalSummaryPdf } = await import('../lib/personalSummaryPdf');
      const bytes = await generatePersonalSummaryPdf(cards, { signal: request.controller.signal });
      if (request.controller.signal.aborted || exportRequest.current !== request || activeUserId.current !== request.userId) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `정보처리기사_내실기요약_${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadError) {
      if (!request.controller.signal.aborted && exportRequest.current === request) setPdfError(downloadError instanceof Error ? downloadError.message : 'PDF를 생성하지 못했습니다. 다시 시도해주세요.');
    } finally {
      if (exportRequest.current === request) { exportRequest.current = null; setIsExporting(false); }
    }
  };

  return (
    <div className="subpage">
      <div className="subpage-header">
        <div>
          <p className="eyebrow">EXAM STUDY</p>
          <h1>실기 요약</h1>
          <p>기출 유형·코드 연습의 개념과 추가 자료에서 선별한 실기 핵심 복습 카드를 모았습니다.</p>
        </div>
        <div className="favorites-count"><BookOpenCheck size={23} /><strong>{hasLoaded ? orderedCards.length : '—'}</strong><span>개 카드</span></div>
      </div>
      <section className="exam-summary-pdf panel" aria-labelledby="exam-summary-pdf-title" aria-busy={isExporting}>
        <FileText size={30} aria-hidden="true" />
        <div><h2 id="exam-summary-pdf-title">내 실기 요약 PDF</h2><p>남아 있는 카드를 과목별로 모으고, 각 과목 안에서는 내가 정한 순서를 유지한 A4 요약본을 만듭니다.</p><small>{hasLoaded ? `현재 과목 필터와 관계없이 내 전체 목록 ${orderedCards.length}개 카드를 담습니다. 삭제한 카드는 제외하고 남아 있는 카드에 해당하는 계산 예제만 포함합니다.` : '계정에 저장된 카드 목록을 확인한 뒤 다운로드할 수 있습니다.'}</small></div>
        <button type="button" className="primary-button" onClick={downloadPersonalPdf} disabled={!hasLoaded || isSaving || isExporting || !orderedCards.length}><Download size={17} aria-hidden="true" />{isExporting ? 'PDF 만드는 중…' : '내 요약 PDF 받기'}</button>
      </section>
      {pdfError && <p className="save-error" role="alert">{pdfError}</p>}
      {isExporting && <p className="exam-summary-save-status" role="status">다운로드 시점의 카드를 과목별로 모아 PDF를 만들고 있습니다. 과목 안의 개인 순서는 유지됩니다.</p>}
      <div className="exam-summary-tabs" aria-label="실기 요약 과목 선택">
        <button type="button" className={activeSubject === 'all' ? 'active' : ''} onClick={() => setActiveSubject('all')} aria-pressed={activeSubject === 'all'}>전체</button>
        {subjects.map((subject) => (
          <button key={subject.id} type="button" className={activeSubject === subject.id ? 'active' : ''} onClick={() => setActiveSubject(subject.id)} aria-pressed={activeSubject === subject.id}>
            {subject.short} <span>{hasLoaded ? orderedCards.filter((card) => card.subject.id === subject.id).length : '—'}</span>
          </button>
        ))}
      </div>
      <p className="practice-history-link"><Link to="/study"><Plus size={15} aria-hidden="true" /> 학습하기에서 내 실기 요약 카드 추가</Link></p>
      {hasLoaded && <p className="exam-summary-count">{visibleCards.length}개 세부 학습 카드</p>}
      {error && <div className="save-error" role="alert">{error} <button type="button" className="row-action" disabled={isSaving} onClick={reload}>다시 불러오기</button></div>}
      {hasLoaded && <p className="exam-summary-save-status" role="status">{isSaving ? '변경 내용을 저장하고 있습니다…' : saved ? '내 계정에 저장했습니다.' : '추가한 카드와 카드 순서·삭제 목록은 내 계정에 저장됩니다.'}</p>}
      {hasLoaded && visibleCards.length > 1 && <p id="exam-summary-reorder-help" className="favorite-reorder-hint">카드를 드래그해 순서를 바꿀 수 있습니다. 키보드는 카드에서 Alt+↑/↓를 누르세요.</p>}
      {isLoading && <div className="empty-review panel"><h2>실기 요약 목록을 불러오는 중입니다.</h2><p>내 계정에 저장된 카드 순서와 삭제 목록을 확인합니다.</p></div>}
      {hasLoaded && visibleCards.length === 0 && <div className="empty-review panel"><h2>표시할 카드가 없습니다.</h2><p>학습하기에서 카드를 추가하거나 아래 삭제한 카드 목록에서 필요한 카드를 복원할 수 있습니다.</p></div>}
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
                  <button type="button" className={selectedMaterial?.id === material.id && studyView === 'summary' ? 'active' : ''} onClick={() => openStudyModal(material.id, 'summary')}>빠른 요약</button>
                  <button type="button" className={selectedMaterial?.id === material.id && studyView === 'detail' ? 'active' : ''} onClick={() => openStudyModal(material.id, 'detail')}>상세 정리</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>}
      {hasLoaded && deletedCards.length > 0 && <details className="exam-summary-deleted panel"><summary>삭제한 카드 {deletedCards.length}개 · 복원하기</summary><p>삭제는 내 실기 요약 목록에만 적용됩니다. 원래 학습 자료는 학습하기에서 계속 볼 수 있습니다.</p><ul>{deletedCards.map((card) => <li key={cardKey(card)}><div><strong>{card.material.title}</strong><span>{card.subject.short}</span></div><button type="button" className="secondary-button" disabled={!canEdit} onClick={() => restoreCard(cardKey(card))}><RotateCcw size={14} aria-hidden="true" /> 복원</button></li>)}</ul></details>}
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={closeStudyModal} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>기출 유형에 맞춰 선별한 복습 목록입니다. 특정 회차의 실제 시험 원문을 수록한 페이지는 아닙니다.</span></div>
    </div>
  );
}
