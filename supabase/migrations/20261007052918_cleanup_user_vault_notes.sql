create index if not exists vault_notes_owner_id_idx
  on public.vault_notes (owner_id);

create or replace function private.delete_vault_notes_for_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.vault_notes where owner_id = old.id;
  return old;
end;
$$;

revoke all on function private.delete_vault_notes_for_deleted_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_deleted_cleanup_vault_notes on auth.users;
create trigger on_auth_user_deleted_cleanup_vault_notes
  after delete on auth.users
  for each row execute function private.delete_vault_notes_for_deleted_user();
