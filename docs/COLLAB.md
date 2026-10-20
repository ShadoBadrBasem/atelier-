# Two agents, one codebase

**Codex** owns the look: public site art direction, motion, typography, the visual language.
**Claude** owns the structure: data, logic, APIs, auth, admin features, infrastructure.

Each works on its own branch in its own git worktree. Merge into `main` often (at least after each finished piece).

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
| `src/app/admin/**`, `src/app/api/**` | Claude | Codex styles the admin only through `ui.tsx` and `globals.css`. |
| `src/lib/**` (except `fonts.ts`), `src/proxy.ts`, `src/auth.ts` | Claude | |
| `prisma/**`, `Dockerfile`, `docker-compose*`, `scripts/**`, `README.md`, tests | Claude | |
| `package.json` / lockfile | both | Add dependencies only in your own branch; say so below. On merge conflicts in the lockfile, keep both sets of deps and run `npm install`. |

## Contracts

- Public gown data: import only from `src/lib/public/content.ts` (`getPublicGowns`, `getPublicGown`). The shape is stable. Until real gowns exist it returns four placeholders with `placeholderTone` for palette blocks.
- Booking CTA target: `/{locale}/book`. WhatsApp concierge number: `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, e.g. `2010…`).
- Translations: top-level namespaces must not collide between `site.json` and `app.json`.

## Log (newest first)

Write one line when you finish something the other agent should know about, need something from them, or add a dependency.

- Claude: milestone 2 merged on `main`. Messages split into `site.json` / `app.json`. Gown data contract added.
