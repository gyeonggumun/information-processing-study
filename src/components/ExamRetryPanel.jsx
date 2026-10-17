import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { matchesWrittenAnswer } from '../lib/writtenAnswer';
import { savePracticeAttempt } from '../lib/practiceHistory';
import RestoredExamPanel from './RestoredExamPanel';

export default function ExamRetryPanel(props) {
  return props.question.restored ? <RestoredExamPanel isRetry closeLabel="오답 목록으로" nextLabel="오답 목록으로 돌아가기" {...props} /> : <WrittenExamPanel {...props} />;
}

function WrittenExamPanel({ question, onClose, onNext = onClose, onAttemptSaved, reviewAttempt, closeLabel = '오답 목록으로', nextLabel = '오답 목록으로 돌아가기', isRetry = true }) {
  const { user } = useAuth();
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  const pendingRef = useRef(false);
  const attemptIdRef = useRef(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(Boolean(reviewAttempt));
  const [saveStatus, setSaveStatus] = useState('idle');
  const correct = reviewAttempt ? reviewAttempt.is_correct : submitted && matchesWrittenAnswer(question, answer);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const saveAttempt = async () => {
    if (pendingRef.current || saveStatus === 'saved') return;
    pendingRef.current = true;
    setSaveStatus('saving');
    try {
      if (!user) throw new Error('인증 세션 없음');
      attemptIdRef.current ??= crypto.randomUUID();
      const saved = await savePracticeAttempt(supabase, {
        id: attemptIdRef.current, user_id: user.id, practice_type: 'exam',
        question_id: question.id, is_correct: matchesWrittenAnswer(question, answer),
      });
      setSaveStatus('saved');
      onAttemptSaved?.(saved);
    } catch {
      setSaveStatus('error');
    } finally {
      pendingRef.current = false;
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (reviewAttempt || !answer.trim() || submitted || pendingRef.current) return;
    setSubmitted(true);
    saveAttempt();
  };

  return <section ref={panelRef} className="random-quiz panel wrong-retry-panel" aria-labelledby="wrong-exam-title">
    <div className="code-practice-top"><span className="tag">{isRetry ? '기출문제 복습' : '필답형 랜덤 출제'}</span><button type="button" className="secondary-button" disabled={!reviewAttempt && submitted && saveStatus !== 'saved'} onClick={onClose}><ArrowLeft size={15} /> {closeLabel}</button></div>
    <div className="code-practice-heading"><h2 id="wrong-exam-title" ref={headingRef} tabIndex={-1}>{question.title}</h2><p className="quiz-prompt">{question.prompt}</p></div>
    <form onSubmit={submit}>
      {!reviewAttempt && <div className={`written-answer-box${submitted ? correct ? ' correct' : ' wrong' : ''}`}>
        <label htmlFor="wrong-exam-answer">답안 입력</label>
        <input id="wrong-exam-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitted} autoComplete="off" placeholder="정답 용어를 직접 입력하세요" />
        <small>공백과 영문 대소문자는 채점에 영향을 주지 않습니다.</small>
      </div>}
      {submitted && <div className={`result-callout ${correct ? 'correct' : 'wrong'}`} aria-live="polite"><strong>{reviewAttempt ? `최근 풀이: ${correct ? '정답' : '오답'} · 해설 다시 보기` : correct ? '정답입니다!' : `오답입니다. 정답은 ${question.answerText}입니다.`}</strong><p>{question.explanation}</p><p><strong>정답:</strong> {question.answerText}</p></div>}
      {saveStatus === 'error' && <div className="save-error" role="alert">채점은 완료했지만 풀이 기록을 저장하지 못했습니다. <button type="button" onClick={saveAttempt}>저장 다시 시도</button></div>}
      {!reviewAttempt && <div className="quiz-actions"><span role="status">{saveStatus === 'saving' ? '풀이 기록 저장 중…' : saveStatus === 'saved' ? '오답노트와 통계에 풀이 기록을 저장했습니다.' : '기억나는 답을 다시 작성해보세요.'}</span>{submitted ? <button type="button" className="primary-button" disabled={saveStatus !== 'saved'} onClick={onNext}>{nextLabel} <ArrowRight size={15} /></button> : <button type="submit" className="primary-button" disabled={!answer.trim()}>정답 확인 <ArrowRight size={15} /></button>}</div>}
    </form>
  </section>;
}
