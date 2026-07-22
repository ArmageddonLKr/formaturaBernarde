-- Tabela de confirmações de presença da formatura
create table if not exists public.confirmacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  presenca boolean not null,
  qtd_pessoas int not null default 0,
  mensagem text,
  criado_em timestamptz not null default now()
);

alter table public.confirmacoes enable row level security;

-- Qualquer um pode confirmar presença (INSERT liberado para anon)
create policy "anon pode inserir confirmacoes"
  on public.confirmacoes
  for insert
  to anon
  with check (true);

-- Leitura liberada para anon: a "proteção" do admin é o link secreto da pasta,
-- não autenticação (conforme decisão do projeto).
create policy "anon pode ler confirmacoes"
  on public.confirmacoes
  for select
  to anon
  using (true);
