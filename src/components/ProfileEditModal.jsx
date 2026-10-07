import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import NicknameForm from './NicknameForm';

export default function ProfileEditModal({ email, nickname, onCheckAvailability, onSave, onDeleteAccount, onClose }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || isDeleting) return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
        setDeleteError('');
      } else {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmingDelete, isDeleting, onClose]);

  const startDeleteConfirmation = () => {
    setDeletePhrase('');
    setDeleteError('');
    setConfirmingDelete(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const { error } = await onDeleteAccount();
      if (error) throw error;
    } catch {
      setDeleteError('회원 탈퇴를 완료하지 못했습니다. 로그인 상태와 네트워크를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !confirmingDelete && onClose()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        {!confirmingDelete && <button type="button" className="profile-modal-close" onClick={onClose} aria-label="프로필 편집 닫기"><X size={18} /></button>}
        <p className="eyebrow">PROFILE</p>
        <h2 id="profile-modal-title">{confirmingDelete ? '회원 탈퇴 확인' : '프로필 편집'}</h2>
        {confirmingDelete ? (
          <div className="profile-delete-confirm">
            <p>탈퇴하면 계정과 함께 저장된 즐겨찾기, 풀이 기록, 통계가 영구 삭제되며 복구할 수 없습니다.</p>
            <label htmlFor="delete-confirm-phrase">계속하려면 <strong>탈퇴</strong>를 입력하세요.</label>
            <input id="delete-confirm-phrase" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} autoComplete="off" autoFocus />
            {deleteError && <p className="profile-delete-error" role="alert">{deleteError}</p>}
            <div className="profile-delete-actions">
              <button type="button" className="secondary-button" disabled={isDeleting} onClick={() => setConfirmingDelete(false)}>취소</button>
              <button type="button" className="danger-button" disabled={deletePhrase !== '탈퇴' || isDeleting} onClick={handleDelete}>{isDeleting ? '탈퇴 처리 중…' : '계정 영구 삭제'}</button>
            </div>
          </div>
        ) : (
          <>
            <p className="profile-modal-description">가입할 때 사용한 이메일은 확인만 가능하며, 닉네임은 중복 확인 후 변경할 수 있습니다.</p>
            <label className="profile-readonly-field" htmlFor="profile-email">이메일</label>
            <input id="profile-email" className="profile-readonly-input" type="email" value={email ?? ''} readOnly aria-readonly="true" />
            <NicknameForm initialNickname={nickname} onCheckAvailability={onCheckAvailability} onSave={onSave} onCancel={onClose} />
            <div className="profile-account-section">
              <h3>비밀번호 변경</h3>
              <p>Google 계정으로 로그인하므로 비밀번호는 Google에서 관리됩니다. 이 사이트에서는 비밀번호를 직접 변경할 수 없습니다.</p>
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google 계정 보안 설정</a>
            </div>
            <div className="profile-danger-zone">
              <div><h3>회원 탈퇴</h3><p>계정과 학습 데이터가 영구 삭제됩니다.</p></div>
              <button type="button" className="danger-button" onClick={startDeleteConfirmation}>회원 탈퇴</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
