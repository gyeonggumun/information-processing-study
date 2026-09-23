import { useState } from 'react';
import { ArrowRight, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { demoAccount, isLoggedIn, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = location.state?.from?.pathname || '/study';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isLoggedIn) return <Navigate to={redirectPath} replace />;

  const fillDemoAccount = () => {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login({ email, password });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(redirectPath, { replace: true });
  };

  return <div className="login-page"><section className="login-card"><div className="login-icon"><LockKeyhole size={24} /></div><p className="eyebrow">MEMBERS ONLY</p><h1>학습을 시작하려면<br />로그인해주세요.</h1><p>자료 학습, 기출문제 풀이, 코드 연습과 통계는 로그인 후 이용할 수 있습니다.</p><form className="login-form" onSubmit={handleSubmit}><label htmlFor="email"><Mail size={15} /> 이메일</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="study@jeongcheogi.dev" autoComplete="email" required /><label htmlFor="password"><KeyRound size={15} /> 비밀번호</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" autoComplete="current-password" required />{error && <p className="login-error" role="alert">{error}</p>}<button type="submit" className="primary-button">로그인하고 학습 시작 <ArrowRight size={15} /></button></form><div className="demo-account"><div><strong>체험 계정</strong><span>{demoAccount.email} · {demoAccount.password}</span></div><button type="button" onClick={fillDemoAccount}>체험 계정 입력</button></div><p className="login-note">현재는 화면 흐름 검증용 로컬 로그인입니다. 실제 서비스 전에는 서버 인증을 연결해야 합니다.</p><Link className="text-link" to="/">홈으로 돌아가기 <ArrowRight size={14} /></Link></section></div>;
}
