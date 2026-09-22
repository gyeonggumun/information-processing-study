import { useState } from 'react';
import { ArrowRight, CheckCircle2, Code2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { codeQuestions } from '../data/studyData';

export default function CodePage() {
  const { language } = useParams();
  const [selected, setSelected] = useState(language || 'C');
  const questions = codeQuestions[selected] || codeQuestions.C;
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">CODE PRACTICE</p><h1>코드 연습</h1><p>C, Java, Python의 실행 결과와 문법 문제를 언어별로 연습합니다.</p></div><Code2 className="header-line-icon" size={42} /></div>
      <div className="language-tabs" role="tablist">{Object.keys(codeQuestions).map((item) => <button type="button" role="tab" aria-selected={selected === item} className={selected === item ? 'active' : ''} key={item} onClick={() => setSelected(item)}>{item}</button>)}</div>
      <div className="code-intro panel"><div><span className="code-language large">{selected}</span><div><h2>{selected} 실행 결과 예측</h2><p>시험에 자주 나오는 문법과 코드 흐름을 직접 추적해보세요.</p></div></div><Link to="/exams" className="secondary-button">전체 문제 보기 <ArrowRight size={15} /></Link></div>
      <div className="code-question-grid">{questions.map((question) => <article className="code-card" key={question.title}><div className="code-card-top"><span className="tag">{question.tag}</span>{question.solved && <CheckCircle2 size={17} className="solved-icon" />}</div><h2>{question.title}</h2><p>{selected} 코드의 실행 순서와 결과를 작성하는 연습 문제입니다.</p><div className="code-card-bottom"><span className={`difficulty ${question.difficulty === '상' ? 'hard' : question.difficulty === '중' ? 'medium' : 'easy'}`}>{question.difficulty} 난이도</span><button type="button">연습하기 <ArrowRight size={14} /></button></div></article>)}</div>
    </div>
  );
}
