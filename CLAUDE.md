# CLAUDE.md — Tawer Academy website

## Standing rule for every session
After each conversation that changes something or makes a decision, **update this file**:
add a dated entry to the *Session log* below (what was asked, what was done, decisions made),
and update the *Project* sections if the structure, stack or conventions changed.
Keep entries short. This file is the shared context for anyone (human or AI) working on the repo.

## Standing rule: every UI change gets a ui-taste check
After **any** change that affects how the site looks (HTML, CSS, content, layout), before reporting it as done:
1. Serve the site: `python -m http.server 8765 --bind 127.0.0.1` (from the repo root).
2. Look at the real rendered page with the **agent-browser** skill/CLI
   (`agent-browser open http://127.0.0.1:8765/index.html`, then `agent-browser screenshot <file>`).
   Check desktop **and** a mobile/tablet width (`agent-browser set viewport 390 844`).
3. Run the **ui-taste** skill (`/ui-taste`, in [.claude/skills/ui-taste/](.claude/skills/ui-taste/))
   as a review of the changed area. Use its polish/audit playbooks, and fix material issues it finds.
4. Mention in the reply what the ui-taste check found and what was fixed.
The project rules here (strict palette, "don't change the design" requests) outrank ui-taste suggestions.

## Tooling installed
- Skills in [.claude/skills/](.claude/skills/) (tracked in [skills-lock.json](skills-lock.json)): `ui-taste`,
  `ios-design` (from uizze.sh), and `agent-browser` (from vercel-labs/agent-browser).
- `agent-browser` CLI v0.41.2 is installed globally with npm. Its own Chrome download timed out, so it
  uses the system **Edge** via `AGENT_BROWSER_EXECUTABLE_PATH`, set in
  [.claude/settings.local.json](.claude/settings.local.json) (machine-specific; don't commit it).
  Outside Claude Code, pass `--executable-path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`.
- Fallback if agent-browser fails: headless Edge screenshots
  (`msedge --headless=new --screenshot=<file> --window-size=1440,12000 <url>`).

## Project
Static marketing website for **Tawer Academy**, an English language academy
(kids, teens, adults; CEFR levels A1–C1; General English, Conversation, IELTS, TOEFL,
Business English, Corporate Training; in-class and online).

### Stack
- Plain HTML + CSS + vanilla JS. No build step, no framework, no package.json.
- Open [index.html](index.html) directly in a browser to view.
- Fonts: Google Fonts — Lexend (headings), DM Sans (body).
- Icons: Remix Icon 4.5.0 via jsDelivr CDN (`ri-*` classes).
- Images: Unsplash, built by the `U(id, w)` helper in the inline script.

### Files
- [index.html](index.html) — all markup, SEO meta, JSON-LD (EducationalOrganization + FAQPage),
  and one inline `<script>` near the bottom holding the data arrays
  (`LEVELS`, `COURSES`, `TEACHERS`, `REVIEWS`, `QUIZ`, …) and the page logic.
- [style.css](style.css) — all styles. Design tokens in `:root` (see *Color palette*).
- [README.md](README.md) — placeholder only.

### Page sections (in order)
hero → strip (exam prep) → #about (founding story + 4 value ticks) → #levels → #courses →
#test (placement quiz) → #how → why (3 value props + stats) → #stories (auto-scrolling success-story cards) →
#reviews (testimonials) → #pricing → #faq → #blog → cta → #contact

There is **no team/teachers section** (removed on purpose).

### Content status
All names, stories, testimonials, numbers and contact details are **dummy placeholder data**.
Swap in real content before launch. Story and testimonial data live in `STORIES` and `REVIEWS`
in the inline script.

### Messaging priorities (from the client)
- Value proposition: **customised curriculum updated every term**, **build your own course**,
  **live online access from anywhere**.
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
- The favicon and `theme-color` in [index.html](index.html) use the same palette.

### Conventions
- Content (courses, teachers, reviews, quiz questions) lives in the JS data arrays — edit there,
  not in hardcoded HTML.
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
  `python -m http.server 8765`). No design/layout changes, only color structure: reading text moved
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
