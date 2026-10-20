# Claude Code prompt: Shado Badr Maison du Couture

Paste everything below the line into Claude Code, run from an empty project folder. Before you do, create `public/brand/` and drop in your logo files (the cream-background logo PNG, plus a transparent SVG/PNG of the SB monogram if you have one), and any dress photos.

---

You are building a bespoke website and a private management system for **Shado Badr, Maison du Couture**, a Cairo-based couture house making fully customized evening gowns and bridal gowns, made to measure for each client. One codebase, two surfaces:

1. **Public website**: an immersive, sophisticated, editorial luxury experience where clients discover the maison and book a consultation or fitting.
2. **Private admin app ("the Atelier")**: a single-user ERP used only by the founder (for now) to manage appointments, clients, dress progress, daily tasks, supplies and finances. Mobile-first, because it will mostly be used from a phone.

Start by writing a short plan (architecture, data model, milestones) and wait for my OK. Then build milestone by milestone, running and testing as you go, and commit after each milestone.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM. SQLite for local dev, schema kept Postgres-compatible for production
- next-intl for **English + Arabic** (full RTL support for Arabic, mirrored layouts, correct typography)
- Framer Motion for UI motion, Lenis for smooth scroll, GSAP ScrollTrigger for scroll-driven sequences. Respect `prefers-reduced-motion`
- Auth.js (credentials) for the admin: one owner account, hashed password, secure session cookies. Admin lives under `/admin` and is never indexed
- Zod validation everywhere, rate limiting and a honeypot (plus optional Cloudflare Turnstile hook) on public forms
- Dockerfile + docker-compose so I can self-host on a Linux server (see "Devices and budget constraints" for the free hosting and backup setup)
- Timezone `Africa/Cairo`, currency EGP, dates shown correctly in both languages
- No secrets in the repo. `.env.example` only

## Project context and decisions made so far (read this first)
I am the founder's technical builder for this project and I'm handing it to you fresh, so here is everything already decided:
- **The business**: Shado Badr, Maison du Couture is a brand-new Cairo couture house producing **evening gowns and bridal gowns, each customized per client**. **4 gowns have already been produced.** Social media accounts are still being set up, and there is no website or system yet
- **What I want built**: (a) a website where clients can **book appointments**, and (b) a **managerial app (a small ERP, only I use it for now)** to schedule fittings and send the details to clients directly on **WhatsApp**, track the **progress of each dress**, keep my **daily to-do list and calendar**, manage a **supply list that tells me when to repurchase**, and track **revenue, profit and costs**
- **Per dress I must be able to record**: the dress cost, how much the client paid, when payment is due, whether a deposit was paid, and whether she received a **family & friends discount**
- **I must be able to upload photos** of the dress design and inspiration, and keep them organized per client/order
- **Website feel**: impressive, immersive, sophisticated, staying strictly within the brand theme and identity
- **Decisions confirmed**: real full-stack app (Next.js + database, one codebase); WhatsApp via one-tap `wa.me` links first, structured so the WhatsApp Business Cloud API can be added later; website in **English + Arabic (RTL)**; **phase 1 includes everything**: booking site and appointments, dress/order progress tracking, calendar and daily to-do, supplies and finance
- **Devices**: I'll mostly use it from a **Huawei tablet**, an **iPhone** and a **laptop**
- **Budget**: as free as possible, it's a start-up
- **Working mode**: I'm running you with permissions bypassed in a contained local project folder. Do not touch anything outside this project folder, never use real credentials or production infrastructure during the build, commit after every milestone, and stop to confirm the plan with me before building
- **Brand assets**: my logo files go in `public/brand/`. I will also attach the brand board image. Its contents, in case the image isn't visible to you:
  - Logo on cream: cursive S+B monogram in an offset open frame, "CAIRO" stacked top-left, "MAISON DU COUTURE" vertical on the right, "SHADO BADR" beneath
  - Colours: `#480903` `#937F24` `#E5D1A4` `#CE793A` `#B64B12`. Fonts: Boston Angel and The Seasons
  - Mood board (five editorial images): a woman in a gold sequin bodice and brown satin column skirt standing on a plinth among ceramic vases; a pale cream draped gown in warm glowing light holding a small bag; ivory and soft lilac garments on a clothes rail outdoors in dark green foliage; a dark studio shot of a white draped gown with a long teal-tinted flowing train against black; a rust/terracotta gown with a sheer rust veil across the face against a deep blue textured wall
  - Packaging references: stacked metallic hangers with a wooden hanger bearing a pale-blue wordmark, an ivory garment bag with dark ribbon ties, a woven white label on satin, pink organza pouches holding sequined pieces, a cream hanger with a small wordmark
  - Overall direction: warm earth tones, draped fluid fabric, ceramic and golden-hour light, understated editorial luxury

## Devices and budget constraints (hard requirements)
This is a start-up, so **running cost must be as close to zero as possible**. The only acceptable paid item is a domain name.

**Devices**: I will use the admin mainly from a **Huawei tablet (no Google Mobile Services)**, an **iPhone**, and a **laptop**. Clients will use anything.
- Build the admin as an installable **PWA** that works well in Safari/iOS (apple-touch-icons, `viewport-fit=cover` and safe-area insets, inputs at 16px+ to prevent iOS zoom, standalone display mode) and in Chromium-based browsers including Huawei Browser. Test layouts at phone, tablet (portrait and landscape, with a split list/detail view and a wide calendar on tablet) and laptop widths
- **No Google dependencies**: no Firebase/FCM, no Google Maps embed (use OpenStreetMap or a plain map link), no reCAPTCHA (use Cloudflare Turnstile or the honeypot), no Google-hosted fonts or scripts at runtime. Self-host all fonts and assets
- Do not rely on push notifications (unreliable on iOS/Huawei). Surface reminders in the dashboard "Today" view, and make the app cache the admin shell plus today's agenda and tasks so they open fast and can be **read offline**; show a clear message if an edit needs a connection
- Data lives on the server so all three devices always see the same thing; no data stored only in the browser

**Free-of-charge architecture**
- No paid APIs or SaaS. WhatsApp via `wa.me` links, calendar via `.ics`, maps via OpenStreetMap, charts and animation via open-source libraries
- Default deployment: Docker on my own Linux server, exposed through a **Cloudflare Tunnel** (free, no open ports, free SSL/CDN/DDoS protection, custom domain). Use SQLite with a nightly automated backup (database + uploaded files) to a second location, e.g. a cron job that pushes to Cloudflare R2 free tier or another free storage, keeping the last 30 days, and document how to restore
- Also document and, if cheap to support, make the app deployable to a free cloud alternative: Postgres on Neon/Supabase free tier plus storage on Cloudflare R2, so I can move off my own server if uptime becomes an issue. Note each free tier's limits and caveats in the README (for example, Vercel's free Hobby plan is for non-commercial use, so do not use it for the live business)
- Keep the app light on resources: compress and resize uploaded images on the server (WebP/AVIF, sensible max sizes), generate thumbnails, avoid heavy server-side jobs

## Brand identity (follow strictly)
**Logo**: an elegant cursive **S + B monogram** inside an offset open frame (two L-shaped hairlines), with "CAIRO" stacked top-left, "MAISON DU COUTURE" set vertically on the right, "SHADO BADR" in spaced capitals beneath. Use the supplied files in `public/brand/`. Never redraw or distort them. The frame hairline motif is part of the identity, so reuse it as a design device (section corners, image frames, hover states, loaders).

**Palette** (define as CSS variables / Tailwind tokens):
- Oxblood `#480903` : primary text, logo colour, dark surfaces
- Olive gold `#937F24` : fine accents, hairlines, small details
- Sand `#E5D1A4` : soft panels, dividers
- Copper `#CE793A` : highlights, links, hover
- Burnt orange `#B64B12` : rare strong accent, CTAs
- Logo background cream (approx `#EDE5D6`) : the main page background. Warm ivory, never pure white

**Typography**: display = **Boston Angel**, secondary serif = **The Seasons**. Both are commercial fonts: if I add licensed font files to `public/fonts/`, load them with `next/font/local`. Until then use fallbacks: *Bodoni Moda* for display and *Cormorant Garamond* for the secondary serif, behind a single font-token layer so swapping is a one-file change. Headings in generous letter-spaced uppercase or large light italics. For small UI text (forms, admin tables) use a quiet geometric sans (e.g. *Jost*) so data stays legible. Arabic: pair with a refined Arabic serif/naskh such as *Amiri* or *Noto Naskh Arabic* and tune line-height.

**Mood**: warm, earthy, draped and sculptural. Think terracotta, ceramics, oxblood, olive, golden-hour light, fluid satin and chiffon, long trains, soft shadows, editorial fashion photography. Packaging references: ivory garment bags with oxblood ribbon ties, woven labels, cream hangers. Quiet luxury, never loud, never template-looking, no stock-site clichés, no emoji, no heavy gradients or neon.

## Public website: experience goals
Impressive, immersive, sophisticated. Slow, deliberate, cinematic pacing. Every interaction should feel like walking into the atelier.

Pages/sections (bilingual, mobile-first, excellent Lighthouse scores despite the richness):
- **Entrance**: a preloader where the SB monogram's strokes draw themselves in oxblood on cream, then the frame hairlines close around it and the hero reveals
- **Hero**: full-bleed editorial imagery or looping muted video with slow parallax, the monogram and tagline, one refined CTA ("Book a Private Consultation")
- **The Maison**: founder's story and philosophy of bespoke, with a scroll-pinned text-and-image sequence
- **The Collection / Atelier Gallery**: the four existing gowns as an immersive horizontal-scroll or pinned gallery. Each opens into a full detail view (fabric, silhouette, craftsmanship notes, detail close-ups) with smooth shared-element transitions. Build it so new gowns are added through the admin
- **Bridal** and **Evening** landing sections with distinct but cohesive art direction
- **The Journey** (how a gown is made): a scroll-driven timeline: Consultation → Design & sketch → Fabric selection → Pattern & toile → Fittings → Finishing → Delivery, with delicate line-art illustrations and the frame-hairline motif
- **Savoir-faire**: macro close-ups of stitching, beading, fabric textures with hover-reveal details
- **Book a Consultation**: a multi-step, elegant form: occasion (bridal/evening), event date, inspiration notes and image upload, preferred days/times from real availability, contact details with WhatsApp number. Gentle validation, a confirmation screen, and an `.ics` calendar download. Requests land in the admin inbox as "pending"
- **Made-to-order timeline estimator**: client enters event date and gets the latest recommended order date, with a soft note if it is tight
- **FAQ**, **Atelier visit info** (map/location placeholder, hours), **Journal/press** placeholder, **Instagram feed** placeholder, **testimonials** placeholder
- Floating, discreet **WhatsApp concierge** button (wa.me link with a pre-filled message in the active language)
- Custom cursor on desktop, subtle grain texture, a language switcher (EN/AR) that feels native, an optional ambient-sound toggle (off by default)
- Full SEO: metadata, Open Graph images, schema.org (LocalBusiness/Organization), sitemap, hreflang for EN/AR
- **Client progress page** (`/track/[secure-token]`): a private read-only magic link I can send on WhatsApp. It shows the client's gown stage, next fitting date and a few progress photos I choose to share. No login needed, tokens unguessable and revocable

Placeholders: until I supply photos, use tasteful colour-block/texture placeholders in the palette with clear `TODO: replace` slots, and centralize all copy in translation files (write good EN copy in a restrained, couture tone, plus Arabic translations I can review).

## Admin app ("the Atelier"): modules
Mobile-first, installable PWA, same brand language but calmer and denser. Fast to use one-handed.

1. **Dashboard**: today's agenda, tasks due, upcoming fittings, pending booking requests, gowns near deadline, low-stock alerts, this month's revenue/costs/profit snapshot
2. **Appointments & Calendar**: day/week/month views. Inbox of booking requests to confirm, reschedule or decline. Availability rules (working days/hours, slot length, buffer, blackout dates, max per day). Types: consultation, measurements, fitting 1/2/3, final fitting, delivery
3. **WhatsApp messaging**: bilingual message templates (booking confirmed, 24h reminder, fitting ready, balance due, delivery ready, progress update with tracking link). One tap generates a `wa.me` link with the filled-in text for the client's number, and logs that it was sent. Build the sending layer behind an interface so the WhatsApp Business Cloud API can be added later without rewrites
4. **Clients (CRM)**: contact info, language, event details, inspiration images, measurement history with dates (versioned, never overwritten), notes, all their orders
5. **Orders / Dresses**: each gown has a stage pipeline (Inquiry → Design → Fabric sourced → Pattern/Toile → Fitting 1 → Fitting 2 → Finishing → Ready → Delivered), stage dates, photo timeline, notes, fabrics/materials used, event date, status colour-coding. Kanban + list views. Every order also carries a **pricing and payment panel**:
   - **Dress cost** (my production cost): materials (auto-summed from assigned inventory), labor/outsourced work (embroidery, beading, tailors), other costs, with a running total
   - **List price** (what I quote the client)
   - **Discount**: type = none / family & friends / other (with a free-text reason), entered as a percentage or fixed EGP amount. Show list price, discount, and **final price** clearly, and keep the discount visible on the order and in reports
   - **Amount paid so far**, **remaining balance**, and the full payment history (date, amount, method: cash / InstaPay / bank transfer / other, optional note)
   - **Deposit**: required deposit amount, a clear "deposit paid: yes/no" badge, date received
   - **Due dates**: deposit due date, balance/final payment due date (default: before final fitting or delivery, configurable), and optional instalment schedule
   - **Payment status** derived automatically: Unpaid / Deposit paid / Partially paid / Paid in full / Overdue, colour-coded, shown on list and kanban cards
   - **Profit per order** = final price − dress cost, with margin %, so I can see how much the family & friends discount cost me
   - Dashboard and WhatsApp reminders (e.g. "balance due in 3 days") hook into these due dates
   **Photos & design files (per order and per client)**: a dedicated gallery tab on every order, built for fast use on a phone or tablet:
   - Upload **multiple images at once** from the device gallery, **take a photo directly with the camera** (phone/tablet), drag-and-drop or paste on laptop. Also accept PDFs (e.g. scanned sketches or technical drawings)
   - Each file gets a **category**: Design sketch, Client inspiration, Fabric/swatch, Pattern/toile, Fitting photo, Work in progress, Final gown, Other. Plus an optional caption, a date, and the option to tag a fitting or stage
   - Filter by category, view in a full-screen **lightbox** with swipe/pinch-zoom, and a **side-by-side compare** view (e.g. sketch vs finished gown, or fitting 1 vs fitting 2)
   - Mark an image as the order's **cover photo**. Reorder, rename, delete (with confirmation) and download originals
   - A per-image toggle **"share on client progress page"** (off by default). Only images I explicitly mark appear on the client's tracking link; everything else, especially client inspiration and fitting photos of the body, stays private
   - Client-level gallery too, for inspiration collected before an order exists. Images uploaded through the public booking form's inspiration step are attached automatically to that client's/request's gallery
   - Server-side processing: strip location/EXIF metadata from shared images, auto-rotate, resize to sensible sizes, convert to WebP/AVIF, keep the original, generate thumbnails. Upload progress indicator, retry on failure, a sensible size limit per file, and storage usage shown in settings so I can stay within free storage
   - Files are stored outside the public web root and served only through authenticated routes (or signed URLs for the shared tracking page)
6. **Tasks / Daily to-do**: today view, recurring tasks, priority, optionally linked to an order or client, overdue carry-over
7. **Supplies & Inventory**: items (fabric, lining, thread, beads, zippers, boxes, etc.), unit, current stock, reorder level, preferred supplier + contact, last purchase price. Auto-generated **shopping list** of everything at/below reorder level. Log purchases (feeds expenses), and assign materials to an order to deduct stock and cost
8. **Finance**: payments received (deposit/instalments/final), expenses by category (materials, labor/outsourced, rent, utilities, marketing, packaging, other), **per-gown profitability** (final price after discount − materials − labor − allocated costs), monthly P&L, simple charts, EGP formatting, CSV export. Include an **outstanding payments** view (who owes what and when, overdue highlighted), a total of **discounts given** (with family & friends broken out), and expected cash-in for the coming weeks based on due dates
9. **Content manager**: add/edit gowns shown on the public Collection (images, copy in EN/AR, order, visibility)
10. **Settings**: availability, WhatsApp templates, business info, password change, backup/export of all data (JSON/CSV)

## Data model (suggested, refine in your plan)
Client, Measurement (versioned), Order (gown, with listPrice, discountType, discountValue, discountReason, finalPrice, depositAmount, depositDueDate, balanceDueDate), OrderCost (materials/labor/other lines), OrderStageLog, Attachment (client or order, category, caption, isCover, sharedOnTracking, file paths for original/optimized/thumbnail), Payment (amount, date, method, isDeposit), Appointment, AvailabilityRule, BlackoutDate, BookingRequest, Task, InventoryItem, Supplier, PurchaseLog, OrderMaterial, Expense, MessageTemplate, MessageLog, TrackingToken, Gown (public collection entries), User.

## Quality bar
- Privacy first: client measurements and personal data are sensitive. Auth-protect every admin route and API, audit inputs, secure upload handling (type/size checks, files outside public web root where private)
- Accessibility: AA contrast (check the olive/copper accents on cream), keyboard navigation, focus states, alt text, full RTL correctness
- Performance: optimized images (`next/image`), lazy-loaded heavy animation, no layout shift, mobile 60fps
- Seed script with realistic sample data (my 4 gowns as placeholders, 2 sample clients, sample appointments, inventory and finances) so I can see everything working on first run
- Tests for the critical logic (availability/slot calculation, stock deduction, discount and final-price calculation, payment status and overdue logic, profit calculation, token access). All money stored as integer piasters/EGP minor units, never floats
- The public tracking page must never show prices, costs, discounts or payments
- A clear README: setup, env vars, how to run, how to deploy with Docker, how to back up the database

## Working agreement
- Ask me only when a decision is truly mine (copy, photos, legal text). Otherwise choose sensible defaults and tell me
- After each milestone, summarize what works, how to try it, and what's next
- Milestone order: (1) foundation, brand tokens, i18n, auth, schema → (2) admin core: clients, orders, calendar, tasks → (3) booking flow + public availability → (4) WhatsApp templates + tracking page → (5) supplies + finance → (6) public site art direction and animation polish → (7) PWA and offline shell, cross-device testing (iPhone Safari, Huawei tablet browser, laptop), SEO, Docker + Cloudflare Tunnel + backup scripts, tests, README
