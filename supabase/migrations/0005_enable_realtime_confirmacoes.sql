-- Permite que o painel admin escute mudanças na tabela `confirmacoes` em
-- tempo real (Supabase Realtime), pra atualizar a lista de confirmações
-- sozinho assim que alguém confirma presença, sem precisar recarregar a
-- página nem tocar em "Atualizar lista". Seguro expor via Realtime porque
-- a tabela já tem RLS de leitura liberada pra anon (migração 0001).
alter publication supabase_realtime add table public.confirmacoes;
