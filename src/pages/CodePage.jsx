import { useLayoutEffect, useState } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { codeQuestions } from '../data/studyData';
import CodePracticePanel from '../components/CodePracticePanel';
import SqlPracticePanel from '../components/SqlPracticePanel';
import { usePracticeAttempts } from '../hooks/usePracticeAttempts';
import { getUnseenQuestions } from '../lib/practiceHistory';

const levelDescriptions = {
  C: {
    하: '기본 연산·조건문·반복문·배열·단일 포인터와 재귀',
    중: '정렬 중간 상태·static 변수·이중 포인터·구조체·원형 큐',
    상: '트리·연결 리스트·공유 상태 재귀·함수 포인터를 결합한 킬러 문항',
  },
  Java: {
    하: '연산·조건문·반복문·배열·문자열·기본 재귀',
    중: '상속·오버로딩·생성자·static 상태·예외·컬렉션',
    상: '초기화 순서·다형성·재귀 공유 상태·스트림·그래프 추적',
  },
  Python: {
    하: '연산·조건문·반복문·리스트·문자열·기본 재귀',
    중: '참조 공유·가변 기본값·클로저·컴프리헨션·예외·상속',
    상: '데코레이터·제너레이터·MRO·메모이제이션·DFS 추적',
  },
  SQL: {
    하: '기본 조회·정렬·집계와 SQL 키워드 빈칸',
    중: 'JOIN·서브쿼리·GROUP BY·데이터 변경 결과',
    상: '중첩 상관 서브쿼리·외부 조인·NULL 함정·복합 집계',
  },
};

export default function CodePage() {
  const location = useLocation();
  // 같은 언어 메뉴를 다시 선택해도 난이도 선택부터 시작합니다.
  return <CodePractice key={location.key} />;
}

function CodePractice() {
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const { language } = useParams();
  const navigate = useNavigate();
  const selected = Object.hasOwn(codeQuestions, language) ? language : 'C';
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [completedLevel, setCompletedLevel] = useState(null);
  const { completedKeys, isLoading, error, refresh } = usePracticeAttempts();
  const ready = Object.hasOwn(codeQuestions, selected);

  const openRandomQuestion = (level, excludeId) => {
    if (isLoading || error) return;
    const candidates = getUnseenQuestions(codeQuestions[selected], selected, completedKeys, excludeId).filter((question) => question.difficulty === level);
    setCompletedLevel(candidates.length ? null : { language: selected, level });
    setActiveQuestion(candidates[Math.floor(Math.random() * candidates.length)] ?? null);
  };
  const currentQuestion = activeQuestion?.language === selected ? activeQuestion : null;
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">CODE PRACTICE</p><h1>코드 연습</h1><p>C, Java, Python과 SQL의 기출 유형 문제를 연습합니다.</p></div><Code2 className="header-line-icon" size={42} /></div>
      <nav className="language-tabs" aria-label="코드·쿼리 유형">{Object.keys(codeQuestions).map((item) => <button type="button" aria-pressed={selected === item} className={selected === item ? 'active' : ''} key={item} onClick={() => { setActiveQuestion(null); setCompletedLevel(null); navigate(`/code/${item}`); }}>{item}</button>)}</nav>
      <div className="code-intro panel"><div><span className="code-language large">{selected}</span><div><h2>{selected} {selected === 'SQL' ? '쿼리' : '코드'} 기출 유형 문제</h2><p>{ready ? '난이도를 선택하면 해당 난이도의 문제가 무작위로 나옵니다.' : '실제 연습 문제를 준비 중입니다.'}</p></div></div></div>
      <p className="practice-history-link"><Link to="/practice-history">풀었던 문제와 풀이 기록 보기</Link></p>
      {error && <p className="save-error" role="alert">{error} <button type="button" onClick={refresh}>다시 불러오기</button></p>}
      {isLoading && !error && <p role="status">풀이 기록을 확인하고 있습니다.</p>}
      {completedLevel?.language === selected && !currentQuestion && <div className="notice-panel" role="status">{selected} {completedLevel.level} 난이도를 모두 풀었습니다. 다른 난이도를 선택하거나 풀이 기록에서 해설을 확인해주세요.</div>}
      {ready && !isLoading && !error && (currentQuestion ? (
        selected === 'SQL'
          ? <SqlPracticePanel key={currentQuestion.id} question={currentQuestion} onClose={() => setActiveQuestion(null)} onNext={() => openRandomQuestion(currentQuestion.difficulty, currentQuestion.id)} />
          : <CodePracticePanel key={currentQuestion.id} question={currentQuestion} onClose={() => setActiveQuestion(null)} onNext={() => openRandomQuestion(currentQuestion.difficulty, currentQuestion.id)} />
      ) : (
        <section className="code-level-section" aria-label="난이도 선택">
          <div className="code-level-grid">{Object.entries(levelDescriptions[selected]).map(([level, description]) => <button type="button" className={`code-level-card ${level === '상' ? 'hard' : level === '중' ? 'medium' : 'easy'}`} key={level} onClick={() => openRandomQuestion(level)}><strong>{level} 난이도</strong><span>{description}</span><span className="code-level-action">문제 풀기 <ArrowRight size={17} /></span></button>)}</div>
        </section>
      ))}
    </div>
  );
}
