import { Navigate, useLocation } from 'react-router-dom';
import { getSafeReturnPath, useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoading, isLoggedIn, hasNickname } = useAuth();
  const location = useLocation();
  const returnTo = getSafeReturnPath(`${location.pathname}${location.search}${location.hash}`);

  if (isLoading) return <div className="auth-loading">로그인 상태를 확인하고 있습니다.</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!hasNickname) return <Navigate to="/profile/setup" replace state={{ from: { pathname: returnTo } }} />;
  return children;
}
