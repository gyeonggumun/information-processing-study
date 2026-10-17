import { useEffect, useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resetManagedUserPractice } from '../lib/adminPracticeReset';

export default function AdminPracticeResetDialog({ account, onClose, onComplete }) {
  const dialogRef = useRef(null);
  const pendingRef = useRef(false);
  const mountedRef = useRef(false);
  const [confirmation, setConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const canConfirm = Boolean(account.email && confirmation.trim().toLowerCase() === account.email.toLowerCase());

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      mountedRef.current = false;
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const reset = async (event) => {
    event.preventDefault();
    if (!canConfirm || pendingRef.current) return;
    pendingRef.current = true;
    setIsResetting(true);
    setError('');
    try {
      const result = await resetManagedUserPractice(supabase, account, confirmation);
      if (mountedRef.current) onComplete(result);
    } catch (failure) {
      if (mountedRef.current) setError(failure.message || '풀이 상태를 초기화하지 못했습니다. 다시 시도해주세요.');
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setIsResetting(false);
    }
  };

  return <dialog ref={dialogRef} className="study-modal admin-delete-dialog admin-practice-reset-dialog" aria-labelledby="admin-practice-reset-title" aria-describedby="admin-practice-reset-description" onCancel={(event) => { event.preventDefault(); if (!pendingRef.current) onClose(); }}>
    <button type="button" className="study-modal-close" onClick={onClose} disabled={isResetting} aria-label="풀이 초기화 창 닫기"><X size={19} /></button>
    <h2 id="admin-practice-reset-title">풀이 상태를 초기화할까요?</h2>
    <p id="admin-practice-reset-description"><strong>{account.nickname || '닉네임 미설정'} ({account.email})</strong>님의 기출문제·C·Java·Python·SQL 풀이 기록, 통계, 오답노트가 모두 초기화됩니다. 풀었던 문제도 다시 출제되며, 삭제된 기록은 복구할 수 없습니다.</p>
    <p>계정·권한·즐겨찾기·실기 요약 설정은 유지됩니다. 대상 사용자는 새로고침 후 확인할 수 있습니다.</p>
    <form onSubmit={reset}>
      <label htmlFor="admin-reset-confirm-email">확인을 위해 대상 이메일을 그대로 입력하세요.</label>
      <input id="admin-reset-confirm-email" type="email" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isResetting} autoComplete="off" autoFocus />
      {error && <p className="save-error" role="alert">{error}</p>}
      <div className="admin-delete-actions"><button type="button" onClick={onClose} disabled={isResetting}>취소</button><button type="submit" className="danger-button" disabled={!canConfirm || isResetting}><RotateCcw size={14} /> {isResetting ? '초기화 중…' : '풀이 상태 초기화'}</button></div>
      {isResetting && <p role="status">풀이 기록을 초기화하고 있습니다. 잠시 기다려주세요.</p>}
    </form>
  </dialog>;
}
