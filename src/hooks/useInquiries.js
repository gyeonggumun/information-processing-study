import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseInquiryPage } from '../lib/supportInquiries';

export function useInquiries(userId, admin) {
  const [status, setStatus] = useState('all');
  const [cursors, setCursors] = useState([null]);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ ownerId: null, admin, items: [], nextCursor: null, loading: true, error: '' });
  const generation = useRef(0);
  const cursor = cursors.at(-1);
  useEffect(() => {
    const request = ++generation.current;
    setState({ ownerId: userId, admin, items: [], nextCursor: null, loading: true, error: '' });
    async function load() {
      try {
        if (!userId) return;
        const { data, error } = await supabase.rpc('list_support_inquiries', {
          p_admin: admin, p_status: status, p_before_created_at: cursor?.created_at ?? null, p_before_id: cursor?.id ?? null,
        });
        if (generation.current !== request) return;
        if (error) throw error;
        const page = parseInquiryPage(data);
        if (!page.items.length && cursor) { setCursors(value => value.slice(0, -1)); return; }
        setState({ ownerId: userId, admin, ...page, loading: false, error: '' });
      } catch {
        if (generation.current === request) setState({ ownerId: userId, admin, items: [], nextCursor: null, loading: false, error: '문의 목록을 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해 주세요.' });
      }
    }
    void load();
    return () => { generation.current += 1; };
  }, [userId, admin, status, cursor, refresh]);
  const current = state.ownerId === userId && state.admin === admin;
  return {
    items: current ? state.items : [], loading: !current || state.loading, error: current ? state.error : '',
    status, page: cursors.length, hasNext: current && Boolean(state.nextCursor),
    filter(value) { setCursors([null]); setStatus(value); },
    reload(firstPage = false) { if (firstPage) setCursors([null]); setRefresh(value => value + 1); },
    move(direction) {
      if (!current || state.loading || (direction === 'next' ? !state.nextCursor : cursors.length <= 1)) return;
      setState(value => ({ ...value, loading: true }));
      setCursors(value => direction === 'next' ? [...value, state.nextCursor] : value.slice(0, -1));
    },
  };
}
