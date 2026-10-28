-- Ventas del mostrador: registro de ventas, comprobante no fiscal y caja por día/semana/mes.
-- RLS activado y sin políticas: solo el servidor (service_role) puede leer/escribir.

-- Costo de cada producto (lo que le cuesta la bolsa al negocio). En una tabla aparte para que ninguna
-- consulta del sitio público lo lea por error.
create table if not exists public.product_costs (
  product_id  bigint primary key references public.products(id) on delete cascade,
  cost_uyu    integer not null check (cost_uyu >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sales (
  id              bigint generated always as identity primary key,
  number          integer not null unique,            -- número del comprobante (1, 2, 3…)
  sold_at         timestamptz not null default now(),
  sold_on         date not null,                      -- día de la venta en Montevideo (para la caja)
  customer_name   text not null default '',           -- opcional
  customer_phone  text not null default '',           -- opcional, 09xxxxxxx
  payment_method  text not null default 'efectivo',
  notes           text not null default '',           -- sale en el comprobante
  subtotal_uyu    integer not null default 0,
  discount_uyu    integer not null default 0 check (discount_uyu >= 0),
  total_uyu       integer not null default 0,
  cost_uyu        integer not null default 0,         -- suma de los costos conocidos
  cost_complete   boolean not null default false,     -- todas las líneas tienen costo: la ganancia es real
  voided          boolean not null default false,     -- anulada: no cuenta en la caja
  search_text     text not null default '',           -- cliente, celular, productos y nota, sin tildes
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_sales_sold_on on public.sales (sold_on desc);
create index if not exists idx_sales_sold_at on public.sales (sold_at desc);

create table if not exists public.sale_items (
  id              bigint generated always as identity primary key,
  sale_id         bigint not null references public.sales(id) on delete cascade,
  product_id      bigint references public.products(id) on delete set null,  -- null = concepto libre (ej. envío)
  description     text not null,
  quantity        integer not null check (quantity > 0),
  unit_price_uyu  integer not null check (unit_price_uyu >= 0),
  unit_cost_uyu   integer check (unit_cost_uyu >= 0),                         -- null = costo desconocido
  line_total_uyu  integer not null,
  sort_order      integer not null default 0
);

create index if not exists idx_sale_items_sale on public.sale_items (sale_id);

alter table public.product_costs enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop trigger if exists trg_sales_updated_at on public.sales;
create trigger trg_sales_updated_at before update on public.sales
  for each row execute function set_updated_at();

drop trigger if exists trg_product_costs_updated_at on public.product_costs;
create trigger trg_product_costs_updated_at before update on public.product_costs
  for each row execute function set_updated_at();

-- Crea (p_id null) o reemplaza una venta con sus líneas en una sola transacción. Los totales se calculan
-- acá, a partir de las líneas, para que nunca queden desparejos. p_sale.sold_at llega en hora de
-- Montevideo ('2026-10-28T14:30').
create or replace function public.save_sale(p_id bigint, p_sale jsonb, p_items jsonb)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_id       bigint := p_id;
  v_number   integer;
  v_sold_at  timestamptz := (p_sale->>'sold_at')::timestamp at time zone 'America/Montevideo';
  v_subtotal integer;
  v_cost     integer;
  v_complete boolean;
  v_discount integer;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;

  if v_id is null then
    -- Un número por vez: dos ventas guardadas al mismo tiempo no pueden tomar el mismo.
    perform pg_advisory_xact_lock(hashtext('sales_number'));
    select coalesce(max(number), 0) + 1 into v_number from sales;
    insert into sales (number, sold_at, sold_on)
      values (v_number, v_sold_at, (v_sold_at at time zone 'America/Montevideo')::date)
      returning id into v_id;
  else
    update sales set sold_at = v_sold_at, sold_on = (v_sold_at at time zone 'America/Montevideo')::date
      where id = v_id returning number into v_number;
    if not found then
      raise exception 'No existe la venta %', v_id;
    end if;
    delete from sale_items where sale_id = v_id;
  end if;

  insert into sale_items (sale_id, product_id, description, quantity, unit_price_uyu, unit_cost_uyu, line_total_uyu, sort_order)
  select v_id,
         nullif(item->>'product_id', '')::bigint,
         item->>'description',
         (item->>'quantity')::integer,
         (item->>'unit_price_uyu')::integer,
         nullif(item->>'unit_cost_uyu', '')::integer,
         (item->>'quantity')::integer * (item->>'unit_price_uyu')::integer,
         (ord - 1)::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);

  select sum(line_total_uyu),
         coalesce(sum(unit_cost_uyu * quantity) filter (where unit_cost_uyu is not null), 0),
         bool_and(unit_cost_uyu is not null)
    into v_subtotal, v_cost, v_complete
    from sale_items where sale_id = v_id;
  v_discount := least(greatest(coalesce((p_sale->>'discount_uyu')::integer, 0), 0), v_subtotal);

  update sales set
    customer_name  = coalesce(p_sale->>'customer_name', ''),
    customer_phone = coalesce(p_sale->>'customer_phone', ''),
    payment_method = coalesce(p_sale->>'payment_method', 'efectivo'),
    notes          = coalesce(p_sale->>'notes', ''),
    subtotal_uyu   = v_subtotal,
    discount_uyu   = v_discount,
    total_uyu      = v_subtotal - v_discount,
    cost_uyu       = v_cost,
    cost_complete  = v_complete,
    search_text    = trim(coalesce(p_sale->>'search_text', '') || ' ' || v_number)
  where id = v_id;

  return v_id;
end;
$$;

revoke execute on function public.save_sale(bigint, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_sale(bigint, jsonb, jsonb) to service_role;

-- Caja por día (sin las anuladas). La ganancia solo suma las ventas con todos los costos cargados.
create or replace view public.sales_daily with (security_invoker = on) as
  select sold_on as day,
         count(*) as sales_count,
         sum(total_uyu) as total_uyu,
         coalesce(sum(total_uyu - cost_uyu) filter (where cost_complete), 0) as profit_uyu,
         coalesce(sum(total_uyu) filter (where cost_complete), 0) as total_with_cost_uyu,
         count(*) filter (where not cost_complete) as sales_without_cost
  from public.sales
  where not voided
  group by sold_on;

-- Caja por día y medio de pago (para cerrar la caja: cuánto entró en efectivo, por transferencia…).
create or replace view public.sales_daily_payments with (security_invoker = on) as
  select sold_on as day, payment_method, count(*) as sales_count, sum(total_uyu) as total_uyu
  from public.sales
  where not voided
  group by sold_on, payment_method;

revoke all on public.sales_daily, public.sales_daily_payments from anon, authenticated;
