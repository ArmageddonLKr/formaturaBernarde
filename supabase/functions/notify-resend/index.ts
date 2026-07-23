// Supabase Edge Function: dispara e-mail ao Bernard via Resend
// a cada novo INSERT na tabela `confirmacoes` (chamada por um Database Webhook).
//
// Variaveis de ambiente necessarias (configurar como secrets da funcao, nunca hardcoded):
//   RESEND_API_KEY   -> chave da API do Resend
//   NOTIFY_TO_EMAIL  -> bernardejorge52@gmail.com
//   NOTIFY_FROM_EMAIL -> remetente verificado no Resend (ex: onboarding@resend.dev em modo teste)

// deno-lint-ignore-file no-explicit-any
Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record ?? payload;

    const nome: string = record.nome ?? "Convidado";
    const presenca: boolean = !!record.presenca;
    const qtdPessoas: number = record.qtd_pessoas ?? 0;
    const mensagem: string | null = record.mensagem ?? null;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const NOTIFY_TO_EMAIL = Deno.env.get("NOTIFY_TO_EMAIL") ?? "bernardejorge52@gmail.com";
    const NOTIFY_FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY nao configurada" }), { status: 500 });
    }

    const assunto = `Nova confirmacao: ${nome} - ${presenca ? "Sim" : "Nao"}`;
    const corpoHtml = `
      <p><strong>Nome:</strong> ${nome}</p>
      <p><strong>Vai comparecer:</strong> ${presenca ? "Sim" : "Nao"}</p>
      <p><strong>Quantidade de pessoas:</strong> ${presenca ? qtdPessoas : "-"}</p>
      <p><strong>Mensagem:</strong> ${mensagem ? mensagem : "(sem mensagem)"}</p>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM_EMAIL,
        to: [NOTIFY_TO_EMAIL],
        subject: assunto,
        html: corpoHtml,
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      return new Response(JSON.stringify({ error: "Falha ao enviar via Resend", details: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
