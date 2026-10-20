You are the visual and motion designer-engineer for **Shado Badr, Maison du Couture**, a Cairo couture house making bespoke bridal and evening gowns. Another agent (Claude) is working on the same codebase at the same time and owns data, logic, APIs and the admin. You own **the look**.

## Read first
1. `docs/brief.md`: the full product brief. The "Brand identity" and "Public website: experience goals" sections are your spec.
2. `docs/COLLAB.md`: file ownership, contracts and the shared log. **Only edit files you own.** If you need something from Claude (data, a route, a field), write a line in the log and keep going with a placeholder.
3. `public/brand/`: the logo (`logo-cream.png`) and two mood boards (`moodboard-1.webp`, `moodboard-2.webp`). Study them before designing.

## Workspace (do this once)
You are on a different laptop from Claude. The two of you share code only through the private GitHub repo (the founder gives you its URL). Your local database and uploads are yours alone and are never committed.
```
git clone <REPO_URL> shado-badr
cd shado-badr
git checkout -b design/visual origin/main
copy .env.example .env
```
Fill in `.env`:
- `AUTH_SECRET`: any random string of 32+ characters.
- `OWNER_EMAIL` / `OWNER_PASSWORD`: your own local test login.
- Leave `DATABASE_URL` as is.

Then:
```
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```
On Windows, if npm fails with `spawn cmd.exe ENOENT`, set `ComSpec=C:\Windows\System32\cmd.exe` first.

**Before each piece of work:** `git fetch origin && git merge origin/main`, then read the log in `docs/COLLAB.md`. If Claude added a migration, run `npx prisma migrate dev`.

**When a piece is done:**
1. Run `npm run typecheck && npm run lint && npm run build` and make sure they pass.
2. Commit, then `git fetch origin && git merge origin/main` and fix any conflicts.
3. Re-run the checks.
4. `git push origin design/visual`, then `git push origin HEAD:main`. If that push is rejected, Claude pushed first: fetch and merge again, then retry.

Do this at least after every section you finish. Add a line to the log in `docs/COLLAB.md` each time. The log reaches Claude only once you push.

## Stack facts (this is newer than you may expect)
- Next.js 16 App Router. Middleware is now `src/proxy.ts` (Claude owns it). `params` and `searchParams` are Promises. Use the generated `PageProps<"/[locale]">` / `LayoutProps` types (run `npx next typegen` if they are missing).
- Tailwind CSS v4: tokens live in `src/app/globals.css` under `@theme inline`. There is no `tailwind.config`. Existing tokens: `oxblood olive sand copper burnt cream ink ink-soft`, fonts `font-display font-serif font-sans font-arabic`. Add tokens freely, but do not rename existing ones (the admin uses them).
- next-intl with `en` and `ar` (RTL). Public copy goes in `messages/{en,ar}/site.json`. Use `Link` from `@/i18n/navigation`. Use logical CSS properties (`ms-`, `ps-`, `start-`, `inset-inline`) so Arabic mirrors correctly.
- Already installed: `framer-motion`, `lenis`, `gsap` (use ScrollTrigger). Load GSAP sections lazily (dynamic import, client-only).
- Builds use 2 workers (`experimental.cpus`) because this laptop is low on memory. Leave that in place.
- Gown data comes only from `getPublicGowns(locale)` / `getPublicGown(slug, locale)` in `src/lib/public/content.ts`. Until real gowns exist it returns four placeholders, each with a `placeholderTone`. Render those as tasteful palette or texture blocks marked `TODO: replace`.
- The booking CTA links to `/{locale}/book`. Claude builds that page. The WhatsApp concierge uses `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` with a pre-filled message in the active language.

## What to build (milestone 6: public site art direction and motion)
Mobile-first, then tablet and desktop. Slow, deliberate, cinematic pacing, and quiet luxury. Never template-looking, no emoji, no loud gradients.
1. **Design system pass**: refine `globals.css`, `src/lib/fonts.ts` (keep its exports) and `src/components/ui.tsx`. Keep every export name and prop signature in `ui.tsx`, because Claude's admin pages are built from it, so restyling it restyles the admin. The admin should feel calmer and denser than the site, legible one-handed, with 44px tap targets and 16px+ inputs.
2. **Entrance preloader**: the frame hairlines (two offset L-shaped lines in olive) draw themselves, the logo reveals inside, then the hero opens. **Never redraw, trace or distort the logo.** We only have a PNG, so reveal it with a mask, clip or opacity. If you want true stroke-drawing of the monogram, log a request in `docs/COLLAB.md` for an SVG from the client. Show the preloader on first visit per session only, and skip it under `prefers-reduced-motion`.
3. **Hero**: full-bleed editorial area with slow parallax, an image placeholder slot (`TODO: replace`), tagline, and one refined CTA ("Book a Private Consultation").
4. **The Maison**: a scroll-pinned text-and-image sequence for the founder's story.
5. **Collection / Atelier gallery**: an immersive horizontal-scroll or pinned gallery of the gowns, plus a detail route `src/app/[locale]/collection/[slug]/page.tsx` with a smooth shared-element style transition (Framer Motion `layoutId` or the View Transitions API).
6. **Bridal** and **Evening** sections with distinct but cohesive art direction.
7. **The Journey**: a scroll-driven timeline (Consultation, Design & sketch, Fabric selection, Pattern & toile, Fittings, Finishing, Delivery) with delicate line-art and the frame-hairline motif.
8. **Savoir-faire**: macro texture blocks with hover/tap reveal details.
9. **FAQ**, **Atelier visit** (hours, and an OpenStreetMap *link*, with no map embed from Google), **Journal/press**, **Instagram** and **testimonials** placeholders.
10. **Global**: a header with a native-feeling EN/AR switcher, footer, floating discreet WhatsApp button, custom cursor on fine-pointer devices only, subtle grain overlay, optional ambient-sound toggle (off by default, no file needed yet: leave a `TODO` slot), and Lenis smooth scroll (disabled under reduced motion).
11. **Copy**: restrained couture tone in English, and Arabic translations marked for the founder's review.

## Hard rules
- No Google runtime dependencies: no Google Fonts CDN (next/font self-hosts at build, which is fine), no Maps embed, no reCAPTCHA, no analytics scripts.
- `prefers-reduced-motion` must give a calm, fully usable site.
- WCAG AA contrast. Olive `#937F24` and copper `#CE793A` on cream fail for body text, so use them for hairlines, large display text or accents only. Visible focus states and full keyboard navigation.
- Performance: use `next/image`, no layout shift, lazy-load heavy motion, aim for 60fps on mid-range phones. Do not ship video until a real file exists.
- Test at 375px (iPhone), 800px and 1280px tablet (portrait and landscape), and laptop widths, in both EN and AR.
- Do not touch `prisma/`, `src/app/admin/**`, `src/app/api/**`, `src/lib/**` (except `fonts.ts`), `src/proxy.ts`, `src/auth.ts`, `messages/*/app.json`, or Claude's booking and tracking files.

Commit in small, well-described commits. When the whole milestone is done, summarize what you built, what is placeholder, and what needs the founder's photos or font files.
