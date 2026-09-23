import { useState } from 'react';
import { ArrowRight, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isLoggedIn, isLoading, login, signUp, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = location.state?.from?.pathname || '/study';
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isLoading && isLoggedIn) return <Navigate to={redirectPath} replace />;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const { data, error: authError } = mode === 'login' ? await login(email, password) : await signUp(email, password);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === 'signup' && !data.session) {
      setNotice('인증 메일을 보냈습니다. 메일 인증을 완료한 뒤 로그인해주세요.');
      return;
    }
    navigate(redirectPath, { replace: true });
  };

  const handleGoogleLogin = async () => {
    setError('');
    setNotice('');
    setIsGoogleLoading(true);
    const { error: authError } = await loginWithGoogle();
    if (authError) {
      setError(authError.message);
      setIsGoogleLoading(false);
    }
  };

  return <div className="login-page"><section className="login-card"><div className="login-icon"><LockKeyhole size={24} /></div><p className="eyebrow">MEMBERS ONLY</p><h1>{mode === 'login' ? <>학습을 시작하려면<br />로그인해주세요.</> : <>계정을 만들고<br />학습을 시작하세요.</>}</h1><p>자료 학습, 기출문제 풀이, 코드 연습과 통계는 계정별로 안전하게 저장됩니다.</p><div className="login-mode-switch" role="tablist"><button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>로그인</button><button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>회원가입</button></div><button type="button" className="google-login-button" onClick={handleGoogleLogin} disabled={isGoogleLoading}><span aria-hidden="true">G</span>{isGoogleLoading ? 'Google로 이동 중...' : 'Google로 로그인 또는 회원가입'}</button><div className="login-divider" aria-hidden="true"><span />또는<span /></div><form className="login-form" onSubmit={handleSubmit}><label htmlFor="email"><Mail size={15} /> 이메일</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@email.com" autoComplete="email" required /><label htmlFor="password"><KeyRound size={15} /> 비밀번호</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상 비밀번호" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required />{error && <p className="login-error" role="alert">{error}</p>}{notice && <p className="login-notice" role="status">{notice}</p>}<button type="submit" className="primary-button">{mode === 'login' ? '로그인하고 학습 시작' : '회원가입하고 학습 시작'} <ArrowRight size={15} /></button></form><p className="login-note">이메일과 학습 기록은 Supabase에 저장되며, 본인 계정의 기록만 조회할 수 있습니다.</p><Link className="text-link" to="/">홈으로 돌아가기 <ArrowRight size={14} /></Link></section></div>;
}
