import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasRequiredRole } from '../lib/appRoles';
import { supabase } from '../lib/supabase';
import { savePracticeAttempt } from '../lib/practiceHistory';
import { getRestoredProblemBlocks, getRestoredProblemNote } from '../lib/restoredProblemPresentation';
import '../styles/restored-exams.css';
import ReadingText, { AnswerConceptNotes } from './ReadingText';

export function RestoredBlocks({ blocks, answer = false, lineNumbers = false }) {
  return <div className="restored-blocks">{blocks.map((block, index) => {
    if (block.type === 'code') return <pre className="restored-code" key={index}><code>{lineNumbers ? block.text.split('\n').map((line, i) => <span className="restored-code-line" key={i}><span className="restored-line-number" aria-hidden="true">{i + 1}</span>{line}{'\n'}</span>) : block.text}</code></pre>;
    if (block.type === 'image') return <figure className="restored-figure" key={index}><img src={block.src} alt={block.alt} loading="lazy" /><figcaption><a href={block.src} target="_blank" rel="noopener noreferrer">이미지 크게 보기 <ExternalLink size={13} /></a></figcaption></figure>;
    if (block.type === 'table') return <div className="restored-table-wrap" key={index}><table className="restored-table"><caption>{block.caption || `${answer ? '예시 답안 표' : '문제 자료 표'} ${index + 1}`}</caption><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => i === 0 ? <th scope="col" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
    return <p key={index}>{block.text}</p>;
  })}</div>;
}

export default function RestoredExamPanel(props) {
  const { appRole, isLoading } = useAuth();
  if (isLoading) return <p role="status">접근 권한을 확인하고 있습니다.</p>;
  if (!hasRequiredRole(appRole, 'pro')) return <section className="panel empty-review"><h2>Pro 이상 전용 문제입니다.</h2><p>{props.question.similar ? '실기 유사' : '실기 복원'} 문제의 풀이·해설·오답 복습은 Pro·Admin 계정으로 이용할 수 있습니다. 기존 풀이 기록은 유지됩니다.</p><button type="button" className="secondary-button" onClick={props.onClose}>돌아가기</button></section>;
  return <RestoredQuestion {...props} />;
}

function RestoredQuestion({ question, onClose, onNext = onClose, onAttemptSaved, reviewAttempt, closeLabel = '목록으로', nextLabel = '다음 문제', isRetry = false }) {
  const { user, appRole } = useAuth();
  const inputId = useId();
  const heading = useRef(null);
  const pending = useRef(false);
  const attempt = useRef(null);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(Boolean(reviewAttempt));
  const [saveStatus, setSaveStatus] = useState('idle');
  const [result, setResult] = useState(reviewAttempt?.is_correct ?? null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, []);

  const save = async (isCorrect) => {
    if (!hasRequiredRole(appRole, 'pro') || pending.current || reviewAttempt || saveStatus === 'saved' || !revealed) return;
    pending.current = true;
    setSaveStatus('saving');
    attempt.current ??= { id: crypto.randomUUID(), user_id: user?.id, practice_type: 'exam', question_id: question.id, is_correct: isCorrect };
    setResult(attempt.current.is_correct);
    try {
      if (!user || attempt.current.user_id !== user.id) throw new Error('인증 상태 변경');
      const saved = await savePracticeAttempt(supabase, attempt.current);
      setSaveStatus('saved');
      onAttemptSaved?.(saved);
    } catch {
      setSaveStatus('error');
    } finally {
      pending.current = false;
    }
  };
  const canLeave = saveStatus !== 'saving' && saveStatus !== 'error';
  const problemNote = getRestoredProblemNote(question);
  const label = question.similar ? '실기 유사 문제' : '실기 복원 문제';

  return <section className="panel restored-question" aria-labelledby={`${inputId}-title`}>
    <div className="code-practice-top"><span className="tag">{label} · {reviewAttempt ? '풀이 기록' : isRetry ? '오답 복습' : '필답형'}</span><button type="button" className="secondary-button" onClick={onClose} disabled={!canLeave}><ArrowLeft size={15} /> {closeLabel}</button></div>
    <h2 id={`${inputId}-title`} tabIndex={-1} ref={heading}>{revealed ? question.title : label}</h2>
    {problemNote && <p className="restored-correction"><b>문제 조건</b> {problemNote}</p>}
    <RestoredBlocks blocks={getRestoredProblemBlocks(question)} lineNumbers={question.id === 'past-2023-3-q13'} />
    {!reviewAttempt && <form onSubmit={(event) => { event.preventDefault(); if (answer.trim()) setRevealed(true); }}>
      <div className="written-answer-box"><label htmlFor={inputId}>내 답안</label><textarea id={inputId} rows={5} value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={revealed} autoComplete="off" spellCheck={false} placeholder="복수 답은 번호별로, 코드 출력은 출력 순서대로 작성하세요." /><small>SQL·표·복수 정답의 다양한 표현을 고려한 자기채점 방식입니다. 공식 채점 결과가 아닙니다.</small></div>
      {!revealed && <button type="submit" className="primary-button" disabled={!answer.trim()}>정답·해설 확인 <ArrowRight size={15} /></button>}
    </form>}
    {revealed && <div className="restored-solution" aria-live="polite">
      {question.correction && <p className="restored-correction"><b>복원 자료 검수 안내</b> {question.correction}</p>}
      <h3>정답 / 예시 답안</h3><RestoredBlocks blocks={question.answerBlocks} answer />
      <AnswerConceptNotes question={question} />
      <h3>풀이 과정</h3><ol className="reading-steps">{question.explanation.map((step, index) => <li key={index}><ReadingText>{step}</ReadingText></li>)}</ol>
      {question.similar && question.solutionBlocks?.length > 0 && <><h3>{question.language === 'SQL' ? '계산 과정과 완성 표' : '주석으로 보는 코드'}</h3><RestoredBlocks blocks={question.solutionBlocks} answer /></>}
      {reviewAttempt ? <p className={`practice-history-result ${result ? 'correct' : 'wrong'}`}>최근 자기채점: {result ? '정답' : '오답'} · 해설 열람은 기록을 변경하지 않습니다.</p> : <>
        {saveStatus === 'idle' && <div className="restored-marking"><p>내 답안과 비교해 결과를 기록하세요. 용어의 동의어·SQL의 동등한 표현·집합의 원소 순서는 해설을 참고해 판단합니다.</p><button type="button" className="primary-button" onClick={() => save(true)}>정답으로 기록</button><button type="button" className="secondary-button" onClick={() => save(false)}>오답으로 기록</button></div>}
        {saveStatus === 'saving' && <p role="status">자기채점 결과를 저장하고 있습니다.</p>}
        {saveStatus === 'error' && <p className="save-error" role="alert">저장하지 못했습니다. 페이지를 나가기 전에 다시 시도하세요. <button type="button" onClick={() => save(result)}>같은 결과 저장 재시도</button></p>}
        {saveStatus === 'saved' && <div className="quiz-actions"><p role="status">{result ? '정답' : '오답'}으로 기록했습니다. 풀이 기록·오답노트·기출문제 통계에 반영됩니다.</p><button type="button" className="primary-button" onClick={onNext}>{nextLabel} <ArrowRight size={15} /></button></div>}
      </>}
    </div>}
    {(!question.similar || revealed) && <p className="restored-attribution">{question.similar ? '유형 참고: ' : '출처: '}<a href={question.sourceUrl} target="_blank" rel="noopener noreferrer">Life-Journey 복원 게시글</a> · <a href={question.license} target="_blank" rel="noopener noreferrer">CC BY 4.0</a><br />{question.similar ? `${question.referenceBasis}. 복원 원문과 다른 연습문제입니다.` : '원문을 학습용 텍스트·코드·표로 재배치하고 별도 해설과 검수 안내를 추가했습니다.'} 공식 시험지·공식 해설이 아니며 원저자의 보증·제휴를 의미하지 않습니다.</p>}
  </section>;
}
