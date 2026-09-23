import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="auth-loading">로그인 상태를 확인하고 있습니다.</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
