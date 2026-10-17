import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { practiceQuestions } from '../data/studyData';
import { usePracticeAttempts } from '../hooks/usePracticeAttempts';
import { getUnseenQuestions } from '../lib/practiceHistory';
import ExamRetryPanel from '../components/ExamRetryPanel';
import { useAuth } from '../contexts/AuthContext';
import { hasRequiredRole } from '../lib/appRoles';

const getRandomQuestion = (questions) => questions[Math.floor(Math.random() * questions.length)];

export default function ExamsPage() {
  const { appRole } = useAuth();
  const { completedKeys, isLoading, error, refresh } = usePracticeAttempts();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (started || isLoading || error) return;
    setSelectedQuestion(getRandomQuestion(getUnseenQuestions(practiceQuestions, 'exam', completedKeys)) ?? null);
    setStarted(true);
  }, [started, isLoading, error, completedKeys]);
  const activeQuestion = selectedQuestion;
  const pickRandomQuestion = () => setSelectedQuestion(getRandomQuestion(getUnseenQuestions(practiceQuestions, 'exam', completedKeys, activeQuestion?.id)) ?? getRandomQuestion(getUnseenQuestions(practiceQuestions, 'exam', completedKeys)) ?? null);

  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">RANDOM QUESTION PRACTICE</p><h1>기출문제</h1><p>소프트웨어 설계·개발·데이터베이스·정보시스템 구축관리에서 무작위로 출제되는 문제를 풀어봅니다.</p></div></div>
      <p className="practice-history-link">{hasRequiredRole(appRole, 'pro') && <><Link to="/restored-exams">실기 복원 랜덤 문제 풀기 · Pro</Link> · </>}<Link to="/practice-history">풀었던 문제와 풀이 기록 보기</Link></p>
      {error ? <p className="save-error" role="alert">{error} <button type="button" onClick={refresh}>다시 불러오기</button></p> : isLoading || !started ? <p role="status">풀이 기록을 확인하고 있습니다.</p> : activeQuestion ? <ExamRetryPanel key={activeQuestion.id} question={activeQuestion} isRetry={false} onClose={pickRandomQuestion} onNext={pickRandomQuestion} closeLabel="다른 문제" nextLabel="다음 랜덤 문제" /> : <section className="empty-review panel"><h2>기출문제를 모두 풀었습니다.</h2><p>풀었던 문제의 해설은 풀이 기록에서 확인하고, 틀린 문제는 오답노트에서 다시 풀 수 있습니다.</p><div className="wrong-empty-actions"><Link to="/practice-history" className="primary-button">풀이 기록 보기</Link><Link to="/wrong-answers" className="secondary-button">오답 다시 풀기</Link></div></section>}
      <div className="notice-panel"><CheckCircle2 size={19} /><span>프로그래밍 언어 문제는 별도 코드 연습에서 제공하고, 이 문제은행은 나머지 4과목의 기출 유형 학습에 집중합니다.</span></div>
    </div>
  );
}
