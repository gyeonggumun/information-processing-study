import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, BookOpenCheck, ChevronDown, Code2, FileText, Home, ListChecks, Menu, BarChart3, LogIn, LogOut, Pencil, ShieldCheck, Star, UserRound, X } from 'lucide-react';
import { subjects } from '../data/studyData';
import { AUTH_RETURN_TO_KEY, getSafeReturnPath, useAuth } from '../contexts/AuthContext';
import ProfileEditModal from './ProfileEditModal';
import IdleSessionCountdown from './IdleSessionCountdown';
import { appRoleLabels, hasRequiredRole } from '../lib/appRoles';

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
  const { user, isLoading, isLoggedIn, hasNickname, nickname, appRole, idleSessionStore, idleLogoutNotice, dismissIdleLogoutNotice, singleSessionNotice, dismissSingleSessionNotice, accountRestored, dismissAccountRestored, logout, checkNicknameAvailability, updateNickname, deleteAccount } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (isLoggedIn) return;
    setAccountMenuOpen(false);
    setProfileModalOpen(false);
  }, [isLoggedIn]);

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

  const handleAccountDelete = () => deleteAccount();

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
          </nav>
          <div className="header-auth">{isLoggedIn && idleSessionStore && <IdleSessionCountdown store={idleSessionStore} />}{isLoggedIn ? <div className="account-menu" ref={accountRef}>
            <button ref={accountButtonRef} type="button" className="header-auth-button profile-trigger" aria-expanded={accountMenuOpen} aria-haspopup="menu" onClick={() => setAccountMenuOpen((open) => !open)}>
              <span className="profile-avatar"><UserRound size={15} /></span><span className="profile-trigger-name">{nickname || '닉네임 설정'}</span><ChevronDown className={accountMenuOpen ? 'account-chevron open' : 'account-chevron'} size={14} />
            </button>
            {accountMenuOpen && <div className="account-dropdown" role="menu">
              <div className="account-dropdown-heading"><span className="profile-avatar"><UserRound size={15} /></span><span><strong>{nickname || '닉네임 설정'}</strong><small>{appRoleLabels[appRole] ?? appRoleLabels.user}</small></span></div>
              {appRole === 'admin' && <Link to="/admin" role="menuitem" onClick={() => { setAccountMenuOpen(false); closeMobile(); }}><ShieldCheck size={15} /> 관리 페이지</Link>}
              {hasRequiredRole(appRole, 'pro') && <Link to="/exam-summary" role="menuitem" onClick={() => { setAccountMenuOpen(false); closeMobile(); }}><BookOpenCheck size={15} /> 실기 요약</Link>}
              <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); setProfileModalOpen(true); }}><Pencil size={15} /> 프로필 편집</button>
              <Link to="/favorites" role="menuitem" onClick={() => { setAccountMenuOpen(false); closeMobile(); }}><Star size={15} /> 즐겨찾기</Link>
              <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={15} /> 로그아웃</button>
            </div>}
          </div> : <Link to="/login" className="header-auth-button" onClick={closeMobile}><LogIn size={15} /> 로그인</Link>}</div>
        </div>
      </header>
      <main className="page-container">
        {idleLogoutNotice && <div className="account-restored-notice idle-logout-notice" role="status"><span>1시간 동안 활동이 없어 자동 로그아웃되었습니다. 계속 학습하려면 다시 로그인해주세요.</span><button type="button" onClick={dismissIdleLogoutNotice} aria-label="자동 로그아웃 안내 닫기"><X size={16} /></button></div>}
        {singleSessionNotice && <div className="account-restored-notice idle-logout-notice" role="status"><span>{singleSessionNotice === 'replaced' ? '다른 기기 또는 브라우저에서 같은 계정으로 로그인하여 현재 접속이 종료되었습니다.' : '접속 상태를 확인하지 못해 로그아웃했습니다. 연결을 확인한 뒤 다시 로그인해주세요.'}</span><button type="button" onClick={dismissSingleSessionNotice} aria-label="접속 종료 안내 닫기"><X size={16} /></button></div>}
        {accountRestored && <div className="account-restored-notice" role="status"><span>탈퇴 예약이 취소되어 기존 계정과 학습 데이터를 정상적으로 이용할 수 있습니다.</span><button type="button" onClick={dismissAccountRestored} aria-label="안내 닫기"><X size={16} /></button></div>}
        <Outlet />
      </main>
      <footer className="site-footer">정처기학습 플랫폼 <span>·</span> 정보처리기사 실기 학습</footer>
      {isLoggedIn && profileModalOpen && <ProfileEditModal email={user?.email} nickname={nickname} onCheckAvailability={checkNicknameAvailability} onSave={handleNicknameSave} onDeleteAccount={handleAccountDelete} onClose={() => setProfileModalOpen(false)} />}
    </div>
  );
}
