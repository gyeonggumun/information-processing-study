import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import ExamsPage from './pages/ExamsPage';
import CodePage from './pages/CodePage';
import WrongAnswersPage from './pages/WrongAnswersPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import './styles/global.css';
import FavoritesPage from './pages/FavoritesPage';

function NotFound() {
  return <div className="not-found"><p className="eyebrow">404</p><h1>페이지를 찾을 수 없습니다.</h1><a href="/">홈으로 돌아가기</a></div>;
}

export default function App() {
  return <AuthProvider><FavoritesProvider><BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<HomePage />} /><Route path="/login" element={<LoginPage />} /><Route path="/profile/setup" element={<ProfileSetupPage />} /><Route path="/study" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} /><Route path="/study/:subjectId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} /><Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} /><Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} /><Route path="/code" element={<ProtectedRoute><CodePage /></ProtectedRoute>} /><Route path="/code/:language" element={<ProtectedRoute><CodePage /></ProtectedRoute>} /><Route path="/wrong-answers" element={<ProtectedRoute><WrongAnswersPage /></ProtectedRoute>} /><Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} /><Route path="*" element={<NotFound />} /></Route></Routes></BrowserRouter></FavoritesProvider></AuthProvider>;
}
