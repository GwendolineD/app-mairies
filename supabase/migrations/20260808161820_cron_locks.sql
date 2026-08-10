-- Sujet 5: cron lock mechanism for single-writer guarantee
-- Advisory locks don't work through PostgREST (session-level locks are tied to
-- pooled connections, not to the calling HTTP request). This table-based lock
-- with TTL provides the same guarantee.

-- =============================================================================
-- 1. Lock table
-- =============================================================================

create table if not exists public.cron_locks (
  name text primary key,
  locked_at timestamptz,
  locked_by text
);

comment on table public.cron_locks is 'Single-writer locks for cron jobs. Internal table, service_role only.';

-- No RLS — internal table accessed only via service_role
alter table public.cron_locks enable row level security;

grant all on public.cron_locks to service_role;

-- Seed the email_sender lock row
insert into public.cron_locks (name) values ('email_sender') on conflict do nothing;

-- =============================================================================
-- 2. Acquire lock RPC
-- Returns the lock_id (text) if acquired, NULL if already held.
-- TTL ensures crashed runs don't block forever.
-- =============================================================================

create or replace function public.try_acquire_cron_lock(
  p_name text,
  p_ttl_minutes int default 5
)
returns text
language sql
security definer
set search_path = public
as $$
  update public.cron_locks
  set locked_at = now(),
      locked_by = gen_random_uuid()::text
  where name = p_name
    and (locked_at is null or locked_at < now() - make_interval(mins := p_ttl_minutes))
  returning locked_by;
$$;

comment on function public.try_acquire_cron_lock(text, int) is
  'Attempt to acquire a cron lock. Returns lock_id if acquired, NULL if already held.';

-- Restrict to service_role only
revoke all on function public.try_acquire_cron_lock(text, int) from public, anon, authenticated;
grant execute on function public.try_acquire_cron_lock(text, int) to service_role;

-- =============================================================================
-- 3. Release lock RPC
-- Only releases if the caller holds the lock (checked via lock_id).
-- Prevents a slow run from releasing a lock stolen by TTL expiry.
-- =============================================================================

create or replace function public.release_cron_lock(
  p_name text,
  p_lock_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.cron_locks
  set locked_at = null,
      locked_by = null
  where name = p_name
    and locked_by = p_lock_id;
$$;

comment on function public.release_cron_lock(text, text) is
  'Release a cron lock. Only releases if p_lock_id matches the current holder.';

-- Restrict to service_role only
revoke all on function public.release_cron_lock(text, text) from public, anon, authenticated;
grant execute on function public.release_cron_lock(text, text) to service_role;
