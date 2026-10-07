import { useEffect, useState } from 'react';

export default function NicknameForm({ initialNickname = '', onCheckAvailability, onSave, onCancel, submitLabel = '저장' }) {
  const [nickname, setNickname] = useState(initialNickname);
  const [checkedNickname, setCheckedNickname] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNickname(initialNickname);
    setCheckedNickname('');
    setIsAvailable(null);
  }, [initialNickname]);

  const isValidNickname = (value) => {
    const length = Array.from(value).length;
    return length >= 2 && length <= 12 && /^[가-힣A-Za-z0-9_]+$/.test(value);
  };

  const handleCheckAvailability = async () => {
    const value = nickname.trim();
    if (!isValidNickname(value)) {
      setError('닉네임은 한글, 영문, 숫자, 밑줄만 사용해 2~12자로 입력해주세요.');
      setCheckedNickname('');
      setIsAvailable(null);
      return;
    }

    setError('');
    setIsChecking(true);
    try {
      const { available, error: checkError } = await onCheckAvailability(value);
      if (checkError) throw checkError;
      setCheckedNickname(value);
      setIsAvailable(available);
    } catch (checkError) {
      setCheckedNickname('');
      setIsAvailable(null);
      setError(checkError?.message || '중복 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = nickname.trim();

    if (!isValidNickname(value)) {
      setError('닉네임은 한글, 영문, 숫자, 밑줄만 사용해 2~12자로 입력해주세요.');
      return;
    }
    if (checkedNickname !== value || !isAvailable) {
      setError('닉네임 중복 확인 후 저장할 수 있습니다.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const result = await onSave(value);
      if (result?.error) throw result.error;
    } catch (saveError) {
      setError(saveError?.code === '23505' ? '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.' : saveError?.message || '닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="nickname-form" onSubmit={handleSubmit}>
      <label htmlFor="profile-nickname">닉네임</label>
      <div className="nickname-input-row">
        <input
          id="profile-nickname"
          type="text"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setCheckedNickname('');
            setIsAvailable(null);
            setError('');
          }}
          placeholder="예: 정보처리왕"
          autoComplete="nickname"
          maxLength={12}
          autoFocus
          required
        />
        <button type="button" className="secondary-button nickname-check-button" onClick={handleCheckAvailability} disabled={isChecking || isSaving || !isValidNickname(nickname.trim())}>{isChecking ? '확인 중...' : '중복 확인'}</button>
      </div>
      {checkedNickname === nickname.trim() && isAvailable !== null && <p className={`nickname-check-status ${isAvailable ? 'available' : 'taken'}`} role="status">{isAvailable ? '사용할 수 있는 닉네임입니다.' : '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.'}</p>}
      <p className="nickname-hint">한글·영문·숫자·밑줄을 사용할 수 있어요. 2~12자이며, 중복 확인을 완료해야 저장할 수 있습니다.</p>
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="nickname-form-actions">
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving}>취소</button>}
        <button type="submit" className="primary-button" disabled={isSaving || isChecking || checkedNickname !== nickname.trim() || !isAvailable}>{isSaving ? '저장 중...' : submitLabel}</button>
      </div>
    </form>
  );
}
