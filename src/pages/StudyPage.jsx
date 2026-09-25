import { useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileText, Timer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { subjects } from '../data/studyData';

export default function StudyPage() {
  const { subjectId } = useParams();
  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) return <SubjectOverview />;

  return <SubjectLibrary subject={subject} />;
}

function SubjectLibrary({ subject }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(subject.materials[0]?.id ?? null);
  const [studyView, setStudyView] = useState(null);
  const selectedMaterial = subject.materials.find((material) => material.id === selectedMaterialId) ?? subject.materials[0];

  if (!selectedMaterial) return <SubjectEmptyState subject={subject} />;

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">SUBJECT STUDY</p><h1>{subject.short}</h1><p>{subject.description}</p></div></div>
      <div className="material-library-heading"><div><p className="section-kicker">STUDY LIBRARY</p><h2>과목 정리 자료</h2><p>실제 요약 자료와 분석 노트가 들어갈 자리입니다. 자료를 선택하면 핵심 내용을 미리 볼 수 있습니다.</p></div><span><FileText size={16} /> {subject.materials.length}개 자료</span></div>
      <div className="material-grid">
        {subject.materials.map((material, index) => (
          <button type="button" className={`material-card ${selectedMaterial.id === material.id ? 'selected' : ''}`} onClick={() => { setSelectedMaterialId(material.id); setStudyView(null); }} key={material.id}>
            <span className={`material-number ${subject.color}`}>0{index + 1}</span><div><span className="material-kind">{material.kind}</span><h2>{material.title}</h2><p>{material.description}</p><small><Timer size={13} /> 약 {material.minutes}분</small></div><ArrowRight size={18} />
          </button>
        ))}
      </div>
      <article className="material-detail panel"><div className="material-detail-heading"><div><span className="material-kind">선택한 자료 · {selectedMaterial.kind}</span><h2>{selectedMaterial.title}</h2><p>{selectedMaterial.description}</p></div><FileText size={24} /></div>{selectedMaterial.detail && <><div className="material-view-choice"><div><strong>학습 방식 선택</strong><p>먼저 볼 자료 형태를 선택하세요.</p></div><div className="material-view-tabs" role="group" aria-label="학습 자료 보기 방식"><button type="button" className={studyView === 'summary' ? 'active' : ''} onClick={() => setStudyView('summary')} aria-pressed={studyView === 'summary'}>빠른 요약</button><button type="button" className={studyView === 'detail' ? 'active' : ''} onClick={() => setStudyView('detail')} aria-pressed={studyView === 'detail'}>상세 정리</button></div></div>{studyView && <><div className="key-point-list">{selectedMaterial.points.map((point) => <div key={point}><CheckCircle2 size={16} /><span>{point}</span></div>)}</div>{studyView === 'detail' ? <MaterialStudyGuide detail={selectedMaterial.detail} /> : <MaterialQuickSummary detail={selectedMaterial.detail} />}</>}</>}<Link to="/exams" className="secondary-button">관련 랜덤 문제 풀기 <ArrowRight size={15} /></Link></article>
      <div className="notice-panel"><BookOpenCheck size={19} /><span>과목 학습 콘텐츠는 기출 분석 결과에 따라 단계적으로 확장할 예정입니다.</span></div>
    </div>
  );
}

function MaterialStudyGuide({ detail }) {
  return (
    <div className="material-study-guide">
      <div className="learning-definition">
        <span className="section-kicker">ONE-LINE DEFINITION</span>
        <strong>{detail.definition}</strong>
        <p>{detail.memoryTip}</p>
        <div className="learning-concept"><span className="material-kind">먼저 이해하기</span><p>{detail.concept}</p></div>
      </div>
      <div className="learning-steps">{detail.learningSteps.map((step) => <div className="learning-step" key={step.title}><strong>{step.title}</strong><p>{step.text}</p></div>)}</div>
      <img className="learning-visual" src={detail.image} alt={detail.imageAlt} />
      <div className="pattern-group-list">
        {detail.groups.map((group) => (
          <section className={`pattern-group ${group.color}`} key={group.name}>
            <div className="pattern-group-heading"><div><span className="material-kind">{group.name}</span><h3>{group.question}</h3></div><span className="pattern-group-memory">{group.memory}</span></div>
            <div className="pattern-list">{group.patterns.map(([name, meaning, detailText, example]) => <div className="pattern-item" key={name}><strong>{name}</strong><span>{meaning}</span><p>{detailText}</p><small><b>예시</b> {example}</small></div>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MaterialQuickSummary({ detail }) {
  const [selectedGroupName, setSelectedGroupName] = useState(detail.groups[0]?.name ?? '');
  const selectedGroup = detail.groups.find((group) => group.name === selectedGroupName) ?? detail.groups[0];

  return (
    <div className="quick-summary">
      <div className="quick-summary-intro"><span className="section-kicker">QUICK REVIEW</span><strong>디자인 패턴을 3가지 질문으로 빠르게 훑어보기</strong><p>{detail.quickDescription ?? detail.definition}</p><small>{detail.memoryTip}</small></div>
      <div className="quick-summary-grid">
        {detail.groups.map((group) => (
          <button type="button" className={['quick-summary-card', group.color, selectedGroup.name === group.name ? 'active' : ''].join(' ')} onClick={() => setSelectedGroupName(group.name)} aria-pressed={selectedGroup.name === group.name} key={group.name}>
            <span className="material-kind">{group.name}</span><h3>{group.question}</h3><p>{group.memory}</p>
          </button>
        ))}
      </div>
      <section className={['quick-summary-selected', selectedGroup.color].join(' ')}><div><span className="material-kind">선택한 분류 · {selectedGroup.name}</span><h3>{selectedGroup.question}</h3><p>{selectedGroup.memory}</p></div><div className="quick-summary-patterns">{selectedGroup.patterns.map(([name]) => <span key={name}>{name}</span>)}</div></section>
    </div>
  );
}

function SubjectEmptyState({ subject }) {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>준비 중</span></div><div className="empty-review panel"><div className="empty-icon"><BookOpenCheck size={22} /></div><h2>학습 자료를 준비하고 있습니다.</h2><p>기출 출제 포인트를 분석해 원문을 그대로 옮기지 않은 학습 카드 형태로 순서대로 추가할 예정입니다.</p></div></div>;
}

function SubjectOverview() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>5과목 학습 자료</h1><p>과목별 핵심 요약, 비교 노트, 암기 카드를 모아 학습합니다.</p></div></div><div className="overview-grid">{subjects.map((subject) => <Link to={`/study/${subject.id}`} className="overview-card" key={subject.id}><span className={`subject-badge ${subject.color}`}>{subject.short.slice(0, 2)}</span><h2>{subject.short}</h2><p>{subject.description}</p><strong>{subject.materials.length ? `${subject.materials.length}개 자료 · ${subject.progress}% 진행` : '자료 준비 중'}</strong></Link>)}</div></div>;
}
