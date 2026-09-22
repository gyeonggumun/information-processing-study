import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import ExamsPage from './pages/ExamsPage';
import CodePage from './pages/CodePage';
import WrongAnswersPage from './pages/WrongAnswersPage';
import StatisticsPage from './pages/StatisticsPage';
import './styles/global.css';

function NotFound() {
  return <div className="not-found"><p className="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><a href="/">홈으로 돌아가기</a></div>;
}

export default function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<HomePage />} /><Route path="/study" element={<StudyPage />} /><Route path="/study/:subjectId" element={<StudyPage />} /><Route path="/exams" element={<ExamsPage />} /><Route path="/code" element={<CodePage />} /><Route path="/code/:language" element={<CodePage />} /><Route path="/wrong-answers" element={<WrongAnswersPage />} /><Route path="/statistics" element={<StatisticsPage />} /><Route path="*" element={<NotFound />} /></Route></Routes></BrowserRouter>;
}
