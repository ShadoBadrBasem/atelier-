You are continuing the build of **Shado Badr, Maison du Couture**: a bilingual (EN/AR) couture website plus a private admin ERP ("the Atelier"), in `E:\erp and website`. Another agent (Codex) is working at the same time on **the look**: public site art direction, motion, typography, and the `ui.tsx` design primitives. You own **the structure**: data, logic, APIs, auth, admin features and infrastructure.

## Read first
1. `docs/brief.md`: the full product brief and milestone list.
2. `docs/COLLAB.md`: file ownership, contracts and the shared log. **Only edit files you own.** Check the log before each piece of work and add a line when you finish something Codex should know about.
3. `git log`: milestones 1 (foundation) and 2 (admin core) are done on `main`.

## Workspace
Work in `E:\erp and website` on a branch: `git checkout -b feat/structure main`. Run the dev server on port 3001. Codex works in a separate worktree (`E:\shado-design`, branch `design/visual`).
**Integrating:** when a piece is done and `npm run typecheck && npm run lint && npm test && npm run build` pass, commit, then run `git merge main` (bring in Codex's work) and `git push . HEAD:main` (fast-forward `main`). Do this after every finished piece and log it in `docs/COLLAB.md`.

## What exists (don't rebuild)
- Next.js 16 (middleware is `src/proxy.ts`; `params` are Promises), Tailwind v4, next-intl (`messages/{locale}/site.json` belongs to Codex, `app.json` is yours), Prisma on SQLite (Postgres-compatible, no enums, money as integer piasters), and Auth.js credentials with a single owner.
- Domain logic with tests in `src/lib/domain/`: pricing and discount, profit, payment status, order finance, task recurrence. Cairo time helpers are in `src/lib/cairo.ts` (always use them, never the server's local time).
- Admin: dashboard, clients with versioned measurements, orders (stages, kanban, pricing and payment panel, costs, payments), the photo gallery (`/api/attachments`, `/api/files/[id]`, private storage, sharp processing), calendar (day, week, month), and tasks.
- The public gown data contract is `src/lib/public/content.ts`. Keep its exported shape stable; Codex's pages depend on it.

## Environment gotchas
- On Windows, npm may fail with `spawn cmd.exe ENOENT`: `export ComSpec='C:\Windows\System32\cmd.exe'`.
- Builds are capped at 2 workers (low memory). Mark dynamic `path.resolve` with `/*turbopackIgnore: true*/` or the build traces the whole project and runs out of memory.
- The lint config enforces React purity rules (no `Date.now()` in render, no components defined inside components, no setState in effects).

## What to build, in order
1. **Milestone 3: booking flow and public availability.**
   - An availability engine in `src/lib/domain/availability.ts` (pure and tested): working days and hours from `AvailabilityRule`, slot length, buffer, blackout dates, max per day, existing appointments, and Cairo DST.
   - A public slots API and the multi-step booking page at `src/app/[locale]/book/**`: occasion, event date, inspiration notes and image upload (attached to the request's gallery), preferred slots from real availability, and contact details with WhatsApp. Include gentle validation, a confirmation screen and an `.ics` download.
   - Protect the form with Zod, rate limiting, a honeypot and an optional Turnstile hook.
   - An admin inbox to confirm (this creates the client and appointment), reschedule or decline requests.
   - The made-to-order estimator at `src/app/[locale]/estimator/**`.
   - Build every public page from the `ui.tsx` primitives and plain semantic markup so Codex can style it. Put strings in `app.json`. Mark the pages "ready for styling" in the log when they are done.
2. **Milestone 4: WhatsApp and tracking.**
   - Bilingual `MessageTemplate`s, seeded and editable in Settings.
   - A `MessageSender` interface with a `wa.me` implementation that logs to `MessageLog`, so the Cloud API can be added later.
   - One-tap send buttons on orders and appointments, plus "balance due in N days" reminders on the dashboard.
   - `/track/[token]`: hashed, revocable tokens, a page showing stage, next fitting and photos marked shared only (served EXIF-free via a signed or token-scoped route), and **never** any prices, costs, discounts or payments. Add a test for this.
3. **Milestone 5: supplies and finance.**
   - Inventory, suppliers, a shopping list (at or below reorder level), and purchases that feed expenses.
   - Assigning materials to an order deducts stock and snapshots cost, in a transaction, with tests.
   - Expenses by category, per-gown profitability, monthly P&L with simple charts, outstanding payments, discounts given (family & friends broken out), expected cash-in, and CSV export.
4. **Content manager and settings.**
   - Gown CRUD with EN/AR copy, ordering, visibility and images; public image serving for visible gowns; wire this into `content.ts`.
   - Settings: availability, templates, business info, default balance-due days (currently hard-coded to 7 in `orderFinance.ts`), password change, storage usage, and JSON/CSV export.
5. **Milestone 2 gaps to close:** gallery reorder, and an optional instalment schedule on orders.
6. **Milestone 7 (structural parts):**
   - A PWA manifest and service worker caching the admin shell plus today's agenda and tasks for offline reading, with a clear "needs a connection" message on edits.
   - SEO plumbing: sitemap, hreflang, schema.org, robots, with admin `noindex`.
   - Dockerfile and docker-compose with a Cloudflare Tunnel service.
   - A nightly backup script (database plus storage, pushed to R2, keep 30 days) with restore docs.
   - A realistic seed (4 gowns, 2 clients, appointments, inventory, finances).
   - A README covering setup, environment variables, Docker, backups, and the Neon/R2 free-tier alternative with its caveats.

## Rules
- Every admin route, action and API authenticates (`requireUser()` / `auth()`). Validate every input with Zod. Money is always integer piasters.
- Tests are required for availability, stock deduction, discount and final price, payment status and overdue, profit, and token access.
- Don't restyle public pages or edit Codex's files. If the design system is missing a primitive you need, ask in the log, or add a minimal one in your own component and flag it.
- After each milestone, summarize what works, how to try it, and what's next, then stop for the founder's OK.
