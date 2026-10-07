import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, Code2, FileText, Home, ListChecks, Menu, BarChart3, LogIn, LogOut, Pencil, Star, UserRound, X } from 'lucide-react';
import { subjects } from '../data/studyData';
import { AUTH_RETURN_TO_KEY, getSafeReturnPath, useAuth } from '../contexts/AuthContext';
import ProfileEditModal from './ProfileEditModal';

function HeaderLink({ to, children, end = false, className = '' }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `top-link${className ? ` ${className}` : ''}${isActive ? ' active' : ''}`}>
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
        <div className="dropdown-heading">코드·SQL 문제 풀이</div>
        {['C', 'Java', 'Python', 'SQL'].map((language) => (
          <Link key={language} to={`/code/${language}`} className="dropdown-link code-link" onClick={onNavigate} role="menuitem">
            <span className="code-language">{language}</span>
            <span>{language === 'SQL' ? 'SQL 쿼리 기출 유형' : `${language}코드 기출문제`}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { isLoading, isLoggedIn, hasNickname, nickname, logout, updateNickname } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (isLoading || !isLoggedIn) return;

    const pendingReturn = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
    if (pendingReturn) {
      window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
      const destination = getSafeReturnPath(pendingReturn);
      navigate(hasNickname ? destination : '/profile/setup', {
        replace: true,
        state: hasNickname ? undefined : { from: { pathname: destination } },
      });
      return;
    }

    if (!hasNickname && !['/profile/setup', '/login'].includes(location.pathname)) {
      navigate('/profile/setup', {
        replace: true,
        state: { from: { pathname: getSafeReturnPath(`${location.pathname}${location.search}${location.hash}`) } },
      });
    }
  }, [hasNickname, isLoading, isLoggedIn, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleNicknameSave = async (nextNickname) => {
    const { error } = await updateNickname(nextNickname);
    if (error) throw error;
    setProfileModalOpen(false);
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    closeMobile();
    await logout();
    navigate('/', { replace: true });
  };

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
            <HeaderLink to="/favorites" className="favorites-link"><Star size={16} /> 즐겨찾기</HeaderLink>
          </nav>
          <div className="header-auth">{isLoggedIn ? <div className="account-menu" ref={accountRef}>
            <button ref={accountButtonRef} type="button" className="header-auth-button profile-trigger" aria-expanded={accountMenuOpen} aria-haspopup="menu" onClick={() => setAccountMenuOpen((open) => !open)}>
              <span className="profile-avatar"><UserRound size={15} /></span><span className="profile-trigger-name">{nickname || '닉네임 설정'}</span><ChevronDown className={accountMenuOpen ? 'account-chevron open' : 'account-chevron'} size={14} />
            </button>
            {accountMenuOpen && <div className="account-dropdown" role="menu">
              <div className="account-dropdown-heading"><span className="profile-avatar"><UserRound size={15} /></span><span><strong>{nickname || '닉네임 설정'}</strong><small>내 계정</small></span></div>
              <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); setProfileModalOpen(true); }}><Pencil size={15} /> 프로필 편집</button>
              <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={15} /> 로그아웃</button>
            </div>}
          </div> : <Link to="/login" className="header-auth-button" onClick={closeMobile}><LogIn size={15} /> 로그인</Link>}</div>
        </div>
      </header>
      <main className="page-container"><Outlet /></main>
      <footer className="site-footer">정처기학습 플랫폼 <span>·</span> 정보처리기사 실기 학습</footer>
      {profileModalOpen && <ProfileEditModal nickname={nickname} onSave={handleNicknameSave} onClose={() => setProfileModalOpen(false)} />}
    </div>
  );
}
