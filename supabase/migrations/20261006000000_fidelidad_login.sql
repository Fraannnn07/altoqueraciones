-- Login de clientes de la tarjeta de sellos.
-- El admin genera un código de acceso por tarjeta (se guarda solo el hash scrypt) y el cliente entra
-- con celular + código. Después de varios intentos fallidos la tarjeta queda bloqueada un rato.
alter table public.loyalty_cards
  add column if not exists access_code_hash text,
  add column if not exists login_failures integer not null default 0,
  add column if not exists login_blocked_until timestamptz;
