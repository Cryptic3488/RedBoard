# RLS Verification Steps — F-01 profiles

Run these SQL queries in Supabase SQL Editor to verify policies.

## Setup test users

```sql
-- Create a player user (via Auth dashboard or supabase.auth.admin.createUser)
-- Then manually check their profile row:
select * from public.profiles;
```

## Test 1: Player can read own profile

```sql
-- Set role to a player JWT, then:
select * from public.profiles where id = auth.uid();
-- Expected: 1 row (their own)
```

## Test 2: Player cannot read another user's profile

```sql
-- Simulate as player A, try to read player B:
select * from public.profiles where id = '<other_player_uuid>';
-- Expected: 0 rows
```

## Test 3: Player cannot update their own role

```sql
-- As a player:
update public.profiles set role = 'admin' where id = auth.uid();
-- Expected: error or 0 rows affected (WITH CHECK prevents role change)
```

## Test 4: Admin can read all profiles

```sql
-- As admin user:
select * from public.profiles;
-- Expected: all rows visible
```

## Test 5: No unauthenticated access

```sql
-- Without a JWT (anon role):
select * from public.profiles;
-- Expected: 0 rows (RLS default-deny)
```
