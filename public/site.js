/* Tawer Academy public site.
 * Content comes from window.TAWER_CONTENT (saved from the admin dashboard and injected by the
 * server, from the database), merged over window.TAWER_DEFAULT (the defaults from data/*.json, served as /content.js). */
(() => {
  const $ = (id) => document.getElementById(id);
  const FALLBACK_IMG = "1522202176988-66273c2fd55f";
  const U = (id, w = 800) => `https://images.unsplash.com/photo-${id || FALLBACK_IMG}?auto=format&fit=crop&w=${w}&q=80`;

  /* ---------- Content helpers ---------- */
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const merge = (d, s) => {
    if (s === undefined || s === null) return d;
    if (!isObj(d) || !isObj(s)) return s;
    const out = { ...d };
    for (const k of Object.keys(s)) out[k] = merge(d[k], s[k]);
    return out;
  };
  // Language is chosen by the server (?lang=, remembered choice, or browser language) and set on <html lang>.
  const LANG = window.TAWER_LANG || document.documentElement.lang || "en";
  const RTL = document.documentElement.dir === "rtl";
  /* Arabic over English (must match translate() in lib/format.js): structure (list length/order, numbers, images,
   * links) always comes from English; text uses the translation when it isn't empty, otherwise English. */
  const translate = (base, tr) => {
    if (tr === undefined || tr === null) return base;
    if (Array.isArray(base)) return base.map((b, i) => translate(b, Array.isArray(tr) ? tr[i] : undefined));
    if (isObj(base)) {
      if (!isObj(tr)) return base;
      const out = { ...base };
      for (const k of Object.keys(base)) if (k !== "ar") out[k] = translate(base[k], tr[k]);
      return out;
    }
    if (typeof base === "string") return typeof tr === "string" && tr.trim() ? tr : base;
    return base;
  };
  const EN = merge(window.TAWER_DEFAULT || {}, window.TAWER_CONTENT || {});
  const C = LANG === "ar" ? translate(EN, EN.ar) : EN;
  // Fixed interface text: Arabic from the server (lib/ui-strings.js), English fallback written here.
  const UI = window.TAWER_UI || {};
  const t = (key, en, vars = {}) => String(UI[key] || en).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  const arr = (v) => (Array.isArray(v) ? v : []);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  // [[word]] = highlight, **word** = bold, new line = <br>
  const fmt = (s, hl = "") => esc(s)
    .replace(/\[\[(.+?)\]\]/g, `<span${hl ? ` class="${hl}"` : ""}>$1</span>`)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br />");
  const plain = (s) => String(s ?? "").replace(/\[\[|\]\]|\*\*/g, "");
  const safeUrl = (u) => (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(String(u || "").trim()) ? String(u).trim() : "#");
  const initials = (n) => plain(n).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  /* ---------- Simple text fields ---------- */
  document.querySelectorAll("[data-c]").forEach((el) => {
    const v = get(el.dataset.c);
    if (typeof v === "string" || typeof v === "number") el.innerHTML = fmt(v, el.dataset.hl);
  });
  document.querySelectorAll("[data-cn]").forEach((el) => { const v = get(el.dataset.cn); if (v !== undefined) el.dataset.count = +v || 0; });
  if (C.seo?.title) document.title = plain(C.seo.title);

  /* ---------- Contact links ---------- */
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const waNum = digits(C.contact?.whatsapp) || digits(C.contact?.phone);
  const waOk = waNum.length >= 8 && !/^0+$/.test(waNum);
  // Booking buttons open WhatsApp with a ready-made message. Until a real number is set, they go to the contact section.
  const WA_MSG = {
    "wa.trial": "Hi Tawer Academy! I'd like to book a free trial session.",
    "wa.course": "Hi! I'd like to know more about the {course} course.",
    "wa.level": "Hi! I'd like to book a free trial session at level {code}.",
    "wa.plan": "Hi! I'd like to know the price of the {plan}.",
  };
  const waHref = (key, vars) => (waOk ? `https://wa.me/${waNum}?text=${encodeURIComponent(t(key, WA_MSG[key] || "", vars))}` : "#contact");
  const waAttrs = (key, vars) => (waOk ? `href="${esc(waHref(key, vars))}" target="_blank" rel="noopener"` : `href="#contact"`);
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = waHref(a.dataset.wa && WA_MSG[a.dataset.wa] ? a.dataset.wa : "wa.trial");
    if (waOk) { a.target = "_blank"; a.rel = "noopener"; }
  });
  document.querySelectorAll("[data-social]").forEach((a) => {
    const url = (C.social || {})[a.dataset.social];
    if (!url) { a.hidden = true; return; }
    a.href = safeUrl(url);
    if (/^https?:/i.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
  });
  const blogAll = $("blogAll");
  if (blogAll) blogAll.href = safeUrl(C.blog?.allUrl);

  /* ---------- Structured data (SEO) ---------- */
  $("ldOrg").textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Tawer Academy",
    description: plain(C.seo?.description),
    url: "https://www.tawer-academy.com/",
    telephone: C.contact?.phone,
    email: C.contact?.email,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "English courses",
      itemListElement: arr(C.courses?.items).map((c) => ({ "@type": "Course", name: plain(c.title), provider: { "@type": "Organization", name: "Tawer Academy" } })),
    },
  }).replace(/</g, "\\u003c");
  $("ldFaq").textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: arr(C.faq?.items).map((f) => ({ "@type": "Question", name: plain(f.q), acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
  }).replace(/</g, "\\u003c");

  /* ---------- Simple lists ---------- */
  $("examList").innerHTML = arr(C.exams?.items).map((x) => `<li><i class="ri-medal-line"></i> ${fmt(x)}</li>`).join("");
  $("aboutTicks").innerHTML = arr(C.about?.ticks).map((x) => `<li><i class="ri-check-line"></i> ${fmt(x)}</li>`).join("");
  const PERK_ICONS = ["ri-timer-line", "ri-bar-chart-2-line", "ri-user-voice-line"];
  $("testPerks").innerHTML = arr(C.test?.perks).map((x, i) => `<li><i class="${PERK_ICONS[i % PERK_ICONS.length]}"></i> ${fmt(x)}</li>`).join("");
  $("stepsGrid").innerHTML = arr(C.how?.items).map((s, i) => `
    <div class="step reveal"><span class="step__n">${String(i + 1).padStart(2, "0")}</span><i class="${esc(s.icon || "ri-checkbox-circle-line")}"></i><h3>${fmt(s.title)}</h3><p>${fmt(s.text)}</p></div>`).join("");
  $("whyGrid").innerHTML = arr(C.why?.items).map((f) => `
    <article class="feat reveal"><i class="${esc(f.icon || "ri-star-line")}"></i><h3>${fmt(f.title)}</h3><p>${fmt(f.text)}</p></article>`).join("");
  $("statsGrid").innerHTML = arr(C.why?.stats).map((s) => `
    <div><b><span data-count="${+s.value || 0}">0</span>${esc(s.suffix)}</b><small>${fmt(s.label)}</small></div>`).join("");

  /* ---------- Header, nav, burger ---------- */
  const header = $("header"), nav = $("nav"), burger = $("burger");
  const onScroll = () => {
    header.classList.toggle("sticky", scrollY > 40);
    $("totop").classList.toggle("on", scrollY > 600);
    let cur = "";
    document.querySelectorAll("main section[id]").forEach((s) => { if (scrollY >= s.offsetTop - 140) cur = s.id; });
    nav.querySelectorAll("a:not(.nav__cta)").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const closeNav = () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", t("a11y.menu", "Open menu")); burger.innerHTML = '<i class="ri-menu-3-line"></i>'; };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? t("a11y.closeMenu", "Close menu") : t("a11y.menu", "Open menu"));
    burger.innerHTML = open ? '<i class="ri-close-line"></i>' : '<i class="ri-menu-3-line"></i>';
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeNav(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  $("totop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Toast ---------- */
  let tt;
  const toast = (msg) => { const t = $("toast"); t.innerHTML = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); };

  const LEVELS = arr(C.levels?.items);
  const COURSES = arr(C.courses?.items);

  /* ---------- Levels ---------- */
  $("levelTabs").innerHTML = LEVELS.map((l, i) => `<button class="${i === 0 ? "active" : ""}" data-l="${i}" role="tab"><b>${esc(l.code)}</b><span>${fmt(l.name)}</span></button>`).join("");
  const renderLevel = (i) => {
    const l = LEVELS[i];
    if (!l) { $("levelPanel").innerHTML = ""; return; }
    $("levelPanel").innerHTML = `
      <div class="lp__text">
        <div class="lp__head"><span class="lp__code">${esc(l.code)}</span><div><h3>${fmt(l.name)}</h3><p>${fmt(l.intro)}</p></div></div>
        <h4>${esc(t("level.after", "After this level you can:"))}</h4>
        <ul>${arr(l.can).map((c) => `<li><i class="ri-checkbox-circle-fill"></i>${fmt(c)}</li>`).join("")}</ul>
        <div class="lp__meta">
          <span><i class="ri-calendar-line"></i> ${esc(t("level.weeks", "{n} weeks", { n: l.weeks }))}</span>
          <span><i class="ri-time-line"></i> ${esc(t("level.hours", "{n} teaching hours", { n: l.hours }))}</span>
          <span><i class="ri-award-line"></i> ${esc(t("level.cert", "Certificate"))}</span>
        </div>
        <a ${waAttrs("wa.level", { code: l.code })} class="btn"><i class="ri-whatsapp-line"></i> ${esc(t("level.start", "Start {code} with a free trial", { code: l.code }))}</a>
      </div>
      <img src="${U(l.img, 700)}" alt="${esc(t("level.alt", "{name} English class at Tawer Academy", { name: plain(l.name) }))}" loading="lazy" />`;
  };
  $("levelTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("levelTabs").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    renderLevel(+b.dataset.l);
  });
  renderLevel(0);

  /* ---------- Courses ---------- */
  const renderCourses = (f = "all") => {
    $("courseGrid").innerHTML = COURSES.map((c, i) => ({ c, i })).filter(({ c }) => f === "all" || c.cat === f).map(({ c, i }) => `
      <article class="course">
        <div class="course__img"><img src="${U(c.img, 600)}" alt="${esc(plain(c.title))} course" loading="lazy" />${c.badge ? `<span class="course__badge">${fmt(c.badge)}</span>` : ""}</div>
        <div class="course__body">
          <span class="course__lvl"><i class="ri-bar-chart-fill"></i> ${fmt(c.level)}</span>
          <h3>${fmt(c.title)}</h3>
          <p>${fmt(c.desc)}</p>
          <div class="course__meta"><span><i class="ri-time-line"></i> ${fmt(c.dur)}</span><span><i class="ri-map-pin-user-line"></i> ${fmt(c.mode)}</span></div>
          <div class="course__foot">
            <span class="course__price">${c.price || c.price === 0 ? `<small>${esc(t("course.from", "from"))}</small> $${esc(c.price)}<small>${esc(t("course.perCourse", "per course"))}</small>` : esc(t("course.quote", "Custom quote"))}</span>
            <a ${c.action === "corporate" || c.action === "custom" ? `href="#request" data-open-form="${c.action}"` : waAttrs("wa.course", { course: plain(c.title) })} class="course__btn" aria-label="${esc(t("course.enquireAria", "Enquire about {title}", { title: plain(c.title) }))}">${esc(t("course.enquire", "Enquire"))} <i class="ri-arrow-right-up-line"></i></a>
          </div>
        </div>
      </article>`).join("");
  };
  renderCourses();
  $("filters").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("filters").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    renderCourses(b.dataset.f);
  });

  /* ---------- Placement test ---------- */
  const QUIZ = arr(C.test?.questions).filter((q) => q && q.q && arr(q.a).length);
  const RESULT = arr(C.test?.results);
  let qi = 0, score = 0, picked = null;
  const quizStart = () => {
    $("quiz").innerHTML = `
      <div class="quiz__start">
        <i class="ri-question-answer-line"></i>
        <h3>${fmt(C.test?.startTitle)}</h3>
        <p>${fmt(C.test?.startText)}</p>
        <button class="btn btn--orange btn--lg" id="qStart">${esc(t("quiz.start", "Start the test"))} <i class="ri-arrow-right-line"></i></button>
      </div>`;
    $("qStart").onclick = () => { qi = 0; score = 0; if (QUIZ.length) renderQ(); };
  };
  const renderQ = () => {
    const q = QUIZ[qi]; picked = null;
    $("quiz").innerHTML = `
      <div class="quiz__top"><span>${esc(t("quiz.progress", "Question {i} of {n}", { i: qi + 1, n: QUIZ.length }))}</span><span>${Math.round((qi / QUIZ.length) * 100)}%</span></div>
      <div class="quiz__bar"><i style="width:${(qi / QUIZ.length) * 100}%"></i></div>
      <h3 class="quiz__q" lang="en" dir="ltr">${esc(q.q).replace("___", '<span class="gap">_____</span>')}</h3>
      <div class="quiz__opts">${arr(q.a).map((o, i) => `<button data-i="${i}" lang="en" dir="ltr"><b>${"ABCDEF"[i]}</b>${esc(o)}</button>`).join("")}<button data-i="-1" class="idk"><b>?</b>${esc(t("quiz.idk", "I don't know"))}</button></div>
      <button class="btn btn--full" id="qNext" disabled>${esc(qi === QUIZ.length - 1 ? t("quiz.seeResult", "See my result") : t("quiz.next", "Next question"))} <i class="ri-arrow-right-line"></i></button>`;
    $("quiz").querySelector(".quiz__opts").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      picked = +b.dataset.i;
      $("quiz").querySelectorAll(".quiz__opts button").forEach((x) => x.classList.toggle("sel", x === b));
      $("qNext").disabled = false;
    };
    $("qNext").onclick = () => {
      if (picked === +q.c) score++;
      qi++;
      qi < QUIZ.length ? renderQ() : showResult();
    };
  };
  const showResult = () => {
    // Split the score range evenly across the result levels (10 questions / 5 levels = 2 per level).
    const n = RESULT.length || 1;
    const li = Math.min(n - 1, Math.max(0, Math.ceil((score / QUIZ.length) * n) - 1));
    const r = RESULT[li] || { code: "", name: "", course: "", text: "" };
    $("quiz").innerHTML = `
      <div class="quiz__result">
        <span class="quiz__score">${esc(t("quiz.score", "{s}/{n} correct", { s: score, n: QUIZ.length }))}</span>
        <div class="quiz__lvl">${esc(r.code)}</div>
        <h3>${esc(t("quiz.estimated", "Estimated level: {name}", { name: "\u0000" })).replace("\u0000", fmt(r.name))}</h3>
        <div class="ladder">${RESULT.map((x, i) => `<span class="${i < li ? "done" : i === li ? "now" : ""}">${esc(x.code)}</span>`).join("")}</div>
        <p>${fmt(r.text)}</p>
        <div class="quiz__rec"><i class="ri-lightbulb-flash-line"></i><div><small>${esc(t("quiz.recommended", "Recommended for you"))}</small><b>${fmt(r.course)}</b></div></div>
        <div class="quiz__actions">
          <a ${waAttrs("wa.level", { code: r.code })} class="btn btn--orange"><i class="ri-whatsapp-line"></i> ${esc(t("quiz.book", "Book a free trial at {code}", { code: r.code }))}</a>
          <button class="btn btn--outline" id="qAgain"><i class="ri-restart-line"></i> ${esc(t("quiz.retake", "Retake"))}</button>
        </div>
      </div>`;
    $("qAgain").onclick = quizStart;
  };
  quizStart();

  /* ---------- Success stories (auto-scrolling row) ---------- */
  const STORIES = arr(C.stories?.items);
  const storyCard = (st, hidden) => `
    <article class="story"${hidden ? ' aria-hidden="true"' : ""}>
      <div class="story__result"><b>${fmt(st.result)}</b>${st.resultLabel ? `<span>${fmt(st.resultLabel)}</span>` : ""}</div>
      <p>${fmt(st.text)}</p>
      <div class="story__who">${st.img
        ? `<img src="${U(st.img, 120)}" alt="${hidden ? "" : esc(plain(st.name))}" loading="lazy" />`
        : `<span class="avatar-fallback avatar-fallback--sm">${esc(initials(st.name))}</span>`}<div><b>${fmt(st.name)}</b><small>${fmt(st.role)}</small></div></div>
    </article>`;
  // Two copies make the loop seamless: the track slides left by exactly one copy, then restarts.
  $("storyTrack").innerHTML = STORIES.map((st) => storyCard(st, false)).join("") + STORIES.map((st) => storyCard(st, true)).join("");
  $("storyPause").onclick = (e) => {
    const btn = e.currentTarget, paused = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", paused);
    btn.setAttribute("aria-label", paused ? t("a11y.playStories", "Play success stories") : t("a11y.pauseStories", "Pause success stories"));
    btn.innerHTML = `<i class="ri-${paused ? "play" : "pause"}-line"></i>`;
    $("storyTrack").classList.toggle("is-paused", paused);
  };

  /* ---------- Testimonials slider ---------- */
  const REVIEWS = arr(C.reviews?.items);
  let si = 0, timer;
  $("track").innerHTML = REVIEWS.map((r) => `
    <figure class="review">
      <i class="ri-double-quotes-l review__q"></i>
      <div class="stars"><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i><i class="ri-star-fill"></i></div>
      <blockquote>${fmt(r.text)}</blockquote>
      <figcaption>${r.img
        ? `<img src="${U(r.img, 120)}" alt="${esc(plain(r.name))}" loading="lazy" />`
        : `<span class="avatar-fallback avatar-fallback--sm">${esc(initials(r.name))}</span>`}<div><b>${fmt(r.name)}</b><small>${fmt(r.role)}</small></div></figcaption>
    </figure>`).join("");
  $("dots").innerHTML = REVIEWS.map((_, i) => `<button aria-label="${esc(t("a11y.review", "Review {i}", { i: i + 1 }))}"></button>`).join("");
  const perView = () => (innerWidth < 900 ? 1 : 2);
  const go = (i) => {
    const card = $("track").children[0]; if (!card) return;
    const max = Math.max(0, REVIEWS.length - perView());
    si = i < 0 ? max : i > max ? 0 : i;
    $("track").style.transform = `translateX(${RTL ? "" : "-"}${si * (card.offsetWidth + 24)}px)`;
    $("dots").querySelectorAll("button").forEach((d, k) => { d.classList.toggle("active", k === si); d.hidden = k > max; });
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => go(si + 1), 5500); };
  $("prev").onclick = () => { go(si - 1); auto(); };
  $("next").onclick = () => { go(si + 1); auto(); };
  $("dots").onclick = (e) => { const d = [...$("dots").children].indexOf(e.target); if (d >= 0) { go(d); auto(); } };
  addEventListener("resize", () => go(si));
  go(0); auto();

  /* ---------- Pricing (starting prices; no discount amounts are shown) ---------- */
  $("plansGrid").innerHTML = arr(C.pricing?.plans).map((p) => `
    <article class="plan${p.popular ? " plan--pop" : ""} reveal">
      ${p.tag ? `<span class="plan__tag">${fmt(p.tag)}</span>` : ""}
      <h3>${fmt(p.name)}</h3>
      <p>${fmt(p.desc)}</p>
      <div class="plan__price">${p.from || p.from === 0
        ? `<small>${esc(t("plan.from", "Starting from"))}</small><b>$${esc(p.from)}</b><span>${esc(t("plan.perCourse", "per course"))}</span>`
        : `<small>${esc(t("plan.price", "Price"))}</small><b class="plan__quote">${esc(t("plan.onRequest", "On request"))}</b>`}</div>
      <ul>
        ${arr(p.included).map((x) => `<li><i class="ri-check-line"></i> ${fmt(x)}</li>`).join("")}
        ${arr(p.excluded).map((x) => `<li class="off"><i class="ri-close-line"></i> ${fmt(x)}</li>`).join("")}
      </ul>
      ${p.action === "custom"
        ? `<a href="#request" data-open-form="custom" class="btn ${p.popular ? "btn--orange" : "btn--outline"}">${esc(t("plan.ctaCustom", "Build my course"))}</a>`
        : `<a ${waAttrs("wa.plan", { plan: plain(p.name) })} class="btn ${p.popular ? "btn--orange" : "btn--outline"}"><i class="ri-whatsapp-line"></i> ${esc(t("plan.cta", "Get my price"))}</a>`}
    </article>`).join("");
  $("savingsGrid").innerHTML = arr(C.pricing?.savings).map((x) => `
    <div class="saving"><i class="${esc(x.icon || "ri-price-tag-3-line")}"></i><div><h4>${fmt(x.title)}</h4><p>${fmt(x.text)}</p></div></div>`).join("");

  /* ---------- FAQ ---------- */
  $("faqList").innerHTML = arr(C.faq?.items).map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${fmt(f.q)}</summary><p>${fmt(f.a)}</p></details>`).join("");

  /* ---------- Blog ---------- */
  $("postsGrid").innerHTML = arr(C.blog?.items).map((p) => {
    const url = safeUrl(p.url), ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
    return `
    <article class="post reveal">
      <img src="${U(p.img, 700)}" alt="${esc(plain(p.title))}" loading="lazy" />
      <div class="post__body"><span>${fmt(p.tag)}</span><h3><a href="${esc(url)}"${ext}>${fmt(p.title)}</a></h3><p>${fmt(p.excerpt)}</p></div>
    </article>`;
  }).join("");

  /* ---------- Request forms: "Build your own course" and "Corporate training" (the site's only two forms) ---------- */
  $("reqLevel").innerHTML = `<option value="">${esc(t("req.levelUnsure", "Not sure yet"))}</option>` +
    LEVELS.map((l) => `<option value="${esc(l.code)} · ${esc(plain(l.name))}">${esc(l.code)} · ${esc(plain(l.name))}</option>`).join("");
  const showForm = (type) => {
    document.querySelectorAll("#request [data-form]").forEach((b) => {
      const on = b.dataset.form === type;
      b.classList.toggle("active", on); b.setAttribute("aria-selected", on);
    });
    $("formCustom").hidden = type !== "custom";
    $("formCorporate").hidden = type !== "corporate";
  };
  $("request").querySelector(".request__tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-form]"); if (b) showForm(b.dataset.form); });
  // Buttons elsewhere on the page ("Build my course", Corporate "Enquire") open the right form.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-open-form]"); if (!a) return;
    e.preventDefault();
    showForm(a.dataset.openForm);
    $("request").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const REQ_ERR = {
    missing: ["req.missing", "Please fill in the required fields."],
    phone: ["req.badPhone", "Please enter a valid phone number, with the country code."],
    email: ["req.badEmail", "Please enter a valid email, or leave it empty."],
    "too-many": ["req.tooMany", "You've sent several requests recently. Please try again later or message us on WhatsApp."],
  };
  document.querySelectorAll("#request form").forEach((f) => f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = f.querySelector(".form__msg"), btn = f.querySelector('button[type="submit"]');
    const say = (cls, text) => { msg.className = "form__msg " + cls; msg.textContent = text; };
    // Required fields first (shown in red), then send.
    const bad = [...f.querySelectorAll("[required]")].filter((i) => !i.value.trim());
    f.querySelectorAll("[required]").forEach((i) => i.classList.toggle("err", bad.includes(i)));
    if (bad.length) { say("bad", t(REQ_ERR.missing[0], REQ_ERR.missing[1])); bad[0].focus(); return; }
    const fd = new FormData(f), data = {};
    for (const [k, v] of fd.entries()) {
      if (k === "website") continue;
      if (k === "focus" || k === "times") (data[k] ||= []).push(v); else data[k] = String(v);
    }
    btn.disabled = true;
    const label = btn.querySelector("span"), was = label.textContent;
    label.textContent = t("req.sending", "Sending…");
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: f.dataset.type, data, lang: LANG, website: fd.get("website") || "" }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        const [key, en] = REQ_ERR[out.error] || ["req.failed", "Sorry, that didn't go through. Please try again or message us on WhatsApp."];
        if (out.error === "phone") f.querySelector('[name="phone"]').classList.add("err");
        if (out.error === "email") f.querySelector('[name="email"]').classList.add("err");
        say("bad", t(key, en));
        return;
      }
      msg.className = "form__msg ok";
      msg.innerHTML = `<i class="ri-checkbox-circle-fill"></i> ${fmt(C.forms?.sent || "Thank you! We received your request and will contact you on WhatsApp within one working day.")}`;
      toast(`<i class="ri-checkbox-circle-fill"></i> ${esc(t("req.sentShort", "Request sent"))}`);
      f.reset();
      f.querySelectorAll(".err").forEach((i) => i.classList.remove("err"));
    } catch {
      say("bad", t("req.failed", "Sorry, that didn't go through. Please try again or message us on WhatsApp."));
    } finally {
      btn.disabled = false; label.textContent = was;
    }
  }));

  /* ---------- Reveal + counters ---------- */
  const count = (el) => {
    const end = +el.dataset.count, t0 = performance.now(), d = 1400;
    const step = (t) => { const p = Math.min((t - t0) / d, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US"); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    en.target.querySelectorAll("[data-count]").forEach(count);
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  $("year").textContent = new Date().getFullYear();
})();
