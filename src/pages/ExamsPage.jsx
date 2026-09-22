import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, RefreshCw, Search, XCircle } from 'lucide-react';
import { practiceQuestions } from '../data/studyData';

export default function ExamsPage() {
  const [query, setQuery] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(practiceQuestions[0]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const questions = useMemo(() => practiceQuestions.filter((question) => `${question.title} ${question.category} ${question.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const isCorrect = selectedAnswer === activeQuestion.answer;

  const openQuestion = (question) => {
    setActiveQuestion(question);
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  const pickRandomQuestion = () => {
    const candidates = practiceQuestions.filter((question) => question.id !== activeQuestion.id);
    openQuestion(candidates[Math.floor(Math.random() * candidates.length)] ?? practiceQuestions[0]);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || submitted) return;
    setSubmitted(true);
    setSolvedCount((count) => count + 1);
  };

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">RANDOM QUESTION PRACTICE</p><h1>기출문제</h1><p>과목 구분 없이 문제은행에서 무작위로 출제되는 문제를 풀어봅니다.</p></div><div className="exam-count"><strong>{practiceQuestions.length}</strong><span>데모 문항</span></div></div>
      <section className="random-quiz panel"><div className="quiz-heading"><div><span className="quiz-label"><CircleHelp size={15} /> 랜덤 출제</span><h2>{activeQuestion.title}</h2><p>{activeQuestion.year}년 {activeQuestion.round}회 · {String(activeQuestion.number).padStart(2, '0')}번 · {activeQuestion.category}</p></div><button type="button" className="random-button" onClick={pickRandomQuestion}><RefreshCw size={15} /> 다른 문제</button></div><p className="quiz-prompt">{activeQuestion.prompt}</p><div className="choice-list">{activeQuestion.choices.map((choice, index) => { const state = submitted ? (index === activeQuestion.answer ? 'correct' : index === selectedAnswer ? 'wrong' : '') : index === selectedAnswer ? 'selected' : ''; return <button type="button" className={`choice-button ${state}`} onClick={() => !submitted && setSelectedAnswer(index)} key={choice}><span>{index + 1}</span>{choice}{submitted && index === activeQuestion.answer && <CheckCircle2 size={18} />}{submitted && index === selectedAnswer && index !== activeQuestion.answer && <XCircle size={18} />}</button>; })}</div>{submitted && <div className={`result-callout ${isCorrect ? 'correct' : 'wrong'}`}><strong>{isCorrect ? '정답입니다!' : '다시 확인해보세요.'}</strong><p>{activeQuestion.explanation}</p></div>}<div className="quiz-actions"><span>이번 세션 풀이 <strong>{solvedCount}</strong>문제</span>{submitted ? <button type="button" className="primary-button" onClick={pickRandomQuestion}>다음 랜덤 문제 <ArrowRight size={15} /></button> : <button type="button" className="primary-button" onClick={submitAnswer} disabled={selectedAnswer === null}>정답 확인 <ArrowRight size={15} /></button>}</div></section>
      <div className="section-title-row question-bank-heading"><div><p className="section-kicker">DEMO QUESTION BANK</p><h2>문제은행에서 선택하기</h2></div><span>{practiceQuestions.length}개 샘플 문항</span></div>
      <div className="toolbar panel"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문제, 키워드, 유형 검색" /></div><span className="toolbar-meta">{questions.length}개 표시</span></div>
      <div className="exam-list panel">{questions.map((question) => <div className="exam-row" key={question.id}><span className="exam-id">{question.year}<b>{question.round}회</b><small>{String(question.number).padStart(2, '0')}</small></span><div className="exam-content"><div><span className="tag">{question.category}</span><span className="muted-tag">{question.type}</span></div><h2>{question.title}</h2><p>데모 문제와 보기, 정답 해설이 연결된 항목입니다.</p></div><button className="row-action" type="button" onClick={() => openQuestion(question)}>풀기 <ArrowRight size={15} /></button></div>)}{questions.length === 0 && <div className="empty-state"><strong>검색 결과가 없습니다.</strong><span>다른 키워드로 다시 검색해보세요.</span></div>}</div>
      <div className="notice-panel"><CheckCircle2 size={19} /><span>현재 문항은 화면 흐름 검증용 데모 데이터입니다. 실제 기출·해설 데이터는 practiceQuestions 배열을 교체해 연결할 수 있습니다.</span></div>
    </div>
  );
}
