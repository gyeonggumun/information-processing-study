alter table public.practice_attempts
  drop constraint practice_attempts_practice_type_check,
  add constraint practice_attempts_practice_type_check
    check (practice_type in ('exam', 'C', 'Java', 'Python', 'SQL'));
