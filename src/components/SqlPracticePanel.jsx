import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isCodeOutputCorrect } from '../lib/codePractice';

function isSqlAnswerCorrect(answer, question) {
  if (question.answerMode === 'result') return isCodeOutputCorrect(answer, question.answerText);
  const normalize = (value) => value.trim().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').toUpperCase();
  return normalize(answer) === normalize(question.answerText);
}

export default function SqlPracticePanel({ question, onClose, onNext, onAttemptSaved, closeLabel = '난이도 다시 선택', nextLabel = '같은 난이도 랜덤 문제' }) {
  const { user } = useAuth();
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  const pendingRef = useRef(false);
  const attemptIdRef = useRef(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const correct = submitted && isSqlAnswerCorrect(answer, question);

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
      const { error } = await supabase.from('practice_attempts').insert({
        id: attemptIdRef.current, user_id: user.id, practice_type: 'SQL',
        question_id: question.id, is_correct: isSqlAnswerCorrect(answer, question),
      });
      if (error && error.code !== '23505') throw error;
      setSaveStatus('saved');
      onAttemptSaved?.();
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

  return <section ref={panelRef} className="code-practice-panel panel" aria-labelledby="sql-practice-title">
    <div className="code-practice-top"><span className="tag">SQL · {question.difficulty} 난이도</span><button type="button" className="secondary-button" disabled={saveStatus === 'saving'} onClick={onClose}><ArrowLeft size={15} /> {closeLabel}</button></div>
    <div className="code-practice-heading"><h2 id="sql-practice-title" ref={headingRef} tabIndex={-1}>{question.title}</h2><p>{question.prompt}</p></div>
    {question.tables.length > 0 && <div className="sql-tables">{question.tables.map((item) => <div className="sql-table-wrap" key={item.name}>
      <strong>[표] {item.name}</strong><div className="sql-table-scroll"><table className="sql-data-table"><thead><tr>{item.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{item.rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell}>{value === null ? <em>NULL</em> : value}</td>)}</tr>)}</tbody></table></div>
    </div>)}</div>}
    <p className="sql-code-label">[SQL문]</p><pre className="code-source" aria-label="문제 SQL문"><code>{question.code}</code></pre>
    <form onSubmit={submit}>
      <div className={`written-answer-box${submitted ? correct ? ' correct' : ' wrong' : ''}`}>
        <label htmlFor="sql-answer">{question.answerMode === 'blanks' ? '빈칸 정답' : '조회 결과'}</label>
        <textarea id="sql-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitted} rows={3} spellCheck={false} autoComplete="off" placeholder={question.answerMode === 'blanks' ? '여러 빈칸은 쉼표로 구분해 입력하세요' : '결과 행을 순서대로 입력하세요'} />
        <small>{question.answerMode === 'blanks' ? 'SQL 키워드는 대소문자를 구분하지 않습니다. 여러 빈칸은 쉼표로 구분하세요.' : '공백·줄바꿈의 양은 무시하지만 값의 순서와 문자는 일치해야 합니다.'} 쿼리는 직접 실행되지 않습니다.</small>
      </div>
      {submitted && <section className={`result-callout ${correct ? 'correct' : 'wrong'}`} aria-live="polite">
        <strong>{correct ? '정답입니다!' : '오답입니다. 아래 풀이와 함께 SQL 흐름을 확인하세요.'}</strong>
        <p className="code-result-label">주석으로 보는 SQL</p>
        <pre className="code-source code-solution" aria-label="풀이 주석이 달린 SQL문"><code>{`${question.steps.map((step, index) => `-- ${index + 1}. ${step}`).join('\n')}\n\n${question.code}`}</code></pre>
        <div className="code-step-explanation"><h3>풀이 과정</h3><ol>{question.steps.map((step, index) => <li key={index}><p>{step}</p></li>)}</ol><div className="code-concept"><strong>핵심 개념</strong><p>{question.explanation}</p></div><p className="code-final-answer"><strong>정답</strong> <code>{question.answerText}</code></p></div>
      </section>}
      {saveStatus === 'error' && <div className="save-error" role="alert">채점은 완료했지만 풀이 기록을 저장하지 못했습니다. <button type="button" onClick={saveAttempt}>저장 다시 시도</button></div>}
      <div className="quiz-actions"><span role="status">{saveStatus === 'saving' ? '풀이 기록 저장 중…' : saveStatus === 'saved' ? 'SQL 통계에 풀이 기록을 저장했습니다.' : '표와 SQL문의 조건을 차례대로 확인해보세요.'}</span>{submitted ? <button type="button" className="primary-button" disabled={saveStatus === 'saving'} onClick={onNext}>{nextLabel} <ArrowRight size={15} /></button> : <button type="submit" className="primary-button" disabled={!answer.trim()}>정답 확인 <ArrowRight size={15} /></button>}</div>
    </form>
  </section>;
}
