import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import NicknameForm from './NicknameForm';

export default function ProfileEditModal({ email, nickname, onCheckAvailability, onSave, onDeleteAccount, onClose }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionScheduledFor, setDeletionScheduledFor] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || isDeleting) return;
      if (deletionScheduledFor) {
        onClose();
        return;
      }
      if (confirmingDelete) {
        setConfirmingDelete(false);
        setDeleteError('');
      } else {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmingDelete, deletionScheduledFor, isDeleting, onClose]);

  const startDeleteConfirmation = () => {
    setDeletePhrase('');
    setDeleteError('');
    setConfirmingDelete(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const { error, scheduledFor } = await onDeleteAccount();
      if (error) throw error;
      if (!scheduledFor) throw new Error('탈퇴 예약일을 확인할 수 없습니다.');
      setDeletionScheduledFor(scheduledFor);
    } catch {
      setDeleteError('탈퇴 예약을 완료하지 못했습니다. 로그인 상태와 네트워크를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !confirmingDelete && onClose()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        {!confirmingDelete && <button type="button" className="profile-modal-close" onClick={onClose} aria-label="프로필 편집 닫기"><X size={18} /></button>}
        <p className="eyebrow">PROFILE</p>
        <h2 id="profile-modal-title">{deletionScheduledFor ? '탈퇴 예약 완료' : confirmingDelete ? '회원 탈퇴 확인' : '프로필 편집'}</h2>
        {deletionScheduledFor ? (
          <div className="profile-delete-confirm" role="status">
            <p className="profile-delete-success">회원 탈퇴가 예약됐습니다. 계정과 학습 데이터는 {new Date(deletionScheduledFor).toLocaleString('ko-KR')} 이후 영구 삭제됩니다.</p>
            <p className="profile-delete-recovery">그 전에 Google 계정으로 다시 로그인하면 탈퇴 예약이 자동 취소되어 기존 계정과 학습 데이터를 정상적으로 이용할 수 있습니다.</p>
            <div className="profile-delete-actions"><button type="button" className="primary-button" onClick={onClose}>확인</button></div>
          </div>
        ) : confirmingDelete ? (
          <div className="profile-delete-confirm">
            <p>탈퇴를 신청하면 즉시 로그아웃됩니다. 7일 동안 로그인하지 않으면 계정과 저장된 즐겨찾기, 풀이 기록, 통계가 영구 삭제됩니다.</p>
            <p className="profile-delete-recovery">7일 이내에 Google 계정으로 다시 로그인하면 탈퇴 예약이 취소되고 기존 데이터로 정상 활동할 수 있습니다.</p>
            <label htmlFor="delete-confirm-phrase">계속하려면 <strong>탈퇴</strong>를 입력하세요.</label>
            <input id="delete-confirm-phrase" value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} autoComplete="off" autoFocus />
            {deleteError && <p className="profile-delete-error" role="alert">{deleteError}</p>}
            <div className="profile-delete-actions">
              <button type="button" className="secondary-button" disabled={isDeleting} onClick={() => setConfirmingDelete(false)}>취소</button>
              <button type="button" className="danger-button" disabled={deletePhrase !== '탈퇴' || isDeleting} onClick={handleDelete}>{isDeleting ? '탈퇴 예약 중…' : '7일 후 영구 삭제 예약'}</button>
            </div>
          </div>
        ) : (
          <>
            <p className="profile-modal-description">가입할 때 사용한 이메일은 확인만 가능하며, 닉네임은 중복 확인 후 변경할 수 있습니다.</p>
            <p className="profile-modal-description">90일 동안 사이트에 접속하지 않으면 계정과 학습 데이터가 자동 삭제됩니다. 기존 계정은 정책 적용일부터 90일을 계산합니다.</p>
            <label className="profile-readonly-field" htmlFor="profile-email">이메일</label>
            <input id="profile-email" className="profile-readonly-input" type="email" value={email ?? ''} readOnly aria-readonly="true" />
            <NicknameForm initialNickname={nickname} onCheckAvailability={onCheckAvailability} onSave={onSave} onCancel={onClose} />
            <div className="profile-account-section">
              <h3>비밀번호 변경</h3>
              <p>Google 계정으로 로그인하므로 비밀번호는 Google에서 관리됩니다. 이 사이트에서는 비밀번호를 직접 변경할 수 없습니다.</p>
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google 계정 보안 설정</a>
            </div>
            <div className="profile-danger-zone">
              <div><h3>회원 탈퇴</h3><p>7일 유예 기간 후 계정과 학습 데이터가 영구 삭제됩니다.</p></div>
              <button type="button" className="danger-button" onClick={startDeleteConfirmation}>회원 탈퇴</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
