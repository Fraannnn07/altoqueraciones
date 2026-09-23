-- =====================================================================
-- Al Toque Raciones — Esquema de base de datos (Supabase / Postgres)
-- Rediseño completo para la reconstrucción del sitio (v1).
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run.
-- Idempotente: se puede correr de nuevo sin romper nada.
-- =====================================================================

-- ---------- brands ----------

create table if not exists brands (
  id                bigint generated always as identity primary key,
  name              text not null,
  slug              text not null unique,
  logo_path         text default '',            -- Supabase Storage path (bucket "product-images")
  description       text not null default '',   -- copy propia para /marcas/{slug}/
  meta_title        text,
  meta_description  text,
  active            boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_brands_active on brands (active);

-- ---------- categories (jerarquía a 2 niveles vía parent_id) ----------

create table if not exists categories (
  id                bigint generated always as identity primary key,
  parent_id         bigint references categories(id) on delete restrict,
  name              text not null,
  slug              text not null,
  species           text check (species in ('perro', 'gato', null)),
  intro_html        text not null default '',   -- copy propia para diferenciar la página (evita thin content)
  faq               jsonb not null default '[]', -- [{question, answer}, ...]
  meta_title        text,
  meta_description  text,
  image_path        text default '',
  active            boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (parent_id, slug)
);

create index if not exists idx_categories_parent on categories (parent_id);
create index if not exists idx_categories_active on categories (active);

-- ---------- products ----------

create table if not exists products (
  id                 bigint generated always as identity primary key,
  slug               text not null unique,
  previous_slugs     text[] not null default '{}',  -- slugs viejos: evita 404 propios al renombrar
  name               text not null,
  brand_id           bigint not null references brands(id),
  category_id        bigint not null references categories(id),
  presentation       text not null default '',      -- ej. "15+3 kg", "M 7-15 kg"
  short_description  text not null default '',
  long_description   text not null default '',      -- markdown, copy propia (no copiada de competidores)
  benefits           jsonb not null default '[]',    -- string[]
  characteristics    jsonb not null default '[]',    -- string[]
  price_uyu          integer not null check (price_uyu >= 0),
  tier               text not null default 'standard' check (tier in ('premium', 'standard', 'economico')),
  stock_status       text not null default 'in_stock' check (stock_status in ('in_stock', 'out_of_stock')),
  sku                text,
  active             boolean not null default true,
  featured           boolean not null default false,
  meta_title         text,
  meta_description   text,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz
);

create index if not exists idx_products_active_category on products (category_id) where active;
create index if not exists idx_products_active_brand on products (brand_id) where active;
create index if not exists idx_products_slug on products (slug);

-- ---------- product_images ----------

create table if not exists product_images (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references products(id) on delete cascade,
  storage_path  text not null,          -- bucket "product-images"
  alt_text      text not null default '',
  width         integer,
  height        integer,
  is_primary    boolean not null default false,
  sort_order    integer not null default 0
);

create index if not exists idx_product_images_product on product_images (product_id);

-- ---------- guides (guías / blog nuevo) ----------

create table if not exists guides (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  title             text not null,
  excerpt           text not null default '',
  body_markdown     text not null default '',
  cover_image_path  text default '',
  meta_title        text,
  meta_description  text,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  legacy_urls       text[] not null default '{}',  -- documenta qué URL(s) vieja(s) 301 redirigen acá
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_guides_status on guides (status);

create table if not exists guide_related_products (
  guide_id    bigint not null references guides(id) on delete cascade,
  product_id  bigint not null references products(id) on delete cascade,
  sort_order  integer not null default 0,
  primary key (guide_id, product_id)
);

-- ---------- vistas de apoyo (regla "sin categorías/marcas vacías") ----------

create or replace view category_active_product_counts as
  select category_id, count(*) as n
  from products
  where active
  group by category_id;

create or replace view brand_active_product_counts as
  select brand_id, count(*) as n
  from products
  where active
  group by brand_id;

-- ---------- updated_at automático ----------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brands_updated_at on brands;
create trigger trg_brands_updated_at before update on brands
  for each row execute function set_updated_at();

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_guides_updated_at on guides;
create trigger trg_guides_updated_at before update on guides
  for each row execute function set_updated_at();

-- ---------- Row Level Security ----------
-- Todo el acceso (lectura y escritura) pasa por el cliente de service role en el
-- servidor (Next.js Server Components / Server Actions). Esta app nunca expone una
-- anon key al navegador, así que no hace falta ninguna policy: con RLS habilitado y
-- cero policies, solo el service role (que bypassea RLS) puede leer o escribir.

alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table guides enable row level security;
alter table guide_related_products enable row level security;

-- ---------- categorías iniciales (estructura fija del sitio) ----------
-- Solo inserta si la tabla está vacía, para no duplicar al re-ejecutar.

insert into categories (name, slug, species, sort_order)
select * from (values
  ('Raciones para Perros', 'raciones-perros', 'perro', 10),
  ('Raciones para Gatos', 'raciones-gatos', 'gato', 20),
  ('Antipulgas y Desparasitantes', 'antipulgas', null, 30),
  ('Snacks', 'snacks', null, 40),
  ('Arena para Gatos', 'arena-gatos', 'gato', 50),
  ('Accesorios para Perros', 'accesorios-perros', 'perro', 60)
) as v(name, slug, species, sort_order)
where not exists (select 1 from categories);

insert into categories (parent_id, name, slug, species, sort_order)
select c.id, v.name, v.slug, 'perro', v.sort_order
from (values
  ('Adultos', 'adultos', 10),
  ('Cachorros', 'cachorros', 20),
  ('Senior', 'senior', 30),
  ('Razas Pequeñas', 'razas-pequenas', 40)
) as v(name, slug, sort_order)
cross join (select id from categories where slug = 'raciones-perros' and parent_id is null) as c
where not exists (
  select 1 from categories sub
  where sub.parent_id = c.id and sub.slug = v.slug
);

insert into categories (parent_id, name, slug, species, sort_order)
select c.id, v.name, v.slug, 'gato', v.sort_order
from (values
  ('Adultos', 'adultos', 10),
  ('Gatitos', 'gatitos', 20),
  ('Castrados', 'castrados', 30)
) as v(name, slug, sort_order)
cross join (select id from categories where slug = 'raciones-gatos' and parent_id is null) as c
where not exists (
  select 1 from categories sub
  where sub.parent_id = c.id and sub.slug = v.slug
);
