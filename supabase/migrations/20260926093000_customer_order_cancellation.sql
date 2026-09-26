-- Customer cancellation: server-authoritative cancellation window and stock restoration.
-- This migration documents the RPC used by the storefront.
-- Apply this migration to the production Supabase project before enabling the
-- customer cancellation button in production.

create or replace function private.customer_cancel_halal_order(p_order_code text, p_mobile text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $function$
declare
  v_order public.halal_orders%rowtype;
  v_item record;
  v_minutes integer;
begin
  if nullif(trim(p_order_code), '') is null or nullif(trim(p_mobile), '') is null then
    raise exception 'Order code and mobile are required';
  end if;

  select o.* into v_order
  from public.halal_orders o
  where upper(o.order_code)=upper(trim(p_order_code))
    and regexp_replace(coalesce(o.mobile,''),'[^0-9]','','g')=regexp_replace(trim(p_mobile),'[^0-9]','','g')
  for update;

  if not found then raise exception 'Order not found'; end if;
  if v_order.status not in ('pending','confirmed') then raise exception 'এই অর্ডারটি এখন ক্যানসেল করা যাবে না।'; end if;

  select greatest(0, coalesce((delivery_settings->>'customerCancellationMinutes')::integer,0))
    into v_minutes
  from public.halal_store_settings where id=true;

  if coalesce(v_minutes,0)<=0 then raise exception 'গ্রাহকের জন্য অর্ডার ক্যানসেল সুবিধা বর্তমানে বন্ধ আছে।'; end if;
  if now() > v_order.created_at + make_interval(mins=>v_minutes) then raise exception 'অর্ডার ক্যানসেল করার সময়সীমা শেষ হয়ে গেছে।'; end if;

  for v_item in
    select product_id,quantity
    from public.halal_order_items
    where order_id=v_order.id and product_id is not null
    order by id
    for update
  loop
    update public.halal_products
    set stock=stock+v_item.quantity,updated_at=now()
    where id=v_item.product_id;
    if not found then raise exception 'Product for cancelled order item no longer exists'; end if;
  end loop;

  update public.halal_orders set status='cancelled',updated_at=now() where id=v_order.id;
  insert into public.halal_order_status_history(order_id,status,changed_at)
  values(v_order.id,'cancelled',now());

  return jsonb_build_object('success',true,'order_code',v_order.order_code,'status','cancelled');
end;
$function$;

revoke execute on function private.customer_cancel_halal_order(text,text) from public;
revoke execute on function private.customer_cancel_halal_order(text,text) from anon;
revoke execute on function private.customer_cancel_halal_order(text,text) from authenticated;

create or replace function public.customer_cancel_halal_order(p_order_code text, p_mobile text)
returns jsonb
language sql
security invoker
set search_path=public
as $function$
  select private.customer_cancel_halal_order(p_order_code,p_mobile);
$function$;

revoke execute on function public.customer_cancel_halal_order(text,text) from public;
grant execute on function public.customer_cancel_halal_order(text,text) to anon, authenticated;


grant usage on schema private to anon, authenticated;
