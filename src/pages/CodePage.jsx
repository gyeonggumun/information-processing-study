import { useState } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { codeQuestions } from '../data/studyData';
import CodePracticePanel from '../components/CodePracticePanel';

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
};

export default function CodePage() {
  const { language } = useParams();
  const navigate = useNavigate();
  const selected = Object.hasOwn(codeQuestions, language) ? language : 'C';
  const [activeQuestion, setActiveQuestion] = useState(null);
  const ready = ['C', 'Java', 'Python'].includes(selected);

  const openRandomQuestion = (level, excludeId) => {
    const candidates = codeQuestions[selected].filter((question) => question.difficulty === level && question.id !== excludeId);
    setActiveQuestion(candidates[Math.floor(Math.random() * candidates.length)]);
  };
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">CODE PRACTICE</p><h1>코드 연습</h1><p>C, Java, Python의 기출 유형 코드 문제를 언어별로 연습합니다.</p></div><Code2 className="header-line-icon" size={42} /></div>
      <nav className="language-tabs" aria-label="프로그래밍 언어">{Object.keys(codeQuestions).map((item) => <button type="button" aria-pressed={selected === item} className={selected === item ? 'active' : ''} key={item} onClick={() => { setActiveQuestion(null); navigate(`/code/${item}`); }}>{item}</button>)}</nav>
      <div className="code-intro panel"><div><span className="code-language large">{selected}</span><div><h2>{selected}코드 기출문제</h2><p>{ready ? '난이도를 선택하면 해당 난이도의 문제가 무작위로 나옵니다.' : '실제 연습 문제를 준비 중입니다.'}</p></div></div></div>
      {ready && (activeQuestion ? (
        <CodePracticePanel key={activeQuestion.id} question={activeQuestion} onClose={() => setActiveQuestion(null)} onNext={() => openRandomQuestion(activeQuestion.difficulty, activeQuestion.id)} />
      ) : (
        <section className="code-level-section" aria-label="난이도 선택">
          <div className="code-level-grid">{Object.entries(levelDescriptions[selected]).map(([level, description]) => <button type="button" className={`code-level-card ${level === '상' ? 'hard' : level === '중' ? 'medium' : 'easy'}`} key={level} onClick={() => openRandomQuestion(level)}><strong>{level} 난이도</strong><span>{description}</span><span className="code-level-action">문제 풀기 <ArrowRight size={17} /></span></button>)}</div>
        </section>
      ))}
    </div>
  );
}
