import { useEffect, useState } from 'react';
import { ArrowRight, BookmarkX, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { codeQuestions, practiceQuestions } from '../data/studyData';
import { summarizeWrongAnswers } from '../lib/wrongAnswers';
import CodePracticePanel from '../components/CodePracticePanel';
import SqlPracticePanel from '../components/SqlPracticePanel';
import ExamRetryPanel from '../components/ExamRetryPanel';

const questionMap = new Map([
  ...practiceQuestions.map((question) => [`exam:${question.id}`, question]),
  ...Object.entries(codeQuestions).flatMap(([type, questions]) => questions.map((question) => [`${type}:${question.id}`, question])),
]);
const typeLabels = { exam: '기출문제', C: 'C', Java: 'Java', Python: 'Python', SQL: 'SQL' };

export default function WrongAnswersPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState('all');
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const loadAttempts = async () => {
      try {
        const all = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from('practice_attempts')
            .select('id, practice_type, question_id, is_correct, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + 499);
          if (error) throw error;
          all.push(...(data ?? []));
          if (!data || data.length < 500) break;
        }
        if (!cancelled) { setAttempts(all); setLoadError(''); }
      } catch {
        if (!cancelled) setLoadError('오답 기록을 불러오지 못했습니다. 다시 시도해주세요.');
      }
    };
    loadAttempts();
    return () => { cancelled = true; };
  }, [user?.id, refresh]);

  const { pending, resolvedCount, totalWrongAttempts, unavailableCount } = summarizeWrongAnswers(attempts ?? [], questionMap);
  const visible = filter === 'all' ? pending : pending.filter((entry) => entry.type === filter);
  const activeQuestion = activeKey ? questionMap.get(activeKey) : null;
  const activeType = activeKey?.split(':', 1)[0];
  const closeQuestion = () => setActiveKey(null);
  const refreshAttempts = () => setRefresh((value) => value + 1);

  return <div className="subpage">
    <div className="subpage-header"><div><p className="eyebrow">REVIEW DESK</p><h1>오답노트</h1><p>기출문제와 C·Java·Python·SQL에서 틀린 문제를 모아 다시 풀어봅니다.</p></div><BookmarkX className="header-line-icon" size={42} /></div>
    <div className="wrong-summary">
      <div className="summary-card"><span>누적 오답</span><strong>{attempts ? totalWrongAttempts : '—'}</strong><small>틀린 풀이 기록</small></div>
      <div className="summary-card"><span>다시 풀 문제</span><strong>{attempts ? pending.length : '—'}</strong><small>마지막 풀이가 오답인 문제</small></div>
      <div className="summary-card"><span>복습 완료</span><strong>{attempts ? resolvedCount : '—'}</strong><small>오답 이후 정답을 맞힌 문제</small></div>
    </div>
    {loadError && <div className="save-error wrong-load-error" role="alert">{loadError} <button type="button" onClick={refreshAttempts}>다시 불러오기</button></div>}
    {activeQuestion && (activeType === 'exam'
      ? <ExamRetryPanel key={activeKey} question={activeQuestion} onClose={closeQuestion} onAttemptSaved={refreshAttempts} />
      : activeType === 'SQL'
        ? <SqlPracticePanel key={activeKey} question={activeQuestion} onClose={closeQuestion} onNext={closeQuestion} onAttemptSaved={refreshAttempts} closeLabel="오답 목록으로" nextLabel="오답 목록으로 돌아가기" />
        : <CodePracticePanel key={activeKey} question={activeQuestion} onClose={closeQuestion} onNext={closeQuestion} onAttemptSaved={refreshAttempts} closeLabel="오답 목록으로" nextLabel="오답 목록으로 돌아가기" />)}
    {attempts === null && !loadError && <div className="empty-review panel"><div className="empty-icon"><RotateCcw size={22} /></div><h2>오답 기록을 불러오는 중입니다.</h2></div>}
    {attempts && pending.length === 0 && !loadError && <div className="empty-review panel"><div className="empty-icon"><RotateCcw size={22} /></div><h2>다시 풀 오답이 없습니다.</h2><p>문제를 틀리면 여기에 모입니다. 오답을 다시 맞히면 복습 완료로 집계됩니다.</p><div className="wrong-empty-actions"><Link to="/exams" className="primary-button">기출문제 풀기 <ArrowRight size={15} /></Link><Link to="/code" className="secondary-button">코드 연습하기 <ArrowRight size={15} /></Link></div></div>}
    {attempts && pending.length > 0 && <section className="wrong-list panel" aria-label="다시 풀 문제 목록">
      <div className="wrong-list-heading"><div><h2>다시 풀 문제</h2><p>마지막 풀이가 오답인 문제입니다. 여기서 다시 맞히면 목록에서 빠집니다.</p></div><label>유형 <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">전체</option>{Object.entries(typeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label></div>
      <div className="wrong-question-list">{visible.map(({ key, type, question }) => <button type="button" className={`wrong-question-row${activeKey === key ? ' active' : ''}`} key={key} onClick={() => setActiveKey(key)}><span className="tag">{typeLabels[type]}{question.difficulty ? ` · ${question.difficulty}` : ''}</span><span className="wrong-question-title">{question.title}</span><span className="wrong-question-action">다시 풀기 <ArrowRight size={15} /></span></button>)}</div>
      {visible.length === 0 && <p className="wrong-filter-empty">이 유형에는 다시 풀 문제가 없습니다.</p>}
    </section>}
    {unavailableCount > 0 && <p className="wrong-unavailable">현재 문제은행에서 찾을 수 없는 오답 {unavailableCount}개는 다시 풀이할 수 없습니다.</p>}
  </div>;
}
