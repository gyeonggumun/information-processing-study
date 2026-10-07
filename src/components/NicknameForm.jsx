import { useEffect, useState } from 'react';

export default function NicknameForm({ initialNickname = '', onSave, onCancel, submitLabel = '저장' }) {
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setNickname(initialNickname), [initialNickname]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = nickname.trim();
    const length = Array.from(value).length;

    if (length < 2 || length > 12 || !/^[가-힣A-Za-z0-9_]+$/.test(value)) {
      setError('닉네임은 한글, 영문, 숫자, 밑줄만 사용해 2~12자로 입력해주세요.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const result = await onSave(value);
      if (result?.error) throw result.error;
    } catch (saveError) {
      setError(saveError?.message || '닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="nickname-form" onSubmit={handleSubmit}>
      <label htmlFor="profile-nickname">닉네임</label>
      <input
        id="profile-nickname"
        type="text"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder="예: 정보처리왕"
        autoComplete="nickname"
        maxLength={12}
        autoFocus
        required
      />
      <p className="nickname-hint">한글·영문·숫자·밑줄을 사용할 수 있어요. 2~12자이며, 중복 닉네임도 사용할 수 있습니다.</p>
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="nickname-form-actions">
        {onCancel && <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving}>취소</button>}
        <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? '저장 중...' : submitLabel}</button>
      </div>
    </form>
  );
}
