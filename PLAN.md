# Plan: Rate Limiting + User Tracking via Supabase

## Context

The GEO/AEO Tracker is a Next.js demo app with no auth and no server-side user tracking. All state lives in IndexedDB/localStorage. We need to:

1. Track every user who ever runs a scrape (IP-based identity)
2. Enforce a rate limit: **1 run per tab** (i.e. one run of each tab type per IP)
3. Show a "It's Just a Demo" modal when the limit is hit — with "Clone Repo" and "Docs" buttons
4. Store everything in **Supabase** (Postgres + client SDK)

---

## Rate Limit Definition

> **"One brand, 1 run on each tab"**

Interpretation: each unique IP gets **1 scrape run per provider tab** (chatgpt, perplexity, copilot, gemini, google_ai, grok). The unit of tracking is `(ip, provider)`.

- First run of `chatgpt` for IP `1.2.3.4` → allowed
- Second run of `chatgpt` for same IP → **blocked**, show modal
- First run of `perplexity` for same IP → allowed (different tab)

This means each IP gets at most **6 total runs** (one per provider).

---

## Supabase Schema

### Table: `demo_users`

Stores every IP that has ever visited/run the demo.

```sql
CREATE TABLE demo_users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip           TEXT NOT NULL,
  user_agent   TEXT,
  first_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_runs   INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX demo_users_ip_idx ON demo_users (ip);
```

### Table: `demo_runs`

Tracks each run attempt per IP per provider.

```sql
CREATE TABLE demo_runs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip         TEXT NOT NULL,
  provider   TEXT NOT NULL,   -- chatgpt | perplexity | copilot | gemini | google_ai | grok
  prompt     TEXT,
  ran_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ip, provider)       -- enforces "1 run per tab per IP" at the DB level
);

CREATE INDEX demo_runs_ip_idx ON demo_runs (ip);
```

The `UNIQUE (ip, provider)` constraint is the canonical enforcement point.

---

## Architecture: Where Rate Limiting Happens

Rate limiting is enforced **server-side** in the `/api/scrape/trigger` route.

The client (sovereign-dashboard.tsx) already passes calls through this route, so we intercept there. We do **not** trust the client to self-enforce.

### Flow

```
User clicks "Run Prompt" in UI
↓
callScrapeOne() → POST /api/scrape/trigger { provider, prompt }
↓
[NEW] Extract IP from request headers
[NEW] Upsert demo_users row (create or update last_seen)
[NEW] Attempt INSERT into demo_runs (ip, provider)
  → Success: continue as normal
  → UNIQUE violation: return HTTP 429 with { rateLimited: true }
↓
Client receives 429 → shows "It's Just a Demo" modal
```

---

## Files to Create/Modify

### 1. Supabase Setup

**New file: `lib/server/supabase.ts`**

Server-only Supabase client using service role key (no RLS required since we're server-side only).

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 2. Rate Limit Helper

**New file: `lib/server/rate-limit.ts`**

```ts
// Returns { allowed: true } or { allowed: false, reason: string }
export async function checkAndRecordRun(ip: string, provider: string, prompt: string, userAgent: string)
```

Steps:
1. Upsert `demo_users` by IP (create or update `last_seen` + increment `total_runs`)
2. Attempt to insert into `demo_runs (ip, provider)` — the UNIQUE constraint handles enforcement
3. If insert succeeds → `{ allowed: true }`
4. If insert fails with Postgres code `23505` (unique_violation) → `{ allowed: false }`

### 3. Modify `/api/scrape/trigger/route.ts`

Add rate limit check before job creation:

```ts
// Extract IP
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
       ?? req.headers.get('x-real-ip')
       ?? '0.0.0.0'

const userAgent = req.headers.get('user-agent') ?? ''

// Check rate limit
const { allowed } = await checkAndRecordRun(ip, body.provider, body.prompt, userAgent)
if (!allowed) {
  return NextResponse.json({ rateLimited: true }, { status: 429 })
}

// ... existing job creation logic
```

### 4. Client: Handle 429 in `sovereign-dashboard.tsx`

In `callScrapeOne()`, catch the 429 response and set a new state flag `showDemoModal: true`.

```ts
if (res.status === 429) {
  setShowDemoModal(true)
  return null
}
```

### 5. New Component: `DemoLimitModal`

**New file: `components/dashboard/demo-limit-modal.tsx`**

A centered modal that appears when `showDemoModal === true`.

**Design (dark, Bright Data aesthetic):**
- Headline: `"It's Just a Demo"`
- Subtext: `"You've reached the limit for this demo. Clone the repo and run it yourself with your own Bright Data API key — it's free to start."`
- Button 1: `"Clone the Repo"` → links to the GitHub repo URL
- Button 2: `"Read the Docs"` → links to `https://docs.brightdata.com`
- Dismiss button (X) to close

### 6. Environment Variables (`.env.local`)

Add:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Implementation Order

1. **Supabase project + schema** — Create the two tables in Supabase dashboard (copy SQL from above)
2. **`lib/server/supabase.ts`** — Supabase server client
3. **`lib/server/rate-limit.ts`** — Rate limit check/record helper
4. **`app/api/scrape/trigger/route.ts`** — Add IP extraction + rate limit check
5. **`components/dashboard/demo-limit-modal.tsx`** — New modal component
6. **`components/sovereign-dashboard.tsx`** — Add `showDemoModal` state + modal render + 429 handling in `callScrapeOne()`
7. **`.env.local`** — Add Supabase credentials
8. **Install `@supabase/supabase-js`** — `npm install @supabase/supabase-js`

---

## Package to Install

```bash
npm install @supabase/supabase-js
```

---

## Notes

- **No RLS needed** — all DB access is server-side via service role key, never exposed to client
- **IP privacy** — we only store IP addresses; no PII beyond that
- **Local dev** — `x-forwarded-for` will be absent; IP falls back to `'0.0.0.0'`, which means all local dev traffic shares one "user" — fine for testing
- **The UNIQUE constraint** is the true enforcement; the helper is just a clean wrapper around it
- **No Supabase Auth** — we're using Supabase purely as a Postgres + REST API, no auth flows needed
- **The modal does not require login** — it's purely informational and links out

---

## Modal Copy

```
Title: It's Just a Demo

Body: You've hit the run limit for this preview. The real power comes
when you deploy it yourself — full access, your data, your keys.

Buttons:
  [Clone the Repo]     → https://github.com/luminati-io/geo-aeo-tracker  (or actual repo URL)
  [Read the Docs]      → https://docs.brightdata.com
```

---

## What We're NOT Doing

- No JWT / session tokens
- No email signup
- No Supabase Auth
- No per-prompt limiting (only per-provider tab)
- No Redis / edge rate limiting (Supabase DB is sufficient for demo scale)
