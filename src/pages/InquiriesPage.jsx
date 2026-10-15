import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useInquiries } from '../hooks/useInquiries';
import { inquiryCategories, inquiryStatuses, inquiryError, validateInquiry } from '../lib/supportInquiries';
import AdminNavigation from '../components/AdminNavigation';

const formatDate = value => new Date(value).toLocaleString('ko-KR');

function InquiryForm({ userId, onCreated }) {
  const [category, setCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const request = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const validation = validateInquiry({ category, title, body });
    if (validation) { setError(validation); return; }
    const payload = { p_category: category, p_title: title.trim(), p_body: body.trim() };
    const signature = JSON.stringify([userId, payload]);
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: saveError } = await supabase.rpc('create_support_inquiry', { ...payload, p_request_id: request.current.id });
      if (saveError || !data) throw saveError ?? new Error('Missing inquiry ID');
      setTitle(''); setBody(''); request.current = null;
      setNotice('문의가 접수되었습니다. 아래 내 문의에서 처리 상태와 답변을 확인할 수 있습니다.');
      onCreated();
    } catch (saveError) { setError(inquiryError(saveError)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <form className="inquiry-form panel" onSubmit={submit} aria-label="문의 작성">
    <h2>문의 작성</h2><p>문의 내용은 본인과 관리자만 볼 수 있습니다. 비밀번호·인증번호 등 민감한 정보는 입력하지 마세요.</p>
    <label htmlFor="inquiry-category">문의 유형</label><select id="inquiry-category" value={category} onChange={event => setCategory(event.target.value)} disabled={busy}>{Object.entries(inquiryCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <label htmlFor="inquiry-title">제목</label><input id="inquiry-title" value={title} onChange={event => setTitle(event.target.value)} minLength={2} maxLength={120} required disabled={busy} placeholder="문의 제목을 입력해 주세요" />
    <label htmlFor="inquiry-body">문의 내용</label><textarea id="inquiry-body" value={body} onChange={event => setBody(event.target.value)} minLength={10} maxLength={5000} required disabled={busy} rows={6} placeholder="발생한 상황이나 궁금한 내용을 자세히 적어 주세요" />
    <small>{body.length.toLocaleString('ko-KR')} / 5,000자 · 1분에 1회, 24시간에 최대 10회 접수</small>
    {error && <p className="save-error" role="alert">{error}</p>}{notice && <p className="account-restored-notice" role="status">{notice}</p>}
    <button type="submit" className="primary-button" disabled={busy}>{busy ? '접수 중…' : '문의 접수하기'}</button>
  </form>;
}

function InquiryReplyForm({ item, onSaved }) {
  const [reply, setReply] = useState(item.reply);
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function save(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const { error: saveError } = await supabase.rpc('reply_support_inquiry', { p_id: item.id, p_status: status, p_reply: reply.trim(), p_expected_updated_at: item.updated_at });
      if (saveError) throw saveError;
      onSaved();
    } catch (saveError) { setError(inquiryError(saveError)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <form className="inquiry-reply-form" onSubmit={save} aria-label={`${item.title} 관리자 답변`}>
    <label htmlFor={`reply-status-${item.id}`}>처리 상태</label><select id={`reply-status-${item.id}`} value={status} onChange={event => setStatus(event.target.value)} disabled={busy}>{Object.entries(inquiryStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <label htmlFor={`reply-${item.id}`}>관리자 답변</label><textarea id={`reply-${item.id}`} value={reply} onChange={event => { setReply(event.target.value); if (event.target.value.trim()) setStatus('answered'); }} maxLength={5000} required={status === 'answered'} disabled={busy} rows={5} placeholder="답변을 작성하면 답변 완료로 저장합니다" />
    <small>답변 없이 상태만 변경하려면 답변을 비우고 접수 대기 또는 확인 중을 선택하세요.</small>
    {error && <p className="save-error" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy}>{busy ? '저장 중…' : '답변·상태 저장'}</button>
  </form>;
}

export default function InquiriesPage({ admin = false }) {
  const { user } = useAuth();
  const inquiries = useInquiries(user?.id, admin);
  const [notice, setNotice] = useState('');
  return <div className="subpage inquiries-page">
    <div className="subpage-header"><div><p className="eyebrow">{admin ? 'ADMIN SUPPORT' : 'SUPPORT'}</p><h1>{admin ? '문의 관리' : '문의하기'}</h1><p>{admin ? '접수된 문의를 확인하고 답변과 처리 상태를 관리합니다.' : '이용 중 궁금한 점이나 학습 자료·사이트 오류를 문의해 주세요.'}</p></div><MessageSquare className="header-line-icon" size={42} /></div>
    {admin && <AdminNavigation />}
    {!admin && user && <InquiryForm key={user.id} userId={user.id} onCreated={() => { inquiries.filter('all'); inquiries.reload(true); }} />}
    <section className="inquiry-list panel" aria-label={admin ? '전체 문의 목록' : '내 문의 목록'}>
      <div className="inquiry-list-heading"><h2>{admin ? '전체 문의' : '내 문의'}</h2><button type="button" className="secondary-button" onClick={() => { setNotice(''); inquiries.reload(); }} disabled={inquiries.loading}><RefreshCw size={15} /> 새로고침</button></div>
      <div className="inquiry-filter"><label htmlFor="inquiry-filter">처리 상태 필터</label><select id="inquiry-filter" value={inquiries.status} onChange={event => { setNotice(''); inquiries.filter(event.target.value); }}><option value="all">전체 상태</option>{Object.entries(inquiryStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {notice && <p role="status" className="account-restored-notice">{notice}</p>}{inquiries.error && <p role="alert" className="save-error">{inquiries.error}</p>}
      {inquiries.loading ? <p className="admin-empty">문의 목록을 불러오고 있습니다.</p> : !inquiries.items.length && !inquiries.error ? <p className="admin-empty">{inquiries.status === 'all' ? '등록된 문의가 없습니다.' : '해당 상태의 문의가 없습니다.'}</p> : inquiries.items.map(item => <details className="inquiry-item" key={item.id} name="support-inquiry">
        <summary><span className={`inquiry-status ${item.status}`}>{inquiryStatuses[item.status]}</span><span className="inquiry-item-title"><strong>{item.title}</strong><small>{inquiryCategories[item.category]} · {formatDate(item.created_at)}</small></span></summary>
        <div className="inquiry-item-content">{admin && <p className="inquiry-author">작성자: {item.author_nickname || '닉네임 미설정'} · {item.author_email || '이메일 없음'}</p>}<h3>문의 내용</h3><p className="inquiry-text">{item.body}</p>
          {item.reply && <div className="inquiry-answer"><h3>관리자 답변</h3><p className="inquiry-text">{item.reply}</p>{item.replied_at && <small>{formatDate(item.replied_at)}</small>}</div>}
          {admin && <InquiryReplyForm key={`${item.id}:${item.updated_at}`} item={item} onSaved={() => { setNotice('문의의 답변과 처리 상태를 저장했습니다.'); inquiries.reload(); }} />}
        </div>
      </details>)}
      <nav className="admin-pagination" aria-label="문의 목록 페이지 이동"><button type="button" aria-label="문의 이전 페이지" disabled={inquiries.loading || inquiries.page === 1} onClick={() => inquiries.move('previous')}><ChevronLeft size={16} /> 이전</button><span aria-current="page">{inquiries.page}페이지</span><button type="button" aria-label="문의 다음 페이지" disabled={inquiries.loading || !inquiries.hasNext} onClick={() => inquiries.move('next')}>다음 <ChevronRight size={16} /></button></nav>
    </section>
  </div>;
}
