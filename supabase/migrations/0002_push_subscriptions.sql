-- Assinaturas de notificação push do painel admin (Web Push API)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys jsonb not null,
  criado_em timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- O painel admin (anon) pode registrar sua própria assinatura de push.
-- Leitura/envio é feito pela Edge Function com a service role key, não por anon.
create policy "anon pode registrar push subscription"
  on public.push_subscriptions
  for insert
  to anon
  with check (true);

create policy "anon pode atualizar sua propria subscription"
  on public.push_subscriptions
  for update
  to anon
  using (true)
  with check (true);
