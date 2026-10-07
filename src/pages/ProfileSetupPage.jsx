import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import NicknameForm from '../components/NicknameForm';
import { getSafeReturnPath, useAuth } from '../contexts/AuthContext';

function getReturnPath(from) {
  if (typeof from === 'string') return getSafeReturnPath(from);
  if (!from) return '/study';
  return getSafeReturnPath(`${from.pathname ?? ''}${from.search ?? ''}${from.hash ?? ''}`);
}

export default function ProfileSetupPage() {
  const { isLoading, isLoggedIn, hasNickname, nickname, checkNicknameAvailability, updateNickname } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = getReturnPath(location.state?.from);

  if (isLoading) return <div className="auth-loading">계정 정보를 불러오고 있습니다.</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: { pathname: returnPath } }} />;
  if (hasNickname) return <Navigate to={returnPath} replace />;

  const handleSave = async (nextNickname) => {
    const { error } = await updateNickname(nextNickname);
    if (error) throw error;
    navigate(returnPath, { replace: true });
  };

  return (
    <div className="profile-setup-page">
      <section className="profile-setup-card" aria-labelledby="profile-setup-title">
        <p className="eyebrow">ACCOUNT SETUP</p>
        <h1 id="profile-setup-title">사용할 닉네임을 정해주세요.</h1>
        <p>상단 메뉴와 학습 기록에 표시할 이름입니다. 나중에 프로필 메뉴에서 언제든 바꿀 수 있어요.</p>
        <NicknameForm initialNickname={nickname} onCheckAvailability={checkNicknameAvailability} onSave={handleSave} submitLabel="닉네임 저장하고 시작하기" />
      </section>
    </div>
  );
}
