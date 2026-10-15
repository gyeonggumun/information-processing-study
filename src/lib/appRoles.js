export const APP_ROLES = Object.freeze(['user', 'pro', 'admin']);

export function normalizeAppRole(role) {
  return APP_ROLES.includes(role) ? role : 'user';
}

export function hasRequiredRole(role, requiredRole) {
  if (!requiredRole) return true;
  return APP_ROLES.includes(role) && APP_ROLES.includes(requiredRole)
    && APP_ROLES.indexOf(role) >= APP_ROLES.indexOf(requiredRole);
}

export const appRoleLabels = Object.freeze({ user: 'User · 일반', pro: 'Pro · 실기 요약', admin: 'Admin · 관리자' });
