import { useState } from 'react';
import { Link } from 'react-router-dom';
import { restoredExams } from '../data/restoredExams';
import { usePracticeAttempts } from '../hooks/usePracticeAttempts';
import { getUnseenQuestions } from '../lib/practiceHistory';
import RestoredExamPanel from '../components/RestoredExamPanel';

export default function RestoredExamsPage() {
  const { completedKeys, isLoading, error, refresh } = usePracticeAttempts();
  const [examId, setExamId] = useState(null);
  const [selected, setSelected] = useState(null);
  const exam = restoredExams.find((item) => item.id === examId);
  const next = () => setSelected(getUnseenQuestions(exam.questions, 'exam', completedKeys, selected?.id)[0] ?? null);
  const close = () => { setExamId(null); setSelected(null); };

  return <div className="subpage">
    <div className="subpage-header"><div><p className="eyebrow">PAST EXAM SESSIONS</p><h1>실기 회차별 문제</h1><p>2023년 1회~2026년 2회, 주신 11개 복원 게시글의 이론·계산·C·Java·Python·SQL 문제를 회차별로 풀어봅니다.</p></div></div>
    <p className="practice-history-link"><Link to="/exams">기존 랜덤 유형 연습</Link> · <Link to="/practice-history">내 풀이와 해설 기록</Link></p>
    <div className="notice-panel"><span>공식 기출 공개본이 아닌 블로그 복원 자료입니다. 답안을 직접 작성한 뒤 예시 답안·해설과 비교해 자기채점합니다. 기록한 문제는 새 문제 출제에서 제외되고 오답은 오답노트에서 다시 풀 수 있습니다.</span></div>
    {error ? <p className="save-error" role="alert">{error} <button type="button" onClick={refresh}>다시 불러오기</button></p> : isLoading ? <p role="status">내 풀이 기록을 불러오고 있습니다.</p> : !exam ? <div className="restored-exam-grid">{restoredExams.map((item) => {
      const remaining = getUnseenQuestions(item.questions, 'exam', completedKeys);
      return <article className="panel restored-exam-card" key={item.id}><span className="tag">실기 복원 · {item.questions.length}문항</span><h2>{item.title}</h2><p>이론·계산·프로그래밍·SQL 통합 회차</p><p>{item.questions.length - remaining.length}개 기록 · {remaining.length}개 미풀이</p><button type="button" className="primary-button" onClick={() => { setExamId(item.id); setSelected(remaining[0] ?? null); }}>{remaining.length ? '미풀이 문제 풀기' : '완료한 회차 확인'}</button><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">출처 게시글</a></article>;
    })}</div> : selected ? <RestoredExamPanel key={selected.id} question={selected} onClose={close} onNext={next} /> : <section className="panel empty-review"><h2>{exam.title} 문제를 모두 기록했습니다.</h2><p>해설은 풀이 기록에서 다시 확인하고 틀린 문제는 오답노트에서 복습하세요.</p><div className="wrong-empty-actions"><Link className="primary-button" to="/practice-history">풀이 기록 보기</Link><Link className="secondary-button" to="/wrong-answers">오답 다시 풀기</Link><button type="button" className="secondary-button" onClick={close}>회차 목록으로</button></div></section>}
  </div>;
}
