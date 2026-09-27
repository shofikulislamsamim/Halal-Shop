-- Restore the execution permission required by the browser admin client.
-- The function itself remains responsible for deciding whether the caller is
-- an administrator; this grant does not bypass that authorization check.
grant execute on function public.halal_is_admin() to authenticated;
