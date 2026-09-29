import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, RefreshCw, Search } from 'lucide-react';
import { practiceQuestions } from '../data/studyData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const normalizeAnswer = (value) => value.normalize('NFKC').toLowerCase().replace(/[\s().·ㆍ,/_-]/g, '');

const matchesWrittenAnswer = (question, answerInput) => question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(answerInput));

export default function ExamsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(practiceQuestions[0]);
  const [answerInput, setAnswerInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [saveError, setSaveError] = useState('');
  const questions = useMemo(() => practiceQuestions.filter((question) => `${question.title} ${question.category} ${question.type} ${question.subject}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const isCorrect = submitted && matchesWrittenAnswer(activeQuestion, answerInput);

  const openQuestion = (question) => {
    setActiveQuestion(question);
    setAnswerInput('');
    setSubmitted(false);
  };

  const pickRandomQuestion = () => {
    const candidates = practiceQuestions.filter((question) => question.id !== activeQuestion.id);
    openQuestion(candidates[Math.floor(Math.random() * candidates.length)] ?? practiceQuestions[0]);
  };

  const submitAnswer = async () => {
    if (!answerInput.trim() || submitted) return;
    const correct = matchesWrittenAnswer(activeQuestion, answerInput);
    setSubmitted(true);
    setSolvedCount((count) => count + 1);
    setSaveError('');
    const { error } = await supabase.from('practice_attempts').insert({ user_id: user.id, practice_type: 'exam', question_id: activeQuestion.id, is_correct: correct });
    if (error) setSaveError('풀이 기록을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
  };

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">RANDOM QUESTION PRACTICE</p><h1>기출문제</h1><p>소프트웨어 설계·개발·데이터베이스·정보시스템 구축관리에서 무작위로 출제되는 문제를 풀어봅니다.</p></div><div className="exam-count"><strong>{practiceQuestions.length}</strong><span>연습 문항</span></div></div>
      <section className="random-quiz panel">
        <div className="quiz-heading"><div><span className="quiz-label"><CircleHelp size={15} /> 필답형 랜덤 출제</span><h2>{activeQuestion.title}</h2><p>{activeQuestion.source ?? `${activeQuestion.year}년 ${activeQuestion.round}회`} · {String(activeQuestion.number).padStart(2, '0')}번 · {activeQuestion.subject ?? activeQuestion.category}</p></div><button type="button" className="random-button" onClick={pickRandomQuestion}><RefreshCw size={15} /> 다른 문제</button></div>
        <p className="quiz-prompt">{activeQuestion.prompt}</p>
        <div className={`written-answer-box${submitted ? (isCorrect ? ' correct' : ' wrong') : ''}`}>
          <label htmlFor="written-answer">답안 입력</label>
          <input id="written-answer" value={answerInput} onChange={(event) => setAnswerInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitAnswer(); }} placeholder="정답 용어를 직접 입력하세요" disabled={submitted} autoComplete="off" />
          <small>공백과 영문 대소문자는 채점에 영향을 주지 않습니다.</small>
        </div>
        {submitted && <div className={`result-callout ${isCorrect ? 'correct' : 'wrong'}`}><strong>{isCorrect ? '정답입니다!' : `오답입니다. 정답은 ${activeQuestion.answerText}입니다.`}</strong><p>{activeQuestion.explanation}</p></div>}
        {saveError && <p className="save-error" role="alert">{saveError}</p>}
        <div className="quiz-actions"><span>이번 세션 풀이 <strong>{solvedCount}</strong>문제</span>{submitted ? <button type="button" className="primary-button" onClick={pickRandomQuestion}>다음 랜덤 문제 <ArrowRight size={15} /></button> : <button type="button" className="primary-button" onClick={submitAnswer} disabled={!answerInput.trim()}>정답 확인 <ArrowRight size={15} /></button>}</div>
      </section>
      <div className="section-title-row question-bank-heading"><div><p className="section-kicker">PRACTICE QUESTION BANK</p><h2>문제은행에서 선택하기</h2></div><span>{practiceQuestions.length}개 연습 문항</span></div>
      <div className="toolbar panel"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="과목, 문제, 키워드 검색" /></div><span className="toolbar-meta">{questions.length}개 표시</span></div>
      <div className="exam-list panel">{questions.map((question) => <div className="exam-row" key={question.id}><span className="exam-id">{question.source ? '유형' : question.year}<b>{question.source ? '연습' : `${question.round}회`}</b><small>{String(question.number).padStart(2, '0')}</small></span><div className="exam-content"><div><span className="tag">{question.subject ?? question.category}</span><span className="muted-tag">{question.type}</span></div><h2>{question.title}</h2><p>기출 출제 개념을 바탕으로 답안을 직접 작성하고 관련 개념까지 복습하는 필답형 문제입니다.</p></div><button className="row-action" type="button" onClick={() => openQuestion(question)}>풀기 <ArrowRight size={15} /></button></div>)}{questions.length === 0 && <div className="empty-state"><strong>검색 결과가 없습니다.</strong><span>다른 키워드로 다시 검색해보세요.</span></div>}</div>
      <div className="notice-panel"><CheckCircle2 size={19} /><span>프로그래밍 언어 문제는 별도 코드 연습에서 제공하고, 이 문제은행은 나머지 4과목의 기출 유형 학습에 집중합니다.</span></div>
    </div>
  );
}
