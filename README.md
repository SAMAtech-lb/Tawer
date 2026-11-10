# Tawer Academy

The Tawer Academy website plus a password-protected admin dashboard (`/admin`) for editing the site's text.
Built with **Next.js** (App Router). Saved content is stored in a **Neon** Postgres database.

```
app/                   ← Next.js routes
  content.js/route.js  GET  /content.js   the default content (data/*.json) for the browser
  route.js             GET  /             the website, with the saved content applied on the server (good for Google & link previews)
  admin/route.js       GET  /admin        the content dashboard
  api/login/route.js   POST /api/login    password → session cookie (5 wrong tries = 15 min lock)
  api/logout/route.js  POST /api/logout
  api/session/route.js GET  /api/session
  api/content/route.js GET  /api/content  (public)   ·   PUT /api/content (admin only)
  api/history/route.js GET  /api/history  last 10 saved versions (admin only)
lib/                   ← server helpers
  db.js                Neon queries (tables are created automatically on first use)
  auth.js              admin session cookie, request checks
  content.js           which content sections may be saved + validation
  render.js            fills the saved text into templates/home.html
  format.js            [[highlight]] / **bold** formatting (must match public/site.js)
data/                  ← DEFAULT content (used for anything not saved from the dashboard yet)
  content.en.json      English (also the structure: lists, numbers, photos, links)
  content.ar.json      Arabic translation (same shape, text only)
templates/             ← the page markup
  home.html            the website
  admin.html           the dashboard
public/                ← static files served as-is
  style.css            site styles
  site.js              renders the page sections from the content
  admin/               dashboard script and styles (admin.js, admin.css)
```

## Setup

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill it in:
   - `DATABASE_URL`: your Neon connection string (Neon dashboard → **Connect** → copy the string).
   - `ADMIN_PASSWORD`: the dashboard password (12+ characters).
   - `SESSION_SECRET` (optional): signs admin sessions. If it's not set, the admin password is used.
4. `npm run dev`, then open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the dashboard.

For production: `npm run build`, then `npm start`. Any Node.js host that runs Next.js works (for example Vercel, which
pairs well with Neon). Set the same environment variables on the host.

Changing `ADMIN_PASSWORD` (or `SESSION_SECRET`) logs out every open admin session.

## How content works

- **Where text comes from:** the database first; anything not saved there comes from the JSON files in `data/`
  (see `data/README.md`). Saving from the dashboard stores the full content in the database
  (table `site_content`). The previous version goes to `content_history` (last 10 kept, and they can be restored
  from **History** in the dashboard).
- Saved content always wins over the JSON files. Fields missing from the saved version come from the JSON files, so new
  fields added to the code later show up automatically.
- Text fields support `[[words]]` (highlight colour), `**words**` (bold) and line breaks. Everything else is escaped,
  so typing HTML into the dashboard can't break or hijack the page.
- **Images are not editable** from the dashboard (by design). Existing items keep their photo. New courses, levels and
  posts get a standard photo, and new stories and reviews show initials. To change photos, edit the `img` IDs in
  `data/content.en.json` (Unsplash photo IDs) or the image URLs in `templates/home.html`.
- If two people edit at once, the second save is refused with a message to reload, so nobody silently overwrites
  someone else's changes.

## Adding a new section

A new content section touches 5 places: `data/content.en.json` + `data/content.ar.json` (default text), `templates/home.html` (markup with
`data-c="group.field"`), `public/site.js` (lists), `public/admin/admin.js` (editor) and `CONTENT_GROUPS` in
`lib/content.js`.
