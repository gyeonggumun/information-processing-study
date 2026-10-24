import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { restoredExamQuestions } from '../data/restoredExams';
import { usePracticeAttempts } from '../hooks/usePracticeAttempts';
import { pickRestoredExamQuestion } from '../lib/restoredExamPractice';
import RestoredExamPanel from '../components/RestoredExamPanel';
import { similarExamQuestions } from '../data/similarExams';

export default function RestoredExamsPage({ similar = false }) {
  const questions = similar ? similarExamQuestions : restoredExamQuestions;
  const label = similar ? '실기 유사' : '실기 복원';
  const { completedKeys, isLoading, error, refresh } = usePracticeAttempts();
  const [selected, setSelected] = useState(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started || isLoading || error) return;
    setSelected(pickRestoredExamQuestion(questions, completedKeys));
    setStarted(true);
  }, [started, isLoading, error, completedKeys, questions]);
  const next = () => setSelected(pickRestoredExamQuestion(questions, completedKeys, selected?.id));

  return <div className="subpage">
    <div className="subpage-header"><div><p className="eyebrow">{similar ? 'SIMILAR EXAM PRACTICE' : 'RANDOM RESTORED EXAMS'} · PRO</p><h1>{label} 랜덤 문제</h1><p>{similar ? 'Pro·Admin 전용 · 실기 복원 유형을 바탕으로 사례·코드·데이터를 바꾼 이론·계산·C·Java·Python·SQL 문제를 무작위로 풀어봅니다.' : 'Pro·Admin 전용 · 2023년 1회~2026년 2회 전체 복원 문제에서 이론·계산·C·Java·Python·SQL을 구분하지 않고 무작위로 출제합니다.'}</p></div></div>
    <p className="practice-history-link"><Link to={similar ? '/restored-exams' : '/similar-exams'}>{similar ? '실기 복원 랜덤 문제' : '실기 유사 랜덤 문제'}</Link> · <Link to="/exams">기존 랜덤 유형 연습</Link> · <Link to="/practice-history">내 풀이와 해설 기록</Link></p>
    <div className="notice-panel"><span>{similar ? '복원 원문과 다른 창작·변형 연습문제입니다.' : '공식 기출 공개본이 아닌 블로그 복원 자료입니다.'} 답안을 직접 작성한 뒤 예시 답안·해설과 비교해 자기채점합니다. 기록한 문제는 새 문제 출제에서 제외되고 오답은 오답노트에서 다시 풀 수 있습니다.</span></div>
    {error ? <p className="save-error" role="alert">{error} <button type="button" onClick={refresh}>다시 불러오기</button></p> : isLoading || !started ? <p role="status">내 풀이 기록을 불러오고 있습니다.</p> : selected ? <RestoredExamPanel key={selected.id} question={selected} onClose={next} onNext={next} closeLabel="다른 문제" nextLabel="다음 랜덤 문제" /> : <section className="panel empty-review"><h2>{label} 문제를 모두 기록했습니다.</h2><p>해설은 풀이 기록에서 다시 확인하고 틀린 문제는 오답노트에서 복습하세요.</p><div className="wrong-empty-actions"><Link className="primary-button" to="/practice-history">풀이 기록 보기</Link><Link className="secondary-button" to="/wrong-answers">오답 다시 풀기</Link></div></section>}
  </div>;
}
