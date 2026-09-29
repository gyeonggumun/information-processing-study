import { useState } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, RefreshCw } from 'lucide-react';
import { practiceQuestions } from '../data/studyData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const normalizeAnswer = (value) => value.normalize('NFKC').toLowerCase().replace(/[\s().·ㆍ,/_-]/g, '');

const matchesWrittenAnswer = (question, answerInput) => question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizeAnswer(answerInput));

const getRandomQuestion = (questions) => questions[Math.floor(Math.random() * questions.length)];

export default function ExamsPage() {
  const { user } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState(() => getRandomQuestion(practiceQuestions));
  const [answerInput, setAnswerInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [saveError, setSaveError] = useState('');
  const isCorrect = submitted && matchesWrittenAnswer(activeQuestion, answerInput);

  const openQuestion = (question) => {
    setActiveQuestion(question);
    setAnswerInput('');
    setSubmitted(false);
  };

  const pickRandomQuestion = () => {
    const candidates = practiceQuestions.filter((question) => question.id !== activeQuestion.id);
    openQuestion(getRandomQuestion(candidates) ?? practiceQuestions[0]);
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
      <div className="subpage-header"><div><p className="eyebrow">RANDOM QUESTION PRACTICE</p><h1>기출문제</h1><p>소프트웨어 설계·개발·데이터베이스·정보시스템 구축관리에서 무작위로 출제되는 문제를 풀어봅니다.</p></div></div>
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
      <div className="notice-panel"><CheckCircle2 size={19} /><span>프로그래밍 언어 문제는 별도 코드 연습에서 제공하고, 이 문제은행은 나머지 4과목의 기출 유형 학습에 집중합니다.</span></div>
    </div>
  );
}
