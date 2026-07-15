# Prateleira

SaaS de gestão para mercearias e mercadinhos: estoque com lotes/validade, PDV (dinheiro/PIX/cartão), equipe com papéis e **assinatura Stripe**.

> Fora do escopo atual: NFC-e/NF-e e TEF de maquininha (roadmap).

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Postgres + Prisma 7
- Auth.js (credentials)
- Stripe Checkout + Customer Portal + webhooks
- Uploads: filesystem local (`UPLOAD_DRIVER=local`) ou Vercel Blob (`blob`)

## Setup rápido

### 1. Banco

Com Docker Compose (se tiver o plugin):

```bash
docker compose up -d
```

Sem Docker Compose, use Postgres local ou Prisma Dev:

```bash
npx prisma dev --name prateleira -d
# anote a URL (porta costuma mudar) e ajuste DATABASE_URL no .env
# crie o database: CREATE DATABASE prateleira;
```

### 2. Env

```bash
cp .env.example .env
# edite DATABASE_URL, AUTH_SECRET, e chaves Stripe quando for testar cobrança
```

Gere um secret:

```bash
openssl rand -base64 32
```

### 3. Schema + seed

```bash
npm install
npx prisma db push
npm run db:seed
```

Contas demo:

| E-mail | Senha | Papel |
|--------|-------|-------|
| `dono@prateleira.app` | `demo1234` | OWNER |
| `caixa@prateleira.app` | `demo1234` | CASHIER |

Com `SEED_FORCE_ACTIVE=1`, a org seed entra como `ACTIVE` (útil para demo sem cartão).

### 4. App

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Healthcheck: `GET /api/health`.

## Stripe

1. Crie dois Prices recorrentes (BRL) no Dashboard (Essencial / Profissional).
2. Preencha no `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ESSENCIAL=price_...
STRIPE_PRICE_PROFISSIONAL=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Webhooks locais:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

4. Fluxo: login dono → `/billing` → Checkout → webhook → `subscriptionStatus=ACTIVE`.

Cartões de teste: [Stripe testing](https://docs.stripe.com/testing).

## Planos (limites no código)

| Plano | Lojas | Usuários |
|-------|-------|----------|
| Trial / NONE | 1 | 3 |
| Essencial | 1 | 5 |
| Profissional | 20 | 50 |

Trial: 14 dias após o cadastro. Sem trial/assinatura válida, o app redireciona para `/billing`.

## Uploads

- Dev: `UPLOAD_DRIVER=local` → arquivos em `public/uploads/products/`
- Prod: `UPLOAD_DRIVER=blob` + `BLOB_READ_WRITE_TOKEN` (Vercel Blob)

## Deploy (Vercel + Postgres)

1. Postgres gerenciado (Neon / Supabase / Prisma Postgres).
2. Variáveis de ambiente de produção.
3. `STRIPE_WEBHOOK_SECRET` do endpoint de produção no Dashboard.
4. `UPLOAD_DRIVER=blob` e token Blob.
5. `AUTH_URL` / `AUTH_SECRET` corretos.

## Scripts

```bash
npm run dev
npm run build
npm run db:push
npm run db:seed
npm run db:studio
```

## Estrutura útil

- `src/actions/` — server actions (auth, billing, catalog, sales, shops)
- `src/lib/` — db, auth, stripe, billing gate, upload, stock FIFO
- `prisma/schema.prisma` — multi-tenant (`Organization` → `Shop` → dados)
