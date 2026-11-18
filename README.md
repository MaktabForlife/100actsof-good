# The 100 Acts of Good

A team logbook for Umm Abbad Academy. The artwork, example acts, hadith references, and Team Log fields come from the two user-supplied PDFs in `public/`.

## Production ownership

| Resource | Value |
| --- | --- |
| Source | https://github.com/MaktabForlife/100actsof-good |
| Cloudflare account | Hifzhelper.app@gmail.com's Account |
| Account ID | `7f42bd46597bab9181b7a128a695f2cd` |
| D1 database | `acts-of-good-production` |
| Database ID | `35e77ced-b8c0-4fdd-bbb7-3c52d5a0e720` |
| Worker | `acts-of-good` |
| Production hostname | `100actsofgood.hifz-helper.app` |

The account, database and custom domain are declared in `wrangler.jsonc`. The deployed application uses the D1 binding `DB`. No Sites or ChatGPT sign-in service is required by this version.

## Features

- Separate student or team accounts, with password hashing, session cookies and server-side record ownership checks.
- Team cover fields: team name, members, class and start date.
- Numbered acts with circle, date, the act, how we lived it, inspiring hadith and full reference.
- All acts remain expanded, with the newest saved entry first.
- Mobile-first paper styling follows the PDF. On mobile, View tracker opens the numbered 100-drop tracker; desktop shows it below all entries.
- The academy-wide shared goal counts completed acts across accounts.
- Hadith research collections and the three Jalsa Day Reflection prompts.
- CSV, complete JSON backup, and a printable report containing all saved fields.
- Original Student Guidelines and Team Log downloads, including proofread reference text.

## Local development

Node.js 22.13 or later is required.

```sh
npm ci
npm run cf:types
npm run db:migrate:local
npm run dev
```

The local URL is http://127.0.0.1:5174. Local D1 state stays in `.wrangler/` and is separate from production. The pinned local Workers runtime needs a development-only compatibility-date override in `vite.config.ts`; production keeps the date in `wrangler.jsonc`.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

With the local server running, `node tests/integration.mjs` creates test-only accounts and verifies sign-in, session invalidation, team ownership, CSRF rejection, the Team Log fields and numbered acts. It refuses non-loopback targets. Never run test account creation against production.

## Deployment

Sign in to Wrangler with access to the account listed above. The required Cloudflare permissions are Workers Scripts Write, Workers Routes Write, D1 Write and Zone Read. DNS Write may be needed when managing DNS separately.

```sh
npm run deploy
```

The deploy script verifies the approved account and database IDs, checks types and security tests, applies pending schema migrations to that exact database, builds the app, and deploys its custom domain. The initial two migrations were applied in the account's D1 dashboard and recorded in `d1_migrations`.

Cloudflare Workers Builds can also connect this GitHub repository. Use `npm ci` for installation, `npm run build` for building, and `npx wrangler deploy --config dist/server/wrangler.json` as the deploy command. Add the existing `DB` binding if the dashboard prompts for it, using the exact database ID above.

## Data and account access

Records are stored in your D1 database. Each account can read and change its own teams, acts, hadith research and reflections. Only the total act count is shared across accounts for the academy goal.

Passwords use PBKDF2-SHA256 with random per-account salts. Session tokens are random, stored as hashes in D1, and expire after seven days. Login and registration attempts are rate limited. Production cookies use Secure, HttpOnly and SameSite=Lax. There is no email service or automated password-reset flow in this version.

The original Sites deployment has not been deleted. A private backup of its pre-migration team record is kept locally under the ignored `backups/` directory; student data, credentials and session state are never committed to this public repository.

## Source references

- `public/student-guidelines.pdf`
- `public/team-log.pdf`
- `reference/student-guidelines-proofread.txt`
- `reference/team-log-review.txt`
- `public/artwork/README.txt` (artwork provenance)
