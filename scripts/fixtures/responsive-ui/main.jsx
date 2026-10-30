import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { FixtureIdentity } from './mocks';
import Layout from '../../../src/components/Layout';
import Home from '../../../src/pages/HomePage';
import Study from '../../../src/pages/StudyPage';
import Code from '../../../src/pages/CodePage';
import Exams from '../../../src/pages/ExamsPage';
import Favorites from '../../../src/pages/FavoritesPage';
import Summary from '../../../src/pages/ExamSummaryPage';
import Statistics from '../../../src/pages/StatisticsPage';
import History from '../../../src/pages/PracticeHistoryPage';
import Wrong from '../../../src/pages/WrongAnswersPage';
import Inquiries from '../../../src/pages/InquiriesPage';
import Admin from '../../../src/pages/AdminPage';
import Login from '../../../src/pages/LoginPage';
import Restored from '../../../src/pages/RestoredExamsPage';
import Similar from '../../../src/pages/SimilarExamsPage';
import RestoredExamPanel from '../../../src/components/RestoredExamPanel';
import { similarExamQuestions } from '../../../src/data/similarExams';
import { restoredExamQuestions } from '../../../src/data/restoredExams';
import CodePracticePanel from '../../../src/components/CodePracticePanel';
import SqlPracticePanel from '../../../src/components/SqlPracticePanel';
import { codeQuestions } from '../../../src/data/studyData';
import '../../../src/styles/global.css';
import '../../../src/styles/responsive.css';
import '../../../src/styles/reading.css';
const browserHistoryMode = new URLSearchParams(window.location.search).has('browserHistory');
const FixtureRouter = browserHistoryMode ? HashRouter : MemoryRouter;
const pages = ['/', '/study', '/study/software-design', '/study/software-development', '/study/database', '/study/programming', '/study/systems', '/code/C', '/code/Java', '/code/Python', '/code/SQL', '/exams', '/favorites', '/exam-summary', '/statistics', '/practice-history', '/wrong-answers', '/inquiries', '/admin', '/admin/inquiries', '/restored-exams', '/login', '/verify/C', '/verify/Java', '/verify/Python', '/verify/SQL'];
function SolutionFixture() {
  const { language } = useParams();
  const type = language === 'SQL-update' ? 'SQL' : language;
  const family = { C: 'practical-c-matrix', Java: 'override-recursive-calls', Python: 'additional-nested-augmented-sharing', SQL: 'practical-sql-group', 'SQL-update': 'additional-update-average-filter' }[language];
  const question = codeQuestions[type].find(q => q.family === family);
  const Panel = type === 'SQL' ? SqlPracticePanel : CodePracticePanel;
  return <div className="subpage"><h1>{language} 상세 해설</h1><Panel question={question} reviewAttempt={{ is_correct: false }} onClose={() => {}} /></div>;
}
function SimilarSolutionFixture() {
  const { language } = useParams();
  const question = similarExamQuestions.find(q => language === 'SQL' ? q.key === 'sql-view-1' : language === 'theory' ? q.key === 'proxy' : language === 'distinction' ? q.key === 'requirements' : language === 'hash' ? q.key === 'hash' : q.language === language);
  return <div className="subpage"><h1>실기 유사 문제 풀이</h1><RestoredExamPanel question={question} reviewAttempt={{ is_correct: false }} onClose={() => {}} /></div>;
}
function RestoredSolutionFixture({ play = false }) {
  const { language } = useParams();
  const id = { C: 'past-2026-2-q7', Java: 'past-2026-1-q7', Python: 'past-2026-1-q14', SQL: 'past-2026-2-q14', error: 'past-2023-3-q13', theory: 'past-2026-2-q1', access: 'past-2025-3-q18', normalization: 'past-2026-2-q20', cohesion: 'past-2026-1-q20', 'typo-java': 'past-2024-1-q10', 'typo-sql': 'past-2024-2-q3', choices: 'past-2023-3-q16', definitions: 'past-2023-1-q12', union: 'past-2023-3-q6', integrity: 'past-2025-1-q2', url: 'past-2024-3-q9', branch: 'past-2025-2-q11' }[language];
  const question = restoredExamQuestions.find(q => q.id === id);
  return <div className="subpage"><h1>실기 복원 상세 해설</h1><RestoredExamPanel question={question} reviewAttempt={play ? undefined : { is_correct: false }} onClose={() => {}} /></div>;
}
function App() {
  const [path, setPath] = useState(browserHistoryMode ? window.location.hash.slice(1) || '/' : '/');
  const changePath = (nextPath) => {
    setPath(nextPath);
    if (browserHistoryMode) window.location.hash = nextPath;
  };
  return <><div className="responsive-fixture-controls"><label>검증 페이지 <select value={path} onChange={event => changePath(event.target.value)}>{[...pages, '/similar-exams', '/verify/SQL-update', '/verify-similar/SQL', '/verify-similar/C', '/verify-similar/theory', '/verify-similar/distinction', '/verify-similar/hash', ...['C','Java','Python','SQL','error','theory','access','normalization','cohesion','choices','definitions','union','integrity','url','branch'].map(language => `/verify-restored/${language}`), '/verify-restored-play/Java', '/verify-restored-play/theory', '/verify-restored-play/typo-java', '/verify-restored-play/typo-sql', '/verify-restored-play/union', '/verify-restored-play/integrity'].map(page => <option key={page}>{page}</option>)}</select></label><span>실제 데이터 접근 없음</span></div><FixtureIdentity><FixtureRouter key={browserHistoryMode ? 'history' : path} {...(browserHistoryMode ? {} : { initialEntries: [path] })}><Routes><Route element={<Layout />}>
    <Route path="/" element={<Home />} /><Route path="/study" element={<Study />} /><Route path="/study/:subjectId" element={<Study />} /><Route path="/code/:language" element={<Code />} /><Route path="/exams" element={<Exams />} /><Route path="/favorites" element={<Favorites />} /><Route path="/exam-summary" element={<Summary />} /><Route path="/statistics" element={<Statistics />} /><Route path="/practice-history" element={<History />} /><Route path="/wrong-answers" element={<Wrong />} /><Route path="/inquiries" element={<Inquiries />} /><Route path="/admin" element={<Admin />} /><Route path="/admin/inquiries" element={<Inquiries admin />} /><Route path="/restored-exams" element={<Restored />} /><Route path="/login" element={<Login />} />
    <Route path="/verify/:language" element={<SolutionFixture />} />
    <Route path="/similar-exams" element={<Similar />} />
    <Route path="/verify-similar/:language" element={<SimilarSolutionFixture />} />
    <Route path="/verify-restored/:language" element={<RestoredSolutionFixture />} />
    <Route path="/verify-restored-play/:language" element={<RestoredSolutionFixture play />} />
  </Route></Routes></FixtureRouter></FixtureIdentity></>;
}
const style = document.createElement('style'); style.textContent = '.responsive-fixture-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:4px;font-size:12px}.responsive-fixture-controls label{min-width:0}.responsive-fixture-controls select{max-width:100%;font:inherit}'; document.head.appendChild(style);
const root = createRoot(document.getElementById('root')); root.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
