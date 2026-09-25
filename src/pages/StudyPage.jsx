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
  const selectedMaterial = subject.materials.find((material) => material.id === selectedMaterialId) ?? subject.materials[0];

  if (!selectedMaterial) return <SubjectEmptyState subject={subject} />;

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">SUBJECT STUDY</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>{subject.progress}%</span></div>
      <div className="study-summary panel"><div><span>자료 학습률</span><strong>{subject.progress}%</strong></div><div className="progress-track large"><span className={subject.color} style={{ width: `${subject.progress}%` }} /></div><small>정리 노트를 읽고 핵심 포인트를 확인한 뒤 관련 문제로 이어집니다.</small></div>
      <div className="material-library-heading"><div><p className="section-kicker">STUDY LIBRARY</p><h2>과목 정리 자료</h2><p>실제 요약 자료와 분석 노트가 들어갈 자리입니다. 자료를 선택하면 핵심 내용을 미리 볼 수 있습니다.</p></div><span><FileText size={16} /> {subject.materials.length}개 자료</span></div>
      <div className="material-grid">
        {subject.materials.map((material, index) => (
          <button type="button" className={`material-card ${selectedMaterial.id === material.id ? 'selected' : ''}`} onClick={() => setSelectedMaterialId(material.id)} key={material.id}>
            <span className={`material-number ${subject.color}`}>0{index + 1}</span><div><span className="material-kind">{material.kind}</span><h2>{material.title}</h2><p>{material.description}</p><small><Timer size={13} /> 약 {material.minutes}분</small></div><ArrowRight size={18} />
          </button>
        ))}
      </div>
      <article className="material-detail panel"><div className="material-detail-heading"><div><span className="material-kind">선택한 자료 · {selectedMaterial.kind}</span><h2>{selectedMaterial.title}</h2><p>{selectedMaterial.description}</p></div><FileText size={24} /></div><div className="key-point-list">{selectedMaterial.points.map((point) => <div key={point}><CheckCircle2 size={16} /><span>{point}</span></div>)}</div>{selectedMaterial.detail && <MaterialStudyGuide detail={selectedMaterial.detail} />}<Link to="/exams" className="secondary-button">관련 랜덤 문제 풀기 <ArrowRight size={15} /></Link></article>
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

function SubjectEmptyState({ subject }) {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>준비 중</span></div><div className="empty-review panel"><div className="empty-icon"><BookOpenCheck size={22} /></div><h2>학습 자료를 준비하고 있습니다.</h2><p>기출 출제 포인트를 분석해 원문을 그대로 옮기지 않은 학습 카드 형태로 순서대로 추가할 예정입니다.</p></div></div>;
}

function SubjectOverview() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>5과목 학습 자료</h1><p>과목별 핵심 요약, 비교 노트, 암기 카드를 모아 학습합니다.</p></div></div><div className="overview-grid">{subjects.map((subject) => <Link to={`/study/${subject.id}`} className="overview-card" key={subject.id}><span className={`subject-badge ${subject.color}`}>{subject.short.slice(0, 2)}</span><h2>{subject.short}</h2><p>{subject.description}</p><strong>{subject.materials.length ? `${subject.materials.length}개 자료 · ${subject.progress}% 진행` : '자료 준비 중'}</strong></Link>)}</div></div>;
}
