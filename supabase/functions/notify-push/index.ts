// Supabase Edge Function: envia uma notificação push (Web Push API) para o
// painel admin instalado como PWA, a cada novo INSERT na tabela `confirmacoes`
// (chamada por um Database Webhook).
//
// Variaveis de ambiente necessarias (configurar como secrets da funcao, nunca hardcoded):
//   VAPID_PUBLIC_KEY  -> chave publica VAPID (a mesma usada em painel-x7k2p9/index.html)
//   VAPID_PRIVATE_KEY -> chave privada VAPID (NUNCA expor no HTML)
//   VAPID_SUBJECT     -> ex: mailto:bernardejorge52@gmail.com
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao injetadas automaticamente pelo runtime.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? payload;

    const nome: string = record.nome ?? "Convidado";
    const presenca: boolean = !!record.presenca;
    const qtdPessoas: number = record.qtd_pessoas ?? 0;

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:bernardejorge52@gmail.com";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "VAPID keys nao configuradas" }), { status: 500 });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const { data: subs, error } = await supabase.from("push_subscriptions").select("id, endpoint, keys");
    if (error) throw error;

    const title = `Nova confirmação: ${nome}`;
    const body = presenca
      ? `Vai comparecer — ${qtdPessoas} ${qtdPessoas === 1 ? "pessoa" : "pessoas"}`
      : "Não poderá comparecer";

    const staleIds: string[] = [];

    await Promise.allSettled(
      (subs ?? []).map(async (s: { id: string; endpoint: string; keys: unknown }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: s.keys } as any,
            JSON.stringify({ title, body }),
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            staleIds.push(s.id);
          }
        }
      }),
    );

    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(JSON.stringify({ ok: true, sent: (subs ?? []).length - staleIds.length }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
