# Formatura do Bernard — Confirmação de Presença

Site estático (GitHub Pages) com convite público + formulário de confirmação de presença, e um painel admin secreto (instalável como app/PWA) para o Bernard acompanhar as confirmações e receber notificações push.

- **Evento:** Engenharia de Produção – UFPI, 08/08/2026 (sábado), 19:00/19:30, Auditório Tupperware, Avenida Frei Serafim, 1967.
- **Banco de dados:** Supabase — já conectado (projeto `fvnwhqelqwoppuhkvpww`), tabelas criadas, RLS configurado e credenciais já preenchidas nos dois HTMLs.
- **Aviso ao Bernard:** notificação push direto no app do painel (PWA) — sem e-mail. Função já publicada, falta só configurar as chaves VAPID como secret (passo 2).

## Estrutura

```
/index.html                 → convite público + formulário de confirmação (responsivo: celular, tablet, PC)
/painel-x7k2p9/index.html   → painel admin (lista completa + estatísticas + botão "Ativar notificações") — link secreto
/painel-x7k2p9/manifest.json → manifesto do PWA do painel (ícone, nome "Bernard", instalável)
/painel-x7k2p9/sw.js        → service worker: cache do app shell + recebe/mostra as notificações push
/assets/foto-convite.jpg    → arte do convite usada como imagem de topo
/assets/icons/              → ícone do app (monograma "B") em vários tamanhos, usado no manifest e como favicon
/supabase/migrations/0001_confirmacoes.sql     → schema da tabela de confirmações + RLS (já aplicado)
/supabase/migrations/0002_push_subscriptions.sql → schema das assinaturas de push + RLS (já aplicado)
/supabase/functions/notify-push/index.ts       → Edge Function que envia a notificação push a cada confirmação (já publicada)
```

## 1. Supabase (já feito)

O projeto Supabase já está conectado:

- Tabela `confirmacoes` criada (`id`, `nome`, `presenca`, `qtd_pessoas`, `mensagem`, `criado_em`)
- Tabela `push_subscriptions` criada (`id`, `endpoint`, `keys`, `criado_em`) — guarda a assinatura de push do painel do Bernard
- RLS habilitado nas duas, com policies liberadas para o papel `anon` (a "proteção" é o link secreto do painel, não autenticação)
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` já preenchidos em `index.html` e `painel-x7k2p9/index.html`

Se precisar reconferir ou trocar de projeto Supabase no futuro, pegue os valores em **Project Settings → API** e atualize as duas constantes no topo do `<script>` de cada HTML.

## 2. Notificações push para o Bernard (em vez de e-mail)

Em vez de e-mail, o Bernard recebe uma **notificação push** no celular/PC direto pelo painel instalado como app (PWA) — assim que ele abrir o painel uma vez e clicar em **"Ativar notificações"**, o dispositivo dele fica registrado.

A Edge Function `notify-push` já está publicada (sem verificação de JWT, pois é acionada por um Database Webhook interno) e já sabe buscar todos os dispositivos inscritos e mandar a notificação. Só falta configurar as chaves VAPID (usadas para autenticar o servidor de push) como secret da função:

### Chaves VAPID já geradas

```
VAPID_PUBLIC_KEY  = BDp5tBBRmAiz03ZfjKKut3URwqCZjpWXOqFKy_bH9U6nAoX_xLBrQiSCsAL9OYGG5vA7KkZJeTr1sc71sWvMWnU
VAPID_PRIVATE_KEY = IgBsp323BQSRDuodNymgK8ls_7Ku_4-BC5vwe27owOA
```

A `VAPID_PUBLIC_KEY` já está embutida em `painel-x7k2p9/index.html` (é uma chave pública, feita para ser exposta no cliente — é assim que a Web Push funciona). A `VAPID_PRIVATE_KEY` **nunca** deve entrar em um arquivo do repositório — configure-a só como secret da Edge Function:

```bash
supabase secrets set VAPID_PUBLIC_KEY=BDp5tBBRmAiz03ZfjKKut3URwqCZjpWXOqFKy_bH9U6nAoX_xLBrQiSCsAL9OYGG5vA7KkZJeTr1sc71sWvMWnU --project-ref fvnwhqelqwoppuhkvpww
supabase secrets set VAPID_PRIVATE_KEY=IgBsp323BQSRDuodNymgK8ls_7Ku_4-BC5vwe27owOA --project-ref fvnwhqelqwoppuhkvpww
supabase secrets set VAPID_SUBJECT=mailto:bernardejorge52@gmail.com --project-ref fvnwhqelqwoppuhkvpww
```

(Ou pelo painel do Supabase: **Edge Functions → notify-push → Secrets**.)

> Se algum dia quiser trocar essas chaves (por exemplo, se desconfiar que a privada vazou), gere um novo par com `npx web-push generate-vapid-keys` e atualize os dois lugares: o secret `VAPID_PRIVATE_KEY`/`VAPID_PUBLIC_KEY` na função e a constante `VAPID_PUBLIC_KEY` em `painel-x7k2p9/index.html`.

### Disparar a função a cada INSERT

No painel do Supabase, vá em **Database → Webhooks → Create a new hook**:

- **Table:** `confirmacoes`
- **Events:** `Insert`
- **Type:** `Supabase Edge Functions`
- **Edge Function:** `notify-push`

### Ativar no dispositivo do Bernard

1. O Bernard abre `painel-x7k2p9/index.html` no celular (ou PC).
2. (Opcional, recomendado) Adiciona à tela de início — no Android/Chrome aparece um prompt de instalar; no iPhone/Safari é **Compartilhar → Adicionar à Tela de Início**. O ícone do app já é o monograma dourado "B".
3. Clica em **"Ativar notificações"** e aceita a permissão do navegador.

Pronto — a partir daí, toda vez que alguém confirmar presença, uma notificação chega no dispositivo dele, com o nome, se vai comparecer e a quantidade de pessoas. Ele pode ativar em mais de um dispositivo (cada um vira uma assinatura separada).

## 3. Publicar no GitHub Pages

1. Faça push deste repositório para o GitHub (branch `main`).
2. Em **Settings → Pages**, selecione a branch `main` e pasta raiz (`/`).
3. O convite ficará em `https://SEU_USUARIO.github.io/SEU_REPO/` — funciona em celular, tablet e PC (layout responsivo).
4. O painel admin ficará em `https://SEU_USUARIO.github.io/SEU_REPO/painel-x7k2p9/` — envie esse link **só** para o Bernard.

> Notificações push (assim como a instalação do PWA) só funcionam em contexto seguro (`https://`), então precisam estar publicadas no GitHub Pages — não funcionam abrindo o arquivo local direto no navegador.

## Checklist

- [x] Página pública idêntica ao visual aprovado, com Supabase no lugar de `window.storage`
- [x] Página pública sem lista de confirmados visível, responsiva em celular/tablet/PC
- [x] Painel admin em pasta de nome aleatório, com lista completa e estatísticas
- [x] Painel admin instalável como PWA (ícone, nome e tela cheia próprios do Bernard)
- [x] Nenhum link do site público aponta para o admin
- [x] Tabelas, RLS e credenciais do Supabase já configuradas e conectadas
- [ ] Notificação push configurada (Edge Function já publicada — falta só definir os secrets VAPID e o webhook, passo 2)
- [x] README com passo a passo de: Supabase, notificação push, subir no GitHub Pages
