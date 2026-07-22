# Formatura do Bernard — Confirmação de Presença

Site estático (GitHub Pages) com convite público + formulário de confirmação de presença, e um painel admin secreto para o Bernard acompanhar as confirmações.

- **Evento:** Engenharia de Produção – UFPI, 08/08/2026 (sábado), 19:00/19:30, Auditório Tupperware, Avenida Frei Serafim, 1967.
- **Banco de dados:** Supabase.
- **Envio de e-mail:** Resend (via Supabase Edge Function).

## Estrutura

```
/index.html              → convite público + formulário de confirmação
/painel-x7k2p9/index.html → painel admin (lista completa + estatísticas) — link secreto, não referenciado em nenhum lugar do site público
/assets/foto-convite.jpg  → foto usada no topo do convite
/supabase/migrations/0001_confirmacoes.sql → schema da tabela + políticas de RLS
/supabase/functions/notify-resend/index.ts → Edge Function que envia e-mail ao Bernard a cada confirmação
```

## 1. Criar a tabela no Supabase

No seu projeto Supabase, abra o **SQL Editor** e rode o conteúdo de `supabase/migrations/0001_confirmacoes.sql` (ou aplique via CLI/MCP). Isso cria:

- Tabela `confirmacoes` (`id`, `nome`, `presenca`, `qtd_pessoas`, `mensagem`, `criado_em`)
- RLS habilitado, com policy de `INSERT` e `SELECT` liberadas para o papel `anon`

A "proteção" do painel admin é apenas o link secreto (pasta `painel-x7k2p9`) — não há autenticação por senha, conforme decidido para esse caso de uso.

## 2. Preencher as credenciais do Supabase

Pegue em **Project Settings → API** do Supabase:

- `Project URL`
- `anon public` key

E cole nos dois arquivos HTML, no topo do `<script>`:

```js
const SUPABASE_URL = 'COLOCAR_AQUI';
const SUPABASE_ANON_KEY = 'COLOCAR_AQUI';
```

Arquivos a editar:
- `index.html`
- `painel-x7k2p9/index.html`

A `anon key` é pública por natureza (é isso que o SDK do Supabase usa no navegador) — a segurança real vem das políticas de RLS, já restritas ao necessário.

## 3. Configurar o Resend (envio de e-mail ao Bernard)

1. Crie uma conta grátis em [resend.com](https://resend.com) (não pede cartão).
2. Gere uma **API Key** em **API Keys**.
3. (Opcional, recomendado) Verifique um domínio próprio em **Domains** para poder enviar de um endereço tipo `convite@seudominio.com`. Sem domínio verificado, use o remetente de teste `onboarding@resend.dev` (funciona, mas só entrega para o e-mail da conta Resend usada — para produção, verifique um domínio).

### Deploy da Edge Function

Com a Supabase CLI logada no projeto:

```bash
supabase functions deploy notify-resend
```

### Configurar os secrets da função (nunca hardcode a API key no HTML)

```bash
supabase secrets set RESEND_API_KEY=SEU_TOKEN_RESEND
supabase secrets set NOTIFY_TO_EMAIL=bernardejorge52@gmail.com
supabase secrets set NOTIFY_FROM_EMAIL=onboarding@resend.dev
```

### Disparar a função a cada INSERT

No painel do Supabase, vá em **Database → Webhooks → Create a new hook**:

- **Table:** `confirmacoes`
- **Events:** `Insert`
- **Type:** `Supabase Edge Functions`
- **Edge Function:** `notify-resend`

Assim, toda vez que alguém confirmar presença, o Bernard recebe um e-mail em `bernardejorge52@gmail.com` com:
- Assunto: `Nova confirmação: [nome] — [Sim/Não]`
- Corpo: nome, presença, quantidade de pessoas e mensagem (se houver)

## 4. Publicar no GitHub Pages

1. Faça push deste repositório para o GitHub (branch `main`).
2. Em **Settings → Pages**, selecione a branch `main` e pasta raiz (`/`).
3. O convite ficará em `https://SEU_USUARIO.github.io/SEU_REPO/`.
4. O painel admin ficará em `https://SEU_USUARIO.github.io/SEU_REPO/painel-x7k2p9/` — envie esse link **só** para o Bernard.

## Checklist

- [x] Página pública idêntica ao visual aprovado, com Supabase no lugar de `window.storage`
- [x] Página pública sem lista de confirmados visível
- [x] Painel admin em pasta de nome aleatório, com lista completa e estatísticas
- [x] Nenhum link do site público aponta para o admin
- [ ] E-mail automático configurado para o Bernard a cada nova confirmação (depende de você preencher as credenciais do Resend e configurar o webhook — passo 3)
- [x] README com passo a passo de: criar tabela no Supabase, configurar RLS, configurar Resend, subir no GitHub Pages
