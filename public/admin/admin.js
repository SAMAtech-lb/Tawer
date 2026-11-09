/* Tawer Academy content dashboard. Edits the content object (see /content.js) and saves it via /api/content. */
(() => {
  const $ = (id) => document.getElementById(id);
  const DEFAULT = window.TAWER_DEFAULT || {};

  /* ---------- Helpers ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const merge = (d, s) => {
    if (s === undefined || s === null) return d;
    if (!isObj(d) || !isObj(s)) return s;
    const out = { ...d };
    for (const k of Object.keys(s)) out[k] = merge(d[k], s[k]);
    return out;
  };
  const getP = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const setP = (o, p, v) => {
    const ks = p.split("."), last = ks.pop();
    const t = ks.reduce((x, k) => (isObj(x[k]) ? x[k] : (x[k] = {})), o);
    t[last] = v;
  };
  const plain = (s) => String(s ?? "").replace(/\[\[|\]\]|\*\*/g, "");

  /* Tiny DOM builder. Text is always set via textContent / value, never innerHTML. */
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
    return el;
  };
  const icon = (name) => h("i", { class: name });

  let tt;
  const toast = (msg, bad = false) => {
    const t = $("toast");
    t.replaceChildren(icon(bad ? "ri-error-warning-line" : "ri-checkbox-circle-line"), document.createTextNode(" " + msg));
    t.classList.toggle("bad", bad);
    t.classList.add("on");
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove("on"), bad ? 6000 : 3000);
  };

  const api = async (path, opts = {}) => {
    const res = await fetch(path, {
      credentials: "same-origin",
      ...opts,
      headers: { "content-type": "application/json", ...(opts.headers || {}) },
    });
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    if (!data) throw Object.assign(new Error("The server didn't respond correctly. The dashboard only works when the site runs on Cloudflare Pages (or locally with `npm run dev`)."), { status: res.status });
    if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), { status: res.status });
    return data;
  };

  /* ---------- State ---------- */
  let state = null;          // content being edited
  let baseUpdatedAt = null;  // version the editor started from (conflict detection)
  let dirty = false;
  let saving = false;
  let currentTab = "contact";
  const openItems = new Map(); // list path -> Set of open item indexes

  const setStatus = () => {
    const s = $("status");
    s.className = "top__status" + (dirty ? " dirty" : baseUpdatedAt ? " ok" : "");
    s.replaceChildren();
    if (dirty) s.append(icon("ri-edit-circle-line"), " Unsaved changes");
    else if (baseUpdatedAt) s.append(icon("ri-checkbox-circle-line"), ` Published ${new Date(baseUpdatedAt).toLocaleString()}`);
    else s.append(icon("ri-information-line"), " Showing default content");
    $("saveBtn").disabled = !dirty || saving;
  };
  const markDirty = () => { if (!dirty) { dirty = true; setStatus(); } };

  /* ---------- Field types ---------- */
  const FILL = "1522202176988-66273c2fd55f";
  const F = (k, label, type = "text", extra = {}) => ({ k, label, type, ...extra });
  const TXT = (k, label, extra) => F(k, label, "textarea", { wide: true, ...extra });
  const LINES = (k, label, extra) => F(k, label, "lines", { wide: true, hint: "One item per line.", ...extra });

  const field = (def, obj, onChange) => {
    const val = getP(obj, def.k);
    const changed = (v) => { setP(obj, def.k, v); markDirty(); onChange && onChange(); };
    let control;

    switch (def.type) {
      case "textarea":
        control = h("textarea", { rows: def.rows || 3, oninput: (e) => changed(e.target.value) });
        control.value = val ?? "";
        break;
      case "lines":
        control = h("textarea", { rows: def.rows || Math.max(3, (val || []).length + 1), oninput: (e) => changed(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean)) });
        control.value = (Array.isArray(val) ? val : []).join("\n");
        break;
      case "number":
        control = h("input", { type: "number", step: "any", placeholder: def.placeholder,
          oninput: (e) => changed(e.target.value === "" ? (def.nullable ? null : 0) : Number(e.target.value)) });
        control.value = val ?? "";
        break;
      case "select":
        control = h("select", { onchange: (e) => changed(e.target.value) },
          def.options.map(([v, l]) => h("option", { value: v, text: l })));
        control.value = val ?? def.options[0][0];
        break;
      case "checkbox":
        return h("label", { class: "field check" + (def.wide ? " field--wide" : "") },
          h("input", { type: "checkbox", checked: !!val, onchange: (e) => changed(e.target.checked) }), def.label);
      case "answers": {
        const answers = Array.isArray(obj.a) ? obj.a : (obj.a = ["", "", "", ""]);
        while (answers.length < 4) answers.push("");
        const name = "c" + Math.random().toString(36).slice(2);
        const rows = answers.slice(0, 4).map((a, i) => {
          const input = h("input", { type: "text", "aria-label": `Answer ${"ABCD"[i]}`, oninput: (e) => { answers[i] = e.target.value; markDirty(); } });
          input.value = a;
          const radio = h("input", { type: "radio", name, checked: +obj.c === i, onchange: () => {
            obj.c = i; markDirty();
            wrap.querySelectorAll(".answer").forEach((r, j) => r.classList.toggle("correct", j === i));
          } });
          return h("div", { class: "answer" + (+obj.c === i ? " correct" : "") }, h("b", { text: "ABCD"[i] }), input, h("label", {}, radio, "Correct"));
        });
        const wrap = h("div", { class: "field field--wide" }, h("span", { text: "Answers" }), h("div", { class: "answers" }, rows),
          h("small", { text: "Pick which answer is correct. Visitors also get an \"I don't know\" option automatically." }));
        return wrap;
      }
      default:
        control = h("input", { type: def.type === "url" ? "url" : "text", placeholder: def.placeholder, oninput: (e) => changed(e.target.value) });
        control.value = val ?? "";
    }
    return h("label", { class: "field" + (def.wide ? " field--wide" : "") },
      h("span", { text: def.label }), control, def.hint ? h("small", { text: def.hint }) : null);
  };

  /* ---------- List editor ---------- */
  const listEditor = (def) => {
    const box = h("div", { class: "list" });
    const opened = openItems.get(def.p) || new Set();
    openItems.set(def.p, opened);

    const render = () => {
      const items = getP(state, def.p);
      if (!Array.isArray(items)) setP(state, def.p, []);
      const arr = getP(state, def.p);
      box.replaceChildren(
        ...arr.map((item, i) => {
          const title = h("span", { class: "item__title" });
          const updateTitle = () => { title.textContent = plain(def.title(item, i)) || "(untitled)"; };
          updateTitle();
          const tool = (ic, label, fn, cls = "") => h("button", { type: "button", class: "btn btn--icon btn--sm " + cls, "aria-label": label, title: label,
            onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(); } }, icon(ic));
          const move = (to) => {
            if (to < 0 || to >= arr.length) return;
            [arr[i], arr[to]] = [arr[to], arr[i]];
            const a = opened.has(i), b = opened.has(to);
            opened.delete(i); opened.delete(to);
            if (a) opened.add(to); if (b) opened.add(i);
            markDirty(); render();
          };
          const details = h("details", { class: "item", open: opened.has(i),
            ontoggle: (e) => (e.target.open ? opened.add(i) : opened.delete(i)) },
            h("summary", {},
              h("span", { class: "item__n", text: String(i + 1) }), title,
              h("span", { class: "item__tools" },
                tool("ri-arrow-up-line", "Move up", () => move(i - 1)),
                tool("ri-arrow-down-line", "Move down", () => move(i + 1)),
                tool("ri-delete-bin-6-line", "Delete", () => {
                  if (!confirm(`Delete "${title.textContent}"?`)) return;
                  arr.splice(i, 1);
                  const next = new Set([...opened].filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
                  opened.clear(); next.forEach((x) => opened.add(x));
                  markDirty(); render();
                }, "del")),
              icon("ri-arrow-down-s-line item__chev")),
            h("div", { class: "item__body" }, h("div", { class: "fields" }, def.fields.map((f) => field(f, item, updateTitle)))));
          return details;
        }),
        h("button", { type: "button", class: "btn btn--add", onclick: () => {
          arr.push(def.make());
          opened.add(arr.length - 1);
          markDirty(); render();
          box.children[arr.length - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
        } }, icon("ri-add-line"), ` Add ${def.noun}`)
      );
    };
    render();
    return box;
  };

  /* ---------- Dashboard structure ---------- */
  const FORMAT_HINT = { hint: () => ["Formatting: ", h("code", { text: "[[words]]" }), " highlights words in colour, ", h("code", { text: "**words**" }), " makes them bold."] };
  const NO_PHOTO = "New items get a standard photo. Photos can't be changed from the dashboard.";
  const CAT = [["adults", "Adults"], ["kids", "Kids & Teens"], ["business", "Business"], ["exam", "Exam prep"]];

  const TABS = [
    { id: "contact", label: "Contact & links", icon: "ri-contacts-book-3-line", desc: "Shown in the top bar, contact section, footer and WhatsApp buttons.",
      cards: [
        { title: "Contact details", fields: [
          F("contact.phone", "Phone"),
          F("contact.whatsapp", "WhatsApp number", "text", { placeholder: "e.g. 96170123456", hint: "Country code + number, digits only. Leave empty to use the phone number." }),
          F("contact.email", "Email"),
          F("contact.hours", "Opening hours"),
          F("contact.address", "Address", "text", { wide: true }),
          F("contact.intake", "Top bar announcement", "text", { wide: true, hint: "e.g. New intake starts **3 November**" }),
        ] },
        { title: "Contact section", ...FORMAT_HINT, fields: [F("contact.label", "Small label"), F("contact.title", "Heading"), TXT("contact.text", "Text")] },
        { title: "Social media links", hint: "Full links, e.g. https://instagram.com/tawer.academy. Leave a field empty to hide that icon.", fields: [
          F("social.instagram", "Instagram", "url"), F("social.facebook", "Facebook", "url"), F("social.tiktok", "TikTok", "url"),
          F("social.youtube", "YouTube", "url"), F("social.linkedin", "LinkedIn", "url"),
        ] },
      ] },
    { id: "hero", label: "Hero (top of page)", icon: "ri-home-5-line", desc: "The first thing visitors see.",
      cards: [
        { title: "Main text", ...FORMAT_HINT, fields: [
          F("hero.label", "Small label", "text", { wide: true }), F("hero.title", "Main heading", "text", { wide: true }), TXT("hero.text", "Text"),
          F("hero.button1", "Orange button"), F("hero.button2", "Outline button"),
          F("hero.rating", "Rating"), F("hero.ratingText", "Rating text"),
        ] },
        { title: "Floating cards on the photo", fields: [
          F("hero.progressTitle", "Progress card title"), F("hero.progressTag", "Progress card tag"),
          F("hero.clubTitle", "Event card title"), F("hero.clubText", "Event card text"),
          F("hero.certTitle", "Certificate card title"), F("hero.certText", "Certificate card text"),
        ] },
        { title: "Exams strip", fields: [F("exams.label", "Label", "text", { wide: true }), LINES("exams.items", "Exams")] },
      ] },
    { id: "about", label: "About", icon: "ri-information-line",
      cards: [
        { title: "About section", ...FORMAT_HINT, fields: [
          F("about.label", "Small label"), F("about.title", "Heading"), TXT("about.text", "Text", { rows: 5 }),
          F("about.years", "Years badge number", "number"), F("about.yearsText", "Years badge text", "textarea", { rows: 2 }),
          F("about.storyTitle", "Founding story title", "text", { wide: true }), TXT("about.storyText", "Founding story", { rows: 4 }),
          LINES("about.ticks", "Checklist"),
        ] },
      ] },
    { id: "levels", label: "Levels", icon: "ri-bar-chart-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("levels.label", "Small label"), F("levels.title", "Heading"), TXT("levels.text", "Text")] },
        { title: "Levels", sub: NO_PHOTO, list: { p: "levels.items", noun: "level", title: (x) => `${x.code || "?"} · ${x.name || ""}`,
          make: () => ({ code: "", name: "New level", weeks: 12, hours: 72, img: FILL, intro: "", can: [] }),
          fields: [F("code", "Code", "text", { placeholder: "e.g. B2" }), F("name", "Name"), F("weeks", "Weeks", "number"), F("hours", "Teaching hours", "number"),
            TXT("intro", "Intro", { rows: 2 }), LINES("can", "After this level you can…")] } },
      ] },
    { id: "courses", label: "Courses", icon: "ri-book-2-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("courses.label", "Small label"), F("courses.title", "Heading")] },
        { title: "Courses", sub: NO_PHOTO, list: { p: "courses.items", noun: "course", title: (x) => x.title,
          make: () => ({ cat: "adults", title: "New course", level: "", dur: "", mode: "In-class & online", price: null, img: FILL, desc: "", badge: "" }),
          fields: [F("title", "Title"), F("cat", "Category (filter)", "select", { options: CAT }),
            F("level", "Level / ages"), F("dur", "Duration"), F("mode", "Format"),
            F("price", "Price from ($ / month)", "number", { nullable: true, hint: "Leave empty to show \"Custom quote\"." }),
            F("badge", "Badge on photo", "text", { hint: "Optional, e.g. Best seller" }), TXT("desc", "Description", { rows: 2 })] } },
      ] },
    { id: "test", label: "Placement test", icon: "ri-survey-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("test.label", "Small label"), F("test.title", "Heading"), TXT("test.text", "Text"),
          LINES("test.perks", "Bullet points"), F("test.startTitle", "Start card title"), TXT("test.startText", "Start card text", { wide: false })] },
        { title: "Questions", sub: "Write ___ (three underscores) where the gap is.", list: { p: "test.questions", noun: "question", title: (x) => x.q,
          make: () => ({ q: "", a: ["", "", "", ""], c: 0 }),
          fields: [F("q", "Question", "text", { wide: true, placeholder: "e.g. She ___ a teacher." }), F("a", "Answers", "answers")] } },
        { title: "Results", sub: "The score is split evenly across these results, lowest first.", list: { p: "test.results", noun: "result", title: (x) => `${x.code || "?"} · ${x.name || ""}`,
          make: () => ({ code: "", name: "", course: "", text: "" }),
          fields: [F("code", "Level code"), F("name", "Level name"), F("course", "Recommended course", "text", { wide: true }), TXT("text", "Message", { rows: 2 })] } },
      ] },
    { id: "how", label: "How it works", icon: "ri-route-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("how.label", "Small label"), F("how.title", "Heading")] },
        { title: "Steps", list: { p: "how.items", noun: "step", title: (x) => x.title,
          make: () => ({ icon: "ri-checkbox-circle-line", title: "New step", text: "" }),
          fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
      ] },
    { id: "why", label: "Why Tawer & stats", icon: "ri-star-smile-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("why.label", "Small label"), F("why.title", "Heading")] },
        { title: "Reasons", list: { p: "why.items", noun: "reason", title: (x) => x.title,
          make: () => ({ icon: "ri-star-line", title: "New reason", text: "" }),
          fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
        { title: "Numbers", list: { p: "why.stats", noun: "number", title: (x) => `${x.value ?? ""}${x.suffix || ""} ${x.label || ""}`,
          make: () => ({ value: 0, suffix: "", label: "" }),
          fields: [F("value", "Number", "number"), F("suffix", "After the number", "text", { placeholder: "e.g. + or %" }), F("label", "Label", "text", { wide: true })] } },
      ] },
    { id: "stories", label: "Success stories", icon: "ri-trophy-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("stories.label", "Small label"), F("stories.title", "Heading"), TXT("stories.text", "Text")] },
        { title: "Stories", sub: "New stories are shown with initials instead of a photo. They scroll automatically on the site.", list: { p: "stories.items", noun: "story", title: (x) => `${x.result || ""} ${x.name || ""}`.trim(),
          make: () => ({ name: "", role: "", result: "", resultLabel: "", text: "", img: "" }),
          fields: [F("result", "Result (big)", "text", { placeholder: "e.g. 8.0 or A2 → B2" }), F("resultLabel", "Result label", "text", { placeholder: "e.g. IELTS band at 14" }),
            F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Started at 10 · now 14" }), TXT("text", "Story", { rows: 3 })] } },
      ] },
    { id: "reviews", label: "Reviews", icon: "ri-chat-quote-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("reviews.label", "Small label"), F("reviews.title", "Heading")] },
        { title: "Reviews", sub: "New reviews are shown with initials instead of a photo.", list: { p: "reviews.items", noun: "review", title: (x) => x.name,
          make: () => ({ name: "", role: "", text: "", img: "" }),
          fields: [F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Engineer · A2 → B2" }), TXT("text", "Review", { rows: 3 })] } },
      ] },
    { id: "pricing", label: "Pricing", icon: "ri-price-tag-3-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("pricing.label", "Small label"), F("pricing.title", "Heading"),
          F("pricing.termSave", "Per-term badge"), F("pricing.note", "Note under the plans", "text", { wide: true })] },
        { title: "Plans", list: { p: "pricing.plans", noun: "plan", title: (x) => `${x.name || ""} · $${x.monthly ?? ""}`,
          make: () => ({ name: "New plan", desc: "", monthly: 0, term: 0, popular: false, tag: "", included: [], excluded: [] }),
          fields: [F("name", "Plan name"), F("desc", "Short description"), F("monthly", "Monthly price ($)", "number"), F("term", "Per-term price ($)", "number"),
            F("tag", "Tag", "text", { hint: "Optional, e.g. Most popular" }), F("popular", "Highlight this plan", "checkbox"),
            LINES("included", "Included (✓)"), LINES("excluded", "Not included (✗)")] } },
      ] },
    { id: "faq", label: "FAQ", icon: "ri-question-answer-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("faq.label", "Small label"), F("faq.title", "Heading"), TXT("faq.text", "Text", { rows: 2 }), F("faq.button", "WhatsApp button")] },
        { title: "Questions", list: { p: "faq.items", noun: "question", title: (x) => x.q,
          make: () => ({ q: "New question", a: "" }),
          fields: [F("q", "Question", "text", { wide: true }), TXT("a", "Answer", { rows: 3 })] } },
      ] },
    { id: "blog", label: "Blog", icon: "ri-article-line",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("blog.label", "Small label"), F("blog.title", "Heading"),
          F("blog.allLabel", "\"All articles\" button"), F("blog.allUrl", "\"All articles\" link", "url")] },
        { title: "Posts", sub: NO_PHOTO, list: { p: "blog.items", noun: "post", title: (x) => x.title,
          make: () => ({ tag: "", title: "New post", excerpt: "", url: "#", img: FILL }),
          fields: [F("title", "Title", "text", { wide: true }), F("tag", "Category · read time", "text", { placeholder: "e.g. IELTS · 6 min read" }),
            F("url", "Link", "url", { placeholder: "https://…" }), TXT("excerpt", "Short summary", { rows: 2 })] } },
      ] },
    { id: "other", label: "Banner, footer & SEO", icon: "ri-layout-bottom-2-line",
      cards: [
        { title: "Free trial banner", ...FORMAT_HINT, fields: [F("cta.title", "Heading"), F("cta.button", "Button"), TXT("cta.text", "Text", { rows: 2 })] },
        { title: "Footer", fields: [TXT("footer.about", "About text", { rows: 2 }), F("footer.newsTitle", "Newsletter title"), F("footer.newsText", "Newsletter text")] },
        { title: "Google & link previews", hint: "What Google shows in search results, and what WhatsApp / Facebook show when someone shares the link.", fields: [
          F("seo.title", "Page title", "text", { wide: true }), TXT("seo.description", "Search description", { rows: 3, hint: "Best kept under 160 characters." }),
          F("seo.shareTitle", "Share title", "text", { wide: true }), TXT("seo.shareDescription", "Share description", { rows: 2 }),
        ] },
      ] },
  ];

  /* ---------- Rendering ---------- */
  const renderTabs = () => {
    $("tabs").replaceChildren(...TABS.map((t) => h("button", { type: "button", class: t.id === currentTab ? "active" : "",
      onclick: () => { currentTab = t.id; try { localStorage.setItem("tawer-admin-tab", t.id); } catch {} renderTabs(); renderPanel(); scrollTo({ top: 0 }); } },
      icon(t.icon), t.label)));
  };

  const renderPanel = () => {
    const t = TABS.find((x) => x.id === currentTab) || TABS[0];
    $("panel").replaceChildren(
      h("div", { class: "panel__head" }, h("h1", { text: t.label }), t.desc ? h("p", { class: "muted", text: t.desc }) : null),
      ...t.cards.map((c) => h("section", { class: "card" },
        h("h2", {}, c.title, c.sub ? h("small", { text: "· " + c.sub }) : null),
        c.hint ? h("div", { class: "hint" }, icon("ri-lightbulb-line"), h("div", {}, typeof c.hint === "function" ? c.hint() : c.hint)) : null,
        c.list ? listEditor(c.list) : h("div", { class: "fields" }, c.fields.map((f) => field(f, state))))));
  };

  const showApp = () => {
    $("loginView").hidden = true;
    $("appView").hidden = false;
    renderTabs(); renderPanel(); setStatus();
  };

  const showLogin = (msg = "") => {
    $("appView").hidden = true;
    $("loginView").hidden = false;
    $("loginMsg").textContent = msg;
    $("password").value = "";
    $("password").focus();
  };

  const loadContent = async () => {
    const data = await api("/api/content");
    state = merge(clone(DEFAULT), data.content || {});
    baseUpdatedAt = data.updatedAt;
    dirty = false;
    openItems.clear();
  };

  /* ---------- Actions ---------- */
  const save = async () => {
    if (!dirty || saving) return;
    saving = true; setStatus();
    $("saveBtn").querySelector("span").textContent = "Saving…";
    try {
      const r = await api("/api/content", { method: "PUT", body: JSON.stringify({ content: state, baseUpdatedAt }) });
      baseUpdatedAt = r.updatedAt;
      dirty = false;
      toast("Saved. The website is updated.");
    } catch (e) {
      if (e.status === 401) showLogin("Your session expired. Log in again. Your changes are kept, press Save after logging in.");
      else toast(e.message, true);
    } finally {
      saving = false;
      $("saveBtn").querySelector("span").textContent = "Save & publish";
      setStatus();
    }
  };

  const loadVersion = (content, label) => {
    if (dirty && !confirm("You have unsaved changes. Replace them with this version?")) return;
    state = merge(clone(DEFAULT), content || {});
    openItems.clear();
    dirty = true;
    $("historyDlg").close();
    renderPanel(); setStatus();
    toast(`${label} loaded. Press "Save & publish" to put it live.`);
  };

  const openHistory = async () => {
    const list = $("historyList");
    list.replaceChildren(h("p", { class: "muted", text: "Loading…" }));
    $("historyDlg").showModal();
    try {
      const { versions } = await api("/api/history");
      list.replaceChildren(...(versions.length ? versions.map((v) => h("div", { class: "history__row" },
        h("div", {}, h("b", { text: new Date(v.updatedAt).toLocaleString() }), h("small", { text: "Saved version" })),
        h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => loadVersion(v.content, "Older version") }, icon("ri-arrow-go-back-line"), " Load"))) :
        [h("p", { class: "muted", text: "No older versions yet. They appear here after you save a few times." })]));
    } catch (e) {
      if (e.status === 401) { $("historyDlg").close(); showLogin("Your session expired. Log in again."); return; }
      list.replaceChildren(h("p", { class: "msg", text: e.message }));
    }
  };

  /* ---------- Events ---------- */
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("loginBtn");
    btn.disabled = true; $("loginMsg").textContent = "";
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password: $("password").value }) });
      if (!state) await loadContent();
      showApp();
    } catch (err) {
      $("loginMsg").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
  $("pwToggle").addEventListener("click", () => {
    const p = $("password"), show = p.type === "password";
    p.type = show ? "text" : "password";
    $("pwToggle").replaceChildren(icon(show ? "ri-eye-off-line" : "ri-eye-line"));
  });
  $("saveBtn").addEventListener("click", save);
  $("historyBtn").addEventListener("click", openHistory);
  $("resetBtn").addEventListener("click", () => loadVersion(clone(DEFAULT), "Original default content"));
  $("historyDlg").addEventListener("click", (e) => { if (e.target.closest("[data-close]") || e.target === $("historyDlg")) $("historyDlg").close(); });
  $("logoutBtn").addEventListener("click", async () => {
    if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
    try { await api("/api/logout", { method: "POST", body: "{}" }); } catch { /* ignore */ }
    state = null; dirty = false;
    showLogin();
  });
  addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("appView").hidden) { e.preventDefault(); save(); }
  });
  addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Start ---------- */
  (async () => {
    try { currentTab = localStorage.getItem("tawer-admin-tab") || currentTab; } catch {}
    if (!TABS.some((t) => t.id === currentTab)) currentTab = TABS[0].id;
    try {
      const s = await api("/api/session");
      if (!s.configured.password) return showLogin("The admin password isn't set up on the server yet (ADMIN_PASSWORD). See the README.");
      if (!s.configured.storage) return showLogin("Content storage isn't set up on the server yet (KV binding CONTENT). See the README.");
      if (!s.admin) return showLogin();
      await loadContent();
      showApp();
    } catch (e) {
      showLogin(e.message);
    }
  })();
})();
