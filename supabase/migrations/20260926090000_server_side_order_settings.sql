-- Server-side enforcement for checkout settings.
-- The frontend keeps its validation for immediate UX feedback, while this function
-- remains authoritative for direct RPC/API callers.

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
  v_idempotency_key uuid; v_existing public.halal_orders%rowtype; v_order_id uuid:=gen_random_uuid(); v_order_code text;
  v_subtotal numeric:=0; v_delivery_fee numeric:=0; v_total numeric:=0; v_free_threshold numeric:=1000; v_dhaka_fee numeric:=80; v_outside_fee numeric:=121; v_is_dhaka boolean:=false;
  v_min_order numeric:=0; v_cod_min numeric:=0; v_cod_max numeric:=0; v_cod_enabled boolean:=true; v_auto_confirm boolean:=false; v_store_status text:='open'; v_order_status text:='pending';
  v_item jsonb; v_product public.halal_products%rowtype; v_quantity integer; v_item_total numeric; v_item_rows jsonb:='[]'::jsonb; v_product_id uuid;
begin
  if nullif(payload->>'idempotencyKey','') is not null then
    begin v_idempotency_key:=(payload->>'idempotencyKey')::uuid; exception when invalid_text_representation then raise exception 'Invalid idempotency key'; end;
    perform pg_advisory_xact_lock(hashtextextended(v_idempotency_key::text,0));
    select * into v_existing from public.halal_orders where idempotency_key=v_idempotency_key limit 1;
    if found then
      return (select jsonb_build_object('id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,'payment_method',o.payment_method,'status',o.status,'created_at',o.created_at,'updated_at',o.updated_at,'order_note',o.order_note,'items',coalesce((select jsonb_agg(jsonb_build_object('product_id',oi.product_id,'product_name',oi.product_name,'image_url',oi.image_url,'unit_price',oi.unit_price,'quantity',oi.quantity,'subtotal',oi.subtotal) order by oi.id) from public.halal_order_items oi where oi.order_id=o.id),'[]'::jsonb)) from public.halal_orders o where o.id=v_existing.id);
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

  v_is_dhaka:=lower(coalesce(v_address->>'district','')) in ('dhaka','ঢাকা','ঢাকা (মেট্রো / সিটি)') or lower(coalesce(v_address->>'city',''))='dhaka' or coalesce(v_address->>'city','')='ঢাকা';

  for v_item in select value from jsonb_array_elements(v_items) loop
    if coalesce(v_item->>'productId','')='' then raise exception 'Invalid product'; end if;
    if coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]*$' then raise exception 'Invalid quantity for product %',v_item->>'productId'; end if;
    begin v_product_id:=(v_item->>'productId')::uuid; exception when invalid_text_representation then raise exception 'Invalid product'; end;
  end loop;

  for v_item in select jsonb_build_object('productId',x.product_id,'quantity',x.quantity) from (select (value->>'productId')::uuid product_id,sum((value->>'quantity')::integer)::integer quantity from jsonb_array_elements(v_items) group by (value->>'productId')::uuid) x loop
    v_product_id:=(v_item->>'productId')::uuid; v_quantity:=(v_item->>'quantity')::integer;
    select * into v_product from public.halal_products where id=v_product_id and is_active=true for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_quantity>v_product.stock then raise exception 'Insufficient stock'; end if;
    v_item_total:=v_product.price*v_quantity; v_subtotal:=v_subtotal+v_item_total;
    v_item_rows:=v_item_rows||jsonb_build_array(jsonb_build_object('product_id',v_product.id,'product_name',v_product.name_bn,'image_url',v_product.image_url,'unit_price',v_product.price,'quantity',v_quantity,'subtotal',v_item_total));
  end loop;

  if v_subtotal<v_free_threshold then v_delivery_fee:=case when v_is_dhaka then v_dhaka_fee else v_outside_fee end; end if;
  v_total:=v_subtotal+v_delivery_fee;
  if v_min_order > 0 and v_total < v_min_order then raise exception 'Minimum order amount is %', v_min_order; end if;
  if v_cod_min > 0 and v_total < v_cod_min then raise exception 'Cash on Delivery minimum order is %', v_cod_min; end if;
  if v_cod_max > 0 and v_total > v_cod_max then raise exception 'Cash on Delivery maximum order is %', v_cod_max; end if;
  if v_auto_confirm then v_order_status:='confirmed'; end if;

  loop v_order_code:='HS'||to_char(now(),'YYMMDD')||upper(substr(md5(gen_random_uuid()::text),1,6)); exit when not exists(select 1 from public.halal_orders where order_code=v_order_code); end loop;
  begin
    insert into public.halal_orders(id,order_code,customer_name,mobile,alt_mobile,address_mode,address,subtotal,discount,delivery_fee,total,payment_method,status,order_note,idempotency_key)
    values(v_order_id,v_order_code,v_customer_name,v_mobile,v_alt_mobile,v_address_mode,v_address,v_subtotal,0,v_delivery_fee,v_total,'cod',v_order_status,v_order_note,v_idempotency_key);
  exception when unique_violation then
    if v_idempotency_key is not null then
      select * into v_existing from public.halal_orders where idempotency_key=v_idempotency_key;
      if found then
        return (select jsonb_build_object('id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,'payment_method',o.payment_method,'status',o.status,'created_at',o.created_at,'updated_at',o.updated_at,'order_note',o.order_note,'items',coalesce((select jsonb_agg(jsonb_build_object('product_id',oi.product_id,'product_name',oi.product_name,'image_url',oi.image_url,'unit_price',oi.unit_price,'quantity',oi.quantity,'subtotal',oi.subtotal) order by oi.id) from public.halal_order_items oi where oi.order_id=o.id),'[]'::jsonb)) from public.halal_orders o where o.id=v_existing.id);
      end if;
    end if;
    raise;
  end;

  perform set_config('halal.allow_stock_mutation','true',true);
  for v_item in select * from jsonb_array_elements(v_item_rows) loop
    insert into public.halal_order_items(id,order_id,product_id,product_name,image_url,unit_price,quantity)
    values(gen_random_uuid(),v_order_id,(v_item->>'product_id')::uuid,v_item->>'product_name',nullif(v_item->>'image_url',''),(v_item->>'unit_price')::numeric,(v_item->>'quantity')::integer);
    update public.halal_products set stock=stock-(v_item->>'quantity')::integer,updated_at=now() where id=(v_item->>'product_id')::uuid;
  end loop;
  insert into public.halal_order_status_history(order_id,status,changed_at) values(v_order_id,v_order_status,now());
  return (select jsonb_build_object('id',o.id,'order_code',o.order_code,'customer_name',o.customer_name,'mobile',o.mobile,'alt_mobile',o.alt_mobile,'address_mode',o.address_mode,'address',o.address,'subtotal',o.subtotal,'discount',o.discount,'delivery_fee',o.delivery_fee,'total',o.total,'payment_method',o.payment_method,'status',o.status,'created_at',o.created_at,'updated_at',o.updated_at,'order_note',o.order_note,'items',v_item_rows) from public.halal_orders o where o.id=v_order_id);
end;
$function$;