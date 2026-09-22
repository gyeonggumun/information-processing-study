import { ArrowRight, BookOpenCheck, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { subjects } from '../data/studyData';

export default function StudyPage() {
  const { subjectId } = useParams();
  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) return <SubjectOverview />;

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">SUBJECT STUDY</p><h1>{subject.short}</h1><p>{subject.description}</p></div><span className={`large-subject-badge ${subject.color}`}>{subject.progress}%</span></div>
      <div className="study-summary panel"><div><span>과목 진행률</span><strong>{subject.progress}%</strong></div><div className="progress-track large"><span className={subject.color} style={{ width: `${subject.progress}%` }} /></div><small>기본 개념부터 기출 연결까지 단계별로 학습합니다.</small></div>
      <div className="lesson-grid">
        {subject.lessons.map((lesson, index) => (
          <Link to="/exams" className="lesson-card" key={lesson}><span className="lesson-index">0{index + 1}</span><div><h2>{lesson}</h2><p>핵심 개념 요약과 관련 기출문제를 함께 확인하세요.</p></div><ArrowRight size={18} /></Link>
        ))}
      </div>
      <div className="notice-panel"><BookOpenCheck size={19} /><span>과목 학습 콘텐츠는 기출 분석 결과에 따라 단계적으로 확장할 예정입니다.</span></div>
    </div>
  );
}

function SubjectOverview() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">SUBJECT ROADMAP</p><h1>5과목 학습</h1><p>상단 메뉴에서 과목을 선택해 학습을 시작하세요.</p></div></div><div className="overview-grid">{subjects.map((subject) => <Link to={`/study/${subject.id}`} className="overview-card" key={subject.id}><span className={`subject-badge ${subject.color}`}>{subject.short.slice(0, 2)}</span><h2>{subject.short}</h2><p>{subject.description}</p><strong>{subject.progress}% 진행</strong></Link>)}</div></div>;
}
