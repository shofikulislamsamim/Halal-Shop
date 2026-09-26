-- Variant inventory support: variant-level stock adjustments with history.
alter table public.halal_product_stock_movements
  add column if not exists variant_id text,
  add column if not exists variant_name text;

create index if not exists halal_product_stock_movements_variant_idx
  on public.halal_product_stock_movements(product_id, variant_id, created_at desc);

create or replace function public.sync_halal_product_variant_stock()
returns trigger
language plpgsql
security invoker
set search_path = public
as $function$
declare v_total integer;
begin
  if jsonb_typeof(coalesce(new.variants, '[]'::jsonb)) = 'array'
     and jsonb_array_length(coalesce(new.variants, '[]'::jsonb)) > 0 then
    select coalesce(sum(greatest(0, floor(coalesce((value->>'stock')::numeric, 0)))::integer), 0)
      into v_total from jsonb_array_elements(new.variants) as item(value);
    new.stock := v_total;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_sync_halal_product_variant_stock on public.halal_products;
create trigger trg_sync_halal_product_variant_stock
before insert or update of variants on public.halal_products
for each row execute function public.sync_halal_product_variant_stock();

create or replace function public.admin_adjust_halal_product_variant_stock_with_history(
  p_product_id uuid, p_variant_id text, p_delta integer,
  p_reason text default 'manual_adjustment', p_note text default null
)
returns jsonb language plpgsql volatile security invoker set search_path = public
as $function$
declare
  v_product public.halal_products%rowtype;
  v_variant jsonb; v_variants jsonb; v_new_stock integer;
  v_total_stock integer; v_variant_name text; v_previous_stock integer;
  v_changed_by uuid := auth.uid();
begin
  if not (select public.halal_is_admin()) then raise exception 'Admin access required'; end if;
  if p_product_id is null or nullif(trim(p_variant_id), '') is null then raise exception 'Product and variant are required'; end if;
  if p_delta is null or p_delta = 0 then raise exception 'Stock delta cannot be zero'; end if;
  select * into v_product from public.halal_products where id = p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  select item.value into v_variant from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) item(value)
    where item.value->>'id' = trim(p_variant_id) limit 1;
  if v_variant is null then raise exception 'Variant not found'; end if;
  v_previous_stock := greatest(0, floor(coalesce((v_variant->>'stock')::numeric, 0))::integer);
  v_new_stock := v_previous_stock + p_delta;
  if v_new_stock < 0 then raise exception 'Insufficient variant stock'; end if;
  select coalesce(jsonb_agg(case when item.value->>'id'=trim(p_variant_id)
    then jsonb_set(item.value, '{stock}', to_jsonb(v_new_stock), true) else item.value end order by item.ordinality), '[]'::jsonb)
    into v_variants from jsonb_array_elements(coalesce(v_product.variants, '[]'::jsonb)) with ordinality item(value, ordinality);
  select coalesce(sum(greatest(0, floor(coalesce((value->>'stock')::numeric, 0)))::integer),0)
    into v_total_stock from jsonb_array_elements(v_variants) item(value);
  v_variant_name := coalesce(v_variant->>'name', trim(p_variant_id));
  update public.halal_products set variants=v_variants, stock=v_total_stock, updated_at=now() where id=p_product_id;
  insert into public.halal_product_stock_movements(product_id,variant_id,variant_name,previous_stock,delta,new_stock,reason,note,changed_by)
  values(p_product_id,trim(p_variant_id),v_variant_name,v_previous_stock,p_delta,v_new_stock,coalesce(nullif(trim(p_reason),''),'manual_adjustment'),nullif(trim(p_note),''),v_changed_by);
  return jsonb_build_object('product_id',p_product_id,'variant_id',trim(p_variant_id),'variant_name',v_variant_name,'variant_stock',v_new_stock,'stock',v_total_stock);
end;
$function$;

revoke execute on function public.admin_adjust_halal_product_variant_stock_with_history(uuid,text,integer,text,text) from public;
revoke execute on function public.admin_adjust_halal_product_variant_stock_with_history(uuid,text,integer,text,text) from anon;
grant execute on function public.admin_adjust_halal_product_variant_stock_with_history(uuid,text,integer,text,text) to authenticated;

update public.halal_products set stock=sub.total_stock,updated_at=now()
from (select p.id,coalesce(sum(greatest(0,floor(coalesce((v.value->>'stock')::numeric,0)))::integer),0) total_stock
      from public.halal_products p cross join lateral jsonb_array_elements(coalesce(p.variants,'[]'::jsonb)) v(value) group by p.id) sub
where public.halal_products.id=sub.id and jsonb_array_length(coalesce(public.halal_products.variants,'[]'::jsonb))>0;