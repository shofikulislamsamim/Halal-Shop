-- Security and performance hardening applied to production.
-- Keep storefront order lookup callable through the public RPC while ensuring
-- the exposed wrapper is SECURITY INVOKER. The underlying private function
-- remains SECURITY DEFINER because it must read order data despite RLS.
create or replace function public.get_halal_orders_by_mobile(p_mobile text)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.get_halal_orders_by_mobile(p_mobile);
$function$;

revoke execute on function private.get_halal_orders_by_mobile(text) from public;
grant execute on function private.get_halal_orders_by_mobile(text) to anon, authenticated;

-- Avoid per-row auth evaluation in the admin_users RLS policy.
drop policy if exists "Allow authenticated read admin_users" on public.admin_users;
create policy "Allow authenticated read admin_users"
on public.admin_users
for select
to authenticated
using (
  (lower(email) = lower((select auth.jwt() ->> 'email')))
  or (select is_admin())
);

-- Merge overlapping authenticated SELECT policies so each table evaluates one
-- SELECT policy instead of separately evaluating the public and admin policies.
drop policy if exists "halal admin categories select" on public.halal_categories;
drop policy if exists "halal public active categories" on public.halal_categories;
create policy "halal categories select"
on public.halal_categories
for select
to anon, authenticated
using (
  is_active = true
  or (select halal_is_admin())
);

drop policy if exists "halal admin products select" on public.halal_products;
drop policy if exists "halal public active products" on public.halal_products;
create policy "halal products select"
on public.halal_products
for select
to anon, authenticated
using (
  is_active = true
  or (select halal_is_admin())
);

-- Remove the exact duplicate of halal_products_active_idx.
drop index if exists public.halal_products_is_active_idx;
