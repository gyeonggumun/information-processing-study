import { useMemo, useState } from 'react';
import { ArrowRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { codeQuestions, practiceQuestions, previousQuestions } from '../data/studyData';
import { usePracticeAttempts } from '../hooks/usePracticeAttempts';
import { practiceKey, summarizePracticeHistory } from '../lib/practiceHistory';
import CodePracticePanel from '../components/CodePracticePanel';
import SqlPracticePanel from '../components/SqlPracticePanel';
import ExamRetryPanel from '../components/ExamRetryPanel';
import { restoredExamQuestions } from '../data/restoredExams';
import { similarExamQuestions } from '../data/similarExams';
import { getCodeProblemTitle } from '../lib/codePractice';

const questionMap = new Map([
  ...similarExamQuestions.map((question) => [practiceKey('exam', question.id), question]),
  ...Object.entries(previousQuestions).flatMap(([type, questions]) => questions.map((question) => [practiceKey(type, question.id), question])),
  ...restoredExamQuestions.map((question) => [practiceKey('exam', question.id), question]),
  ...practiceQuestions.map((question) => [practiceKey('exam', question.id), question]),
  ...Object.entries(codeQuestions).flatMap(([type, questions]) => questions.map((question) => [practiceKey(type, question.id), question])),
]);
const labels = { exam: '기출문제', C: 'C', Java: 'Java', Python: 'Python', SQL: 'SQL' };
const PAGE_SIZE = 20;
function historyTitle(type, question) {
  if (!question) return '제공 종료된 문제';
  if (type === 'exam' && !question.language) return question.title;
  return getCodeProblemTitle(question.language ?? type);
}

export default function PracticeHistoryPage() {
  const { attempts, isLoading, error, refresh } = usePracticeAttempts();
  const [type, setType] = useState('all');
  const [result, setResult] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [activeKey, setActiveKey] = useState(null);
  const entries = useMemo(() => summarizePracticeHistory(attempts), [attempts]);
  const visible = entries.filter(({ key, attempt }) => (type === 'all' || attempt.practice_type === type)
    && (result === 'all' || attempt.is_correct === (result === 'correct'))
    && historyTitle(attempt.practice_type, questionMap.get(key)).toLowerCase().includes(search.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const activeEntry = entries.find((entry) => entry.key === activeKey);
  const question = questionMap.get(activeKey);
  const panelProps = { question, reviewAttempt: activeEntry?.attempt, onClose: () => setActiveKey(null), closeLabel: '풀이 기록 목록으로' };

  return <div className="subpage">
    <div className="subpage-header"><div><p className="eyebrow">MY PRACTICE HISTORY</p><h1>풀이 기록</h1><p>풀었던 문제의 정답과 해설을 다시 확인합니다. 해설 열람은 풀이 횟수나 통계를 변경하지 않습니다.</p></div><History className="header-line-icon" size={42} /></div>
    <div className="notice-panel"><History size={19} /><span>정답·오답 모두 일반 랜덤 출제에서 제외됩니다. 틀린 문제를 다시 풀려면 <Link to="/wrong-answers">오답노트</Link>를 이용하세요.</span></div>
    {error && <p className="save-error" role="alert">{error} <button type="button" onClick={refresh}>다시 불러오기</button></p>}
    {isLoading && !error && <p role="status">풀이 기록을 불러오는 중입니다.</p>}
    {question && activeEntry && (activeEntry.attempt.practice_type === 'exam' ? <ExamRetryPanel key={activeKey} {...panelProps} /> : activeEntry.attempt.practice_type === 'SQL' ? <SqlPracticePanel key={activeKey} {...panelProps} /> : <CodePracticePanel key={activeKey} {...panelProps} />)}
    {!isLoading && <section className="wrong-list panel" aria-label="풀이 기록 목록">
      <div className="wrong-list-heading"><div><h2>풀었던 문제</h2><p>문제별 최근 결과와 풀이 일시를 표시합니다. 같은 문제의 오답 재풀이는 하나의 항목으로 모입니다.</p></div></div>
      <div className="practice-history-filters">
        <label>유형 <select value={type} onChange={(event) => { setType(event.target.value); setPage(0); }}><option value="all">전체</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>최근 결과 <select value={result} onChange={(event) => { setResult(event.target.value); setPage(0); }}><option value="all">전체</option><option value="correct">정답</option><option value="wrong">오답</option></select></label>
        <label>문제 검색 <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="문제 이름" /></label>
      </div>
      <div className="wrong-question-list">{visible.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(({ key, attempt, count }) => {
        const item = questionMap.get(key);
        return <button type="button" className={`wrong-question-row practice-history-row${activeKey === key ? ' active' : ''}`} key={key} disabled={!item} onClick={() => setActiveKey(key)}>
          <span className="tag">{labels[attempt.practice_type]}{item?.difficulty ? ` · ${item.difficulty}` : ''}</span>
          <span className="wrong-question-title"><strong>{historyTitle(attempt.practice_type, item)}</strong><small>{new Date(attempt.created_at).toLocaleString('ko-KR')} · {count}회 풀이</small></span>
          <span className={`practice-history-result ${attempt.is_correct ? 'correct' : 'wrong'}`}>{attempt.is_correct ? '정답' : '오답'}</span><span className="wrong-question-action">풀이 보기 <ArrowRight size={15} /></span>
        </button>;
      })}</div>
      {visible.length === 0 && <div className="empty-review"><h2>{entries.length ? '조건에 맞는 풀이 기록이 없습니다.' : '아직 풀었던 문제가 없습니다.'}</h2><p>문제를 제출하면 기록이 여기에 모입니다.</p><Link to="/exams" className="primary-button">기출문제 풀기</Link></div>}
      {totalPages > 1 && <nav className="admin-pagination" aria-label="풀이 기록 페이지"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>이전</button><span>{currentPage + 1} / {totalPages}</span><button type="button" disabled={currentPage + 1 >= totalPages} onClick={() => setPage(currentPage + 1)}>다음</button></nav>}
    </section>}
  </div>;
}
