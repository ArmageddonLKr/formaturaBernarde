-- O upsert (INSERT ... ON CONFLICT DO UPDATE) usado pelo painel pra
-- registrar/atualizar a assinatura de push precisa conseguir enxergar a
-- linha existente pra detectar o conflito, mesmo com policies de
-- INSERT/UPDATE liberadas. Sem uma policy de SELECT pra anon, o Postgres
-- nega com "new row violates row-level security policy" nesse caso
-- específico. Como a tabela só guarda endpoint/keys de push (nada sensível
-- de usuário), liberar leitura pra anon aqui não muda o modelo de proteção
-- do projeto (que já é o link secreto do painel, não autenticação).
create policy "anon pode ler push subscriptions (necessario pro upsert)"
  on public.push_subscriptions
  for select
  to anon
  using (true);
