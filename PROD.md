# Creo — Production Setup Guide

This document lists every external service you need to provision before deploying Creo to production, where to register, which keys to copy, and which environment variables to set. Follow it top-to-bottom the first time you deploy.

## Architecture recap

Creo depends on the following external pieces in production:

| Piece              | Purpose                                         | Recommended provider    | Alternative          |
| ------------------ | ----------------------------------------------- | ----------------------- | -------------------- |
| PostgreSQL         | Primary database (users, scripts, voiceovers)   | Neon / Supabase / RDS   | self-hosted          |
| Object storage     | Voiceover MP3s & subtitles (S3-compatible)      | **Cloudflare R2**       | AWS S3, Backblaze B2 |
| Redis              | BullMQ job queue (voiceover ingest, polling)    | **Upstash Redis**       | Redis Cloud, self-hosted |
| MiniMax            | TTS + voice cloning (already in use)            | api.minimax.io          | —                    |
| OpenRouter         | AI script generation (already in use)           | openrouter.ai           | —                    |

Local development uses Docker (Postgres + MinIO + Redis) and does not require any of the accounts below.

---

## 1. Cloudflare R2 (object storage for audio)

**Why R2**: voiceover MP3s are streamed to every user who plays a voiceover. R2 has **zero egress fees**, which is the single biggest cost driver for audio/video workloads. For comparison, AWS S3 charges $0.09/GB out — at 1000 users streaming 50 MB/day that's ~$135/month on S3 versus **$0 on R2**. Storage cost is the same order of magnitude ($0.015/GB/mo).

**Free tier (as of 2026)**:
- 10 GB storage
- 1 million Class A operations / month (writes)
- 10 million Class B operations / month (reads)
- Unlimited free egress

That's enough to cover thousands of voiceovers per month with headroom.

### Registration steps

1. Go to **https://dash.cloudflare.com/sign-up** and create an account (email + password, no card required).
2. In the left sidebar click **R2 Object Storage**. On first use Cloudflare will ask you to add a payment method even for the free tier — this is a formality; you will not be charged unless you exceed the free limits.
3. Click **Create bucket**.
   - **Name**: `creo-voiceovers` (must be globally unique within your account)
   - **Location**: leave as *Automatic*
   - Click **Create bucket**
4. Open the bucket → tab **Settings** → copy the **S3 API** endpoint. It looks like:
   ```
   https://<your-account-id>.r2.cloudflarestorage.com
   ```
   Save this as `S3_ENDPOINT`.
5. Back in the R2 overview page, click **Manage R2 API Tokens** (top-right) → **Create API Token**.
   - **Token name**: `creo-api-prod`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket**: select `creo-voiceovers` (scoping the token to one bucket is safer than account-wide)
   - **TTL**: leave empty (non-expiring)
   - Click **Create API Token**
6. Copy the three values Cloudflare shows you **exactly once** — you cannot view them again, only rotate:
   - **Access Key ID** → `S3_ACCESS_KEY_ID`
   - **Secret Access Key** → `S3_SECRET_ACCESS_KEY`
   - (Endpoint is already saved from step 4)

### R2-specific environment variables

```bash
S3_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
S3_PUBLIC_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=creo-voiceovers
S3_ACCESS_KEY_ID=<from step 6>
S3_SECRET_ACCESS_KEY=<from step 6>
S3_FORCE_PATH_STYLE=false
S3_PRESIGNED_TTL=604800     # 7 days, in seconds
```

**Why two endpoint vars?** In local dev the API (inside docker) talks to MinIO via the internal hostname `http://minio:9000`, but browsers need the public hostname `http://localhost:9000` embedded into presigned URLs. In production both are usually the same public R2 endpoint — just keep them identical. If you attach a custom domain via `S3_PUBLIC_BASE_URL`, `S3_PUBLIC_ENDPOINT` becomes irrelevant.

### (Optional) Public custom domain

If you want voiceover URLs to look like `https://audio.yourdomain.com/voiceovers/abc.mp3` instead of presigned R2 URLs, you can attach a custom domain:

1. Bucket → **Settings** → **Public access** → **Connect Domain** → enter a subdomain you own (must be on Cloudflare DNS).
2. Cloudflare will add a CNAME automatically.
3. Set `S3_PUBLIC_BASE_URL=https://audio.yourdomain.com` in prod env — the API will emit public URLs instead of presigned ones.

**Not recommended for Creo v1**: voiceovers are per-user content and presigned URLs give free access control. Skip this unless you explicitly want public audio.

---

## 2. Upstash Redis (job queue)

**Why Upstash**: BullMQ needs Redis. Upstash is serverless, pay-per-request, has a permanent free tier (10k commands/day, 256 MB), requires no credit card, and exposes a standard Redis connection URL that BullMQ/`ioredis` talk to without any changes.

**Free tier**:
- 10 000 commands/day
- 256 MB max DB size
- Region of your choice

For Creo v1 this is plenty — each voiceover ingest is ~20 Redis commands total.

### Registration steps

1. Go to **https://console.upstash.com/login** → sign up with GitHub / Google / email.
2. Click **Create Database**.
   - **Name**: `creo-prod`
   - **Type**: **Regional** (serverless works too, but Regional gives you a single stable Redis URL and is simpler for BullMQ)
   - **Region**: pick one close to where your API is hosted
   - **TLS**: **Enabled** (on by default — keep it)
   - Click **Create**
3. On the database page find the **Connect** section → **Node.js** tab → copy the line that looks like:
   ```
   rediss://default:<password>@<host>.upstash.io:6379
   ```
   The `rediss://` (double `s`) means TLS. Save this as `REDIS_URL`.

### Redis-specific environment variables

```bash
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
```

That's it — BullMQ and `ioredis` pick up TLS automatically from the `rediss://` scheme.

### Alternatives

If you hit the free tier limit or prefer not to use Upstash:

| Provider       | Free tier       | Notes                                |
| -------------- | --------------- | ------------------------------------ |
| Redis Cloud    | 30 MB, 30 conn  | Official Redis Inc.                  |
| Railway        | $5 credit/mo    | Handy if API is already on Railway   |
| Self-hosted    | free            | Run `redis:7-alpine` next to the API |

All expose a `redis://` or `rediss://` URL; just swap `REDIS_URL` — no code changes.

---

## 3. PostgreSQL (database)

You already have this working locally via Docker. For prod, any managed Postgres works. Recommended free tiers:

| Provider | Free tier                    | Signup                    |
| -------- | ---------------------------- | ------------------------- |
| **Neon** | 0.5 GB, autoscaling          | https://neon.tech         |
| Supabase | 500 MB + auth + storage      | https://supabase.com      |
| Railway  | $5 credit/mo                 | https://railway.app       |

### Registration steps (Neon example)

1. Go to **https://neon.tech** → sign up with GitHub.
2. **Create project** → name `creo-prod` → region close to your API → Postgres version 16.
3. After creation, Neon shows a **Connection string** box. Copy the one labelled **Pooled connection** (for serverless) or **Direct connection** (for long-lived servers). It looks like:
   ```
   postgresql://<user>:<password>@<host>.neon.tech/neondb?sslmode=require
   ```
4. Save as `DATABASE_URL`.

### Run migrations against prod DB

After setting `DATABASE_URL` in your prod env:

```bash
pnpm db:migrate:deploy
```

This applies all existing Prisma migrations. Do this **once** before first deploy, and again whenever you ship schema changes.

---

## 4. MiniMax (TTS + voice cloning)

Already wired up. If you don't have a key yet:

1. Go to **https://www.minimax.io/platform** (international) or **https://platform.minimaxi.com** (China region).
2. Sign up → verify email → go to **API Keys** / **Settings** → **Create new API key**.
3. Copy the key. It starts with `sk-api-`.

### Environment variables

```bash
MINIMAX_API_KEY=sk-api-<your-key>
MINIMAX_BASE_URL=https://api.minimax.io/v1
```

---

## 5. OpenRouter (AI script generation)

Already wired up.

1. Go to **https://openrouter.ai/keys** → sign in with Google.
2. **Create Key** → copy the `sk-or-v1-...` value.
3. (Optional) Add credit to your account — pay-per-use, ~$0.001-$0.01 per script depending on model.

### Environment variables

```bash
OPENROUTER_API_KEY=sk-or-v1-<your-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## 6. JWT secrets

These don't need a service — they're random strings the API uses to sign access/refresh tokens. **Generate new ones for prod**, never reuse the dev values.

Generate two strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run it twice — one for each secret below
```

```bash
JWT_ACCESS_SECRET=<first random hex>
JWT_REFRESH_SECRET=<second random hex>
```

---

## Full production `.env` checklist

Copy this block, fill in the values from the sections above, and set it on your hosting provider (Railway, Fly, Render, etc.):

```bash
# === App ===
NODE_ENV=production
PORT=3000

# === Database (section 3) ===
DATABASE_URL=postgresql://...

# === JWT (section 6) ===
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# === Object storage — Cloudflare R2 (section 1) ===
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_PUBLIC_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=creo-voiceovers
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
S3_PRESIGNED_TTL=604800

# === Redis — Upstash (section 2) ===
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379

# === MiniMax (section 4) ===
MINIMAX_API_KEY=sk-api-...
MINIMAX_BASE_URL=https://api.minimax.io/v1

# === OpenRouter (section 5) ===
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## First-deploy checklist

Run through this list in order the very first time you deploy to production:

1. [ ] Create Postgres database (Neon) → copy `DATABASE_URL`
2. [ ] Create R2 bucket + API token → copy `S3_*` values
3. [ ] Create Upstash Redis DB → copy `REDIS_URL`
4. [ ] Get MiniMax API key → set `MINIMAX_API_KEY`
5. [ ] Get OpenRouter API key → set `OPENROUTER_API_KEY`
6. [ ] Generate JWT secrets → set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
7. [ ] Set all env vars on your hosting provider
8. [ ] Run `pnpm db:migrate:deploy` against the prod database
9. [ ] Deploy the API (`apps/api`) and the web app (`apps/web`)
10. [ ] Smoke-test: log in → create a script → generate a voiceover → verify the MP3 plays from your own R2 bucket (not from a MiniMax URL)

---

## Day-2 operations

### How to verify the ingest pipeline is healthy

1. Open Upstash console → your DB → **Data Browser**. Look for keys under `bull:voiceover-ingest:*`. If there are persistent entries in `bull:voiceover-ingest:failed`, a job is stuck — check API logs.
2. Open R2 bucket → **Objects**. Every successful voiceover produces one `.mp3` (and one `.json` for subtitles). Missing files = broken ingest.
3. API logs: grep for `VoiceoverIngestProcessor` — errors there indicate tar parsing, download, or upload failures.

### How to rotate secrets

- **R2 token**: Cloudflare dashboard → R2 → Manage Tokens → **Roll** the token, update `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY`, redeploy.
- **MiniMax / OpenRouter**: generate a new key, update env, redeploy, revoke the old key.
- **JWT secrets**: rotating these logs out all users (tokens become invalid). Do it if you suspect leakage.
- **Postgres password**: use your provider's rotation UI, update `DATABASE_URL`, redeploy.

### Cost monitoring

- **R2**: dashboard shows storage + operations. Budget alert can be set in Cloudflare billing.
- **Upstash**: dashboard shows daily command count; upgrade when you get close to 10k/day.
- **Neon**: dashboard shows DB size; the free tier cuts off at 0.5 GB.
- **MiniMax / OpenRouter**: both have usage dashboards and support prepaid credit — safer than postpaid billing.
