import { ArrowRight, CheckCircle2, Flame, Play, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recentQuestions, stats, subjects } from '../data/studyData';

function Metric({ icon: Icon, label, value, caption, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon"><Icon size={18} /></div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-intro">
        <div>
          <p className="eyebrow">INFORMATION PROCESSING ENGINEER · PRACTICAL</p>
          <h1>오늘 풀 문제를 고르고<br /><span>실기 감각을 쌓아보세요.</span></h1>
          <p className="intro-copy">기출문제, 과목별 개념, C·Java·Python 코드 연습을 한 화면에서 이어갑니다.</p>
        </div>
        <Link to="/exams" className="primary-button"><Play size={17} fill="currentColor" /> 전체 기출 시작</Link>
      </section>

      <section className="metrics-grid" aria-label="학습 요약">
        <Metric icon={Target} label="전체 진행률" value="52%" caption="280문항 중 146문항" tone="blue" />
        <Metric icon={CheckCircle2} label="정답률" value="78%" caption="최근 30문제 기준" tone="green" />
        <Metric icon={Flame} label="연속 학습" value="6일" caption="어제보다 1일 증가" tone="orange" />
        <Metric icon={TrendingUp} label="이번 주 풀이" value="24개" caption="지난주보다 8개 증가" tone="violet" />
      </section>

      <section className="content-section">
        <div className="section-title-row"><div><p className="section-kicker">SUBJECT ROADMAP</p><h2>5과목 학습 현황</h2></div><Link to="/study">전체 과목 보기 <ArrowRight size={15} /></Link></div>
        <div className="subject-grid">
          {subjects.map((subject) => (
            <Link to={`/study/${subject.id}`} className="subject-card" key={subject.id}>
              <div className="subject-card-top"><span className={`subject-badge ${subject.color}`}>{subject.short.slice(0, 2)}</span><span>{subject.progress}%</span></div>
              <h3>{subject.short}</h3>
              <p>{subject.description}</p>
              <div className="progress-track"><span className={subject.color} style={{ width: `${subject.progress}%` }} /></div>
              <small>학습 계속하기 <ArrowRight size={13} /></small>
            </Link>
          ))}
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <div className="section-title-row compact"><div><p className="section-kicker">RECENT QUESTIONS</p><h2>최근 학습 문제</h2></div><Link to="/exams">전체 보기 <ArrowRight size={15} /></Link></div>
          <div className="question-list">
            {recentQuestions.map((question) => (
              <Link to="/exams" className="question-row" key={question.id}>
                <span className="question-number">{String(question.number).padStart(2, '0')}</span>
                <span className="question-main"><strong>{question.title}</strong><small>{question.year}년 {question.round}회 · {question.category} · {question.type}</small></span>
                <span className={`question-state ${question.solved ? 'done' : ''}`}>{question.solved ? '완료' : '풀기'}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel focus-panel">
          <div className="section-title-row compact"><div><p className="section-kicker">WEEKLY FOCUS</p><h2>이번 주 집중 영역</h2></div></div>
          <div className="focus-chart">
            {stats.map((item) => <div className="focus-row" key={item.label}><span>{item.label}</span><div className="focus-bar"><i className={item.color} style={{ width: `${item.value}%` }} /></div><strong>{item.value}%</strong></div>)}
          </div>
          <Link to="/statistics" className="text-link">상세 통계 보기 <ArrowRight size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
