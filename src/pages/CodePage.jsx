import { useState } from 'react';
import { Code2 } from 'lucide-react';
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
  const [activeQuestion, setActiveQuestion] = useState(null);
  const ready = selected === 'C';

  const openRandomQuestion = (level, excludeId) => {
    const candidates = codeQuestions[selected].filter((question) => question.difficulty === level && question.id !== excludeId);
    setActiveQuestion(candidates[Math.floor(Math.random() * candidates.length)]);
  };
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">CODE PRACTICE</p><h1>코드 연습</h1><p>C, Java, Python의 실행 결과와 문법 문제를 언어별로 연습합니다.</p></div><Code2 className="header-line-icon" size={42} /></div>
      <nav className="language-tabs" aria-label="프로그래밍 언어">{Object.keys(codeQuestions).map((item) => <button type="button" aria-pressed={selected === item} className={selected === item ? 'active' : ''} key={item} onClick={() => { setActiveQuestion(null); navigate(`/code/${item}`); }}>{item}</button>)}</nav>
      <div className="code-intro panel"><div><span className="code-language large">{selected}</span><div><h2>{selected} 실행 결과 예측</h2><p>{ready ? '난이도를 선택하면 해당 난이도의 문제가 무작위로 나옵니다.' : '실제 연습 문제를 준비 중입니다.'}</p></div></div></div>
      {ready && <>
        <section className="code-level-section" aria-label="난이도 선택">
          <div className="language-tabs">{Object.keys(levelDescriptions).map((level) => <button type="button" title={levelDescriptions[level]} key={level} onClick={() => openRandomQuestion(level)}>{level}</button>)}</div>
        </section>
      </>}
      {ready && activeQuestion && <CodePracticeModal key={activeQuestion.id} question={activeQuestion} onClose={() => setActiveQuestion(null)} onNext={() => openRandomQuestion(activeQuestion.difficulty, activeQuestion.id)} />}
    </div>
  );
}
