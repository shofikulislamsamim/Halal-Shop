-- Complete end-to-end product variant ordering.
-- Variant identity is preserved from storefront -> cart -> order -> cancellation.
-- Parent product stock remains the sum of variant stocks.

alter table public.halal_order_items
  add column if not exists variant_id text,
  add column if not exists variant_name text;

create index if not exists halal_order_items_variant_idx
  on public.halal_order_items(order_id, variant_id);

create or replace function private.create_halal_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_customer_name text := trim(coalesce(payload->>'customerName',''));
  v_mobile text := regexp_replace(coalesce(payload->>'mobile',''), '[[:space:]+-]', '', 'g');
  v_alt_mobile text := nullif(regexp_replace(coalesce(payload->>'altMobile',''), '[[:space:]+-]', '', 'g'), '');
  v_address_mode text := coalesce(payload->'address'->>'locationType',payload->'address'->>'mode','');
  v_address jsonb := coalesce(payload->'address','{}'::jsonb);
  v_items jsonb := coalesce(payload->'items','[]'::jsonb);
  v_order_note text := nullif(trim(coalesce(payload->>'orderNote','')),'');
  v_idempotency_key uuid;
  v_existing public.halal_orders%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_order_code text;
  v_subtotal numeric := 0;
  v_delivery_fee numeric := 0;
  v_total numeric := 0;
  v_free_threshold numeric := 1000;
  v_dhaka_fee numeric := 80;
  v_outside_fee numeric := 121;
  v_is_dhaka boolean := false;
  v_min_order numeric := 0;
  v_cod_min numeric := 0;
  v_cod_max numeric := 0;
  v_cod_enabled boolean := true;
  v_auto_confirm boolean := false;
  v_store_status text := 'open';
  v_order_status text := 'pending';
  v_item jsonb;
  v_product public.halal_products%rowtype;
  v_quantity integer;
  v_item_total numeric;
  v_unit_price numeric;
  v_variant_id text;
  v_variant_name text;
  v_variant_stock integer;
  v_variant jsonb;
  v_item_rows jsonb := '[]'::jsonb;
  v_product_id uuid;
begin
  if nullif(payload->>'idempotencyKey','') is not null then
    begin
      v_idempotency_key := (payload->>'idempotencyKey')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid idempotency key';
    end;

    perform pg_advisory_xact_lock(hashtextextended(v_idempotency_key::text,0));
    select * into v_existing from public.halal_orders where idempotency_key=v_idempotency_key limit 1;
    if found then
      return (
        select jsonb_build_object(
          'id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,
          'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,
          'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,
          'payment_method',o.payment_method,'status',o.status,'created_at',o.created_at,'updated_at',o.updated_at,
          'order_note',o.order_note,
          'items',coalesce((select jsonb_agg(jsonb_build_object(
            'product_id',oi.product_id,'variant_id',oi.variant_id,'variant_name',oi.variant_name,
            'product_name',oi.product_name,'image_url',oi.image_url,'unit_price',oi.unit_price,
            'quantity',oi.quantity,'subtotal',oi.subtotal) order by oi.id
          ) from public.halal_order_items oi where oi.order_id=o.id),'[]'::jsonb)
        ) from public.halal_orders o where o.id=v_existing.id
      );
    end if;
  end if;

  if v_customer_name='' then raise exception 'Customer name is required'; end if;
  if v_mobile='' or v_mobile !~ '^(?:88)?01[3-9][0-9]{8}$' then raise exception 'Invalid mobile number'; end if;
  if v_alt_mobile is not null and v_alt_mobile !~ '^(?:88)?01[3-9][0-9]{8}$' then raise exception 'Invalid alternative mobile number'; end if;
  if v_address_mode not in ('rural','urban') then raise exception 'Invalid address mode'; end if;
  if nullif(trim(coalesce(v_address->>'division','')),'') is null then raise exception 'Division is required'; end if;
  if nullif(trim(coalesce(v_address->>'district','')),'') is null then raise exception 'District is required'; end if;
  if nullif(trim(coalesce(v_address->>'detailedAddress','')),'') is null then raise exception 'Detailed address is required'; end if;
  if jsonb_typeof(v_items)<>'array' or jsonb_array_length(v_items)=0 then raise exception 'Order items are required'; end if;

  select coalesce((delivery_settings->>'freeDeliveryThreshold')::numeric,1000),
         coalesce((delivery_settings->>'deliveryChargeDhaka')::numeric,80),
         coalesce((delivery_settings->>'deliveryChargeOutsideDhaka')::numeric,121),
         greatest(coalesce((delivery_settings->>'minimumOrderAmount')::numeric,0),0),
         greatest(coalesce((delivery_settings->>'codMinimumOrder')::numeric,0),0),
         greatest(coalesce((delivery_settings->>'codMaximumOrder')::numeric,0),0),
         coalesce((delivery_settings->>'cashOnDeliveryEnabled')::boolean,true),
         coalesce((delivery_settings->>'orderAutoConfirm')::boolean,false),
         coalesce(nullif(delivery_settings->>'storeStatus',''),'open')
  into v_free_threshold,v_dhaka_fee,v_outside_fee,v_min_order,v_cod_min,v_cod_max,v_cod_enabled,v_auto_confirm,v_store_status
  from public.halal_store_settings where id=true limit 1;

  if v_store_status <> 'open' then raise exception 'Store is currently closed'; end if;
  if not v_cod_enabled then raise exception 'Cash on Delivery is currently unavailable'; end if;

  v_is_dhaka := lower(coalesce(v_address->>'district','')) in ('dhaka','ঢাকা','ঢাকা (মেট্রো / সিটি)')
    or lower(coalesce(v_address->>'city',''))='dhaka'
    or coalesce(v_address->>'city','')='ঢাকা';

  for v_item in select value from jsonb_array_elements(v_items) loop
    if coalesce(v_item->>'productId','')='' then raise exception 'Invalid product'; end if;
    if coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]*$' then
      raise exception 'Invalid quantity for product %',v_item->>'productId';
    end if;
    begin
      v_product_id := (v_item->>'productId')::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid product';
    end;
    if nullif(v_item->>'variantId','') is not null and length(v_item->>'variantId') > 200 then
      raise exception 'Invalid variant';
    end if;
  end loop;

  -- Aggregate duplicate product+variant lines before stock validation so the
  -- same variant cannot be oversold by sending it twice in one request.
  for v_item in
    select jsonb_build_object('productId',x.product_id,'variantId',x.variant_id,'quantity',x.quantity)
    from (
      select
        (value->>'productId')::uuid as product_id,
        nullif(value->>'variantId','') as variant_id,
        sum((value->>'quantity')::integer)::integer as quantity
      from jsonb_array_elements(v_items)
      group by (value->>'productId')::uuid, nullif(value->>'variantId','')
    ) x
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_variant_id := nullif(v_item->>'variantId','');
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product
    from public.halal_products
    where id=v_product_id and is_active=true
    for update;

    if not found then raise exception 'Product unavailable'; end if;

    if jsonb_typeof(v_product.variants)='array' and jsonb_array_length(v_product.variants)>0 then
      if v_variant_id is null then raise exception 'Variant selection is required'; end if;

      select value into v_variant
      from jsonb_array_elements(v_product.variants)
      where value->>'id'=v_variant_id
      limit 1;

      if v_variant is null then raise exception 'Selected variant is unavailable'; end if;

      v_variant_stock := greatest(coalesce((v_variant->>'stock')::integer,0),0);
      if v_quantity > v_variant_stock then raise exception 'Insufficient stock'; end if;

      v_variant_name := nullif(v_variant->>'name','');
      v_unit_price := greatest(coalesce((v_variant->>'price')::numeric,0),0);
    else
      if v_variant_id is not null then raise exception 'Invalid variant for product'; end if;
      if v_quantity > v_product.stock then raise exception 'Insufficient stock'; end if;
      v_variant_name := null;
      v_variant_stock := null;
      v_unit_price := greatest(v_product.price,0);
    end if;

    v_item_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_item_total;
    v_item_rows := v_item_rows || jsonb_build_array(jsonb_build_object(
      'product_id',v_product.id,
      'variant_id',v_variant_id,
      'variant_name',v_variant_name,
      'product_name',v_product.name_bn,
      'image_url',v_product.image_url,
      'unit_price',v_unit_price,
      'quantity',v_quantity,
      'subtotal',v_item_total
    ));
  end loop;

  if v_subtotal < v_free_threshold then
    v_delivery_fee := case when v_is_dhaka then v_dhaka_fee else v_outside_fee end;
  end if;

  v_total := v_subtotal + v_delivery_fee;
  if v_min_order > 0 and v_total < v_min_order then raise exception 'Minimum order amount is %',v_min_order; end if;
  if v_cod_min > 0 and v_total < v_cod_min then raise exception 'Cash on Delivery minimum order is %',v_cod_min; end if;
  if v_cod_max > 0 and v_total > v_cod_max then raise exception 'Cash on Delivery maximum order is %',v_cod_max; end if;
  if v_auto_confirm then v_order_status := 'confirmed'; end if;

  loop
    v_order_code := 'HS'||to_char(now(),'YYMMDD')||upper(substr(md5(gen_random_uuid()::text),1,6));
    exit when not exists(select 1 from public.halal_orders where order_code=v_order_code);
  end loop;

  insert into public.halal_orders(
    id,order_code,customer_name,mobile,alt_mobile,address_mode,address,subtotal,discount,
    delivery_fee,total,payment_method,status,order_note,idempotency_key
  )
  values(
    v_order_id,v_order_code,v_customer_name,v_mobile,v_alt_mobile,v_address_mode,v_address,
    v_subtotal,0,v_delivery_fee,v_total,'cod',v_order_status,v_order_note,v_idempotency_key
  );

  perform set_config('halal.allow_stock_mutation','true',true);

  for v_item in select * from jsonb_array_elements(v_item_rows) loop
    insert into public.halal_order_items(
      id,order_id,product_id,variant_id,variant_name,product_name,image_url,unit_price,quantity
    )
    values(
      gen_random_uuid(),v_order_id,(v_item->>'product_id')::uuid,
      nullif(v_item->>'variant_id',''),nullif(v_item->>'variant_name',''),
      v_item->>'product_name',nullif(v_item->>'image_url',''),
      (v_item->>'unit_price')::numeric,(v_item->>'quantity')::integer
    );

    if nullif(v_item->>'variant_id','') is not null then
      update public.halal_products
      set variants = (
        select jsonb_agg(
          case when value->>'id'=v_item->>'variant_id'
            then jsonb_set(value,'{stock}',to_jsonb(greatest(coalesce((value->>'stock')::integer,0) - (v_item->>'quantity')::integer,0)))
            else value end
        )
        from jsonb_array_elements(variants)
      ),
      updated_at=now()
      where id=(v_item->>'product_id')::uuid;
    else
      update public.halal_products
      set stock=stock-(v_item->>'quantity')::integer,updated_at=now()
      where id=(v_item->>'product_id')::uuid;
    end if;
  end loop;

  insert into public.halal_order_status_history(order_id,status,changed_at)
  values(v_order_id,v_order_status,now());

  return (
    select jsonb_build_object(
      'id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,
      'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,
      'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,
      'payment_method',o.payment_method,'status',o.status,'created_at',o.created_at,'updated_at',o.updated_at,
      'order_note',o.order_note,'items',v_item_rows
    ) from public.halal_orders o where o.id=v_order_id
  );
end;
$function$;

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

  perform set_config('halal.allow_stock_mutation','true',true);

  for v_item in
    select product_id,variant_id,quantity
    from public.halal_order_items
    where order_id=v_order.id and product_id is not null
    order by id
    for update
  loop
    if v_item.variant_id is not null then
      update public.halal_products p
      set variants = (
        select jsonb_agg(
          case when value->>'id'=v_item.variant_id
            then jsonb_set(value,'{stock}',to_jsonb(greatest(coalesce((value->>'stock')::integer,0) + v_item.quantity,0)))
            else value end
        )
        from jsonb_array_elements(p.variants)
      ),
      updated_at=now()
      where p.id=v_item.product_id;
    else
      update public.halal_products
      set stock=stock+v_item.quantity,updated_at=now()
      where id=v_item.product_id;
    end if;

    if not found then raise exception 'Product for cancelled order item no longer exists'; end if;
  end loop;

  update public.halal_orders set status='cancelled',updated_at=now() where id=v_order.id;
  insert into public.halal_order_status_history(order_id,status,changed_at)
  values(v_order.id,'cancelled',now());

  return jsonb_build_object('success',true,'order_code',v_order.order_code,'status','cancelled');
end;
$function$;

create or replace function private.get_halal_order_by_code_phone(p_order_code text,p_mobile text)
returns jsonb
language sql
security definer
set search_path to 'public','private'
as $function$
  select case when o.id is null then null else jsonb_build_object(
    'id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,
    'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,
    'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,
    'payment_method',o.payment_method,'status',o.status,'order_note',o.order_note,'created_at',o.created_at,
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'product_id',oi.product_id,'variant_id',oi.variant_id,'variant_name',oi.variant_name,
      'product_name',oi.product_name,'image_url',oi.image_url,'unit_price',oi.unit_price,
      'quantity',oi.quantity,'subtotal',oi.subtotal
    ) order by oi.id) from public.halal_order_items oi where oi.order_id=o.id),'[]'::jsonb')
  ) end
  from public.halal_orders o
  where upper(o.order_code)=upper(trim(p_order_code))
    and o.mobile=trim(p_mobile)
  limit 1;
$function$;

create or replace function private.get_halal_orders_by_mobile(p_mobile text)
returns jsonb
language sql
security definer
set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,
    'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,
    'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,
    'payment_method',o.payment_method,'status',o.status,'order_note',o.order_note,'created_at',o.created_at,
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'product_id',oi.product_id,'variant_id',oi.variant_id,'variant_name',oi.variant_name,
      'product_name',oi.product_name,'image_url',oi.image_url,'unit_price',oi.unit_price,
      'quantity',oi.quantity,'subtotal',oi.subtotal
    ) order by oi.id) from public.halal_order_items oi where oi.order_id=o.id),'[]'::jsonb')
  ) order by o.created_at desc),'[]'::jsonb)
  from public.halal_orders o
  where regexp_replace(coalesce(o.mobile,''),'[^0-9]','','g') =
        regexp_replace(coalesce(trim(p_mobile),''),'[^0-9]','','g')
    and length(regexp_replace(coalesce(trim(p_mobile),''),'[^0-9]','','g')) >= 11
  limit 20;
$function$;

create or replace function public.get_halal_order_by_code_phone(p_order_code text,p_mobile text)
returns jsonb language sql set search_path='public' as $function$
  select private.get_halal_order_by_code_phone(p_order_code,p_mobile);
$function$;

create or replace function public.get_halal_orders_by_mobile(p_mobile text)
returns jsonb language sql security invoker set search_path='' as $function$
  select private.get_halal_orders_by_mobile(p_mobile);
$function$;

revoke execute on function private.create_halal_order(jsonb) from public,anon,authenticated;
revoke execute on function private.customer_cancel_halal_order(text,text) from public,anon,authenticated;
revoke execute on function private.get_halal_order_by_code_phone(text,text) from public,anon,authenticated;
revoke execute on function private.get_halal_orders_by_mobile(text) from public,anon,authenticated;
grant execute on function private.create_halal_order(jsonb) to anon,authenticated;
grant execute on function private.customer_cancel_halal_order(text,text) to anon,authenticated;
grant execute on function private.get_halal_order_by_code_phone(text,text) to anon,authenticated;
grant execute on function private.get_halal_orders_by_mobile(text) to anon,authenticated;
