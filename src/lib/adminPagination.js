export const ADMIN_PAGE_SIZE = 10;

export function parseManagedUsersPage(data) {
  const counts = data?.counts;
  if (!Array.isArray(data?.accounts) || data.accounts.length > ADMIN_PAGE_SIZE
    || typeof data.has_more !== 'boolean'
    || !['total', 'user', 'pro', 'admin'].every((key) => Number.isSafeInteger(counts?.[key]) && counts[key] >= 0)
    || counts.total !== counts.user + counts.pro + counts.admin
    || (data.has_more && data.accounts.length !== ADMIN_PAGE_SIZE)) {
    throw new Error('Invalid managed users page');
  }
  const last = data.accounts.at(-1);
  if (data.has_more && (!last?.user_id || !last.created_at)) throw new Error('Missing page cursor');
  return {
    accounts: data.accounts,
    counts,
    nextCursor: data.has_more ? { user_id: last.user_id, created_at: last.created_at } : null,
  };
}
