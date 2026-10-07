import { useEffect } from 'react';
import { X } from 'lucide-react';
import NicknameForm from './NicknameForm';

export default function ProfileEditModal({ nickname, onCheckAvailability, onSave, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="profile-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <button type="button" className="profile-modal-close" onClick={onClose} aria-label="프로필 편집 닫기"><X size={18} /></button>
        <p className="eyebrow">PROFILE</p>
        <h2 id="profile-modal-title">프로필 편집</h2>
        <p className="profile-modal-description">학습 화면에 표시할 닉네임을 변경합니다.</p>
        <NicknameForm initialNickname={nickname} onCheckAvailability={onCheckAvailability} onSave={onSave} onCancel={onClose} />
      </section>
    </div>
  );
}
