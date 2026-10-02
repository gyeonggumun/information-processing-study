import { ArrowRight, BookOpenCheck, CheckCircle2, Code2, Database, FileText, Network, Star, TrendingUp, Workflow, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subjects } from '../data/studyData';

const primaryPaths = [
  { to: '/study', icon: BookOpenCheck, label: 'SUBJECT STUDY', title: '학습하러 가기', description: '다섯 과목의 핵심 개념을 빠른 요약으로 훑고, 상세 정리와 도식으로 깊이 있게 이해해 보세요.', action: '과목별 자료 보기', tone: 'blue' },
  { to: '/exams', icon: CheckCircle2, label: 'WRITTEN PRACTICE', title: '기출문제 풀러 가기', description: '프로그래밍을 제외한 과목의 기출 유형 문제를 무작위로 풀고, 답과 해설을 바로 확인해 보세요.', action: '랜덤 문제 시작', tone: 'violet' },
  { to: '/code', icon: Code2, label: 'CODE PRACTICE', title: '코드 문제 풀러 가기', description: 'C·Java·Python 코드와 SQL 쿼리 중 유형과 난이도를 골라, 실행 흐름과 조회 결과를 연습해 보세요.', action: '유형 선택하기', tone: 'cyan' },
];

const reviewPaths = [
  { to: '/favorites', icon: Star, title: '즐겨찾기', description: '다시 보고 싶은 학습 카드를 모아 빠르게 복습합니다.' },
  { to: '/wrong-answers', icon: FileText, title: '오답노트', description: '틀린 문제를 확인하고 부족한 개념을 다시 살펴봅니다.' },
  { to: '/statistics', icon: TrendingUp, title: '학습 통계', description: '기출문제와 언어별 풀이 수·정답률을 확인합니다.' },
];

const subjectIcons = {
  'software-design': Workflow,
  'software-development': Wrench,
  database: Database,
  programming: Code2,
  systems: Network,
};

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-intro">
        <div>
          <p className="eyebrow">INFORMATION PROCESSING ENGINEER · PRACTICAL</p>
          <h1>개념을 정리하고,<br /><span>문제 풀이로 확인하세요.</span></h1>
          <p className="intro-copy">정처기학습 플랫폼은 정보처리기사 실기 공부를 한곳에서 이어갈 수 있도록 만든 학습 공간입니다. 과목별 개념을 읽고, 필답형 문제와 C·Java·Python 코드 및 SQL 쿼리 문제로 이해한 내용을 확인해 보세요.</p>
          <div className="home-intro-actions"><Link to="/study" className="primary-button">학습하러 가기 <ArrowRight size={16} /></Link><Link to="/exams" className="secondary-button">기출문제 풀러 가기 <ArrowRight size={16} /></Link></div>
        </div>
        <ol className="home-steps" aria-label="추천 학습 순서">
          <li><span>01</span><div><strong>개념 익히기</strong><p>빠른 요약으로 흐름을 잡고 상세 정리로 이해합니다.</p></div></li>
          <li><span>02</span><div><strong>문제로 확인하기</strong><p>필답형·코드 문제를 풀며 배운 내용을 적용합니다.</p></div></li>
          <li><span>03</span><div><strong>부족한 부분 복습하기</strong><p>즐겨찾기와 오답노트, 통계로 다음 학습을 정합니다.</p></div></li>
        </ol>
      </section>

      <section className="content-section" aria-labelledby="home-start-title">
        <div className="section-title-row"><div><p className="section-kicker">START HERE</p><h2 id="home-start-title">원하는 학습부터 시작하세요</h2></div></div>
        <div className="home-route-grid">
          {primaryPaths.map(({ to, icon: Icon, label, title, description, action, tone }) => (
            <Link to={to} className={`home-route-card ${tone}`} key={to}>
              <div className="home-route-icon"><Icon size={23} /></div>
              <span className="section-kicker">{label}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <strong>{action} <ArrowRight size={16} /></strong>
            </Link>
          ))}
        </div>
        <p className="home-access-note">학습 자료와 문제 풀이는 로그인 후 이용할 수 있으며, 학습 기록은 계정별로 저장됩니다.</p>
      </section>

      <section className="content-section">
        <div className="section-title-row"><div><p className="section-kicker">SUBJECT LIBRARY</p><h2>다섯 과목을 차근차근 살펴보세요</h2></div><Link to="/study">전체 과목 보기 <ArrowRight size={15} /></Link></div>
        <div className="subject-grid">
          {subjects.map((subject) => (
            <Link to={`/study/${subject.id}`} className="subject-card" key={subject.id}>
              <div className="subject-card-top"><span className={`subject-badge ${subject.color}`}><SubjectIcon subjectId={subject.id} /></span></div>
              <h3>{subject.short}</h3>
              <p>{subject.description}</p>
              <small>자료 살펴보기 <ArrowRight size={13} /></small>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section" aria-labelledby="home-review-title">
        <div className="section-title-row"><div><p className="section-kicker">KEEP GOING</p><h2 id="home-review-title">공부한 내용을 이어서 관리하세요</h2></div></div>
        <div className="home-tool-grid">
          {reviewPaths.map(({ to, icon: Icon, title, description }) => (
            <Link to={to} className="home-tool-card" key={to}>
              <Icon size={20} /><div><h3>{title}</h3><p>{description}</p></div><ArrowRight size={17} className="home-tool-arrow" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SubjectIcon({ subjectId }) {
  const Icon = subjectIcons[subjectId] ?? BookOpenCheck;
  return <Icon size={18} strokeWidth={2} aria-hidden="true" />;
}
