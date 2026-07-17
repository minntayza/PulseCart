-- Automatically create the application profile after Supabase Auth registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, username, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    'customer'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for Auth users created before this trigger existed.
insert into public.profiles (user_id, username, role)
select
  users.id,
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'username'), ''), split_part(users.email, '@', 1)),
  case when users.raw_app_meta_data ->> 'role' = 'manager' then 'manager' else 'customer' end
from auth.users as users
on conflict (user_id) do nothing;
