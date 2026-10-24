import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isCodeOutputCorrect } from '../lib/codePractice';
import { buildCodeWalkthrough } from '../lib/codeWalkthrough';
import { buildCodeCalculationTrace } from '../lib/codeCalculationTrace';
import { getCodeSolutionGuide } from '../lib/codeSolutionGuides';
import SolutionReadingGuide from './SolutionReadingGuide';
import ReadingText from './ReadingText';
import { savePracticeAttempt } from '../lib/practiceHistory';

export default function CodePracticePanel({ question, onClose, onNext, onAttemptSaved, reviewAttempt, closeLabel = '난이도 다시 선택', nextLabel = '같은 난이도 랜덤 문제' }) {
  const { user } = useAuth();
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  const pendingRef = useRef(false);
  const attemptIdRef = useRef(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(Boolean(reviewAttempt));
  const [saveStatus, setSaveStatus] = useState('idle');
  const correct = reviewAttempt ? reviewAttempt.is_correct : submitted && isCodeOutputCorrect(answer, question.answerText);
  const walkthrough = submitted ? buildCodeWalkthrough(question) : null;

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
        id: attemptIdRef.current, user_id: user.id, practice_type: question.language,
        question_id: question.id, is_correct: isCodeOutputCorrect(answer, question.answerText),
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

  return <section ref={panelRef} className="code-practice-panel panel" aria-labelledby="code-practice-title">
    <div className="code-practice-top"><span className="tag">{question.language} · {question.difficulty} 난이도</span><button type="button" className="secondary-button" disabled={!reviewAttempt && submitted && saveStatus !== 'saved'} onClick={onClose}><ArrowLeft size={15} /> {closeLabel}</button></div>
    <div className="code-practice-heading"><h2 id="code-practice-title" ref={headingRef} tabIndex={-1}>{submitted ? question.title : `${question.language} 코드 문제`}</h2><p>{question.prompt}</p></div>
    <pre className="code-source" aria-label={`문제 ${question.language} 소스 코드`}><code>{question.code}</code></pre>
    <form onSubmit={submit}>
      {!reviewAttempt && <div className={`written-answer-box${submitted ? correct ? ' correct' : ' wrong' : ''}`}>
        <label htmlFor="code-output-answer">예상 출력 결과</label>
        <textarea id="code-output-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={submitted} rows={3} spellCheck={false} autoComplete="off" placeholder="출력되는 값들을 순서대로 입력하세요" />
        <small>공백·줄바꿈의 양은 무시합니다. 값의 순서, 문자 대소문자와 기호는 일치해야 합니다. 코드는 {question.language === 'C' ? 'C11' : question.language === 'Java' ? 'Java 11' : 'Python 3'} 기준이며 직접 실행하는 기능은 아닙니다.</small>
      </div>}
      {submitted && <section className={`result-callout ${correct ? 'correct' : 'wrong'}`} aria-live="polite">
        <strong>{reviewAttempt ? `최근 풀이: ${correct ? '정답' : '오답'} · 해설 다시 보기` : correct ? '정답입니다!' : '오답입니다. 아래 풀이와 함께 흐름을 다시 확인하세요.'}</strong>
        <SolutionReadingGuide guide={getCodeSolutionGuide(question)} />
        <p className="code-result-label">주석으로 보는 코드</p>
        <pre className="code-source code-solution" aria-label={`실행 순서별 주석이 달린 ${question.language} 코드`}><code>{walkthrough.annotatedCode.split('\n').map((line, index) => <span className={/^(\/\/|#) \[/.test(line.trimStart()) ? 'code-comment-line' : undefined} key={index}>{line}{'\n'}</span>)}</code></pre>
        <div className="code-step-explanation">
          <h3>풀이 과정</h3>
          <p className="code-step-intro">위 주석의 번호에 대응하는 핵심 단계를 설명합니다. 한 단계가 여러 번의 반복·호출을 요약할 수 있습니다. 재귀의 반환값 계산 순서와 실제 호출 순서는 구분해서 보세요.</p>
          <CalculationTrace question={question} />
          <ol className="reading-steps">{walkthrough.steps.map((step) => <li key={step.order}><span className="code-step-line">{step.lineNumber}행</span> <code>{step.statement}</code><p><ReadingText>{step.description}</ReadingText></p></li>)}</ol>
          <div className="code-concept"><strong>핵심 개념</strong><p><ReadingText>{question.explanation}</ReadingText></p></div>
          <p className="code-final-answer"><strong>정답</strong> <code>{question.answerText}</code></p>
        </div>
      </section>}
      {saveStatus === 'error' && <div className="save-error" role="alert">채점은 완료했지만 풀이 기록을 저장하지 못했습니다. <button type="button" onClick={saveAttempt}>저장 다시 시도</button></div>}
      {!reviewAttempt && <div className="quiz-actions"><span role="status">{saveStatus === 'saving' ? '풀이 기록 저장 중…' : saveStatus === 'saved' ? `${question.language} 통계에 풀이 기록을 저장했습니다.` : ''}</span>{submitted ? <button type="button" className="primary-button" disabled={saveStatus !== 'saved'} onClick={onNext}>{nextLabel} <ArrowRight size={15} /></button> : <button type="submit" className="primary-button" disabled={!answer.trim()}>정답 확인 <ArrowRight size={15} /></button>}</div>}
    </form>
  </section>;
}

function CalculationTrace({ question }) {
  const trace = buildCodeCalculationTrace(question);
  if (!trace) return null;
  return <section className="code-calculation-trace" aria-label="상세 중간 계산">
    <h4>{trace.label}</h4>
    <div className="sql-table-scroll" role="region" aria-label="중간 계산 표 · 가로 스크롤 가능" tabIndex={0}>
      <table className="sql-data-table"><thead><tr>{trace.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{trace.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}
