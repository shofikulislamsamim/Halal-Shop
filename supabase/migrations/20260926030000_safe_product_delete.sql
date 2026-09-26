-- Safe permanent product deletion for admins.
-- Products referenced by order history are intentionally protected.
drop policy if exists "halal_products_admin_delete" on public.halal_products;
drop policy if exists "halal_products_admin_delete" on public.halal_products;

drop policy if exists "halal_product_stock_movements_admin_delete" on public.halal_product_stock_movements;
create policy "halal_product_stock_movements_admin_delete"
on public.halal_product_stock_movements
for delete
to authenticated
using ((select public.halal_is_admin()));

create or replace function public.admin_delete_halal_product(p_product_id uuid)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $function$
declare
  v_order_item_count integer;
begin
  if not (select public.halal_is_admin()) then
    raise exception 'Admin access required';
  end if;

  if p_product_id is null then
    raise exception 'Product id is required';
  end if;

  select count(*)::integer into v_order_item_count
  from public.halal_order_items
  where product_id = p_product_id;

  if v_order_item_count > 0 then
    return jsonb_build_object(
      'success', false,
      'code', 'ORDER_HISTORY_EXISTS',
      'message', 'এই পণ্যটি অর্ডার ইতিহাসে ব্যবহৃত হয়েছে; স্থায়ীভাবে ডিলিট করা নিরাপদ নয়।'
    );
  end if;

  delete from public.halal_product_stock_movements
  where product_id = p_product_id;

  delete from public.halal_products
  where id = p_product_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'পণ্যটি পাওয়া যায়নি।'
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'code', 'DELETED',
    'message', 'পণ্যটি স্থায়ীভাবে ডিলিট করা হয়েছে।'
  );
end;
$function$;

revoke execute on function public.admin_delete_halal_product(uuid) from public;
revoke execute on function public.admin_delete_halal_product(uuid) from anon;
grant execute on function public.admin_delete_halal_product(uuid) to authenticated;
