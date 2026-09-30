import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isCodeOutputCorrect } from '../lib/codePractice';

export default function CodePracticePanel({ question, onClose, onNext }) {
  const { user } = useAuth();
  const headingRef = useRef(null);
  const pendingRef = useRef(false);
  const attemptIdRef = useRef(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const correct = submitted && isCodeOutputCorrect(answer, question.answerText);

  useEffect(() => { headingRef.current?.focus(); }, []);

  const saveAttempt = async () => {
    if (pendingRef.current || saveStatus === 'saved') return;
    pendingRef.current = true;
    setSaveStatus('saving');
    try {
      if (!user) throw new Error('인증 세션 없음');
      attemptIdRef.current ??= crypto.randomUUID();
      const { error } = await supabase.from('practice_attempts').insert({
        id: attemptIdRef.current, user_id: user.id, practice_type: 'C',
        question_id: question.id, is_correct: isCodeOutputCorrect(answer, question.answerText),
      });
      // 응답 유실 후 재시도한 동일 풀이의 중복 키는 이미 저장된 기록입니다.
      if (error && error.code !== '23505') throw error;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      pendingRef.current = false;
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!answer.trim() || submitted || pendingRef.current) return;
    setSubmitted(true);
    saveAttempt();
  };

  return <section className="code-practice-panel panel" aria-labelledby="code-practice-title">
    <div className="code-practice-top"><span className="tag">C · {question.difficulty} 난이도 · {question.number}번</span><button type="button" className="secondary-button" disabled={saveStatus === 'saving'} onClick={onClose}><ArrowLeft size={15} /> 난이도 다시 선택</button></div>
    <div className="code-practice-heading"><h2 id="code-practice-title" ref={headingRef} tabIndex={-1}>{question.title}</h2><p>{question.prompt}</p></div>
    <pre className="code-source" aria-label="문제 C 소스 코드"><code>{question.code}</code></pre>
    <form onSubmit={submit}>
      <div className={`written-answer-box${submitted ? correct ? ' correct' : ' wrong' : ''}`}>
        <label htmlFor="code-output-answer">예상 출력 결과</label>
        <textarea id="code-output-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitted} rows={3} spellCheck={false} autoComplete="off" placeholder="출력되는 값들을 순서대로 입력하세요" />
        <small>공백·줄바꿈의 양은 무시합니다. 값의 순서, 문자 대소문자와 기호는 일치해야 합니다. 코드는 C11 기준이며 직접 실행하는 기능은 아닙니다.</small>
      </div>
      {submitted && <section className={`result-callout ${correct ? 'correct' : 'wrong'}`} aria-live="polite">
        <strong>{correct ? '정답입니다!' : '오답입니다. 아래 풀이와 함께 흐름을 다시 확인하세요.'}</strong>
        <p>정답 출력</p><pre className="code-expected-output">{question.answerText}</pre>
        <p>{question.explanation}</p>
        <ol className="code-trace">{question.trace.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </section>}
      {saveStatus === 'error' && <div className="save-error" role="alert">채점은 완료했지만 풀이 기록을 저장하지 못했습니다. <button type="button" onClick={saveAttempt}>저장 다시 시도</button></div>}
      <div className="quiz-actions"><span role="status">{saveStatus === 'saving' ? '풀이 기록 저장 중…' : saveStatus === 'saved' ? 'C 통계에 풀이 기록을 저장했습니다.' : '실행 순서에 따라 값을 추적해보세요.'}</span>{submitted ? <button type="button" className="primary-button" disabled={saveStatus === 'saving'} onClick={onNext}>같은 난이도 랜덤 문제 <ArrowRight size={15} /></button> : <button type="submit" className="primary-button" disabled={!answer.trim()}>정답 확인 <ArrowRight size={15} /></button>}</div>
    </form>
  </section>;
}
