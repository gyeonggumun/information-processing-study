import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, ChevronDown, Code2, FileText, Home, ListChecks, Menu, BarChart3, LogIn, LogOut, X } from 'lucide-react';
import { subjects } from '../data/studyData';
import { useAuth } from '../contexts/AuthContext';

function HeaderLink({ to, children, end = false }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `top-link${isActive ? ' active' : ''}`}>
      {children}
    </NavLink>
  );
}

function SubjectMenu({ onNavigate }) {
  return (
    <div className="nav-dropdown">
      <HeaderLink to="/study">
        <BookOpen size={16} /> 학습하기 <ChevronDown className="dropdown-chevron" size={14} />
      </HeaderLink>
      <div className="dropdown-panel" role="menu">
        <div className="dropdown-heading">5과목으로 나누어 학습</div>
        {subjects.map((subject) => (
          <Link key={subject.id} to={`/study/${subject.id}`} className="dropdown-link" onClick={onNavigate} role="menuitem">
            <span className={`subject-dot ${subject.color}`} />
            <span><strong>{subject.short}</strong><small>{subject.description}</small></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CodeMenu({ onNavigate }) {
  return (
    <div className="nav-dropdown">
      <HeaderLink to="/code">
        <Code2 size={16} /> 코드 연습 <ChevronDown className="dropdown-chevron" size={14} />
      </HeaderLink>
      <div className="dropdown-panel compact" role="menu">
        <div className="dropdown-heading">언어별 코드 풀이</div>
        {['C', 'Java', 'Python'].map((language) => (
          <Link key={language} to={`/code/${language}`} className="dropdown-link code-link" onClick={onNavigate} role="menuitem">
            <span className="code-language">{language}</span>
            <span>{language} 코드 결과 예측</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { isLoggedIn, logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" onClick={closeMobile}>
            <img className="brand-logo" src="/logo-concepts/option-2-header.svg" alt="정처기학습 플랫폼" />
          </Link>
          <button className="mobile-menu-button" type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="메뉴 열기">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`top-navigation${mobileOpen ? ' open' : ''}`} aria-label="주요 메뉴">
            <HeaderLink to="/" end><Home size={16} /> 홈</HeaderLink>
            <SubjectMenu onNavigate={closeMobile} />
            <HeaderLink to="/exams"><FileText size={16} /> 기출문제</HeaderLink>
            <CodeMenu onNavigate={closeMobile} />
            <HeaderLink to="/wrong-answers"><ListChecks size={16} /> 오답노트</HeaderLink>
            <HeaderLink to="/statistics"><BarChart3 size={16} /> 통계</HeaderLink>
          </nav>
          <div className="header-auth">{isLoggedIn ? <button type="button" className="header-auth-button" onClick={logout} aria-label={`${user.name} 로그아웃`}><LogOut size={15} /> 로그아웃</button> : <Link to="/login" className="header-auth-button" onClick={closeMobile}><LogIn size={15} /> 로그인</Link>}</div>
        </div>
      </header>
      <main className="page-container"><Outlet /></main>
      <footer className="site-footer">정처기학습 플랫폼 <span>·</span> 정보처리기사 실기 학습용 뼈대</footer>
    </div>
  );
}
