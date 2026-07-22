# Formatura do Bernard — Confirmação de Presença

Site estático (GitHub Pages) com convite público + formulário de confirmação de presença, e um painel admin secreto para o Bernard acompanhar as confirmações.

- **Evento:** Engenharia de Produção – UFPI, 08/08/2026 (sábado), 19:00/19:30, Auditório Tupperware, Avenida Frei Serafim, 1967.
- **Banco de dados:** Supabase — já conectado (projeto `fvnwhqelqwoppuhkvpww`), tabela criada, RLS configurado e credenciais já preenchidas nos dois HTMLs.
- **Envio de e-mail:** Resend (via Supabase Edge Function) — função já publicada, falta só a chave da API do Resend (passo 2).

## Estrutura

```
/index.html              → convite público + formulário de confirmação
/painel-x7k2p9/index.html → painel admin (lista completa + estatísticas) — link secreto, não referenciado em nenhum lugar do site público
/assets/foto-convite.jpg  → arte do convite usada como imagem de topo
/supabase/migrations/0001_confirmacoes.sql → schema da tabela + políticas de RLS (já aplicado no projeto)
/supabase/functions/notify-resend/index.ts → Edge Function que envia e-mail ao Bernard a cada confirmação (já publicada)
```

## 1. Supabase (já feito)

O projeto Supabase já está conectado:

- Tabela `confirmacoes` criada (`id`, `nome`, `presenca`, `qtd_pessoas`, `mensagem`, `criado_em`)
- RLS habilitado, com policy de `INSERT` e `SELECT` liberadas para o papel `anon`
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` já preenchidos em `index.html` e `painel-x7k2p9/index.html`

A "proteção" do painel admin é apenas o link secreto (pasta `painel-x7k2p9`) — não há autenticação por senha, conforme decidido para esse caso de uso. A `anon key` é pública por natureza (é isso que o SDK do Supabase usa no navegador) — a segurança real vem das políticas de RLS, já restritas ao necessário.

Se precisar reconferir ou trocar de projeto Supabase no futuro, pegue os valores em **Project Settings → API** e atualize as duas constantes no topo do `<script>` de cada HTML.

## 2. Configurar o Resend (envio de e-mail ao Bernard)

A Edge Function `notify-resend` já está publicada no projeto (sem verificação de JWT, pois é acionada por um Database Webhook interno). Falta só:

1. Criar uma conta grátis em [resend.com](https://resend.com) (não pede cartão).
2. Gerar uma **API Key** em **API Keys**.
3. (Opcional, recomendado) Verificar um domínio próprio em **Domains** para enviar de um endereço tipo `convite@seudominio.com`. Sem domínio verificado, use o remetente de teste `onboarding@resend.dev` (funciona, mas só entrega para o e-mail da conta Resend usada — para produção, verifique um domínio).

### Configurar os secrets da função (nunca hardcode a API key no HTML)

Com a Supabase CLI logada no projeto:

```bash
supabase secrets set RESEND_API_KEY=SEU_TOKEN_RESEND --project-ref fvnwhqelqwoppuhkvpww
supabase secrets set NOTIFY_TO_EMAIL=bernardejorge52@gmail.com --project-ref fvnwhqelqwoppuhkvpww
supabase secrets set NOTIFY_FROM_EMAIL=onboarding@resend.dev --project-ref fvnwhqelqwoppuhkvpww
```

(Ou pelo painel do Supabase: **Edge Functions → notify-resend → Secrets**.)

### Disparar a função a cada INSERT

No painel do Supabase, vá em **Database → Webhooks → Create a new hook**:

- **Table:** `confirmacoes`
- **Events:** `Insert`
- **Type:** `Supabase Edge Functions`
- **Edge Function:** `notify-resend`

Assim, toda vez que alguém confirmar presença, o Bernard recebe um e-mail em `bernardejorge52@gmail.com` com:
- Assunto: `Nova confirmação: [nome] — [Sim/Não]`
- Corpo: nome, presença, quantidade de pessoas e mensagem (se houver)

## 3. Publicar no GitHub Pages

1. Faça push deste repositório para o GitHub (branch `main`).
2. Em **Settings → Pages**, selecione a branch `main` e pasta raiz (`/`).
3. O convite ficará em `https://SEU_USUARIO.github.io/SEU_REPO/`.
4. O painel admin ficará em `https://SEU_USUARIO.github.io/SEU_REPO/painel-x7k2p9/` — envie esse link **só** para o Bernard.

## Checklist

- [x] Página pública idêntica ao visual aprovado, com Supabase no lugar de `window.storage`
- [x] Página pública sem lista de confirmados visível
- [x] Painel admin em pasta de nome aleatório, com lista completa e estatísticas
- [x] Nenhum link do site público aponta para o admin
- [x] Tabela, RLS e credenciais do Supabase já configuradas e conectadas
- [ ] E-mail automático configurado para o Bernard a cada nova confirmação (Edge Function já publicada — falta só a chave do Resend e o webhook, passo 2)
- [x] README com passo a passo de: Supabase, Resend, subir no GitHub Pages
