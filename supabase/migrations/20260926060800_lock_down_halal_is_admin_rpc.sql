-- Security hardening mirror for Supabase migration 20260926060800 (lock_down_halal_is_admin_rpc).
revoke execute on function public.halal_is_admin() from public;
revoke execute on function public.halal_is_admin() from anon;
revoke execute on function public.halal_is_admin() from authenticated;
