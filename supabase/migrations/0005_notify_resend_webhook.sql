-- Canal reserva de aviso: além da notificação push (que depende de o
-- navegador manter uma assinatura válida e permissão concedida), dispara
-- também um e-mail via Resend a cada nova confirmação. E-mail não depende
-- do estado do navegador/dispositivo no momento exato, então é mais
-- confiável como reforço caso o push falhe silenciosamente por qualquer
-- motivo (assinatura expirada, permissão negada sem querer, etc).
--
-- Só funciona depois de configurar o secret RESEND_API_KEY na função
-- notify-resend (ver README).
create trigger "notify-resend-confirmacao"
after insert on public.confirmacoes
for each row execute function supabase_functions.http_request(
  'https://fvnwhqelqwoppuhkvpww.supabase.co/functions/v1/notify-resend',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
