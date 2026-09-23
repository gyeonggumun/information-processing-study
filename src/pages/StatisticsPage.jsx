import { BarChart3, CheckCircle2, CircleX, ListChecks } from 'lucide-react';
import { practiceStats } from '../data/studyData';

export default function StatisticsPage() {
  const totalSolved = practiceStats.reduce((total, item) => total + item.solved, 0);
  const totalCorrect = practiceStats.reduce((total, item) => total + item.correct, 0);
  const accuracy = Math.round((totalCorrect / totalSolved) * 100);

  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">LEARNING ANALYTICS</p><h1>통계</h1><p>기출문제와 언어별 코드 연습의 풀이 기록을 확인합니다.</p></div><BarChart3 className="header-line-icon" size={42} /></div><div className="stats-summary"><div className="summary-card"><ListChecks size={18} /><span>총 풀이 문제</span><strong>{totalSolved}문제</strong></div><div className="summary-card"><CheckCircle2 size={18} /><span>전체 정답률</span><strong>{accuracy}%</strong></div><div className="summary-card"><CircleX size={18} /><span>누적 오답</span><strong>{totalSolved - totalCorrect}문제</strong></div></div><div className="statistics-panel panel"><div className="section-title-row compact"><div><p className="section-kicker">PRACTICE PERFORMANCE</p><h2>유형별 풀이 통계</h2></div><span className="muted-tag">데모 기록</span></div><div className="practice-stat-list">{practiceStats.map((item) => { const itemAccuracy = Math.round((item.correct / item.solved) * 100); return <article className="practice-stat-row" key={item.label}><div className="practice-stat-heading"><span className={`subject-dot ${item.color}`} /><strong>{item.label}</strong></div><div className="practice-stat-values"><span><b>{item.solved}</b>문제 풀이</span><span><b>{item.correct}</b>문제 정답</span><strong>{itemAccuracy}%</strong></div><div className="stat-track"><i className={item.color} style={{ width: `${itemAccuracy}%` }} /></div></article>; })}</div></div><div className="notice-panel"><BarChart3 size={19} /><span>문제 풀이 기록이 저장되면 기출문제와 C·Java·Python 통계가 실제 결과로 자동 갱신됩니다.</span></div></div>;
}
