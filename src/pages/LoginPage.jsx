import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { getSafeReturnPath, useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isLoggedIn, isLoading, hasNickname, loginWithGoogle } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const returnPath = typeof from === 'string' ? from : `${from?.pathname ?? ''}${from?.search ?? ''}${from?.hash ?? ''}`;
  const redirectPath = getSafeReturnPath(returnPath || '/study');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isLoading && isLoggedIn) return <Navigate to={hasNickname ? redirectPath : '/profile/setup'} replace state={{ from: { pathname: redirectPath } }} />;

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    const { error: authError } = await loginWithGoogle(redirectPath);
    if (authError) {
      setError(authError.message);
      setIsGoogleLoading(false);
    }
  };

  return <div className="login-page"><section className="login-card"><div className="login-icon"><LockKeyhole size={24} /></div><p className="eyebrow">MEMBERS ONLY</p><h1>학습을 시작하려면<br />로그인해주세요.</h1><p>자료 학습, 기출문제 풀이, 코드 연습과 통계를 저장하려면 Google 계정으로 로그인해주세요.</p><button type="button" className="google-login-button" onClick={handleGoogleLogin} disabled={isGoogleLoading}><span aria-hidden="true">G</span>{isGoogleLoading ? 'Google로 이동 중...' : 'Google로 로그인 또는 회원가입'}</button>{error && <p className="login-error" role="alert">{error}</p>}<p className="login-note">처음 Google 로그인 후 사용할 닉네임을 설정합니다.</p><Link className="text-link" to="/">홈으로 돌아가기 <ArrowRight size={14} /></Link></section></div>;
}
