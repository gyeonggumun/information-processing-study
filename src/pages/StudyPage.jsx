import { useEffect, useState } from 'react';
import { BookOpenCheck, CheckCircle2, FileText, Plus, Star, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SubjectIcon from '../components/SubjectIcon';
import StudyConceptTable from '../components/StudyConceptTable';
import ReadingText from '../components/ReadingText';
import CalculationGuide, { hasCalculationGuide } from '../components/CalculationGuide';
import { subjects } from '../data/studyData';
import { studyComparisonNotes } from '../data/studyComparisonNotes';
import { studyUnderstandingNotes } from '../data/studyUnderstandingNotes';
import { buildConceptSections } from '../lib/studyConceptTable';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { hasRequiredRole } from '../lib/appRoles';
import { useExamSummaryPreferences } from '../hooks/useExamSummaryPreferences';
import { addSummaryCard } from '../lib/examSummaryPreferences';
import { availableSummaryOrder, defaultSummaryOrder, summaryCardByKey } from '../data/examSummaryCatalog';

export default function StudyPage() {
  const { subjectId } = useParams();
  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) return <SubjectOverview />;

  return <SubjectLibrary subject={subject} />;
}

function SubjectLibrary({ subject }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [studyView, setStudyView] = useState(null);
  const { error, pendingMaterialId, isFavorite, toggleFavorite } = useFavorites();
  const { user, appRole } = useAuth();
  const canManageSummary = hasRequiredRole(appRole, 'pro');
  const summary = useExamSummaryPreferences(canManageSummary ? user?.id : undefined, defaultSummaryOrder, availableSummaryOrder);
  const hiddenSummaryKeys = new Set(summary.preferences.hiddenCardIds);
  const visibleSummaryKeys = new Set(summary.preferences.cardOrder.filter(key => !hiddenSummaryKeys.has(key)));
  const addMaterialToSummary = (material) => {
    if (!canManageSummary || !summary.canEdit) return;
    const next = addSummaryCard(summary.preferences, `${subject.id}:${material.id}`, availableSummaryOrder);
    if (next !== summary.preferences) summary.persistPreferences(next);
  };
  const selectedMaterial = subject.materials.find((material) => material.id === selectedMaterialId);

  if (!subject.materials.length) return <SubjectEmptyState subject={subject} />;

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">SUBJECT STUDY</p><h1>{subject.short}</h1><p>{subject.description}</p></div></div>
      <div className="material-library-heading"><div><p className="section-kicker">STUDY LIBRARY</p><h2>과목 정리 자료</h2><p>카드에서 빠른 요약 또는 상세 정리를 선택해 원하는 깊이로 공부하세요.</p></div><span><FileText size={16} /> {subject.materials.length}개 자료</span></div>
      {error && <p className="save-error" role="alert">{error}</p>}
      {canManageSummary && <p className="practice-history-link">세부 학습 카드의 추가 버튼으로 내 목록을 구성하세요. <Link to="/exam-summary">내 실기 요약 보기</Link></p>}
      {canManageSummary && summary.error && <p className="save-error" role="alert">{summary.error} <button type="button" className="row-action" disabled={summary.isSaving} onClick={summary.reload}>다시 불러오기</button></p>}
      {canManageSummary && <p className="exam-summary-save-status" role="status">{summary.isSaving ? '실기 요약에 저장하고 있습니다…' : summary.saved ? '내 실기 요약에 추가했습니다.' : ''}</p>}
      <div className="material-grid">
        {subject.materials.map((material, index) => {
          const key = `${subject.id}:${material.id}`;
          const isAdded = summary.hasLoaded && visibleSummaryKeys.has(key);
          return (
          <article className={`material-card study-library-card${material.studyRole === 'overview' ? ' overview' : ''}${selectedMaterial?.id === material.id ? ' selected' : ''}`} key={material.id}>
            <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span><div><div className="material-card-heading"><span className="material-kind">{material.kind}</span><button type="button" className={`favorite-button${isFavorite(material.id) ? ' active' : ''}`} onClick={() => toggleFavorite({ subjectId: subject.id, materialId: material.id })} disabled={pendingMaterialId === material.id} aria-label={`${material.title} ${isFavorite(material.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}`} aria-pressed={isFavorite(material.id)}><Star size={17} /></button></div><h2>{material.title}</h2><p>{material.description}</p>{material.detail && <div className="material-card-actions"><button type="button" className={selectedMaterial?.id === material.id && studyView === 'summary' ? 'active' : ''} onClick={() => { setSelectedMaterialId(material.id); setStudyView('summary'); }} aria-pressed={selectedMaterial?.id === material.id && studyView === 'summary'}>빠른 요약</button><button type="button" className={selectedMaterial?.id === material.id && studyView === 'detail' ? 'active' : ''} onClick={() => { setSelectedMaterialId(material.id); setStudyView('detail'); }} aria-pressed={selectedMaterial?.id === material.id && studyView === 'detail'}>상세 정리</button></div>}</div>
            {canManageSummary && summaryCardByKey.has(key) && <button type="button" className={`summary-add-button${isAdded ? ' added' : ''}`} disabled={!summary.canEdit || isAdded} onClick={() => addMaterialToSummary(material)} aria-label={`${material.title} ${isAdded ? '실기 요약에 추가됨' : '실기 요약에 추가'}`}>
              {isAdded ? <CheckCircle2 size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}{isAdded ? '실기 요약에 추가됨' : summary.isLoading ? '요약 목록 확인 중…' : '실기 요약에 추가'}
            </button>}
          </article>
          );
        })}
      </div>
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={() => { setSelectedMaterialId(null); setStudyView(null); }} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>먼저 빠른 요약으로 개념을 훑고, 상세 정리에서 예시와 도식을 확인하세요.</span></div>
    </div>
  );
}

export function MaterialStudyModal({ material, studyView, onClose }) {
  const viewLabel = studyView === 'detail' ? '상세 정리' : '빠른 요약';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="study-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="study-modal" role="dialog" aria-modal="true" aria-label={`${material.title} ${viewLabel}`}>
        <button type="button" className="study-modal-close" onClick={onClose} aria-label="학습 자료 닫기"><X size={19} /></button>
        <div className="material-detail-heading"><div><span className="material-kind">{viewLabel} · {material.kind}</span><h2>{material.title}</h2><p>{material.description}</p></div><FileText size={24} /></div>
        {material.detail && <><div className="key-point-list">{material.points.map((point) => <div key={point}><CheckCircle2 size={16} /><span>{point}</span></div>)}</div>{studyView === 'detail' ? <MaterialStudyGuide detail={material.detail} materialId={material.id} showAllGroups={material.studyRole === 'overview'} /> : <MaterialQuickSummary detail={material.detail} materialId={material.id} title={material.title} showAllGroups={material.studyRole === 'overview'} />}</>}
      </article>
    </div>
  );
}

function MaterialStudyGuide({ detail, materialId, showAllGroups = false }) {
  const [selectedGroupName, setSelectedGroupName] = useState(detail.groups[0]?.name ?? '');
  const selectedGroup = detail.groups.find((group) => group.name === selectedGroupName) ?? detail.groups[0];
  const hasGroupChoices = detail.groups.length > 1;
  const visibleGroups = showAllGroups ? detail.groups : selectedGroup ? [selectedGroup] : [];

  return (
    <div className="material-study-guide">
      <div className="learning-definition">
        <span className="section-kicker">핵심 뜻</span>
        <strong><ReadingText>{detail.definition}</ReadingText></strong>
        <p><ReadingText>{detail.memoryTip}</ReadingText></p>
        <div className="learning-concept"><span className="material-kind">먼저 이해하기</span><p><ReadingText>{detail.concept}</ReadingText></p></div>
      </div>
      {detail.learningSteps.length > 0 && <div className="learning-steps">{detail.learningSteps.map((step) => <div className="learning-step" key={step.title}><strong>{step.title}</strong><p><ReadingText>{step.text}</ReadingText></p></div>)}</div>}
      {hasCalculationGuide(materialId) && <CalculationGuide materialId={materialId} />}
      {!showAllGroups && hasGroupChoices && <div className="detail-group-cards">
        {detail.groups.map((group) => (
          <button type="button" className={['detail-group-card', group.color, selectedGroup.name === group.name ? 'active' : ''].join(' ')} onClick={() => setSelectedGroupName(group.name)} aria-pressed={selectedGroup.name === group.name} key={group.name}>
            <span className="material-kind">{group.name}</span><h3>{group.question}</h3><p>{group.memory}</p>
          </button>
        ))}
      </div>}
      <StudyConceptTable visual={detail.visual} groups={visibleGroups} title={showAllGroups ? detail.visual?.title ?? '주제별 핵심 비교' : selectedGroup?.name} />
    </div>
  );
}

function MaterialQuickSummary({ detail, materialId, title, showAllGroups = false }) {
  const [selectedGroupName, setSelectedGroupName] = useState(detail.groups[0]?.name ?? '');
  const selectedGroup = detail.groups.find((group) => group.name === selectedGroupName) ?? detail.groups[0];
  const hasGroupChoices = detail.groups.length > 1;
  const visibleGroups = showAllGroups ? detail.groups : selectedGroup ? [selectedGroup] : [];

  return (
    <div className="quick-summary">
      <div className="quick-summary-intro"><span className="section-kicker">빠른 복습</span><strong>{title} 핵심만 빠르게 보기</strong><p><ReadingText>{detail.quickDescription ?? detail.definition}</ReadingText></p>{hasGroupChoices && <small>{detail.memoryTip}</small>}</div>
      {hasCalculationGuide(materialId) && <CalculationGuide materialId={materialId} compact />}
      {!showAllGroups && hasGroupChoices && <div className="quick-summary-grid">
        {detail.groups.map((group) => (
          <button type="button" className={['quick-summary-card', group.color, selectedGroup.name === group.name ? 'active' : ''].join(' ')} onClick={() => setSelectedGroupName(group.name)} aria-pressed={selectedGroup.name === group.name} key={group.name}>
            <span className="material-kind">{group.name}</span><h3>{group.question}</h3><p>{group.memory}</p>
          </button>
        ))}
      </div>}
      {visibleGroups.map((group) => {
        const [section] = buildConceptSections({ groups: [group], notes: studyComparisonNotes, understanding: studyUnderstandingNotes });
        return <section className={['quick-summary-selected', group.color].join(' ')} key={group.name}>
          <div><span className="material-kind">{showAllGroups ? `세부 학습 · ${group.name}` : hasGroupChoices ? `선택한 분류 · ${group.name}` : '핵심 항목'}</span><h3>{group.question}</h3><p>{section.intro}</p>{(showAllGroups || hasGroupChoices) && group.memory !== section.intro && <p>{group.memory}</p>}</div>
          <dl className="quick-summary-patterns plain-term-list">{section.items.map((item) => <div className="quick-summary-pattern" key={item.name}><dt>{item.name}</dt><dd><p><ReadingText>{item.plainMeaning ?? item.meaning}</ReadingText></p>{item.hint && item.hint !== item.meaning && <p className="quick-concept-distinction"><b>구별</b> <ReadingText>{item.hint}</ReadingText></p>}</dd></div>)}</dl>
          {section.caution && <p className="concept-section-caution"><b>함께 기억하기</b>{section.caution}</p>}
        </section>;
      })}
    </div>
  );
}

function SubjectEmptyState({ subject }) {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>준비 중</span></div><div className="empty-review panel"><div className="empty-icon"><BookOpenCheck size={22} /></div><h2>학습 자료를 준비하고 있습니다.</h2><p>기출 출제 포인트를 분석해 원문을 그대로 옮기지 않은 학습 카드 형태로 순서대로 추가할 예정입니다.</p></div></div>;
}

function SubjectOverview() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>5과목 학습 자료</h1><p>과목별 핵심 요약, 비교 노트, 암기 카드를 모아 학습합니다.</p></div></div><div className="overview-grid">{subjects.map((subject) => <Link to={`/study/${subject.id}`} className="overview-card" key={subject.id}><span className={`subject-badge ${subject.color}`}><SubjectIcon subjectId={subject.id} /></span><h2>{subject.short}</h2><p>{subject.description}</p><strong>{subject.materials.length ? `${subject.materials.length}개 자료` : '자료 준비 중'}</strong></Link>)}</div></div>;
}
