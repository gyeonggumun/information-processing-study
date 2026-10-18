import { Navigate, useLocation } from 'react-router-dom';
import { getSafeReturnPath, useAuth } from '../contexts/AuthContext';
import { hasRequiredRole } from '../lib/appRoles';

export default function ProtectedRoute({ children, requiredRole, accessDeniedElement }) {
  const { isLoading, isLoggedIn, hasNickname, appRole } = useAuth();
  const location = useLocation();
  const returnTo = getSafeReturnPath(`${location.pathname}${location.search}${location.hash}`);

  if (isLoading) return <div className="auth-loading">로그인 상태를 확인하고 있습니다.</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!hasNickname) return <Navigate to="/profile/setup" replace state={{ from: { pathname: returnTo } }} />;
  if (!hasRequiredRole(appRole, requiredRole)) return accessDeniedElement ?? <Navigate to="/" replace />;
  return children;
}
