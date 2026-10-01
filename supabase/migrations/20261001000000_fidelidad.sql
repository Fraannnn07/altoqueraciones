-- Tarjeta de sellos Al Toque Raciones
-- RLS activado y sin políticas: solo el servidor (service_role) puede leer/escribir.

create table if not exists public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phone text not null unique,
  stamps integer not null default 0 check (stamps >= 0),
  rewards_redeemed integer not null default 0,
  apple_auth_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_events (
  id bigint generated always as identity primary key,
  card_id uuid not null references public.loyalty_cards(id) on delete cascade,
  kind text not null check (kind in ('stamp', 'unstamp', 'redeem')),
  stamps_after integer not null,
  created_at timestamptz not null default now()
);
create index if not exists loyalty_events_card_idx on public.loyalty_events (card_id, created_at desc);

create table if not exists public.apple_wallet_registrations (
  device_library_id text not null,
  serial_number uuid not null references public.loyalty_cards(id) on delete cascade,
  push_token text not null,
  created_at timestamptz not null default now(),
  primary key (device_library_id, serial_number)
);
create index if not exists apple_wallet_reg_serial_idx on public.apple_wallet_registrations (serial_number);

alter table public.loyalty_cards enable row level security;
alter table public.loyalty_events enable row level security;
alter table public.apple_wallet_registrations enable row level security;

-- Sumar / quitar sello o canjear premio en una sola operación atómica
create or replace function public.loyalty_apply(p_card uuid, p_kind text, p_goal integer)
returns setof public.loyalty_cards
language plpgsql
set search_path = public
as $$
declare
  r public.loyalty_cards;
begin
  if p_kind = 'stamp' then
    update loyalty_cards set stamps = least(stamps + 1, p_goal), updated_at = now()
      where id = p_card and stamps < p_goal returning * into r;
  elsif p_kind = 'unstamp' then
    update loyalty_cards set stamps = stamps - 1, updated_at = now()
      where id = p_card and stamps > 0 returning * into r;
  elsif p_kind = 'redeem' then
    update loyalty_cards set stamps = stamps - p_goal, rewards_redeemed = rewards_redeemed + 1, updated_at = now()
      where id = p_card and stamps >= p_goal returning * into r;
  else
    raise exception 'Acción inválida: %', p_kind;
  end if;

  if r.id is not null then
    insert into loyalty_events (card_id, kind, stamps_after) values (r.id, p_kind, r.stamps);
    return next r;
  end if;
end;
$$;

revoke execute on function public.loyalty_apply(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.loyalty_apply(uuid, text, integer) to service_role;
