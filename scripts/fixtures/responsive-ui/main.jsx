import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
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
import CodePracticePanel from '../../../src/components/CodePracticePanel';
import SqlPracticePanel from '../../../src/components/SqlPracticePanel';
import { codeQuestions } from '../../../src/data/studyData';
import '../../../src/styles/global.css';
import '../../../src/styles/responsive.css';
const pages = ['/', '/study', '/study/software-design', '/study/software-development', '/study/database', '/study/programming', '/study/systems', '/code/C', '/code/Java', '/code/Python', '/code/SQL', '/exams', '/favorites', '/exam-summary', '/statistics', '/practice-history', '/wrong-answers', '/inquiries', '/admin', '/admin/inquiries', '/restored-exams', '/login', '/verify/C', '/verify/Java', '/verify/Python', '/verify/SQL'];
function SolutionFixture() {
  const { language } = useParams();
  const family = { C: 'practical-c-matrix', Java: 'override-recursive-calls', Python: 'additional-nested-augmented-sharing', SQL: 'practical-sql-group' }[language];
  const question = codeQuestions[language].find(q => q.family === family);
  const Panel = language === 'SQL' ? SqlPracticePanel : CodePracticePanel;
  return <div className="subpage"><h1>{language} 상세 해설</h1><Panel question={question} reviewAttempt={{ is_correct: false }} onClose={() => {}} /></div>;
}
function SimilarSolutionFixture() {
  const { language } = useParams();
  const question = similarExamQuestions.find(q => language === 'SQL' ? q.key === 'sql-view-1' : q.language === language);
  return <div className="subpage"><h1>실기 유사 문제 풀이</h1><RestoredExamPanel question={question} reviewAttempt={{ is_correct: false }} onClose={() => {}} /></div>;
}
function App() {
  const [path, setPath] = useState('/');
  return <><div className="responsive-fixture-controls"><label>검증 페이지 <select value={path} onChange={event => setPath(event.target.value)}>{[...pages, '/similar-exams', '/verify-similar/SQL', '/verify-similar/C'].map(page => <option key={page}>{page}</option>)}</select></label><span>실제 데이터 접근 없음</span></div><FixtureIdentity><MemoryRouter key={path} initialEntries={[path]}><Routes><Route element={<Layout />}>
    <Route path="/" element={<Home />} /><Route path="/study" element={<Study />} /><Route path="/study/:subjectId" element={<Study />} /><Route path="/code/:language" element={<Code />} /><Route path="/exams" element={<Exams />} /><Route path="/favorites" element={<Favorites />} /><Route path="/exam-summary" element={<Summary />} /><Route path="/statistics" element={<Statistics />} /><Route path="/practice-history" element={<History />} /><Route path="/wrong-answers" element={<Wrong />} /><Route path="/inquiries" element={<Inquiries />} /><Route path="/admin" element={<Admin />} /><Route path="/admin/inquiries" element={<Inquiries admin />} /><Route path="/restored-exams" element={<Restored />} /><Route path="/login" element={<Login />} />
    <Route path="/verify/:language" element={<SolutionFixture />} />
    <Route path="/similar-exams" element={<Similar />} />
    <Route path="/verify-similar/:language" element={<SimilarSolutionFixture />} />
  </Route></Routes></MemoryRouter></FixtureIdentity></>;
}
const style = document.createElement('style'); style.textContent = '.responsive-fixture-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:4px;font-size:12px}.responsive-fixture-controls label{min-width:0}.responsive-fixture-controls select{max-width:100%;font:inherit}'; document.head.appendChild(style);
const root = createRoot(document.getElementById('root')); root.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
