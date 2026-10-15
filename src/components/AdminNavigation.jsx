import { NavLink } from 'react-router-dom';

export default function AdminNavigation() {
  return <nav className="admin-section-navigation" aria-label="관리 페이지 메뉴">
    <NavLink to="/admin" end>계정 관리</NavLink>
    <NavLink to="/admin/inquiries">문의 관리</NavLink>
  </nav>;
}
