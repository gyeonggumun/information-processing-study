import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { appRoleLabels } from '../lib/appRoles';
import { ADMIN_PAGE_SIZE, parseManagedUsersPage } from '../lib/adminPagination';
import AdminNavigation from '../components/AdminNavigation';

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
  const [pageCursors, setPageCursors] = useState([null]);
  const [roleCounts, setRoleCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const roleUpdatePending = useRef(false);
  const requestIdRef = useRef(0);
  const pageCursor = pageCursors.at(-1);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError('');
    setAccounts([]);
    setNextCursor(null);
    setRoleCounts(null);

    const loadPage = async () => {
      try {
        const { data, error } = await supabase.rpc('get_managed_users_page', {
          p_search: search,
          p_before_created_at: pageCursor?.created_at ?? null,
          p_before_user_id: pageCursor?.user_id ?? null,
        });
        if (requestIdRef.current !== requestId) return;
        if (error) throw error;
        const page = parseManagedUsersPage(data);
        setRoleCounts(page.counts);
        // Deleting the final account on a page returns to the preceding page.
        if (!page.accounts.length && pageCursor) {
          setPageCursors((current) => current.slice(0, -1));
          return;
        }
        setAccounts(page.accounts);
        setNextCursor(page.nextCursor);
      } catch {
        if (requestIdRef.current === requestId) setLoadError('계정 목록과 권한별 인원을 불러오지 못했습니다. 다시 불러와 주세요.');
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    };
    void loadPage();

    return () => { requestIdRef.current += 1; };
  }, [search, pageCursor, refreshKey]);

  const changePage = (direction) => {
    if (isLoading || roleUpdatePending.current || isDeleting) return;
    if (direction === 'next' && !nextCursor) return;
    if (direction === 'previous' && pageCursors.length === 1) return;
    setIsLoading(true);
    setPageCursors((current) => direction === 'next' ? [...current, nextCursor] : current.slice(0, -1));
  };

  const openDelete = (account) => {
    setSelectedAccount(account);
    setConfirmation('');
    setDeleteError('');
  };

  const updateRole = async (account) => {
    if (roleUpdatePending.current || account.user_id === user?.id || account.app_role === 'admin') return;
    const nextRole = account.app_role === 'pro' ? 'user' : 'pro';
    const requestId = requestIdRef.current;
    roleUpdatePending.current = true;
    setUpdatingRoleId(account.user_id);
    setNotice('');
    setLoadError('');
    try {
      const { data, error } = await supabase.rpc('set_managed_user_role', { p_user_id: account.user_id, p_role: nextRole });
      if (error || data !== nextRole) throw new Error('Role update failed');
      if (requestIdRef.current !== requestId) return;
      setNotice(`${account.nickname || account.email}님의 권한을 ${appRoleLabels[data]}(으)로 변경했습니다. 대상 계정은 새로고침하면 반영됩니다.`);
      setRefreshKey((current) => current + 1);
    } catch {
      if (requestIdRef.current === requestId) setLoadError('권한을 변경하지 못했습니다. 권한과 접속 상태를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      roleUpdatePending.current = false;
      setUpdatingRoleId(null);
    }
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
    <AdminNavigation />
    <section className="admin-role-summary" aria-label="권한별 전체 계정 수" aria-live="polite">
      <p>전체 계정 기준 · 검색 결과와 관계없이 집계합니다.</p>
      <div className="admin-role-stats">{[['total', '전체 계정'], ['user', 'User'], ['pro', 'Pro'], ['admin', 'Admin']].map(([key, label]) => <div className="admin-role-stat panel" key={key}><span>{label}</span><strong>{isLoading ? '…' : roleCounts?.[key]?.toLocaleString('ko-KR') ?? '—'}<small>명</small></strong></div>)}</div>
    </section>
    <form className="admin-search panel" onSubmit={(event) => { event.preventDefault(); if (roleUpdatePending.current || isDeleting) return; setPageCursors([null]); setSearch(searchInput.trim()); setRefreshKey((current) => current + 1); }}>
      <label htmlFor="admin-user-search">이메일 또는 닉네임 검색</label>
      <div><input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={100} placeholder="사용자 이메일 또는 닉네임" /><button type="submit" className="primary-button" disabled={Boolean(updatingRoleId) || isDeleting}><Search size={16} /> 검색</button></div>
    </form>
    {notice && <p className="account-restored-notice" role="status">{notice}</p>}
    {loadError && <p className="save-error" role="alert">{loadError}</p>}
    {loadError && <button type="button" className="secondary-button" onClick={() => setRefreshKey((current) => current + 1)} disabled={isLoading}>다시 불러오기</button>}
    <section className="admin-users panel" aria-label="사용자 목록">
      <div className="admin-users-heading"><div><Users size={18} /><h2>가입 사용자</h2></div><span>{isLoading ? '불러오는 중' : `${pageCursors.length}페이지 · ${accounts.length}명 표시`}</span></div>
      {isLoading ? <p className="admin-empty">사용자 목록을 불러오고 있습니다.</p> : accounts.length === 0 ? <p className="admin-empty">조건에 맞는 사용자가 없습니다.</p> : <div className="admin-user-list">{accounts.map((account) => <article className="admin-user-row" key={account.user_id}>
        <div className="admin-user-identity"><strong>{account.email || '이메일 없음'}</strong><span>{account.nickname || '닉네임 미설정'} · {appRoleLabels[account.app_role] ?? appRoleLabels.user}</span>{account.app_role !== 'admin' && account.user_id !== user?.id && <button type="button" className="secondary-button admin-role-button" onClick={() => updateRole(account)} disabled={Boolean(updatingRoleId) || isDeleting} aria-label={`${account.email || '사용자'} ${account.app_role === 'pro' ? 'User' : 'Pro'} 권한으로 변경`}>{updatingRoleId === account.user_id ? '변경 중…' : account.app_role === 'pro' ? 'User로 변경' : 'Pro로 변경'}</button>}</div>
        <div className="admin-user-dates"><span>가입 {formatDate(account.created_at)}</span><span>최근 활동 {formatDate(account.last_active_at)}</span></div>
        <span className={account.deletion_scheduled_for ? 'admin-user-status pending' : 'admin-user-status'}>{account.deletion_scheduled_for ? '탈퇴 예약' : '정상'}</span>
        <button type="button" className="danger-button" onClick={() => openDelete(account)} disabled={account.app_role === 'admin' || account.user_id === user?.id || !account.email || Boolean(updatingRoleId)} aria-label={`${account.email || '사용자'} 계정 삭제`}><Trash2 size={14} /> 삭제</button>
      </article>)}</div>}
      <nav className="admin-pagination" aria-label="계정 목록 페이지 이동">
        <button type="button" onClick={() => changePage('previous')} disabled={isLoading || Boolean(updatingRoleId) || isDeleting || pageCursors.length === 1} aria-label="이전 페이지"><ChevronLeft size={16} /> 이전</button>
        <span aria-current="page">{pageCursors.length}페이지</span>
        <button type="button" onClick={() => changePage('next')} disabled={isLoading || Boolean(updatingRoleId) || isDeleting || !nextCursor} aria-label="다음 페이지">다음 <ChevronRight size={16} /></button>
      </nav>
      <p className="admin-page-size">한 페이지에 최대 {ADMIN_PAGE_SIZE}명씩 표시합니다.</p>
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
