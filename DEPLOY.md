# Guia de Deploy — Licença White Label

Este guia descreve o processo completo para configurar e publicar o sistema para um novo cliente.
Tempo estimado por cliente: **1 a 2 horas** (primeira vez) / **30 min** (clientes seguintes).

---

## Pré-requisitos

- Conta no [Supabase](https://supabase.com) (1 projeto por cliente — plano gratuito aguenta)
- Conta no [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) para o deploy do frontend
- Conta PagHiper do cliente (ou criar uma em [paghiper.com](https://paghiper.com))
- Node.js 18+ instalado na sua máquina

---

## Passo 1 — Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Escolha um nome (ex: `farmacentral-prod`)
3. Anote as credenciais em **Settings → API**:
   - `Project URL` → será o `VITE_SUPABASE_URL`
   - `anon public` → será o `VITE_SUPABASE_ANON_KEY`

---

## Passo 2 — Executar migrações SQL

No Supabase → **SQL Editor**, execute os seguintes arquivos **nessa ordem**:

1. `migration_consolidada.sql` — cria todas as tabelas principais
2. `migration_config.sql` — cria tabela de configurações e adiciona campo `observacoes`

> Dica: cole o conteúdo de cada arquivo no editor e clique em **Run**.

---

## Passo 3 — Criar usuário administrador

No Supabase → **Authentication → Users → Add User**:
- E-mail: `admin@farmacentral.com.br` (usar e-mail real do cliente)
- Senha: escolha uma senha forte e entregue ao cliente

---

## Passo 4 — Configurar o bucket de imagens

No Supabase → **Storage → New Bucket**:
- Nome: `product-images`
- Marcar como **Public**

As policies de acesso já foram criadas pelo SQL da migração.

---

## Passo 5 — Configurar a Edge Function (pagamentos)

No Supabase → **Edge Functions → Deploy**:
1. Copie o conteúdo de `supabase/functions/paghiper-payment/index.ts`
2. Crie a função com o nome `paghiper-payment`
3. Depois vá em **Settings → Secrets** e adicione:

| Chave | Valor |
|-------|-------|
| `PAGHIPER_KEY` | Chave da API PagHiper do cliente |
| `PAGHIPER_TOKEN` | Token PagHiper do cliente |
| `NOTIFICATION_URL` | `https://dominio-do-cliente.com.br/webhook/paghiper` |
| `STORE_NAME` | Nome da loja (ex: `Farmácia Central`) |

> Se o cliente não tiver conta PagHiper, mantenha `VITE_MOCK_PAYMENTS=true` e os pagamentos online ficam desabilitados (PDV funciona normalmente).

---

## Passo 6 — Configurar o .env do cliente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

VITE_STORE_NAME=Farmácia Central
VITE_STORE_SLOGAN=Saúde para toda a família
VITE_STORE_SLUG=farmacentral
VITE_STORE_CNPJ=12.345.678/0001-99
VITE_STORE_LEGAL=Farmácia Central Comercio de Medicamentos LTDA
VITE_STORE_CITY=SAO PAULO

VITE_MOCK_PAYMENTS=false
```

---

## Passo 7 — Build e deploy

```bash
# Instalar dependências (só na primeira vez)
npm install

# Gerar build de produção
npm run build

# A pasta /dist está pronta para deploy
```

### Opção A — Vercel (recomendado)

```bash
# Instalar Vercel CLI (só uma vez)
npm i -g vercel

# Fazer deploy
vercel --prod
```

Durante o deploy, configure as variáveis de ambiente no painel da Vercel
(mesmas do `.env`, sem o prefixo `#`).

### Opção B — Netlify

Arraste a pasta `/dist` para o painel do Netlify → **Sites → Add new site → Deploy manually**.
Configure as variáveis em **Site settings → Environment variables**.

---

## Passo 8 — Personalizar o design (opcional)

| O que mudar | Onde |
|-------------|------|
| Cor principal (verde) | `tailwind.config.ts` → `primary` |
| Logo no Header | `src/components/Header.tsx` |
| Favicon | `public/favicon.ico` |
| Fontes | `index.html` + `src/index.css` |

---

## Checklist de entrega

- [ ] Banco criado e migrações executadas
- [ ] Usuário admin criado e senha entregue ao cliente
- [ ] Variáveis de ambiente configuradas no deploy
- [ ] Edge Function publicada (se usar pagamentos online)
- [ ] Teste de pedido real (PDV + site)
- [ ] Estoque inicial cadastrado
- [ ] Logo e cor personalizados

---

## Suporte rápido

| Problema | Solução |
|----------|---------|
| Erro "PGRST204 column not found" | Executar `migration_config.sql` no Supabase |
| Pagamento não processa | Verificar secrets `PAGHIPER_KEY` e `PAGHIPER_TOKEN` |
| Admin não carrega produtos | Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |
| Carrinho some ao atualizar | Normal — é comportamento do `VITE_STORE_SLUG` diferente entre deploys |
