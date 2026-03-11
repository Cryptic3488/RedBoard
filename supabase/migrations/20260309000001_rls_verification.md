# RLS Verification Steps — F-01 profiles

## Key design note
Policies on `profiles` must NOT query `profiles` directly in their USING/WITH CHECK
clauses — PostgreSQL detects this as infinite recursion. The fix is a `SECURITY DEFINER`
function (`get_my_role()`) that reads the caller's role while bypassing RLS.

## Setup test data

```sql
-- Verify profile rows exist for your users
select id, email from auth.users;
select id, role, name from public.profiles;

-- Insert missing profiles for pre-existing users (no trigger fired for them)
insert into public.profiles (id, role, name)
select
  id,
  case
    when email = 'byerly_a1@denison.edu'  then 'admin'
    when email = 'abyerly3488@gmail.com'  then 'player'
  end as role,
  case
    when email = 'byerly_a1@denison.edu'  then 'Austin Byerly'
    when email = 'abyerly3488@gmail.com'  then 'Austin Byerly'
  end as name
from auth.users
where email in ('byerly_a1@denison.edu', 'abyerly3488@gmail.com')
on conflict (id) do update
  set role = excluded.role, name = excluded.name;
```

## Test 1: Player can read own profile
Sign in as player → app loads without error → /app/feed renders with their name.

## Test 2: Admin can read own profile
Sign in as admin → app loads without error → /admin renders with their name.

## Test 3: Player cannot escalate role
```sql
-- As player (via Supabase table editor or RLS test):
update public.profiles set role = 'admin' where id = auth.uid();
-- Expected: 0 rows updated (WITH CHECK blocks role change)
```

## Test 4: Player cannot read another user's profile
```sql
update public.profiles set role = 'admin' where id = '<other_user_uuid>';
-- Expected: 0 rows (USING clause blocks non-own rows)
```

## Test 5: No unauthenticated access
Without a JWT, auth.uid() returns null → no policy matches → 0 rows returned.
