import { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, CircleX, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';

const practiceTypes = [
  { label: '기출문제', type: 'exam', color: 'blue' },
  { label: 'C', type: 'C', color: 'cyan' },
  { label: 'Java', type: 'Java', color: 'orange' },
  { label: 'Python', type: 'Python', color: 'green' },
];

export default function StatisticsPage() {
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    supabase.from('practice_attempts').select('practice_type, is_correct').then(({ data, error }) => {
      if (!isMounted) return;
      if (error) setLoadError('통계를 불러오지 못했습니다. 잠시 후 다시 확인해주세요.');
      else setAttempts(data ?? []);
      setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const stats = practiceTypes.map((item) => {
    const typeAttempts = attempts.filter((attempt) => attempt.practice_type === item.type);
    const correct = typeAttempts.filter((attempt) => attempt.is_correct).length;
    return { ...item, solved: typeAttempts.length, correct, accuracy: typeAttempts.length ? Math.round((correct / typeAttempts.length) * 100) : 0 };
  });
  const totalSolved = stats.reduce((total, item) => total + item.solved, 0);
  const totalCorrect = stats.reduce((total, item) => total + item.correct, 0);
  const accuracy = totalSolved ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">LEARNING ANALYTICS</p><h1>통계</h1><p>기출문제와 언어별 코드 연습의 내 풀이 기록을 확인합니다.</p></div><BarChart3 className="header-line-icon" size={42} /></div><div className="stats-summary"><div className="summary-card"><ListChecks size={18} /><span>총 풀이 문제</span><strong>{totalSolved}문제</strong></div><div className="summary-card"><CheckCircle2 size={18} /><span>전체 정답률</span><strong>{accuracy}%</strong></div><div className="summary-card"><CircleX size={18} /><span>누적 오답</span><strong>{totalSolved - totalCorrect}문제</strong></div></div><div className="statistics-panel panel"><div className="section-title-row compact"><div><p className="section-kicker">MY PRACTICE PERFORMANCE</p><h2>유형별 풀이 통계</h2></div><span className="muted-tag">{isLoading ? '불러오는 중' : '내 기록'}</span></div>{loadError ? <p className="save-error" role="alert">{loadError}</p> : <div className="practice-stat-list">{stats.map((item) => <article className="practice-stat-row" key={item.label}><div className="practice-stat-heading"><span className={`subject-dot ${item.color}`} /><strong>{item.label}</strong></div><div className="practice-stat-values"><span><b>{item.solved}</b>문제 풀이</span><span><b>{item.correct}</b>문제 정답</span><strong>{item.accuracy}%</strong></div><div className="stat-track"><i className={item.color} style={{ width: `${item.accuracy}%` }} /></div></article>)}</div>}</div><div className="notice-panel"><BarChart3 size={19} /><span>기출문제 정답 제출 시 내 계정에 풀이 기록이 저장되며, 통계는 계정별로 분리됩니다.</span></div></div>;
}
