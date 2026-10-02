import { useState } from 'react';
import { BookOpenCheck, CheckCircle2, FileText, Star, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SubjectIcon from '../components/SubjectIcon';
import { subjects } from '../data/studyData';
import { learningDiagrams } from '../data/learningDiagrams';
import { useFavorites } from '../contexts/FavoritesContext';

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
  const selectedMaterial = subject.materials.find((material) => material.id === selectedMaterialId);

  if (!subject.materials.length) return <SubjectEmptyState subject={subject} />;

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">SUBJECT STUDY</p><h1>{subject.short}</h1><p>{subject.description}</p></div></div>
      <div className="material-library-heading"><div><p className="section-kicker">STUDY LIBRARY</p><h2>과목 정리 자료</h2><p>카드에서 빠른 요약 또는 상세 정리를 선택해 원하는 깊이로 공부하세요.</p></div><span><FileText size={16} /> {subject.materials.length}개 자료</span></div>
      {error && <p className="save-error" role="alert">{error}</p>}
      <div className="material-grid">
        {subject.materials.map((material, index) => (
          <article className={`material-card ${selectedMaterial?.id === material.id ? 'selected' : ''}`} key={material.id}>
            <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span><div><div className="material-card-heading"><span className="material-kind">{material.kind}</span><button type="button" className={`favorite-button${isFavorite(material.id) ? ' active' : ''}`} onClick={() => toggleFavorite({ subjectId: subject.id, materialId: material.id })} disabled={pendingMaterialId === material.id} aria-label={`${material.title} ${isFavorite(material.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}`} aria-pressed={isFavorite(material.id)}><Star size={17} /></button></div><h2>{material.title}</h2><p>{material.description}</p>{material.detail && <div className="material-card-actions"><button type="button" className={selectedMaterial?.id === material.id && studyView === 'summary' ? 'active' : ''} onClick={() => { setSelectedMaterialId(material.id); setStudyView('summary'); }} aria-pressed={selectedMaterial?.id === material.id && studyView === 'summary'}>빠른 요약</button><button type="button" className={selectedMaterial?.id === material.id && studyView === 'detail' ? 'active' : ''} onClick={() => { setSelectedMaterialId(material.id); setStudyView('detail'); }} aria-pressed={selectedMaterial?.id === material.id && studyView === 'detail'}>상세 정리</button></div>}</div>
          </article>
        ))}
      </div>
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={() => { setSelectedMaterialId(null); setStudyView(null); }} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>먼저 빠른 요약으로 개념을 훑고, 상세 정리에서 예시와 도식을 확인하세요.</span></div>
    </div>
  );
}

export function MaterialStudyModal({ material, studyView, onClose }) {
  const viewLabel = studyView === 'detail' ? '상세 정리' : '빠른 요약';

  return (
    <div className="study-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="study-modal" role="dialog" aria-modal="true" aria-label={`${material.title} ${viewLabel}`}>
        <button type="button" className="study-modal-close" onClick={onClose} aria-label="학습 자료 닫기"><X size={19} /></button>
        <div className="material-detail-heading"><div><span className="material-kind">{viewLabel} · {material.kind}</span><h2>{material.title}</h2><p>{material.description}</p></div><FileText size={24} /></div>
        {material.detail && <><div className="key-point-list">{material.points.map((point) => <div key={point}><CheckCircle2 size={16} /><span>{point}</span></div>)}</div>{studyView === 'detail' ? <MaterialStudyGuide detail={material.detail} materialId={material.id} /> : <MaterialQuickSummary detail={material.detail} title={material.title} />}</>}
      </article>
    </div>
  );
}

function MaterialStudyGuide({ detail, materialId }) {
  const [selectedGroupName, setSelectedGroupName] = useState(detail.groups[0]?.name ?? '');
  const [imageZoomed, setImageZoomed] = useState(false);
  const selectedGroup = detail.groups.find((group) => group.name === selectedGroupName) ?? detail.groups[0];
  const diagram = learningDiagrams[materialId];

  return (
    <div className="material-study-guide">
      <div className="learning-definition">
        <span className="section-kicker">ONE-LINE DEFINITION</span>
        <strong>{detail.definition}</strong>
        <p>{detail.memoryTip}</p>
        <div className="learning-concept"><span className="material-kind">먼저 이해하기</span><p>{detail.concept}</p></div>
      </div>
      <div className="learning-steps">{detail.learningSteps.map((step) => <div className="learning-step" key={step.title}><strong>{step.title}</strong><p>{step.text}</p></div>)}</div>
      {diagram ? <LearningDiagram diagram={diagram} /> : detail.image && <div className="learning-visual-panel"><div className="learning-visual-toolbar"><strong>한눈에 보는 도식</strong><button type="button" onClick={() => setImageZoomed((value) => !value)} aria-pressed={imageZoomed}>{imageZoomed ? '전체 보기' : '확대해서 보기'}</button><a href={detail.image} target="_blank" rel="noopener noreferrer">원본 열기</a></div><div className={`learning-visual-scroll${imageZoomed ? ' zoomed' : ''}`}><img className="learning-visual" src={detail.image} alt={detail.imageAlt} loading="lazy" /></div></div>}
      <div className="detail-group-cards">
        {detail.groups.map((group) => (
          <button type="button" className={['detail-group-card', group.color, selectedGroup.name === group.name ? 'active' : ''].join(' ')} onClick={() => setSelectedGroupName(group.name)} aria-pressed={selectedGroup.name === group.name} key={group.name}>
            <span className="material-kind">{group.name}</span><h3>{group.question}</h3><p>{group.memory}</p>
          </button>
        ))}
      </div>
      <section className={['pattern-group', selectedGroup.color].join(' ')}><div className="pattern-group-heading"><div><span className="material-kind">선택한 분류 · {selectedGroup.name}</span><h3>{selectedGroup.question}</h3></div><span className="pattern-group-memory">{selectedGroup.memory}</span></div><div className="pattern-list">{selectedGroup.patterns.map(([name, meaning, detailText, example]) => <div className="pattern-item" key={name}><strong>{name}</strong><span>{meaning}</span><p>{detailText}</p><small><b>예시</b> {example}</small></div>)}</div></section>
    </div>
  );
}

function LearningDiagram({ diagram }) {
  return <section className="learning-diagram" aria-label={diagram.title}><div className="learning-diagram-heading"><span className="section-kicker">VISUAL GUIDE</span><h3>{diagram.title}</h3></div><div className={`learning-diagram-items${diagram.flow ? ' flow' : ''}`}>{diagram.items.map(([label, description], index) => <div className="learning-diagram-item" key={label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><p>{description}</p></div>)}</div></section>;
}

function MaterialQuickSummary({ detail, title }) {
  const [selectedGroupName, setSelectedGroupName] = useState(detail.groups[0]?.name ?? '');
  const selectedGroup = detail.groups.find((group) => group.name === selectedGroupName) ?? detail.groups[0];

  return (
    <div className="quick-summary">
      <div className="quick-summary-intro"><span className="section-kicker">QUICK REVIEW</span><strong>{title} 핵심만 빠르게 보기</strong><p>{detail.quickDescription ?? detail.definition}</p><small>{detail.memoryTip}</small></div>
      <div className="quick-summary-grid">
        {detail.groups.map((group) => (
          <button type="button" className={['quick-summary-card', group.color, selectedGroup.name === group.name ? 'active' : ''].join(' ')} onClick={() => setSelectedGroupName(group.name)} aria-pressed={selectedGroup.name === group.name} key={group.name}>
            <span className="material-kind">{group.name}</span><h3>{group.question}</h3><p>{group.memory}</p>
          </button>
        ))}
      </div>
      <section className={['quick-summary-selected', selectedGroup.color].join(' ')}><div><span className="material-kind">선택한 분류 · {selectedGroup.name}</span><h3>{selectedGroup.question}</h3><p>{selectedGroup.memory}</p></div><div className="quick-summary-patterns">{selectedGroup.patterns.map(([name, summary]) => <article className="quick-summary-pattern" key={name}><strong>{name}</strong><p>{summary}</p></article>)}</div></section>
    </div>
  );
}

function SubjectEmptyState({ subject }) {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>준비 중</span></div><div className="empty-review panel"><div className="empty-icon"><BookOpenCheck size={22} /></div><h2>학습 자료를 준비하고 있습니다.</h2><p>기출 출제 포인트를 분석해 원문을 그대로 옮기지 않은 학습 카드 형태로 순서대로 추가할 예정입니다.</p></div></div>;
}

function SubjectOverview() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>5과목 학습 자료</h1><p>과목별 핵심 요약, 비교 노트, 암기 카드를 모아 학습합니다.</p></div></div><div className="overview-grid">{subjects.map((subject) => <Link to={`/study/${subject.id}`} className="overview-card" key={subject.id}><span className={`subject-badge ${subject.color}`}><SubjectIcon subjectId={subject.id} /></span><h2>{subject.short}</h2><p>{subject.description}</p><strong>{subject.materials.length ? `${subject.materials.length}개 자료` : '자료 준비 중'}</strong></Link>)}</div></div>;
}
