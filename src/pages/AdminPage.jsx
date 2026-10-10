import { useEffect, useRef, useState } from 'react';
import { Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

function formatDate(value) {
  return value ? new Date(value).toLocaleString('ko-KR') : '기록 없음';
}

export default function AdminPage() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError('');
    setAccounts([]);
    setNextCursor(null);
    setIsLoadingMore(false);

    supabase.rpc('list_managed_users', { p_search: search }).then(({ data, error }) => {
      if (requestIdRef.current !== requestId) return;
      if (error) {
        setLoadError('사용자 목록을 불러오지 못했습니다. 다시 시도해 주세요.');
      } else {
        const page = (data ?? []).slice(0, PAGE_SIZE);
        setAccounts(page);
        setNextCursor((data?.length ?? 0) > PAGE_SIZE ? page.at(-1) : null);
      }
      setIsLoading(false);
    });

    return () => { requestIdRef.current += 1; };
  }, [search, refreshKey]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    const { data, error } = await supabase.rpc('list_managed_users', {
      p_search: search,
      p_before_created_at: nextCursor.created_at,
      p_before_user_id: nextCursor.user_id,
    });
    if (requestIdRef.current !== requestId) return;
    if (error) {
      setLoadError('다음 사용자 목록을 불러오지 못했습니다. 다시 시도해 주세요.');
    } else {
      const page = (data ?? []).slice(0, PAGE_SIZE);
      setAccounts((current) => [...current, ...page]);
      setNextCursor((data?.length ?? 0) > PAGE_SIZE ? page.at(-1) : null);
      setLoadError('');
    }
    setIsLoadingMore(false);
  };

  const openDelete = (account) => {
    setSelectedAccount(account);
    setConfirmation('');
    setDeleteError('');
  };

  const deleteAccount = async () => {
    if (!selectedAccount || isDeleting || confirmation.trim().toLowerCase() !== selectedAccount.email?.toLowerCase()) return;
    setIsDeleting(true);
    setDeleteError('');
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId: selectedAccount.user_id, confirmEmail: confirmation.trim() },
    });
    if (error || !data?.success) {
      const response = await error?.context?.json?.().catch(() => null);
      setDeleteError(response?.error ?? data?.error ?? '계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsDeleting(false);
      return;
    }
    setSelectedAccount(null);
    setIsDeleting(false);
    setNotice('계정과 학습 데이터가 영구 삭제되었습니다.');
    setRefreshKey((current) => current + 1);
  };

  return <div className="subpage admin-page">
    <div className="subpage-header"><div><p className="eyebrow">ADMINISTRATION</p><h1>사용자 관리</h1><p>가입 계정을 검색하고 최근 활동과 탈퇴 상태를 확인합니다.</p></div><ShieldCheck className="header-line-icon" size={42} /></div>
    <form className="admin-search panel" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setRefreshKey((current) => current + 1); }}>
      <label htmlFor="admin-user-search">이메일 또는 닉네임 검색</label>
      <div><input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="사용자 이메일 또는 닉네임" /><button type="submit" className="primary-button"><Search size={16} /> 검색</button></div>
    </form>
    {notice && <p className="account-restored-notice" role="status">{notice}</p>}
    {loadError && <p className="save-error" role="alert">{loadError}</p>}
    <section className="admin-users panel" aria-label="사용자 목록">
      <div className="admin-users-heading"><div><Users size={18} /><h2>가입 사용자</h2></div><span>{isLoading ? '불러오는 중' : `${accounts.length}명 표시`}</span></div>
      {isLoading ? <p className="admin-empty">사용자 목록을 불러오고 있습니다.</p> : accounts.length === 0 ? <p className="admin-empty">조건에 맞는 사용자가 없습니다.</p> : <div className="admin-user-list">{accounts.map((account) => <article className="admin-user-row" key={account.user_id}>
        <div className="admin-user-identity"><strong>{account.email || '이메일 없음'}</strong><span>{account.nickname || '닉네임 미설정'} · {account.user_id === user?.id ? '관리자' : '일반 사용자'}</span></div>
        <div className="admin-user-dates"><span>가입 {formatDate(account.created_at)}</span><span>최근 활동 {formatDate(account.last_active_at)}</span></div>
        <span className={account.deletion_scheduled_for ? 'admin-user-status pending' : 'admin-user-status'}>{account.deletion_scheduled_for ? '탈퇴 예약' : '정상'}</span>
        <button type="button" className="danger-button" onClick={() => openDelete(account)} disabled={account.user_id === user?.id || !account.email} aria-label={`${account.email || '사용자'} 계정 삭제`}><Trash2 size={14} /> 삭제</button>
      </article>)}</div>}
      {nextCursor && <button type="button" className="admin-load-more" onClick={loadMore} disabled={isLoadingMore}>{isLoadingMore ? '불러오는 중…' : '더 보기'}</button>}
    </section>
    <div className="notice-panel"><ShieldCheck size={19} /><span>계정 삭제는 즉시 영구 적용됩니다. 삭제된 사용자가 Google로 다시 로그인하면 새 계정이 만들어질 수 있습니다.</span></div>
    {selectedAccount && <div className="study-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setSelectedAccount(null); }}>
      <section className="study-modal admin-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-delete-title">
        <button type="button" className="study-modal-close" onClick={() => setSelectedAccount(null)} disabled={isDeleting} aria-label="닫기"><X size={19} /></button>
        <h2 id="admin-delete-title">계정을 영구 삭제할까요?</h2>
        <p><strong>{selectedAccount.email}</strong> 계정과 저장된 학습 데이터가 즉시 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
        <label htmlFor="admin-confirm-email">확인을 위해 이메일을 그대로 입력하세요.</label>
        <input id="admin-confirm-email" type="email" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
        {deleteError && <p className="save-error" role="alert">{deleteError}</p>}
        <div className="admin-delete-actions"><button type="button" onClick={() => setSelectedAccount(null)} disabled={isDeleting}>취소</button><button type="button" className="danger-button" onClick={deleteAccount} disabled={isDeleting || confirmation.trim().toLowerCase() !== selectedAccount.email?.toLowerCase()}>{isDeleting ? '삭제 중…' : '영구 삭제'}</button></div>
      </section>
    </div>}
  </div>;
}
