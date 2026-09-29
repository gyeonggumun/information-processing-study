import { useState } from 'react';
import { ArrowRight, Code2, Shuffle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { codeQuestions } from '../data/studyData';
import CodePracticeModal from '../components/CodePracticeModal';

const levelDescriptions = {
  하: '기본 연산·조건문·반복문·배열·단일 포인터와 재귀',
  중: '정렬 중간 상태·static 변수·이중 포인터·구조체·원형 큐',
  상: '트리·연결 리스트·공유 상태 재귀·함수 포인터를 결합한 킬러 문항',
};

export default function CodePage() {
  const { language } = useParams();
  const navigate = useNavigate();
  const selected = Object.hasOwn(codeQuestions, language) ? language : 'C';
  const [difficulty, setDifficulty] = useState('하');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const questions = codeQuestions[selected].filter((question) => question.difficulty === difficulty);
  const ready = selected === 'C';

  const openRandomQuestion = () => {
    const candidates = questions.filter((question) => question.id !== activeQuestion?.id);
    setActiveQuestion(candidates[Math.floor(Math.random() * candidates.length)]);
  };
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">CODE PRACTICE</p><h1>코드 연습</h1><p>C, Java, Python의 실행 결과와 문법 문제를 언어별로 연습합니다.</p></div><Code2 className="header-line-icon" size={42} /></div>
      <nav className="language-tabs" aria-label="프로그래밍 언어">{Object.keys(codeQuestions).map((item) => <button type="button" aria-pressed={selected === item} className={selected === item ? 'active' : ''} key={item} onClick={() => { setActiveQuestion(null); navigate(`/code/${item}`); }}>{item}</button>)}</nav>
      <div className="code-intro panel"><div><span className="code-language large">{selected}</span><div><h2>{selected} 실행 결과 예측</h2><p>{ready ? '실기 기출 개념을 바탕으로 만든 창작 변형 문제입니다. 코드를 읽고 출력 결과를 직접 작성하세요.' : '실제 연습 문제를 준비 중입니다.'}</p></div></div>{ready && <button type="button" className="secondary-button" onClick={openRandomQuestion}><Shuffle size={15} /> 랜덤 연습</button>}</div>
      {ready && <>
        <section className="code-level-section" aria-label="난이도 선택">
          <div className="language-tabs">{Object.keys(levelDescriptions).map((level) => <button type="button" aria-pressed={difficulty === level} className={difficulty === level ? 'active' : ''} key={level} onClick={() => { setDifficulty(level); setActiveQuestion(null); }}>{level === '상' ? '상 · 킬러' : level} · 50문항</button>)}</div>
          <p>{levelDescriptions[difficulty]}</p>
        </section>
        <div className="code-question-grid">{questions.map((question) => <article className="code-card" key={question.id}><div className="code-card-top"><span className="tag">{question.tag}</span><span className="code-question-number">{String(question.number).padStart(2, '0')}</span></div><h2>{question.title}</h2><p>출력 결과를 예측하고 정답과 단계별 해설을 확인하세요.</p><div className="code-card-bottom"><span className={`difficulty ${difficulty === '상' ? 'hard' : difficulty === '중' ? 'medium' : 'easy'}`}>{difficulty} 난이도</span><button type="button" aria-label={`${question.title} 연습하기`} onClick={() => setActiveQuestion(question)}>연습하기 <ArrowRight size={14} /></button></div></article>)}</div>
      </>}
      {ready && activeQuestion && <CodePracticeModal key={activeQuestion.id} question={activeQuestion} onClose={() => setActiveQuestion(null)} onNext={openRandomQuestion} />}
    </div>
  );
}
