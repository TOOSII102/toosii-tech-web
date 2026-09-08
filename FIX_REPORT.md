# toosii-tech-web — Repair Report

**Branch:** `fix/security-and-build-hardening` (9 commits)
**Result:** build green, lint clean, 0 regressions across 36 pages + API routes

> **Admin auth was reverted to the original implementation at the owner's
> request.** The login bypass described in finding #1 is therefore still
> present. Set `ADMIN_SECRET` to mitigate it — see that section.

---

## Summary

The build was never actually broken — `next build` passed on the original code.
What the repo had instead were **three exploitable security holes**, a lint
script that hung, and documentation that described a different project.

Everything below was reproduced against the running app before fixing, and
re-tested after.

---

## Critical findings

### 1. Admin authentication bypass — REVERTED AT OWNER'S REQUEST ⚠️

> **Current status: NOT FIXED. The bypass is live.**
> A fix was implemented and verified, then rolled back on request in commit
> `revert(admin)`. This section documents the issue as it stands today.

`middleware.js` and the admin API routes all do the same thing:

```js
const secret = process.env.ADMIN_SECRET || 'toosii-admin'
if (!token || token !== secret) { /* deny */ }
```

Two problems compound:

- The session cookie is set to **the secret itself**, so the cookie and the
  long-lived credential are the same value. A leaked cookie leaks the secret,
  it is identical for every session, and it cannot be revoked.
- With `ADMIN_SECRET` unset it falls back to the hardcoded literal
  `'toosii-admin'`.

**Reproduction (current code, no env vars set):**

```
curl -H "Cookie: admin_token=toosii-admin" /admin           -> 200 OK
curl -H "Cookie: admin_token=toosii-admin" /api/admin/stats -> 200 OK
```

**Mitigation available today:** set `ADMIN_SECRET` to a long random value
(`openssl rand -hex 32`) in your host's environment. That defeats the guessable
default and is the single most important thing to do. The weaker properties —
cookie-equals-secret, no expiry, no revocation — remain.

The reverted implementation (HMAC-SHA256 signed expiring tokens, constant-time
comparison, fail-closed when unconfigured) is preserved in git history and can
be restored at any time.

### 2. SSRF + open proxy in `/api/download/proxy` — FIXED ✅

The route fetched **any** `?url=` server-side with no validation.

**Proof (before)** — the internal endpoint's full JSON came back embedded in a
fake ID3-tagged "mp3":

```
/api/download/proxy?url=http://127.0.0.1:3000/api/v1/health&name=payload.mp3
-> ID3....{"success":true,"api":"Toosii API",...}
```

The JSON/HTML guard that should have caught this was written as
`if (!isMp3 && looksLikeErrorPayload)` — so simply **naming the file `.mp3`
skipped it entirely**. The route also reached `169.254.169.254` (cloud instance
metadata) and worked as a free open proxy.

**Fix:** new `lib/safeFetch.js` — scheme allowlist, no embedded credentials, DNS
resolution with every returned address checked against loopback / private /
link-local / CGNAT / reserved ranges (IPv4, IPv6, IPv4-mapped), and **manual
redirect following so every hop is re-validated**. The payload check now applies
unconditionally.

All 12 bypass attempts blocked, including decimal-encoded IPs, `[::ffff:127.0.0.1]`,
`file://`, `gopher://`, credentials-in-URL, and a public→internal redirect.
Legitimate downloads verified working (real 52 KB ID3-tagged MP3, redirects followed).

### 3. Zip bomb in `/api/extract-zip` — FIXED ✅

No upload size, entry count, or expanded-size limit, and `adm-zip` decompresses
each entry fully into memory. A 200 KB archive expanding to 200 MB is now
rejected; normal zips still extract.

---

## Also fixed

| Issue | Detail |
|---|---|
| `npm run lint` hung | No ESLint config → dropped into the interactive setup prompt. Added `.eslintrc.json`, then fixed the **39 errors** it exposed (35 unescaped JSX entities + 4 missing `key` props) so `next build` stays green |
| Dependency CVEs | nodemailer 6→10 (SSRF, arbitrary file read, TLS validation, DoS) and adm-zip 0.5→0.6 (4 GB allocation — directly relevant to the zip endpoint). Runtime advisories **7 → 5** |
| Build warnings | Bare `end`/`start` flexbox values in 3 CSS files — build is now warning-free |
| Stale build flag | `NEXT_IGNORE_INCORRECT_LOCKFILE=1` removed; the lockfile is in sync, so it only masked future drift |
| Paste artifacts | 13 files had their whole body indented 2 extra spaces |
| Wrong docs | README claimed **TypeScript** and **Tailwind CSS**. There are no `.ts` files, no `tsconfig.json`, and no Tailwind config — Tailwind emitted nothing. Corrected, and `.env.example` now documents the vars the code actually reads |

---

## Not fixed — needs your decision

**Password reset is broken on Vercel.** `lib/tokens.js` keeps reset tokens in
`global.__resetTokens` (an in-memory `Map`). On serverless, the request that
creates the token and the request that redeems it can land on different
instances, so a valid link will often report "expired or invalid". The same
applies to `lib/visitorStore.js` and `lib/analytics.js` — those stats reset and
diverge per instance.

This needs a shared store (Vercel KV, Upstash Redis, Postgres). I didn't pick
one for you since it's an infra choice. Say the word and I'll wire it up.

**Two dead devDependencies:** `tailwindcss` and the TypeScript toolchain
(`typescript`, `@types/*`) are installed but unused. I left them in case you
plan to adopt either — trivial to drop if not.

**Remaining 5 advisories** are `postcss` pinned inside `next@14` and a
transitive `file-type`. Both need a Next major upgrade (14 → 16), which is a
breaking change I'd want to do as its own piece of work.

---

## Required action before deploy

Set both of these in your host's environment (Vercel → Settings → Environment Variables):

```bash
ADMIN_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=<your strong password>
```

**This is now load-bearing security, not just configuration.** With the original
auth restored, an unset `ADMIN_SECRET` means the cookie `admin_token=toosii-admin`
opens the dashboard to anyone. Setting it is what prevents that.

---

## Verification

```
build ............... ✓ compiled successfully, 0 warnings, 83/83 static pages
lint ................ ✓ 0 errors
pages ............... ✓ 36/36 (35 × 200, /admin × 307 as designed)
api ................. ✓ all /api/v1 endpoints 200
security regression . ✓ SSRF + zip-bomb assertions passed
admin auth .......... ⚠️  original behaviour restored on request —
                      forged cookie returns 200 (see finding #1)
```
