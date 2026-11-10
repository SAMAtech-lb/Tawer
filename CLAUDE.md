# CLAUDE.md — Tawer Academy website

## Standing rule for every session
After each conversation that changes something or makes a decision, **update this file**:
add a dated entry to the *Session log* below (what was asked, what was done, decisions made),
and update the *Project* sections if the structure, stack or conventions changed.
Keep entries short. This file is the shared context for anyone (human or AI) working on the repo.

## Standing rule: every UI change gets a ui-taste check
After **any** change that affects how the site looks (HTML, CSS, content, layout), before reporting it as done:
1. Run the site: `npm run dev` (Next.js, http://localhost:3000). Without `DATABASE_URL` it shows the default content.
2. Look at the real rendered page with the **agent-browser** skill/CLI
   (`agent-browser open http://localhost:3000/`, then `agent-browser screenshot <file>`).
   Check desktop **and** a mobile/tablet width (`agent-browser set viewport 390 844`).
3. Run the **ui-taste** skill (`/ui-taste`, in [.claude/skills/ui-taste/](.claude/skills/ui-taste/))
   as a review of the changed area. Use its polish/audit playbooks, and fix material issues it finds.
4. Mention in the reply what the ui-taste check found and what was fixed.
The project rules here (strict palette, "don't change the design" requests) outrank ui-taste suggestions.

## Tooling installed
- Skills in [.claude/skills/](.claude/skills/) (tracked in [skills-lock.json](skills-lock.json)): `ui-taste`,
  `ios-design` (from uizze.sh), `agent-browser` (from vercel-labs/agent-browser) and `find-skills` (from vercel-labs/skills).
- `agent-browser` CLI v0.41.2 is installed globally with npm. Its own Chrome download timed out, so it
  uses the system **Edge** via `AGENT_BROWSER_EXECUTABLE_PATH`, set in
  [.claude/settings.local.json](.claude/settings.local.json) (machine-specific and git-ignored).
  Outside Claude Code, pass `--executable-path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`.
- Fallback if agent-browser fails: headless Edge screenshots
  (`msedge --headless=new --screenshot=<file> --window-size=1440,12000 <url>`).

## Project
Static marketing website for **Tawer Academy**, an English language academy
(kids, teens, adults; CEFR levels A1–C1; General English, Conversation, IELTS, TOEFL,
Business English, Corporate Training; live online only, the in-person option was removed).

### Stack
- **Next.js 16** (App Router, **React components**, plain JavaScript/JSX) + **Neon Postgres** (`@neondatabase/serverless`).
  Setup and the full file map are in [README.md](README.md).
- **Two route groups with their own root layouts:** `app/(site)/` (the website, `site.css`) and `app/(admin)/` (the
  dashboard, `admin.css`), so their styles never mix.
- **Language:** [proxy.js](proxy.js) (Next 16's name for middleware) picks it per visit and passes `x-tawer-lang`; the site
  layout sets `<html lang dir>`. The page is fully rendered on the server (good for Google and no flash of English).
- **Server vs client components:** sections without interaction (Hero, About, Why, Pricing, FAQ, Blog, Footer…) are server
  components; interactive ones (Header, Levels, Courses, PlacementTest, Stories, Reviews, RequestForms, the whole
  dashboard) are client components (`"use client"`). Client components get `t()` and WhatsApp links from `SiteContext`.
- **Formatting** (`[[word]]`, `**word**`, new lines) is rendered by [components/Rich.jsx](components/Rich.jsx) as React
  elements, never as HTML.
- Fonts via `next/font` ([lib/fonts.js](lib/fonts.js)): Lexend, DM Sans, Cairo, Tajawal → CSS variables. Icons: the
  `remixicon` npm package (`ri-*`). Images: Unsplash IDs via `U(id, w)` in [lib/site-helpers.js](lib/site-helpers.js).
- Env vars (in `.env`, git-ignored; template in [.env.example](.env.example)): `DATABASE_URL` (Neon),
  `ADMIN_PASSWORD`, optional `SESSION_SECRET`. **Never print or commit their values.**

### Files
- **Where text comes from: database first, then the JSON files.** Defaults live in
  [data/content.en.json](data/content.en.json) (English + structure) and [data/content.ar.json](data/content.ar.json)
  (Arabic, text only), loaded by [lib/defaults.js](lib/defaults.js). The site loads content with
  [lib/site-content.js](lib/site-content.js); the dashboard gets the defaults as a prop from `app/(admin)/admin/page.js`.
  Rules are in [data/README.md](data/README.md).
- [components/site/](components/site/): one component per website section. [components/admin/](components/admin/): the
  dashboard (`schema.js` lists every section and field the admin can edit).
- [app/api/](app/api/): `content`, `history`, `login`, `logout`, `session`, `requests` route handlers.
- [lib/](lib/): `db.js` (Neon; tables `site_content`, `content_history`, `login_failures`, `form_requests`, created
  automatically), `auth.js`, `content.js` (save validation; allowed sections = the keys of content.en.json), `requests.js` (form rules), `format.js`
  (merge + translate), `ui-strings.js` (Arabic interface text).
- Adding a section touches 3 places: data/*.json, a component in components/site/ (+ app/(site)/page.js),
  and components/admin/schema.js. (lib/content.js takes the allowed sections from content.en.json.)

### Page sections (in order)
hero → strip (exam prep) → #about (founding story + 4 value ticks) → #levels → #courses →
#test (placement quiz) → #how → why (3 value props + stats) → #stories (auto-scrolling success-story cards) →
#reviews (testimonials) → #pricing → #faq → #blog → cta → #contact

There is **no team/teachers section** (removed on purpose).

### Languages (English + Arabic)
- **Content:** the main content groups are English. Arabic lives in `content.ar` with the **same shape, text only**.
  `translate()` (in [lib/format.js](lib/format.js)) puts Arabic
  over English. Structure always comes from English (list length and order, numbers, photos, links, booleans).
  An empty Arabic field falls back to English. List items match by position.
- **Dashboard:** every translatable field is an **English | العربية pair side by side** (stacked on phones), under one
  label (`pairField` in admin.js). "English" / "العربية" column headings appear once per card (per field only on
  phones). Text boxes are a small **rich-text box** (`richBox`): bold and coloured words are shown as they will look,
  not as `**` / `[[ ]]`. Selecting words shows a **B / Colour** bubble (`selTool`), and Ctrl+B also works. The box still
  saves the same marks (`htmlToMarks`/`marksToHtml`); a round-trip test over all 448 boxes changed no text. "lines"
  fields (one item per line) stay plain textareas. Fields that are the same in both languages (numbers, codes, phone, email, links,
  exam names, story results, the English placement test) appear once. A badge on each section tab counts English
  texts with no Arabic yet. "View site" + "عربي" open the site in each language. Mark new non-translatable text
  fields with `{ tr: false }`. Moving or deleting list items keeps the `ar` lists aligned. The dashboard's own
  labels stay English.
- **Defaults:** `data/content.ar.json` has a full Arabic translation (259 texts). The brand is written
  **«أكاديمية طوّر»** in Arabic; this is an assumption based on "Tawer means growth", to be confirmed by the client.
  The server uses the same defaults (lib/defaults.js), so even unsaved defaults render in Arabic
  without a flash of English.
- **Site:** the server picks the language in [lib/ui-strings.js](lib/ui-strings.js) `pickLang`: `?lang=` (the header
  switch, also sets the `tawer_lang` cookie) > cookie > browser `Accept-Language` > English. It sets `<html lang dir>`
  and renders Arabic on the server (no flash of English). Fixed interface text (nav, buttons, form, quiz) is in
  `UI.ar` in ui-strings.js. Components use `t(key, "English fallback", vars)` (from `SiteContext` or a `t` prop);
  add the Arabic key to `UI.ar` for new interface text.
- **Placement-test questions stay English** (it tests English). Phone, email and links aren't translated.
- **RTL CSS:** the RTL block near the end of [app/(site)/site.css](app/(site)/site.css). Arabic fonts are Cairo (headings) and
  Tajawal (body). Text blocks use `unicode-bidi: plaintext`, so untranslated English keeps correct punctuation.
  Numbers like 2,500+ and $89 stay left-to-right.

### Content status
All names, stories, testimonials, numbers and contact details are **dummy placeholder data**. A complete placeholder Arabic translation is included; the client will replace it with their own in the dashboard.
Swap in real content before launch, either in [data/](data/) (JSON) or through the `/admin`
dashboard once deployed. Stories are in `stories.items`, testimonials in `reviews.items`.

### Messaging priorities (from the client)
- Value proposition: **customised curriculum updated every term**, **build your own course**,
  **live online access from anywhere**.
- **Pricing:** prices differ per learner, so plans show only a **starting (minimum) price** ("Starting from
  $X / month"; empty = "On request"). **Never show discount amounts** (no %, no per-term prices, no "Save X").
  Family discounts and pay-once discounts are mentioned by name only. Perks (digital books, spelling guides,
  workshop spots) may replace part of a discount.
- Success stories outrank testimonials and come first. They are **small cards like the testimonials** (no big
  featured card), in an endless auto-scrolling row. Anchor story (first card): a student who started at
  age 10 and reached IELTS band 8 at 14. Testimonials are short quotes in a separate slider.

### Color palette (strict — use ONLY these)
| Token | Hex | Role |
|---|---|---|
| `--purple` | #6A0DAD | primary brand, headings (`--dark`), dark section/footer backgrounds |
| `--gold` | #FFD700 | highlights **on purple only** (h2 spans, stats, stars, footer hovers) — never as text on white |
| `--orange` | #E5511A | accent buttons, labels, icons, CTA box, error state, WhatsApp button |
| `--lavender` | #E6E6FA | light sections, soft backgrounds (`--light`, `--primary-soft`) |
| `--slate` | #5E6871 | body text (`--text`), muted/disabled text |
| `--white` | #FFFFFF | cards, page background |

- Only transparent `rgba()` tints of these 6 are allowed (shadows, borders, soft fills). No other hex values.
- Text hierarchy: **purple** = headings, names, prices, interactive text; **slate** = reading text
  (paragraphs, list items, review quotes, form input text). Don't make running text purple.
- On purple backgrounds use white or gold for text/icons, never orange (too low contrast).
- Label pills: orange text on peach tint on white sections; white pill on lavender (`.section--light`) sections.
- Browser defaults are themed too: `::selection` (gold/purple), `:focus-visible` (orange outline),
  `accent-color`/`caret-color` (purple), form placeholders (slate tint).
- No darker hover shades exist: hovers swap between palette colors (purple btn → orange, orange btn → purple, on-purple → gold with purple text).
- The favicon ([app/icon.svg](app/icon.svg)) and `theme-color` (layouts' `viewport`) use the same palette.

### Conventions
- Content (courses, reviews, stories, quiz questions…) lives in [data/](data/) JSON (defaults) and the database,
  never hardcoded in components.
- Photos use `next/image` with `U(id)`; the loader ([lib/image-loader.js](lib/image-loader.js)) asks Unsplash for
  each size. Give every `<Image>` width/height (its real ratio) and `sizes`; only the hero has `priority`.
- Anything new loaded from another site (video embed, map, analytics) must be added to the CSP in
  [next.config.mjs](next.config.mjs), or the browser blocks it.
- Public API errors never include `e.message` (log it with `console.error`, return a plain message).
- Use the CSS variables in `:root` for colors/fonts instead of raw values.
- Contact details in the JSON-LD are placeholders (`+000 00 000 000`).

## History / decisions
- `5388398` Add Tawer Academy website (base version).
- `692185e`, `ede8464` design adjustments + animation (split JS into `content.js` / `main.js`).
- `92cb3c4` **Reverted** those design adjustments back to `5388398` — current code is the
  original single-file-script version. `content.js` / `main.js` no longer exist.

## Session log
- **2026-11-09** — Created this file (renamed `claude.md` → `CLAUDE.md`, the name Claude Code
  auto-loads). Documented project structure and added the standing rule to keep it updated.
- **2026-11-09** — Client supplied a new 6-color palette (6A0DAD, FFD700, E5511A, E6E6FA, 5E6871,
  FFFFFF) with "no other colors". Recolored all of [style.css](style.css) plus the favicon and theme-color.
  Removed the WhatsApp green, error red, success green and lavender-grey shades, mapping them onto the
  palette. Not yet checked in a browser (the Chrome extension wasn't connected).
- **2026-11-09** — Installed Uizze skills with `npx skills add https://uizze.sh/ -a claude-code -y`
  (project scope): `ui-taste` (web/iOS UI design, polish, audit playbooks) and `ios-design`, in
  [.claude/skills/](.claude/skills/), tracked by [skills-lock.json](skills-lock.json). Reviewed first:
  markdown playbooks only; its optional paid Uizze MCP is not connected. Any UI work must still follow
  the strict palette above (the user's constraints outrank the skill).
- **2026-11-09** — Visual color review (headless Edge screenshots, served at
  a local static server). No design/layout changes, only color structure: reading text moved
  from purple to slate; orange on purple (test-section icons, footer "ACADEMY") moved to gold; labels on
  lavender sections are now white; selection/focus/placeholder/form-control colors themed.
  Open question: the 390px-wide mobile screenshot looked clipped on the right. This may be a headless
  rendering quirk, not checked yet.
- **2026-11-09** — Content restructure (dummy data):
  - About: vision/mission boxes replaced by one "Our story, since 2017" founding-story box; the 4 ticks
    kept, with new text.
  - Why: 6 feature cards cut to 3 value props (updated curriculum / build your own course / live online
    anywhere); stats bar kept.
  - Teachers: section, `TEACHERS` data, render code, CSS and footer link removed. The footer link now
    points to `#stories`.
  - New `#stories` section: a featured story card (photo, result badge, 4-step age journey, quote) plus
    3 smaller result cards. New CSS: `.story-feat*`, `.journey`, `.stories`, `.story*`.
  - Testimonials: relabelled "Testimonials"; outcome stories moved out; 4 short quotes remain.
- **2026-11-09** — Added the standing rule that every UI change gets a ui-taste check. Installed the
  `agent-browser` skill and CLI (browser automation: open pages, click, fill forms, screenshots). It runs
  on system Edge and was verified by opening the local site and taking a screenshot.
- **2026-11-09** — Success stories redone per the client: the featured card and grid are gone. Now 5 small
  cards (result + short story + avatar) scroll endlessly (`.marquee`, CSS animation, cards duplicated with
  `aria-hidden` for a seamless loop). The row pauses on hover, and a pause/play button (`#storyPause`) works on
  touch screens and with keyboards. With reduced motion turned on, it becomes a static row the user scrolls
  by hand. ui-taste check (polish playbook, agent-browser at 1440 and 390 wide): no overflow, no console
  errors, all images load. The issue it found was no way to pause on touch, so the pause button was added and verified.
- **2026-11-09** — Merged `origin/main` into `ahmad_frontend_changes`. Main had restructured the site into
  `public/` (content.js + site.js + an admin dashboard). Local work was first saved as commit
  `053e038`, then ported into the new structure: palette CSS (merged automatically); about storyTitle/storyText
  replacing vision/mission; new ticks; 3 why items; `teachers` replaced by a `stories` group (content, page,
  renderer and an admin "Success stories" editor); testimonials relabelled with new quotes; footer link points to
  `#stories`. `teachers` stays in `CONTENT_GROUPS` (legacy) so content saved before the change can still be
  saved again. ui-taste check (agent-browser at 1440 and 390 wide): all sections render, no console errors, no
  sideways overflow, all images load.
- **2026-11-09** — Pricing reworked: removed the Monthly/Per-term toggle and the "Save 15%" badge (it showed
  discount amounts); `term` prices dropped. Plans show "Starting from $X / month" and a "Get my price" button,
  which pre-fills the form message. New "Ways to save" block (`pricing.savings`): family discount, pay once and
  save, perks instead (digital books, spelling guides, workshop spots), all without amounts. Admin: starting
  price can be left empty for "On request"; new "Ways to save" list editor. ui-taste check (agent-browser
  1440/390): no errors, no overflow; fixed bold colour in perk text and the price/"/ month" spacing.
- **2026-11-09** — **Migrated to Next.js + Neon** at the client's request. The previous hosting setup's server
  code, config files and the static GitHub Pages workflow were deleted.
  Page markup moved to `templates/`; APIs ported to Next route handlers with the same behaviour (login lockout,
  10-version history, refusing a save from an outdated tab, validation, HTML escaping); security headers are now in
  `next.config.mjs`. `.env` was not git-ignored, so it was added (with `.claude/settings.local.json`). Verified on
  `next build` + `next start` against the real Neon DB, and every test row was removed afterwards. Fixed a bug
  found in the browser test: the same-origin check now compares against the `Host` header (`request.url` said
  `localhost` while the browser used `127.0.0.1`). ui-taste/agent-browser: site renders fully, dashboard
  login → 14 tabs → logout works, no console errors.
- **2026-11-09** — ui-taste polish of the admin dashboard (operate + polish playbooks, agent-browser at 1440 and 390 wide,
  production server with a temporary test password, nothing saved to the DB). Fixed:
  - **Mobile overflow:** 9 of 14 tabs made the page up to 645px wide on a 390px phone, because single-column grids grew to
    fit long one-line item titles. Fixed with `minmax(0, 1fr)` on .layout/.panel/.card/.list. All 14 tabs now 390px.
  - **Mobile tab strip:** now scrolls the current section into view, and `aria-current` was added.
  - **Palette:** admin.css used the old purple/orange plus navy, red and green. It now uses only the brand palette
    (headings purple, text slate, danger/attention orange, success purple, gold dot on the logo mark).
  - **Contrast:** "Unsaved changes" was light orange (~2.6:1); it is now purple bold with an orange icon. Destructive
    buttons use a slate label with an orange icon.
  - **Focus:** orange focus ring on every control (was the browser default). Story list titles read "8.0 · Lea N.".
- **2026-11-09** — **Arabic + English.** The site has a language switch (header), defaults to the browser language
  (server-side, no flash), and is fully right-to-left in Arabic with Arabic fonts and Arabic interface text. The
  dashboard has an EN/العربية editing switch (default = browser language); the admin enters both languages. Verified
  with agent-browser:
  - language picking for each case, Arabic header fits from 992 to 1440px, no overflow on phones
  - dashboard Arabic edit → save → Arabic site shows it, English site unchanged, fallback works
  - ui-taste fixes: wrapping nav, flipped punctuation, reversed phone/2,500+, mobile menu side, dashboard phone header overflow
  The test save was removed from Neon afterwards (DB empty again).
- **2026-11-09** — Added a full professional Arabic translation of all default content (content.js `ar`). Dashboard redesigned
  from a language switch to **side-by-side English | Arabic fields**, with a per-section "missing Arabic" badge and
  View site / عربي preview links. The server now renders the defaults too (no English flash in Arabic). Verified with
  agent-browser: the Arabic page has no English except the email and exam names, the dashboard pairs work at
  1440/390, badges are 0 at rest and update live, no console errors. No DB writes.
- **2026-11-09** — Dashboard made friendlier for a **non-technical admin** (ui-taste operate playbook, verified with agent-browser):
  - welcome guide on first visit (3 steps; reopen with the **Help** button)
  - plain-language description of every section + "See it on the website" / "بالعربية" links that jump to that section
    (added `id="why"` to the Why section)
  - **B** and **Highlight** buttons over each English/Arabic box in cards with formatting (wrap the selected words,
    press again to remove), so nobody has to type `**` or `[[ ]]`
  - a bottom bar whenever there are unsaved changes, with "Save & publish" and "Undo my changes"
  - fixed a "null" text bug. Also installed the `find-skills` skill.
  - Neon agent setup (global `neon` CLI + `neon login` + plugin) is still pending: the global npm install was blocked
    by the permission check, so the user needs to run it or allow it.
- **2026-11-09** — Client found the dashboard "very overwhelming". Simplified it: removed the 4 buttons and 2 tags per
  field and the visible `**`/`[[ ]]` marks. Now each card has one English | العربية header row, a one-line tip, and
  rich-text boxes with a selection bubble (B / Colour). Verified with agent-browser: round trip identical, bold+colour
  saves `**[[word]]**`, no overflow at 390px even with the bubble open. All test saves were intercepted in the browser;
  nothing was written to the DB. Note: a saved version (21:08 UTC, same as the defaults) is in Neon. It was not made
  by these tests, probably the user's own dev server on :3000.
- **2026-11-09** — Defaults moved from `public/content.js` to **JSON files** (`data/content.en.json`, `data/content.ar.json`,
  verified identical), served as `/content.js` by a route. Rule everywhere: **database first, JSON for the rest**
  (verified: site EN/AR and dashboard boxes show DB text, JSON fills the gaps; tested with a stand-in DB value, no DB
  writes). **Hero background is now plain white.** Colour audit of all CSS, HTML, JS and the 404 page: only the 6 palette
  colours (6A0DAD, E6E6FA, FFD700, 5E6871, E5511A, FFFFFF) plus transparent tints of them. The last stray value was `#000`
  in the stories fade mask, now `#6A0DAD`.
- **2026-11-10** — **Rebuilt as a real Next.js/React app** (the previous version served HTML templates from route
  handlers with hand-written DOM scripts, which the client rightly rejected). Now: `app/(site)` + `app/(admin)` route
  groups with layouts and pages, ~20 site components and 7 dashboard components, `proxy.js` for language, `next/font`,
  `remixicon` package, `Rich.jsx` for formatting. Deleted `templates/`, `public/site.js`, `public/admin/admin.js`,
  `lib/render.js`, the `/content.js` route and `node-html-parser`. Also fixed:
  - **The two forms showed one under the other**: `.form { display: grid }` overrode the `hidden` attribute. Now only the
    selected form is rendered (tabs).
  - **Page was up to 318px too wide** (desktop and phone): hidden checkboxes in the form chips inherited `width: 100%`.
  Earlier the same day: in-person option removed everywhere, newsletter replaced by a WhatsApp/Telegram community box,
  forms limited to "Build your own course" + "Corporate training" (stored in Neon, shown in the dashboard's new
  **Requests** inbox), every other booking button opens WhatsApp with a ready-made message, pricing per course
  (Group / Private / Customize your own). An identical saved copy of the defaults was deleted from Neon with the
  user's OK so the JSON changes show.
  Verified with agent-browser (production build): no overflow at 1440/768/390 in EN and AR; header, levels, filters,
  quiz, stories, slider (also RTL), forms, menu all work; dashboard login, 15 sections, 243 EN|AR pairs, 460 rich
  boxes round-trip unchanged, bold bubble, list move keeps Arabic aligned, add/delete, history, inbox; no console
  errors. Test data (one request) was removed from Neon; DB is empty.
- **2026-11-10** — Hydration warning on `<body>` (`cz-shortcut-listen`) came from the ColorZilla browser extension, not the
  site. Added `suppressHydrationWarning` to `<html>`/`<body>` in both layouts (only ignores attribute differences on those two tags).
- **2026-11-10** — **Requests inbox redesigned** (components/admin/Inbox.jsx + inbox CSS in admin.css): New / Handled / All tabs with
  counts, search (name, phone, word), form filter, compact cards (avatar, name, type, "40 min ago", key facts as chips,
  message quote that reads right-to-left for Arabic, "Reply on WhatsApp" as the main action, Copy number, Mark as handled),
  "All caught up" / "Nothing found" states. ui-taste (agent-browser, sample requests faked in the browser, no DB writes):
  fixed narrow search box (search inputs now use the standard input style), Arabic names aligned with the card, full-width
  search on phones. No overflow at 390px, no console errors.
- **2026-11-10** — Fixed big empty gaps in the dashboard when a page has little content (e.g. one request): the `.panel`
  grid stretched its rows to the sidebar height. Added `align-content: start` to `.panel`, `.inbox-list`, `.req__main`, `.req__chips`.
  Verified with one sample request at 1872px: 22px gaps, normal chip height.
- **2026-11-10** — **Security, bug and speed audit** (plan approved by the user). `npm audit`: 0 vulnerabilities; no secrets
  ever committed; no XSS found (Rich renders React elements, JSON-LD escaped, RichBox escapes first). Fixed:
  - **Spoofable IP (high):** `clientIp()` trusted the first `X-Forwarded-For` entry (anyone can send it), so the login lock
    and form limit could be bypassed. Now: platform header (`x-vercel-forwarded-for` / `cf-connecting-ip` / `x-real-ip`),
    else the last hop; plus **site-wide caps**: 30 wrong passwords from everyone → all logins locked 15 min (fixed window,
    `login_failures` row `*`), 60 form requests/hour for the whole site.
  - **Security headers** on every page (next.config.mjs): CSP (self + images.unsplash.com, no frames/objects), HSTS
    (production), X-Frame-Options, Permissions-Policy, COOP.
  - **Privacy:** form IPs stored as a salted SHA-256 hash (`ipHash` in lib/auth.js), set to NULL after 30 days.
  - Public errors no longer leak DB details; `safeUrl` blocks `//site` and `/\site`; body size checked from
    `content-length` first; admin cookie is `__Host-tawer_admin` in production (everyone is logged out once).
  - **Bug:** "Reply on WhatsApp" broke for local numbers. `waDigits()` (site-helpers): `05XXXXXXXX` → `9665…`, `00…` →
    international (Saudi assumed, as the form placeholder is +966).
  - **Branded 404** (`app/global-not-found.js`, experimental `globalNotFound`, EN/AR from cookie/browser).
  - **Speed:** saved content cached with `unstable_cache` (tag `site-content`, 10 min), cleared by `revalidateTag` on save
    (repeat visits ~40 ms); reads skip the CREATE TABLE checks; scroll handlers once per frame; all photos are
    `next/image` with srcset from Unsplash's CDN, hero `priority`, sizes reserved (no layout shift); Arabic fonts no
    longer preloaded (2 font preloads instead of 4).
  Verified on the production build (:3100, temporary password, deleted afterwards): rotating fake IPs → 429 after 30;
  faked first XFF entry doesn't escape the lock; 6th request per visitor and 61st site-wide → 429; save shows on the next
  visit; agent-browser EN/AR at 1440/390: no overflow, no console/CSP errors, site looks unchanged; dashboard login,
  rich boxes, inbox OK. ui-taste fix: 404 page on phones (smaller "404", equal-width buttons). All test rows removed
  from Neon (content 0, history 0, login 0). One request in the inbox that isn't a test row was left untouched.
  Not done (optional): Remix Icon font → SVG icons (~180 KB).
- **2026-11-10** — **Complexity check** (user: "is there any unwanted complexity, fix it"). Scanned for unused exports, CSS
  classes, interface strings and content fields: almost everything is used. Fixed:
  - one copy of each helper: `isObj`/`merge` (were in lib/format.js, components/admin/util.js and lib/content.js),
    `plain` and `initials` (were also in util.js / Inbox.jsx); util re-exports them, `clone` uses `structuredClone`.
  - `CONTENT_GROUPS`/`TRANSLATIONS` removed: lib/content.js takes the allowed sections from data/content.en.json, so a
    new section touches 3 places instead of 4, and the legacy `teachers` group is gone (DB had nothing saved with it).
  - dead CSS (`.toggle` from the old Monthly/Per-term switch, `ri-send-plane-fill`); `/admin` no longer
    `force-dynamic` (now static); form reset in RequestForms in one function; WhatsApp example number now Saudi.
  Verified on the production build: full default content still saves, `teachers` / `ar.teachers` refused, dashboard
  tabs, list titles, inbox avatar and rich boxes OK, site EN/AR no overflow, no console errors. Test save removed
  from Neon (all tables empty except the one real request).
