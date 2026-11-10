# Tawer Academy

The Tawer Academy website (English + Arabic) plus a password-protected content dashboard (`/admin`).
Built with **Next.js 16** (App Router, React components). Saved content and form requests are stored in **Neon** Postgres.

```
proxy.js                       picks the language for each visit: ?lang=en|ar > remembered choice > browser language
app/
  (site)/layout.js             website shell: <html lang dir>, fonts, site.css
  (site)/page.js               home page: loads the content (database → JSON defaults) and renders the sections
  (site)/site.css              website styles
  (admin)/layout.js            dashboard shell + admin.css
  (admin)/admin/page.js        /admin
  api/content/route.js         GET /api/content (public) · PUT (admin only)
  api/history/route.js         GET last 10 saved versions (admin only)
  api/requests/route.js        POST from the website's two forms · GET / PATCH the inbox (admin only)
  api/login, logout, session   admin login (5 wrong tries from one IP, or 30 from everyone = 15 min lock)
  global-not-found.js          the "page not found" page (English/Arabic)
  robots.js, sitemap.js        /robots.txt and /sitemap.xml (both languages, with hreflang)
  llms.txt/route.js            /llms.txt: plain-text summary for AI assistants, built from the content
  icon.svg                     browser-tab icon
components/
  Rich.jsx                     shows [[highlight]] / **bold** / new lines as real elements (never as HTML)
  site/                        one component per section: Header, Hero, About, Levels, Courses, PlacementTest,
                               Why, Stories, Reviews, Pricing, Sections (FAQ, blog, banner), Contact,
                               RequestForms, Footer, Topbar, Effects (reveal, counters, back to top), SiteContext
  admin/                       AdminApp, schema (the sections & fields of the dashboard), Fields (English|Arabic
                               pairs, rich text box, B/Colour bubble), ListEditor, Inbox, Panels (login, guide,
                               history, save bar), util
lib/
  db.js                        Neon queries (tables are created automatically on the first save)
  auth.js                      admin session cookie, request checks
  content.js                   which content sections may be saved + validation
  requests.js                  rules for the two forms
  site-content.js              loads the website content for a language (server)
  seo.js                       site address, canonical/hreflang URLs, structured data (JSON-LD)
  site-helpers.js              helpers for server and client components (images, WhatsApp links, t())
  format.js                    merge (saved over defaults) and translate (Arabic over English)
  ui-strings.js                Arabic text of the fixed interface (menu, buttons, form labels…)
  image-loader.js              next/image asks Unsplash's CDN for each photo size (no resizing on our server)
  defaults.js, fonts.js
data/                          DEFAULT content (used for anything not saved from the dashboard yet)
  content.en.json              English (also the structure: lists, numbers, photos, links)
  content.ar.json              Arabic translation (same shape, text only)
```

## Setup

1. Install [Node.js](https://nodejs.org) 20.19 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill it in:
   - `DATABASE_URL`: your Neon connection string (Neon dashboard → **Connect** → copy the string).
   - `ADMIN_PASSWORD`: the dashboard password (12+ characters).
   - `SESSION_SECRET` (optional): signs admin sessions. If it's not set, the admin password is used.
   - `SITE_URL`: the public address, e.g. `https://www.tawer-academy.com` (canonical tags, sitemap, structured data).
   Never put real values in `.env.example`: it is committed to git.
4. `npm run dev`, then open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the dashboard.

For production: `npm run build`, then `npm start`. Any Node.js host that runs Next.js works (for example Vercel, which
pairs well with Neon). Set the same environment variables on the host.

Changing `ADMIN_PASSWORD` (or `SESSION_SECRET`) logs out every open admin session.

## How content works

- **Where text comes from:** the database first; anything not saved there comes from the JSON files in `data/`
  (see `data/README.md`). Saving from the dashboard stores the full content in the database (table `site_content`).
  The previous version goes to `content_history` (last 10 kept, restorable from **History** in the dashboard).
- Text fields support `[[words]]` (highlight colour), `**words**` (bold) and line breaks. They are rendered as React
  elements, so typing HTML into the dashboard can't break or hijack the page.
- **Images are not editable** from the dashboard (by design). To change photos, edit the `img` IDs (Unsplash photo IDs)
  in `data/content.en.json`, or the image IDs in the components.
- If two people edit at once, the second save is refused with a message to reload.
- The website keeps the saved content in Next's cache, so visits don't wait for the database. A dashboard save clears
  it at once. If you change the database **by hand** (Neon console), the site can take up to 10 minutes to show it.
- The website's only two forms ("Build your own course", "Corporate training") send to `/api/requests`; the requests
  appear in the dashboard under **Requests**. Every other button opens WhatsApp with a ready-made message.

## Adding a new section

1. Default text in `data/content.en.json` (+ Arabic in `data/content.ar.json`).
2. A component in `components/site/` and its place in `app/(site)/page.js`.
3. Its editor in `components/admin/schema.js`.

The dashboard may save any section that exists in `data/content.en.json` (`lib/content.js` reads the list from there).

## Security

- Security headers for every page are in `next.config.mjs` (Content-Security-Policy, HSTS in production,
  X-Frame-Options, Permissions-Policy). If you add something loaded from another site (a YouTube video, a map,
  analytics), add its address to the CSP there, or the browser will block it.
- Login: 5 wrong passwords from one IP lock that IP for 15 minutes; 30 from everyone together lock all logins for
  15 minutes. Forms: 5 requests per visitor per hour, 60 per hour for the whole site.
- Visitors' IPs are never stored: only a salted hash (for the limits above), removed after 30 days.
- The admin cookie is `__Host-tawer_admin` in production (HttpOnly, Secure, SameSite=Strict, 8 hours).
