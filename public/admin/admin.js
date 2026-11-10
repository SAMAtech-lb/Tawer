/* Tawer Academy content dashboard. Edits the content object and saves it via /api/content.
 * Boxes show the saved content from the database; anything not saved yet comes from the defaults (data/*.json, served as /content.js). */
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
    if (!data) throw Object.assign(new Error("The server didn't respond correctly. The dashboard only works when the site runs on its Next.js server (locally: `npm run dev`)."), { status: res.status });
    if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status}).`), { status: res.status });
    return data;
  };

  /* ---------- State ---------- */
  let state = null;          // content being edited
  let baseUpdatedAt = null;  // version the editor started from (conflict detection)
  let dirty = false;
  let saving = false;
  let currentTab = "requests";
  const openItems = new Map(); // list path -> Set of open item indexes

  /* Two languages, edited side by side. English = the main content (structure: items, order, numbers, photos,
   * links). Arabic = state.ar with the same shape, text only. An empty Arabic field shows the English text on the
   * Arabic site. Every translatable field is shown as an English box and an Arabic box next to each other. */
  const arRoot = () => (isObj(state.ar) ? state.ar : (state.ar = {}));
  // Arabic list (same path under state.ar), kept the same length/order as the English one.
  const arList = (p) => { let a = getP(arRoot(), p); if (!Array.isArray(a)) { a = []; setP(arRoot(), p, a); } return a; };
  const arItem = (p, i) => { const a = arList(p); if (!isObj(a[i])) a[i] = {}; return a[i]; };
  // Which fields are translated: text-like fields, unless marked { tr: false } (codes, phone numbers, the English test…).
  const translatable = (def) => def.tr !== false && ["text", "textarea", "lines"].includes(def.type);

  const setStatus = () => {
    const s = $("status");
    s.className = "top__status" + (dirty ? " dirty" : baseUpdatedAt ? " ok" : "");
    s.replaceChildren();
    if (dirty) s.append(icon("ri-edit-circle-line"), " Unsaved changes");
    else if (baseUpdatedAt) s.append(icon("ri-checkbox-circle-line"), ` Published ${new Date(baseUpdatedAt).toLocaleString()}`);
    else s.append(icon("ri-information-line"), " Showing default content");
    $("saveBtn").disabled = !dirty || saving;
    $("saveBar").hidden = !dirty;
    $("saveBar2").disabled = saving;
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

  /* ---------- Simple rich-text box ----------
   * Bold and coloured words are shown as they will look on the website (no ** or [[ ]] marks on screen).
   * The box still saves the same simple marks: **bold**, [[coloured]], new line. */
  const escHtml = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const marksToHtml = (v) => escHtml(v)
    .replace(/\[\[(.+?)\]\]/g, "<mark>$1</mark>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
  const htmlToMarks = (root) => {
    const walk = (node) => [...node.childNodes].map((c) => {
      if (c.nodeType === 3) return c.nodeValue.replace(/ /g, " ");
      if (c.nodeType !== 1) return "";
      if (c.nodeName === "BR") return "\n";
      const inner = walk(c);
      if (/^(DIV|P)$/.test(c.nodeName)) return "\n" + inner;
      if (!inner.trim()) return inner;
      const bold = c.nodeName === "B" || c.nodeName === "STRONG" || +(c.style && c.style.fontWeight) >= 600 || (c.style && c.style.fontWeight === "bold");
      if (c.nodeName === "MARK") return "[[" + inner + "]]";
      if (bold) return "**" + inner + "**";
      return inner;
    }).join("");
    return walk(root).replace(/^\n/, "").replace(/\*\*\*\*/g, "").replace(/\]\]\[\[/g, "");
  };
  const richBox = (value, attrs, multiline, onText) => {
    const el = h("div", { class: "rte" + (multiline ? " rte--multi" : ""), contenteditable: "true", role: "textbox",
      "aria-multiline": multiline ? "true" : "false", spellcheck: "true", ...attrs });
    el.innerHTML = marksToHtml(value);
    const sync = () => onText(htmlToMarks(el));
    el.addEventListener("input", sync);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); if (multiline) document.execCommand("insertLineBreak"); }
    });
    // Pasted text arrives as plain text (no fonts or colours from Word or websites).
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
      document.execCommand("insertText", false, multiline ? t : t.replace(/\s*\n\s*/g, " "));
    });
    el._sync = sync;
    return el;
  };

  /* Small bubble that appears above selected words: Bold / Colour. */
  const selTool = (() => {
    const bar = h("div", { class: "seltool", role: "toolbar", "aria-label": "Text style", hidden: true });
    let box = null;
    const btn = (label, title, fn, ...kids) => h("button", { type: "button", title, "aria-label": title,
      onmousedown: (e) => e.preventDefault(), onclick: () => { fn(); box && box._sync(); place(); } }, ...kids, label);
    const toggleMark = () => {
      const sel = getSelection(); if (!sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      const inMark = (n) => (n.nodeType === 1 ? n : n.parentElement)?.closest("mark");
      const m = inMark(r.startContainer);
      if (m && box.contains(m) && m === inMark(r.endContainer)) { m.replaceWith(...m.childNodes); return; }
      const mark = document.createElement("mark");
      mark.appendChild(r.extractContents());
      mark.querySelectorAll("mark").forEach((x) => x.replaceWith(...x.childNodes));
      r.insertNode(mark);
      sel.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(mark); sel.addRange(nr);
    };
    bar.append(
      btn("", "Bold", () => document.execCommand("bold"), h("b", { text: "B" })),
      btn(" Colour", "Coloured words", toggleMark, h("span", { class: "seltool__dot" })));
    const place = () => {
      const sel = getSelection();
      const node = sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
      box = node && (node.nodeType === 1 ? node : node.parentElement)?.closest(".rte");
      if (!box || sel.isCollapsed) { bar.hidden = true; return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      bar.hidden = false;
      const w = bar.offsetWidth;
      bar.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      // Above the selection, or below it when there is no room at the top of the screen.
      bar.style.top = (r.top - bar.offsetHeight - 8 < 8 ? r.bottom + 8 : r.top - bar.offsetHeight - 8) + "px";
    };
    document.addEventListener("selectionchange", place);
    addEventListener("scroll", () => { if (!bar.hidden) place(); }, { passive: true });
    addEventListener("resize", () => { if (!bar.hidden) place(); });
    document.body.append(bar);
    return bar;
  })();

  /* A translatable field: English box and Arabic box side by side (stacked on phones), under one label. */
  const pairField = (def, enObj, arObj, onChange) => {
    const lines = def.type === "lines";
    const box = (obj, ar) => {
      const val = getP(obj, def.k);
      const changed = (v) => { setP(obj, def.k, v); markDirty(); refreshBadges(); onChange && onChange(); };
      const attrs = ar ? { dir: "rtl", lang: "ar" } : { dir: "ltr", lang: "en" };
      const enVal = getP(enObj, def.k);
      // Arabic left empty: the English text shows faintly, because that is what the Arabic site will show.
      const hintText = ar ? plain(lines ? (enVal || []).join("\n") : enVal ?? "") : def.placeholder || "";
      let control;
      if (!lines) {
        control = richBox(val ?? "", { ...attrs, "aria-label": `${def.label} (${ar ? "Arabic" : "English"})`, "data-placeholder": hintText },
          def.type === "textarea", changed);
      } else {
        control = h("textarea", { ...attrs, rows: def.rows || Math.max(3, (Array.isArray(enVal) ? enVal.length : 0) + 1),
          "aria-label": `${def.label} (${ar ? "Arabic" : "English"})`, placeholder: hintText,
          // English lines drop empty ones; Arabic lines keep their position (line 2 translates English line 2).
          oninput: (e) => changed(ar ? e.target.value.split("\n").map((x) => x.trim()) : e.target.value.split("\n").map((x) => x.trim()).filter(Boolean)) });
        control.value = (Array.isArray(val) ? val : []).join("\n");
      }
      return h("div", { class: "pair__col" + (ar ? " pair__col--ar" : "") },
        h("span", { class: "pair__tag", lang: ar ? "ar" : "en", text: ar ? "العربية" : "English" }), control);
    };
    return h("div", { class: "field field--wide pair" },
      h("span", { class: "field__label", text: def.label }),
      h("div", { class: "pair__grid" }, box(enObj, false), box(arObj, true)),
      lines ? h("small", { text: "One item per line." }) : def.hint ? h("small", { text: def.hint }) : null);
  };

  /* Fields of a card (or list item): translatable ones as English|Arabic pairs, the rest (numbers, codes, links…) once. */
  const fieldsFor = (defs, enObj, arObj, onChange) =>
    defs.map((f) => (translatable(f) ? pairField(f, enObj, arObj, onChange) : field(f, enObj, onChange)));

  /* How many filled-in English texts in a section have no Arabic yet (shown as a badge on the section tab). */
  const missingArabic = (tab) => {
    let n = 0;
    const check = (def, en, ar) => {
      if (!translatable(def)) return;
      const e = getP(en, def.k), a = ar ? getP(ar, def.k) : undefined;
      if (def.type === "lines") (Array.isArray(e) ? e : []).forEach((x, i) => { if (String(x).trim() && !String((Array.isArray(a) ? a[i] : "") ?? "").trim()) n++; });
      else if (String(e ?? "").trim() && !String(a ?? "").trim()) n++;
    };
    for (const c of tab.cards) {
      if (c.list) {
        const tr = getP(state.ar || {}, c.list.p) || [];
        (getP(state, c.list.p) || []).forEach((item, i) => c.list.fields.forEach((f) => check(f, item, tr[i])));
      } else c.fields.forEach((f) => check(f, state, state.ar || {}));
    }
    return n;
  };
  let badgeTimer;
  const refreshBadges = () => {
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      $("tabs").querySelectorAll("button[data-tab]").forEach((b) => {
        const t = TABS.find((x) => x.id === b.dataset.tab), n = !t ? 0 : t.inbox ? openCount() : missingArabic(t);
        const badge = b.querySelector(".tab__badge");
        badge.textContent = n || "";
        badge.hidden = !n;
        badge.title = !n ? "" : t.inbox ? `${n} new request${n > 1 ? "s" : ""}` : `${n} text${n > 1 ? "s" : ""} without Arabic translation`;
      });
    }, 150);
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
            const tr = arList(def.p); // keep the Arabic items attached to the same English items
            while (tr.length <= Math.max(i, to)) tr.push({});
            [tr[i], tr[to]] = [tr[to], tr[i]];
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
                  arList(def.p).splice(i, 1);
                  refreshBadges();
                  const next = new Set([...opened].filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
                  opened.clear(); next.forEach((x) => opened.add(x));
                  markDirty(); render();
                }, "del")),
              icon("ri-arrow-down-s-line item__chev")),
            h("div", { class: "item__body" }, h("div", { class: "fields" }, fieldsFor(def.fields, item, def.fields.some(translatable) ? arItem(def.p, i) : {}, updateTitle))));
          return details;
        }),
        h("button", { type: "button", class: "btn btn--add", onclick: () => {
          arr.push(def.make());
          refreshBadges();
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
  const FORMAT_HINT = { hint: () => ["Tip: select words to make them ", h("b", { text: "bold" }), " or ", h("mark", { text: "coloured" }), "."] };
  const NO_PHOTO = "New items get a standard photo. Photos can't be changed from the dashboard.";
  const CAT = [["adults", "Adults"], ["kids", "Kids & Teens"], ["business", "Business"], ["exam", "Exam prep"]];

  const TABS = [
    { id: "requests", label: "Requests", icon: "ri-inbox-2-line", inbox: true, cards: [],
      desc: "What visitors send with the website's two forms: \u201cBuild your own course\u201d and \u201cCorporate training\u201d. Reply on WhatsApp, then mark it as handled." },
    { id: "contact", label: "Contact & links", icon: "ri-contacts-book-3-line", desc: "Phone, WhatsApp, email and opening hours, the contact section with its two forms, and your social and community links.", anchor: "#contact",
      cards: [
        { title: "Contact details", fields: [
          F("contact.phone", "Phone", "text", { tr: false }),
          F("contact.whatsapp", "WhatsApp number", "text", { tr: false, placeholder: "e.g. 96170123456", hint: "Country code + number, digits only. Leave empty to use the phone number." }),
          F("contact.email", "Email", "text", { tr: false }),
          F("contact.hours", "Opening hours"),
          F("contact.intake", "Top bar announcement", "text", { wide: true, hint: "e.g. New intake starts **3 November**" }),
        ] },
        { title: "Contact section", ...FORMAT_HINT, fields: [F("contact.label", "Small label"), F("contact.title", "Heading"), TXT("contact.text", "Text"),
          F("contact.button", "WhatsApp button", "text", { wide: true })] },
        { title: "The two forms", sub: "\u201cBuild your own course\u201d and \u201cCorporate training\u201d. What people send arrives in Requests.", fields: [
          F("forms.label", "Text above the forms", "text", { wide: true }),
          F("forms.customTab", "First form: title", "text", { wide: true }), TXT("forms.customText", "First form: short explanation", { rows: 2 }),
          F("forms.corporateTab", "Second form: title", "text", { wide: true }), TXT("forms.corporateText", "Second form: short explanation", { rows: 2 }),
          TXT("forms.sent", "Message after sending", { rows: 2 })] },
        { title: "Community and social media links", hint: "Full links, e.g. https://chat.whatsapp.com/\u2026 or https://instagram.com/tawer.academy. Leave a field empty to hide that button or icon.", fields: [
          F("social.whatsappGroup", "WhatsApp community link", "url"), F("social.telegram", "Telegram link", "url"),
          F("social.instagram", "Instagram", "url"), F("social.facebook", "Facebook", "url"), F("social.tiktok", "TikTok", "url"),
          F("social.youtube", "YouTube", "url"), F("social.linkedin", "LinkedIn", "url"),
        ] },
      ] },
    { id: "hero", label: "Hero (top of page)", icon: "ri-home-5-line", desc: "The big heading, text and buttons at the very top of the website: the first thing visitors see.", anchor: "#top",
      cards: [
        { title: "Main text", ...FORMAT_HINT, fields: [
          F("hero.label", "Small label", "text", { wide: true }), F("hero.title", "Main heading", "text", { wide: true }), TXT("hero.text", "Text"),
          F("hero.button1", "Orange button"), F("hero.button2", "Outline button"),
          F("hero.rating", "Rating", "text", { tr: false }), F("hero.ratingText", "Rating text"),
        ] },
        { title: "Floating cards on the photo", fields: [
          F("hero.progressTitle", "Progress card title"), F("hero.progressTag", "Progress card tag", "text", { tr: false }),
          F("hero.clubTitle", "Event card title"), F("hero.clubText", "Event card text"),
          F("hero.certTitle", "Certificate card title"), F("hero.certText", "Certificate card text"),
        ] },
        { title: "Exams strip", fields: [F("exams.label", "Label", "text", { wide: true }), LINES("exams.items", "Exams", { tr: false, hint: "Official exam names, the same in both languages." })] },
      ] },
    { id: "about", label: "About", icon: "ri-information-line", desc: "The “About” section: who you are, your founding story and the four short points.", anchor: "#about",
      cards: [
        { title: "About section", ...FORMAT_HINT, fields: [
          F("about.label", "Small label"), F("about.title", "Heading"), TXT("about.text", "Text", { rows: 5 }),
          F("about.years", "Years badge number", "number"), F("about.yearsText", "Years badge text", "textarea", { rows: 2 }),
          F("about.storyTitle", "Founding story title", "text", { wide: true }), TXT("about.storyText", "Founding story", { rows: 4 }),
          LINES("about.ticks", "Checklist"),
        ] },
      ] },
    { id: "levels", label: "Levels", icon: "ri-bar-chart-line", desc: "The A1–C1 level tabs: what students can do after each level.", anchor: "#levels",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("levels.label", "Small label"), F("levels.title", "Heading"), TXT("levels.text", "Text")] },
        { title: "Levels", sub: NO_PHOTO, list: { p: "levels.items", noun: "level", title: (x) => `${x.code || "?"} · ${x.name || ""}`,
          make: () => ({ code: "", name: "New level", weeks: 12, hours: 72, img: FILL, intro: "", can: [] }),
          fields: [F("code", "Code", "text", { tr: false, placeholder: "e.g. B2" }), F("name", "Name"), F("weeks", "Weeks", "number"), F("hours", "Teaching hours", "number"),
            TXT("intro", "Intro", { rows: 2 }), LINES("can", "After this level you can…")] } },
      ] },
    { id: "courses", label: "Courses", icon: "ri-book-2-line", desc: "The course cards with their price, duration and format.", anchor: "#courses",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("courses.label", "Small label"), F("courses.title", "Heading")] },
        { title: "Courses", sub: NO_PHOTO, list: { p: "courses.items", noun: "course", title: (x) => x.title,
          make: () => ({ cat: "adults", title: "New course", level: "", dur: "", mode: "Live online", price: null, img: FILL, desc: "", badge: "", action: "whatsapp" }),
          fields: [F("title", "Title"), F("cat", "Category (filter)", "select", { options: CAT }),
            F("level", "Level / ages"), F("dur", "Duration"), F("mode", "Format"),
            F("price", "Price from ($ per course)", "number", { nullable: true, hint: "Leave empty to show \"Custom quote\"." }),
            F("action", "The \u201cEnquire\u201d button opens", "select", { options: [["whatsapp", "WhatsApp"], ["corporate", "The Corporate training form"], ["custom", "The Build-your-own-course form"]] }),
            F("badge", "Badge on photo", "text", { hint: "Optional, e.g. Best seller" }), TXT("desc", "Description", { rows: 2 })] } },
      ] },
    { id: "test", label: "Placement test", icon: "ri-survey-line", desc: "The free placement test: the intro text, the 10 questions and the result for each level.", anchor: "#test",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("test.label", "Small label"), F("test.title", "Heading"), TXT("test.text", "Text"),
          LINES("test.perks", "Bullet points"), F("test.startTitle", "Start card title"), TXT("test.startText", "Start card text", { wide: false })] },
        { title: "Questions", sub: "Write ___ (three underscores) where the gap is.", list: { p: "test.questions", noun: "question", title: (x) => x.q,
          make: () => ({ q: "", a: ["", "", "", ""], c: 0 }),
          fields: [F("q", "Question", "text", { tr: false, wide: true, placeholder: "e.g. She ___ a teacher." }), F("a", "Answers", "answers")] } },
        { title: "Results", sub: "The score is split evenly across these results, lowest first.", list: { p: "test.results", noun: "result", title: (x) => `${x.code || "?"} · ${x.name || ""}`,
          make: () => ({ code: "", name: "", course: "", text: "" }),
          fields: [F("code", "Level code", "text", { tr: false }), F("name", "Level name"), F("course", "Recommended course", "text", { wide: true }), TXT("text", "Message", { rows: 2 })] } },
      ] },
    { id: "how", label: "How it works", icon: "ri-route-line", desc: "The four numbered steps that explain how to start.", anchor: "#how",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("how.label", "Small label"), F("how.title", "Heading")] },
        { title: "Steps", list: { p: "how.items", noun: "step", title: (x) => x.title,
          make: () => ({ icon: "ri-checkbox-circle-line", title: "New step", text: "" }),
          fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
      ] },
    { id: "why", label: "Why Tawer & stats", icon: "ri-star-smile-line", desc: "The “Why Tawer” cards and the purple bar with numbers.", anchor: "#why",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("why.label", "Small label"), F("why.title", "Heading")] },
        { title: "Reasons", list: { p: "why.items", noun: "reason", title: (x) => x.title,
          make: () => ({ icon: "ri-star-line", title: "New reason", text: "" }),
          fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
        { title: "Numbers", list: { p: "why.stats", noun: "number", title: (x) => `${x.value ?? ""}${x.suffix || ""} ${x.label || ""}`,
          make: () => ({ value: 0, suffix: "", label: "" }),
          fields: [F("value", "Number", "number"), F("suffix", "After the number", "text", { tr: false, placeholder: "e.g. + or %" }), F("label", "Label", "text", { wide: true })] } },
      ] },
    { id: "stories", label: "Success stories", icon: "ri-trophy-line", desc: "The moving row of student success stories.", anchor: "#stories",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("stories.label", "Small label"), F("stories.title", "Heading"), TXT("stories.text", "Text")] },
        { title: "Stories", sub: "New stories are shown with initials instead of a photo. They scroll automatically on the site.", list: { p: "stories.items", noun: "story", title: (x) => [x.result, x.name].filter(Boolean).join(" · "),
          make: () => ({ name: "", role: "", result: "", resultLabel: "", text: "", img: "" }),
          fields: [F("result", "Result (big)", "text", { tr: false, placeholder: "e.g. 8.0 or A2 → B2" }), F("resultLabel", "Result label", "text", { placeholder: "e.g. IELTS band at 14" }),
            F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Started at 10 · now 14" }), TXT("text", "Story", { rows: 3 })] } },
      ] },
    { id: "reviews", label: "Reviews", icon: "ri-chat-quote-line", desc: "Short quotes from students and parents (the purple slider).", anchor: "#reviews",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("reviews.label", "Small label"), F("reviews.title", "Heading")] },
        { title: "Reviews", sub: "New reviews are shown with initials instead of a photo.", list: { p: "reviews.items", noun: "review", title: (x) => x.name,
          make: () => ({ name: "", role: "", text: "", img: "" }),
          fields: [F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Engineer · A2 → B2" }), TXT("text", "Review", { rows: 3 })] } },
      ] },
    { id: "pricing", label: "Pricing", icon: "ri-price-tag-3-line", desc: "The price plans and the “Ways to save” cards.", anchor: "#pricing",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("pricing.label", "Small label"), F("pricing.title", "Heading"),
          TXT("pricing.text", "Text under the heading", { rows: 2 }), F("pricing.note", "Note under the plans", "text", { wide: true }),
          F("pricing.savingsTitle", "\"Ways to save\" heading", "text", { wide: true })] },
        { title: "Plans", list: { p: "pricing.plans", noun: "plan", title: (x) => `${x.name || ""} · ${x.from != null && x.from !== "" ? `from $${x.from} per course` : "price on request"}`,
          make: () => ({ name: "New plan", desc: "", from: null, popular: false, tag: "", action: "whatsapp", included: [], excluded: [] }),
          fields: [F("name", "Plan name"), F("desc", "Short description"),
            F("from", "Starting price ($ per course)", "number", { nullable: true, hint: "The minimum price for one course. Shown as \"Starting from\". Leave empty to show \"On request\"." }),
            F("action", "The button opens", "select", { options: [["whatsapp", "WhatsApp (ask for the price)"], ["custom", "The Build-your-own-course form"]] }),
            F("tag", "Tag", "text", { hint: "Optional, e.g. Most popular" }), F("popular", "Highlight this plan", "checkbox"),
            LINES("included", "Included (✓)"), LINES("excluded", "Not included (✗)")] } },
        { title: "Ways to save", sub: "Describe discounts and perks without amounts.", list: { p: "pricing.savings", noun: "offer", title: (x) => x.title,
          make: () => ({ icon: "ri-price-tag-3-line", title: "New offer", text: "" }),
          fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
      ] },
    { id: "faq", label: "FAQ", icon: "ri-question-answer-line", desc: "Questions and answers, and the WhatsApp button next to them.", anchor: "#faq",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("faq.label", "Small label"), F("faq.title", "Heading"), TXT("faq.text", "Text", { rows: 2 }), F("faq.button", "WhatsApp button")] },
        { title: "Questions", list: { p: "faq.items", noun: "question", title: (x) => x.q,
          make: () => ({ q: "New question", a: "" }),
          fields: [F("q", "Question", "text", { wide: true }), TXT("a", "Answer", { rows: 3 })] } },
      ] },
    { id: "blog", label: "Blog", icon: "ri-article-line", desc: "The three blog article cards.", anchor: "#blog",
      cards: [
        { title: "Section text", ...FORMAT_HINT, fields: [F("blog.label", "Small label"), F("blog.title", "Heading"),
          F("blog.allLabel", "\"All articles\" button"), F("blog.allUrl", "\"All articles\" link", "url")] },
        { title: "Posts", sub: NO_PHOTO, list: { p: "blog.items", noun: "post", title: (x) => x.title,
          make: () => ({ tag: "", title: "New post", excerpt: "", url: "#", img: FILL }),
          fields: [F("title", "Title", "text", { wide: true }), F("tag", "Category · read time", "text", { placeholder: "e.g. IELTS · 6 min read" }),
            F("url", "Link", "url", { placeholder: "https://…" }), TXT("excerpt", "Short summary", { rows: 2 })] } },
      ] },
    { id: "other", label: "Banner, footer & SEO", icon: "ri-layout-bottom-2-line", desc: "The orange free-trial banner, the footer (with the \u201cJoin our community\u201d box), and how the site looks on Google and when shared on WhatsApp.", anchor: "#contact",
      cards: [
        { title: "Free trial banner", ...FORMAT_HINT, fields: [F("cta.title", "Heading"), F("cta.button", "Button"), TXT("cta.text", "Text", { rows: 2 })] },
        { title: "Footer", sub: "The WhatsApp / Telegram links are in Contact & links.", fields: [TXT("footer.about", "About text", { rows: 2 }),
          F("footer.communityTitle", "Community title", "text", { wide: true }), TXT("footer.communityText", "Community text", { rows: 2 })] },
        { title: "Google & link previews", hint: "What Google shows in search results, and what WhatsApp / Facebook show when someone shares the link.", fields: [
          F("seo.title", "Page title", "text", { wide: true }), TXT("seo.description", "Search description", { rows: 3, hint: "Best kept under 160 characters." }),
          F("seo.shareTitle", "Share title", "text", { wide: true }), TXT("seo.shareDescription", "Share description", { rows: 2 }),
        ] },
      ] },
  ];

  /* ---------- Requests inbox (the website's two forms) ---------- */
  let inbox = null;          // null = not loaded yet
  let inboxError = "";
  const REQ_LABELS = {
    type: { custom: "Build your own course", corporate: "Corporate training" },
    focus: { speaking: "Speaking & conversation", grammar: "Grammar & vocabulary", writing: "Writing", exam: "IELTS / STEP / TOEFL", business: "Business English", kids: "For a child" },
    lessonType: { private: "Private (1-to-1)", group: "Small group", unsure: "Not sure yet" },
    times: { morning: "Morning", afternoon: "Afternoon", evening: "Evening", weekend: "Weekend" },
  };
  const openCount = () => (inbox || []).filter((r) => !r.done).length;
  const loadInbox = async () => {
    try { inbox = (await api("/api/requests")).requests; inboxError = ""; }
    catch (e) { if (e.status === 401) return showLogin("Your session expired. Log in again."); inboxError = e.message; inbox = inbox || []; }
    refreshBadges();
    if (currentTab === "requests") renderPanel();
  };
  const setDone = async (r, done) => {
    try { await api("/api/requests", { method: "PATCH", body: JSON.stringify({ id: r.id, done }) }); r.done = done; refreshBadges(); renderPanel(); toast(done ? "Marked as handled." : "Moved back to New."); }
    catch (e) { if (e.status === 401) return showLogin("Your session expired. Log in again."); toast(e.message, true); }
  };
  const requestCard = (r) => {
    const d = r.data || {};
    const digitsOnly = String(d.phone || "").replace(/\D/g, "");
    const firstName = String(d.name || "").split(/\s+/)[0];
    const greeting = r.lang === "ar" ? `مرحبًا ${firstName}، شكرًا لتواصلك مع أكاديمية طوّر!` : `Hi ${firstName}, thank you for contacting Tawer Academy!`;
    const row = (label, value) => (value ? h("div", { class: "req__row" }, h("dt", { text: label }), h("dd", { text: value })) : null);
    const list = (key) => (Array.isArray(d[key]) ? d[key].map((x) => REQ_LABELS[key][x] || x).join(", ") : "");
    return h("article", { class: "req" + (r.done ? " req--done" : "") },
      h("div", { class: "req__head" },
        h("span", { class: "req__type req__type--" + r.type, text: REQ_LABELS.type[r.type] || r.type }),
        h("span", { class: "req__date", text: new Date(r.createdAt).toLocaleString() }),
        h("span", { class: "req__lang", title: r.lang === "ar" ? "Sent from the Arabic website" : "Sent from the English website", text: r.lang === "ar" ? "عربي" : "EN" })),
      h("h3", { class: "req__name", text: r.type === "corporate" ? `${d.company || ""} · ${d.name || ""}` : d.name || "" }),
      h("dl", { class: "req__details" },
        row("Phone / WhatsApp", d.phone), row("Email", d.email), row("Level", d.level),
        row("Wants to focus on", list("focus")), row("Lesson type", REQ_LABELS.lessonType[d.lessonType]),
        row("Lessons per week", d.perWeek), row("Best times", list("times")), row("Team size", d.teamSize),
        row(r.type === "corporate" ? "What the team needs" : "Message", d.message)),
      h("div", { class: "req__actions" },
        digitsOnly ? h("a", { class: "btn btn--primary btn--sm", href: `https://wa.me/${digitsOnly}?text=${encodeURIComponent(greeting)}`, target: "_blank", rel: "noopener" }, icon("ri-whatsapp-line"), " Reply on WhatsApp") : null,
        d.phone ? h("a", { class: "btn btn--ghost btn--sm", href: `tel:${String(d.phone).replace(/[^\d+]/g, "")}` }, icon("ri-phone-line"), " Call") : null,
        d.email ? h("a", { class: "btn btn--ghost btn--sm", href: `mailto:${d.email}` }, icon("ri-mail-line"), " Email") : null,
        h("button", { type: "button", class: "btn btn--ghost btn--sm req__done", onclick: () => setDone(r, !r.done) },
          icon(r.done ? "ri-arrow-go-back-line" : "ri-check-line"), r.done ? " Move back to New" : " Mark as handled")));
  };
  const inboxPanel = (t) => {
    const items = inbox || [];
    const fresh = items.filter((r) => !r.done), handled = items.filter((r) => r.done);
    return [
      h("div", { class: "panel__head" },
        h("div", {}, h("h1", { text: t.label }), h("p", { class: "muted", text: t.desc })),
        h("div", { class: "panel__links" }, h("button", { type: "button", class: "btn btn--ghost btn--sm", onclick: () => { inbox = null; renderPanel(); loadInbox(); } }, icon("ri-refresh-line"), " Refresh"))),
      inboxError ? h("p", { class: "msg", text: inboxError }) : null,
      inbox === null ? h("p", { class: "muted", text: "Loading requests…" }) :
      !items.length ? h("section", { class: "card inbox-empty" }, icon("ri-inbox-2-line"),
        h("h2", { text: "No requests yet" }),
        h("p", { class: "muted", text: "When someone sends the \u201cBuild your own course\u201d or \u201cCorporate training\u201d form on the website, it appears here." })) : null,
      fresh.length ? h("section", { class: "inbox-group" }, h("h2", { class: "inbox-group__title" }, "New ", h("span", { class: "tab__badge", text: String(fresh.length) })), ...fresh.map(requestCard)) : null,
      handled.length ? h("details", { class: "inbox-group inbox-group--done" }, h("summary", { class: "inbox-group__title", text: `Handled (${handled.length})` }), ...handled.map(requestCard)) : null,
    ];
  };

  /* ---------- Welcome guide (first visit; can be reopened with the Help button) ---------- */
  let guideOpen = (() => { try { return localStorage.getItem("tawer-admin-guide") !== "done"; } catch { return true; } })();
  const showGuide = () => guideOpen;
  const guideCard = () => h("section", { class: "guide", "aria-label": "How to use this dashboard" },
    h("div", { class: "guide__head" }, h("h2", {}, icon("ri-hand-heart-line"), " Welcome! Here's how it works"),
      h("button", { type: "button", class: "btn btn--icon btn--sm", "aria-label": "Close the guide", title: "Close", onclick: () => setGuide(false) }, icon("ri-close-line"))),
    h("ol", { class: "guide__steps" },
      h("li", {}, h("b", { text: "Pick a section" }), h("span", { text: "on the left. \u201cRequests\u201d shows what visitors sent you; the others are parts of your website (\u201cSee it on the website\u201d shows where)." })),
      h("li", {}, h("b", { text: "Change the text" }), h("span", { text: "in English (left) and Arabic (right). An orange number on a section means some Arabic is still missing." })),
      h("li", {}, h("b", { text: "Press “Save & publish”" }), h("span", { text: "and the website updates right away. Nothing changes until you save, and History lets you go back to an earlier version." }))),
    h("div", { class: "guide__foot" }, h("button", { type: "button", class: "btn btn--primary btn--sm", onclick: () => setGuide(false) }, "Got it")));
  const setGuide = (open) => {
    guideOpen = open;
    try { localStorage.setItem("tawer-admin-guide", open ? "" : "done"); } catch {}
    renderPanel();
    if (open) scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- Rendering ---------- */
  const renderTabs = () => {
    const tabs = $("tabs");
    tabs.replaceChildren(...TABS.map((t) => h("button", { type: "button", class: t.id === currentTab ? "active" : "",
      "aria-current": t.id === currentTab ? "page" : null,
      onclick: () => { currentTab = t.id; try { localStorage.setItem("tawer-admin-tab", t.id); } catch {} renderTabs(); renderPanel(); scrollTo({ top: 0 }); },
      "data-tab": t.id }, icon(t.icon), h("span", { class: "tab__label", text: t.label }), h("span", { class: "tab__badge", hidden: true }))));
    refreshBadges();
    // On phones the tabs are one scrolling row: keep the current section visible in it.
    const active = tabs.querySelector(".active");
    if (active && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
  };

  const renderPanel = () => {
    const t = TABS.find((x) => x.id === currentTab) || TABS[0];
    if (t.inbox) { $("panel").replaceChildren(...[showGuide() ? guideCard() : null, ...inboxPanel(t)].filter(Boolean)); return; }
    $("panel").replaceChildren(...[
      showGuide() ? guideCard() : null,
      h("div", { class: "panel__head" },
        h("div", {}, h("h1", { text: t.label }), t.desc ? h("p", { class: "muted", text: t.desc }) : null),
        t.anchor ? h("div", { class: "panel__links" },
          h("a", { class: "btn btn--ghost btn--sm", href: `/?lang=en${t.anchor}`, target: "_blank", rel: "noopener" }, icon("ri-eye-line"), " See it on the website"),
          h("a", { class: "btn btn--ghost btn--sm", href: `/?lang=ar${t.anchor}`, target: "_blank", rel: "noopener", lang: "ar" }, "بالعربية")) : null),
      ...t.cards.map((c) => h("section", { class: "card" },
        h("h2", {}, c.title, c.sub ? h("small", { text: "· " + c.sub }) : null),
        c.hint === FORMAT_HINT.hint ? h("p", { class: "tip" }, icon("ri-lightbulb-line"), ...c.hint())
          : c.hint ? h("div", { class: "hint" }, icon("ri-lightbulb-line"), h("div", {}, typeof c.hint === "function" ? c.hint() : c.hint)) : null,
        (c.list ? c.list.fields : c.fields).some(translatable)
          ? h("div", { class: "langcols", "aria-hidden": "true" }, h("span", { text: "English" }), h("span", { lang: "ar", text: "العربية" })) : null,
        c.list ? listEditor(c.list) : h("div", { class: "fields" }, fieldsFor(c.fields, state, arRoot()))))].filter(Boolean)); // replaceChildren would print null as text
  };

  const showApp = () => {
    $("loginView").hidden = true;
    $("appView").hidden = false;
    renderTabs(); renderPanel(); setStatus();
    loadInbox();
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
    $("saveBar2").querySelector("span").textContent = "Saving…";
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
      $("saveBar2").querySelector("span").textContent = "Save & publish";
      setStatus();
    }
  };

  const loadVersion = (content, label) => {
    if (dirty && !confirm("You have unsaved changes. Replace them with this version?")) return;
    state = merge(clone(DEFAULT), content || {});
    openItems.clear();
    dirty = true;
    $("historyDlg").close();
    renderTabs(); renderPanel(); setStatus();
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
  $("saveBar2").addEventListener("click", save);
  $("undoBtn").addEventListener("click", async () => {
    if (!confirm("Undo all the changes you made since the last save?")) return;
    try { await loadContent(); renderTabs(); renderPanel(); setStatus(); toast("Your changes were undone."); }
    catch (e) { toast(e.message, true); }
  });
  $("helpBtn").addEventListener("click", () => setGuide(true));
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
      if (!s.configured.storage) return showLogin("The database isn't set up on the server yet (DATABASE_URL). See the README.");
      if (!s.admin) return showLogin();
      await loadContent();
      showApp();
    } catch (e) {
      showLogin(e.message);
    }
  })();
})();
