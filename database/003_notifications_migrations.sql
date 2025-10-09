-- ============================================================
-- Notifications table with RLS and idempotent policies
-- ============================================================

-- 1) Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('success','error','warning','info','invitation')),
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 3) RLS
alter table public.notifications enable row level security;

-- 4) Policies (idempotent)
do $$
begin
  -- SELECT
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'User can see own notifications'
  ) then
    create policy "User can see own notifications"
      on public.notifications
      for select
      using (auth.uid() = user_id);
  end if;

  -- INSERT
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'User can insert own notifications'
  ) then
    create policy "User can insert own notifications"
      on public.notifications
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- UPDATE
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'User can update own notifications'
  ) then
    create policy "User can update own notifications"
      on public.notifications
      for update
      using (auth.uid() = user_id);
  end if;

  -- DELETE
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'User can delete own notifications'
  ) then
    create policy "User can delete own notifications"
      on public.notifications
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

-- 5) Optional helper: unread count view (constrained to RLS via SELECT policy)
create or replace view public.notifications_unread_counts as
  select user_id, count(*)::int as unread_count
  from public.notifications
  where read = false
  group by user_id;