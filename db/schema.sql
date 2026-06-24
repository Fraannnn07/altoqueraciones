-- =====================================================================
-- Al Toque Raciones — Esquema de base de datos (Supabase / Postgres)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- Idempotente: se puede correr de nuevo sin romper nada.
-- =====================================================================

-- ---------- Tablas ----------

create table if not exists products (
  id          bigint generated always as identity primary key,
  name        text    not null,
  description text    default '',
  category    text    not null check (category in ('perros_adultos','cachorros','gatos','accesorios','vet')),
  badge       text    default '',          -- texto que se muestra en la etiqueta (ej. "Premium", "Antipulgas")
  tier        text    not null default 'standard' check (tier in ('premium','standard','economico')), -- color de la etiqueta
  price       integer not null check (price >= 0), -- UYU, sin decimales
  image_url   text    default '',
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_products_active   on products (active);
create index if not exists idx_products_category on products (category);

create table if not exists orders (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  customer_name    text    not null,
  customer_phone   text    not null,
  customer_address text    default '',
  notes            text    default '',
  total            integer not null default 0,
  status           text    not null default 'pending' check (status in ('pending','paid','cancelled')),
  mp_preference_id text    default '',
  mp_payment_id    text    default ''
);

create index if not exists idx_orders_status     on orders (status);
create index if not exists idx_orders_created_at on orders (created_at desc);

create table if not exists order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint not null references orders(id) on delete cascade,
  product_id   bigint references products(id) on delete set null,
  product_name text    not null,   -- snapshot: no cambia si después se edita el producto
  unit_price   integer not null,   -- snapshot del precio al momento de la compra
  quantity     integer not null check (quantity > 0)
);

create index if not exists idx_order_items_order on order_items (order_id);

-- ---------- Seed de productos (migrados desde catalogo.html) ----------
-- Solo se inserta si la tabla está vacía, para no duplicar al re-ejecutar.

insert into products (name, description, category, badge, tier, price, sort_order)
select * from (values
  -- ===== PERROS ADULTOS =====
  ('Equilibrio Pollo','15+3 kg (18 kg total)','perros_adultos','Premium','premium',3400,10),
  ('Equilibrio Carne','15+3 kg (18 kg total)','perros_adultos','Premium','premium',2800,20),
  ('BioFresh Gigantes','15 kg · Ingredientes frescos, sin conservantes artificiales','perros_adultos','Super Premium','premium',4200,30),
  ('BioFresh Medianos','15 kg · Ingredientes frescos, sin conservantes artificiales','perros_adultos','Super Premium','premium',4200,40),
  ('BioFresh Pequeños','15 kg · Ingredientes frescos, sin conservantes artificiales','perros_adultos','Super Premium','premium',4200,50),
  ('Frost Adulto LB','15 kg · Razas grandes','perros_adultos','Premium','premium',3100,60),
  ('Dog Chow Adulto','21 kg · Marca Purina','perros_adultos','Estándar','standard',3100,70),
  ('Natural Dog','22 kg','perros_adultos','Estándar','standard',2100,80),
  ('Pedigree Carne','21 kg','perros_adultos','Estándar','standard',2400,90),
  ('Pedigree Razas Pequeñas','21 kg · Croquetas más chicas','perros_adultos','Estándar','standard',2900,100),
  ('Lager Premium Combo','22 kg + 10 kg regalo (32 kg total)','perros_adultos','Estándar','standard',2490,110),
  ('Primocao','20+7 kg (27 kg total)','perros_adultos','Estándar','standard',2300,120),
  ('Astro','14+3 kg (17 kg total)','perros_adultos','Económico','economico',2000,130),
  ('Fridy','25 kg · Gran rendimiento','perros_adultos','Económico','economico',1210,140),
  ('Keller','22 kg','perros_adultos','Económico','economico',1300,150),
  ('Rex','25 kg · Mejor relación precio-peso','perros_adultos','Económico','economico',1200,160),
  ('Toky / Tocky','25 kg','perros_adultos','Económico','economico',999,170),
  ('N&D Ancestral Adulto','15 kg · Ultra premium','perros_adultos','Super Premium','premium',5000,180),
  ('HPM Virbac Adulto','12 kg · Marca veterinaria de prestigio','perros_adultos','Super Premium','premium',5000,190),
  ('Pro Plan Adulto Perros','15 kg','perros_adultos','Super Premium','premium',4200,200),
  ('Frost Adulto SB','10.1 kg · Presentación más accesible','perros_adultos','Premium','premium',2700,210),
  ('Frost Senior','15 kg · Para perros mayores','perros_adultos','Premium','premium',3600,220),
  ('Balanced Cerdo y Arroz','15+3 kg (18 kg total) · Vitalcan premium','perros_adultos','Premium','premium',3600,230),
  ('Can Feed Adultos','15+3 kg (18 kg total) · Premium accesible','perros_adultos','Premium','premium',3200,240),
  ('Maxine Adulto','21 kg · Premium accesible','perros_adultos','Estándar','standard',2700,250),
  ('Lager Razas Pequeñas','22 kg · Croquetas más chicas','perros_adultos','Estándar','standard',2500,260),
  ('Lager Senior','22 kg · Para perros mayores','perros_adultos','Estándar','standard',2600,270),

  -- ===== CACHORROS =====
  ('Equilibrio Cachorro Carne','15+3 kg (18 kg total)','cachorros','Premium','premium',3400,10),
  ('BioFresh Cachorro Gigantes','15 kg · Ingredientes frescos','cachorros','Super Premium','premium',4200,20),
  ('BioFresh Cachorro Medianos','15 kg · Ingredientes frescos','cachorros','Super Premium','premium',4200,30),
  ('BioFresh Cachorro Pequeños','15 kg · Ingredientes frescos','cachorros','Super Premium','premium',4200,40),
  ('Frost Cachorro LB','15 kg · Razas grandes','cachorros','Premium','premium',3100,50),
  ('Dog Chow Cachorro','21 kg · Marca Purina','cachorros','Estándar','standard',3100,60),
  ('Dogui Cachorro','21 kg','cachorros','Estándar','standard',2400,70),
  ('Primocao Junior','20 kg','cachorros','Estándar','standard',2800,80),
  ('Lager Cachorro','22 kg','cachorros','Económico','economico',2300,90),
  ('Natural Dog Cachorro','14 kg','cachorros','Económico','economico',1800,100),

  -- ===== GATOS =====
  ('Pro Plan Adult Cat','7.5 kg','gatos','Super Premium','premium',3400,10),
  ('Pro Plan Adult Cat','15 kg','gatos','Super Premium','premium',6000,20),
  ('Cat Chow Country','15 kg · Marca Purina','gatos','Premium','premium',3400,30),
  ('Cat Chow','3 kg · Presentación accesible','gatos','Premium','premium',820,40),
  ('Frost Gato','7.5 kg','gatos','Premium','premium',3150,50),
  ('Equilibrio Gatos','7.5 kg','gatos','Premium','premium',2000,60),
  ('Equilibrio Gatos Castrados','7.5 kg · Fórmula para castrados','gatos','Premium','premium',2100,70),
  ('Whiskas','10 kg · Marca icónica','gatos','Estándar','standard',2200,80),
  ('Nero Cat','20 kg','gatos','Estándar','standard',2400,90),
  ('Lager Gato','22 kg','gatos','Económico','economico',2600,100),
  ('Excellent Adult Cat','7.5 kg · Purina premium','gatos','Premium','premium',2400,110),
  ('Frost Kitten','7.5 kg · Gatos cachorro','gatos','Premium','premium',2600,120),

  -- ===== ACCESORIOS =====
  ('Sanitario Pellets','15 kg','accesorios','Sanitario','standard',250,10),
  ('Piedras para gato','~2 kg','accesorios','Sanitario','standard',250,20),
  ('Dentastix Razas Medianas','Snack dental · Alta demanda','accesorios','Snack','premium',1350,30),
  ('Churu Sticks Gatos','Snack cremoso · 3 variedades','accesorios','Snack','premium',1100,40),
  ('Huesos de Lonja','Snacks naturales · Pack 6 unidades','accesorios','Snack','standard',900,50),

  -- ===== VET Y SANITARIOS — Antipulgas =====
  ('NexGard','2 a 4 kg','vet','Antipulgas','premium',380,10),
  ('NexGard','4 a 10 kg','vet','Antipulgas','premium',430,20),
  ('NexGard','10 a 25 kg','vet','Antipulgas','premium',530,30),
  ('NexGard','25 a 50 kg','vet','Antipulgas','premium',750,40),
  ('NexGard Spectra','XS 2-3.5 kg · Premium','vet','Antipulgas','premium',490,50),
  ('NexGard Spectra','S 3.5-7 kg','vet','Antipulgas','premium',600,60),
  ('NexGard Spectra','M 7-15 kg','vet','Antipulgas','premium',770,70),
  ('NexGard Spectra','L 15-30 kg','vet','Antipulgas','premium',840,80),
  ('NexGard Spectra','XL 30-60 kg','vet','Antipulgas','premium',950,90),
  ('Bravecto','2 a 4 kg · 3 meses protección','vet','Antipulgas','premium',390,100),
  ('Bravecto','4 a 10 kg · 3 meses protección','vet','Antipulgas','premium',440,110),
  ('Bravecto','10 a 20 kg · 3 meses protección','vet','Antipulgas','premium',520,120),
  ('Bravecto','20 a 40 kg · 3 meses protección','vet','Antipulgas','premium',720,130),
  ('Supraline (Gato)','Comprimido x1','vet','Antipulgas','premium',380,140),
  -- Pipetas
  ('Pipeta Dominal','Hasta 5 kg','vet','Pipeta','standard',300,150),
  ('Pipeta Dominal','5 a 10 kg','vet','Pipeta','standard',310,160),
  ('Pipeta Dominal','10 a 25 kg','vet','Pipeta','standard',390,170),
  ('Pipeta Dominal','25 a 40 kg','vet','Pipeta','standard',480,180),
  ('Pipeta Dominal','+40 kg','vet','Pipeta','standard',620,190),
  ('Pipeta Dominal Gato','Gato -4 kg','vet','Pipeta','standard',260,200),
  ('Pipeta Dominal Gato','Gato +4 kg','vet','Pipeta','standard',295,210),
  ('Revolution','Gatos · Muy buscado','vet','Pipeta','premium',780,220),
  -- Collares
  ('Collar Dominal','Cachorro 0-5 kg','vet','Collar','standard',530,230),
  ('Collar Dominal','Medianos 5-15 kg','vet','Collar','standard',560,240),
  ('Collar Dominal','Grande 15-40 kg','vet','Collar','standard',700,250),
  ('Collar Dominal','Extra Grande +40 kg','vet','Collar','standard',820,260),
  ('Collar Dominal Gato','Gato','vet','Collar','standard',500,270),
  -- Arenas
  ('Cat Litter Bentonita','Funda 4x4 kg (16 kg total) · Varios aromas: lavanda, limón, rosa, sin aroma','vet','Arena','standard',1150,280),
  ('Cat Litter Bentonita 8kg x2','Funda 2x8 kg (16 kg total)','vet','Arena','standard',1080,290),
  ('Cat Litter Bentonita','Bolsa 20 kg','vet','Arena','standard',1200,300),
  ('Cat Litter Bentonita','Bolsa 24 kg','vet','Arena','standard',1450,310),
  ('Cat Sand Silica Gel','Caja 8x3.8 Lt · Premium','vet','Arena','premium',2100,320),
  ('Cat Litter Tofu','Caja 8x2.5 kg · Ecológica','vet','Arena','premium',3400,330),
  ('Organicat Diatomea','Funda 10x2 kg · Natural','vet','Arena','standard',950,340),
  ('Organicat','7 kg','vet','Arena','standard',300,350),
  ('Lager Sanitario','2 kg x6 unidades · Suelto $200/u','vet','Arena','economico',1100,360),
  -- Casillas
  ('Casilla Perro N°3','60x42x40 cm · Perros chicos','vet','Casilla','standard',1450,370),
  ('Casilla Perro N°4','67x46x41 cm','vet','Casilla','standard',1900,380),
  ('Casilla Perro N°5','74x56x54 cm','vet','Casilla','standard',2700,390),
  ('Casilla Perro N°6','84x67x61 cm · Perros grandes','vet','Casilla','standard',3600,400),
  -- Otros
  ('Shampoo Dominal','250 ml','vet','Higiene','standard',450,410),
  ('Appryl','Caja x240 comprimidos','vet','Salud','standard',3600,420),
  ('Curamic','440 ml','vet','Salud','standard',420,430),
  ('Bandeja sanitaria gato','58x38x14 cm','vet','Accesorio','standard',330,440)
) as seed(name, description, category, badge, tier, price, sort_order)
where not exists (select 1 from products);
