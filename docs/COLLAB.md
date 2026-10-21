# Two agents, one codebase

**Codex** owns the look: public site art direction, motion, typography, the visual language.
**Claude** owns the structure: data, logic, APIs, auth, admin features, infrastructure.

They work on **two different laptops** and share code only through the private GitHub repo:

- Claude works on branch `feat/structure`; Codex works on branch `design/visual`.
- After every finished piece: merge `origin/main` in, make sure the checks pass, push your branch, then fast-forward `main` with `git push origin HEAD:main`.
- Always fetch and merge `origin/main` before starting a piece.
- Databases, `.env` and `storage/` are local to each laptop and never committed. Schema changes travel as Prisma migrations; announce them in the log.

## File ownership

| Area | Owner | Notes |
|---|---|---|
| `src/app/globals.css` | Codex | Brand tokens stay named as they are (`--oxblood`, `bg-oxblood`, …). Add, don't rename. |
| `src/lib/fonts.ts` | Codex | Keep the exports `display`, `serif`, `sans`, `arabic`, `fontVars`. |
| `src/components/ui.tsx` | Codex | Visual only. Keep every export name and prop signature; Claude's admin pages use them. |
| `src/components/NavLinks.tsx` | Codex | Visual only; keep the routes. |
| `src/components/site/**` | Codex | All public-site components, motion, preloader, cursor, grain. |
| `src/app/[locale]/**` | Codex | Every public page **except** `book/**` and `estimator/**`. |
| `messages/*/site.json` | Codex | Public site copy (EN + AR). |
| `public/brand/**`, `public/fonts/**`, `public/images/**` | Codex | |
| `src/app/[locale]/book/**`, `src/app/[locale]/estimator/**` | Claude | Built with `ui.tsx` primitives so Codex's styling applies. Codex may restyle once Claude marks them ready below. |
| `src/components/booking/**`, `src/app/track/**` | Claude | Same rule as above. |
| `messages/*/app.json` | Claude | Booking, tracking, forms, system strings. |
| `src/app/admin/**`, `src/app/api/**` | Claude | Includes `src/app/admin/admin.css`, the admin-only visual layer (loaded only by the admin layout). |
| `src/components/admin/**` | Claude | Admin shell, nav and layout primitives (`PageTitle`, `Panel`, `Stat`, …). |
| `src/lib/**` (except `fonts.ts`), `src/proxy.ts`, `src/auth.ts` | Claude | |
| `prisma/**`, `Dockerfile`, `docker-compose*`, `scripts/**`, `README.md`, tests | Claude | |
| `package.json` / lockfile | both | Add dependencies only in your own branch; say so below. On merge conflicts in the lockfile, keep both sets of deps and run `npm install`. |

## Contracts

- Public gown data: import only from `src/lib/public/content.ts` (`getPublicGowns`, `getPublicGown`). The shape is stable. Until real gowns exist it returns four placeholders with `placeholderTone` for palette blocks.
- Booking CTA target: `/{locale}/book`. WhatsApp concierge number: `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, e.g. `2010…`).
- Translations: top-level namespaces must not collide between `site.json` and `app.json`.

## Log (newest first)

- Codex (2026-10-21): user reports write access is now granted and explicitly instructs pushing ONLY design/visual, not main. Visual work and this coordination log are available on design/visual for Claude to merge; this instruction overrides the default direct-to-main workflow above.

- Codex (2026-10-21): home route explicitly renders on request so newly published gowns appear through the stable public content contract without rebuilding the site. Cursor starts hidden until pointer movement. No data-layer changes.

- Codex (2026-10-21): milestone 6 visual implementation validated with typecheck, lint and production build (2 workers). Browser checked EN/AR at 375/800/1280/1440px, FAQ and craft keyboard disclosure, gallery arrow scrolling, gown detail navigation and language-preserving detail switch. Reduced-motion paths code-reviewed; no live media emulation available. Claude-owned implementation files untouched; next dev generated an untracked AGENTS.md locally. Push blocked by repository permissions; this log has not reached GitHub yet.

- Codex (2026-10-21): public site sections and gown detail routes implemented in EN/AR; photos, founder story specifics, hours/address, social account and testimonials remain explicit placeholders. CTAs use /book (not available on current main yet). Native View Transitions use full-document gallery navigation; reduced motion keeps native navigation. No tracked dependency changes. Local Windows SWC 1.16.18 loader failed; validation uses a local ignored SWC 1.15.8 binding repair. npm reports 8 high severity advisories for structure review. GitHub currently rejects pushes: authenticated SagedEhab lacks write access. Visual commits remain local pending access.

- Codex (2026-10-21): design system pass preserves all UI signatures/tokens, adds 44px controls and visible focus. No dependencies added. Missing .env.example in checkout; please add on structure branch. Please request licensed Boston Angel/The Seasons files and an original monogram SVG from founder; supplied PNG remains untouched.

Write one line when you finish something the other agent should know about, need something from them, or add a dependency.

- Claude (2026-10-21): merged design/visual into main. Admin redesign at the founder's request: new admin-only stylesheet `src/app/admin/admin.css` and `src/components/admin/**`; admin pages no longer use `Card`/`PageHeader`/`Empty` from `ui.tsx` (form classes and `Field`/`Badge` still do). `ui.tsx`, `globals.css` and `NavLinks.tsx` untouched; `NavLinks` is now unused by the admin. Migration `client_discount` adds a standing discount to `Client`. No new dependencies.

- Claude: repo is on GitHub (origin = https://github.com/ShadoBadrBasem/atelier-.git); both agents push to it.
- Claude: milestone 2 merged on `main`. Messages split into `site.json` / `app.json`. Gown data contract added.
