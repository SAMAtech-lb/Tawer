/* Tawer Academy public site.
 * Content comes from window.TAWER_CONTENT (saved from the admin dashboard and injected by the
 * server), merged over window.TAWER_DEFAULT (content.js). */
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
  const C = merge(window.TAWER_DEFAULT || {}, window.TAWER_CONTENT || {});
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
  document.querySelectorAll("[data-wa]").forEach((a) => {
    if (waNum && !/^0+$/.test(waNum)) { a.href = `https://wa.me/${waNum}`; a.target = "_blank"; a.rel = "noopener"; }
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
    address: { "@type": "PostalAddress", streetAddress: C.contact?.address },
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
  const closeNav = () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.innerHTML = '<i class="ri-menu-3-line"></i>'; };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    burger.innerHTML = open ? '<i class="ri-close-line"></i>' : '<i class="ri-menu-3-line"></i>';
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeNav(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  $("totop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Toast ---------- */
  let tt;
  const toast = (msg) => { const t = $("toast"); t.innerHTML = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); };

  /* ---------- Contact form selects ---------- */
  const LEVELS = arr(C.levels?.items);
  const COURSES = arr(C.courses?.items);
  $("fCourse").innerHTML = COURSES.map((c) => `<option>${esc(plain(c.title))}</option>`).join("");
  $("fLevel").innerHTML = `<option>Not sure yet</option>` + LEVELS.map((l) => `<option>${esc(l.code)} · ${esc(plain(l.name))}</option>`).join("");
  const pickLevel = (code) => { const i = LEVELS.findIndex((l) => l.code === code); $("fLevel").selectedIndex = i + 1; };

  /* ---------- Levels ---------- */
  $("levelTabs").innerHTML = LEVELS.map((l, i) => `<button class="${i === 0 ? "active" : ""}" data-l="${i}" role="tab"><b>${esc(l.code)}</b><span>${fmt(l.name)}</span></button>`).join("");
  const renderLevel = (i) => {
    const l = LEVELS[i];
    if (!l) { $("levelPanel").innerHTML = ""; return; }
    $("levelPanel").innerHTML = `
      <div class="lp__text">
        <div class="lp__head"><span class="lp__code">${esc(l.code)}</span><div><h3>${fmt(l.name)}</h3><p>${fmt(l.intro)}</p></div></div>
        <h4>After this level you can:</h4>
        <ul>${arr(l.can).map((c) => `<li><i class="ri-checkbox-circle-fill"></i>${fmt(c)}</li>`).join("")}</ul>
        <div class="lp__meta">
          <span><i class="ri-calendar-line"></i> ${esc(l.weeks)} weeks</span>
          <span><i class="ri-time-line"></i> ${esc(l.hours)} teaching hours</span>
          <span><i class="ri-award-line"></i> Certificate</span>
        </div>
        <a href="#contact" class="btn" data-level="${esc(l.code)}">Start ${esc(l.code)} with a free trial <i class="ri-arrow-right-line"></i></a>
      </div>
      <img src="${U(l.img, 700)}" alt="${esc(plain(l.name))} English class at Tawer Academy" loading="lazy" />`;
  };
  $("levelTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("levelTabs").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    renderLevel(+b.dataset.l);
  });
  renderLevel(0);
  $("levelPanel").addEventListener("click", (e) => { const a = e.target.closest("[data-level]"); if (a) pickLevel(a.dataset.level); });

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
            <span class="course__price">${c.price || c.price === 0 ? `<small>from</small> $${esc(c.price)}<small>/mo</small>` : "Custom quote"}</span>
            <a href="#contact" class="course__btn" data-course="${i}" aria-label="Enquire about ${esc(plain(c.title))}">Enquire <i class="ri-arrow-right-up-line"></i></a>
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
  $("courseGrid").addEventListener("click", (e) => {
    const a = e.target.closest("[data-course]"); if (!a) return;
    $("fCourse").selectedIndex = +a.dataset.course;
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
        <button class="btn btn--orange btn--lg" id="qStart">Start the test <i class="ri-arrow-right-line"></i></button>
      </div>`;
    $("qStart").onclick = () => { qi = 0; score = 0; if (QUIZ.length) renderQ(); };
  };
  const renderQ = () => {
    const q = QUIZ[qi]; picked = null;
    $("quiz").innerHTML = `
      <div class="quiz__top"><span>Question ${qi + 1} of ${QUIZ.length}</span><span>${Math.round((qi / QUIZ.length) * 100)}%</span></div>
      <div class="quiz__bar"><i style="width:${(qi / QUIZ.length) * 100}%"></i></div>
      <h3 class="quiz__q">${esc(q.q).replace("___", '<span class="gap">_____</span>')}</h3>
      <div class="quiz__opts">${arr(q.a).map((o, i) => `<button data-i="${i}"><b>${"ABCDEF"[i]}</b>${esc(o)}</button>`).join("")}<button data-i="-1" class="idk"><b>?</b>I don't know</button></div>
      <button class="btn btn--full" id="qNext" disabled>${qi === QUIZ.length - 1 ? "See my result" : "Next question"} <i class="ri-arrow-right-line"></i></button>`;
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
        <span class="quiz__score">${score}/${QUIZ.length} correct</span>
        <div class="quiz__lvl">${esc(r.code)}</div>
        <h3>Estimated level: ${fmt(r.name)}</h3>
        <div class="ladder">${RESULT.map((x, i) => `<span class="${i < li ? "done" : i === li ? "now" : ""}">${esc(x.code)}</span>`).join("")}</div>
        <p>${fmt(r.text)}</p>
        <div class="quiz__rec"><i class="ri-lightbulb-flash-line"></i><div><small>Recommended for you</small><b>${fmt(r.course)}</b></div></div>
        <div class="quiz__actions">
          <a href="#contact" class="btn btn--orange" id="qBook">Book a free trial at ${esc(r.code)}</a>
          <button class="btn btn--outline" id="qAgain"><i class="ri-restart-line"></i> Retake</button>
        </div>
      </div>`;
    $("qBook").onclick = () => pickLevel(r.code);
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
    btn.setAttribute("aria-label", (paused ? "Play" : "Pause") + " success stories");
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
  $("dots").innerHTML = REVIEWS.map((_, i) => `<button aria-label="Review ${i + 1}"></button>`).join("");
  const perView = () => (innerWidth < 900 ? 1 : 2);
  const go = (i) => {
    const card = $("track").children[0]; if (!card) return;
    const max = Math.max(0, REVIEWS.length - perView());
    si = i < 0 ? max : i > max ? 0 : i;
    $("track").style.transform = `translateX(-${si * (card.offsetWidth + 24)}px)`;
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
      <div class="plan__price">${p.monthly || p.monthly === 0
        ? `<small>Starting from</small><b>$${esc(p.monthly)}</b><span>/ month</span>`
        : `<small>Price</small><b class="plan__quote">On request</b>`}</div>
      <ul>
        ${arr(p.included).map((x) => `<li><i class="ri-check-line"></i> ${fmt(x)}</li>`).join("")}
        ${arr(p.excluded).map((x) => `<li class="off"><i class="ri-close-line"></i> ${fmt(x)}</li>`).join("")}
      </ul>
      <a href="#contact" class="btn ${p.popular ? "btn--orange" : "btn--outline"}" data-plan="${esc(plain(p.name))}">Get my price</a>
    </article>`).join("");
  $("savingsGrid").innerHTML = arr(C.pricing?.savings).map((x) => `
    <div class="saving"><i class="${esc(x.icon || "ri-price-tag-3-line")}"></i><div><h4>${fmt(x.title)}</h4><p>${fmt(x.text)}</p></div></div>`).join("");
  document.querySelectorAll("[data-plan]").forEach((a) => a.addEventListener("click", () => {
    $("trialForm").msg.value = `I'd like a price for the ${a.dataset.plan} plan.`;
  }));

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

  /* ---------- Forms ---------- */
  $("trialForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, msg = $("formMsg");
    const bad = [...f.querySelectorAll("[required]")].filter((i) => !i.value.trim() || (i.type === "email" && !/^\S+@\S+\.\S+$/.test(i.value)));
    f.querySelectorAll("[required]").forEach((i) => i.classList.toggle("err", bad.includes(i)));
    if (bad.length) { msg.className = "form__msg bad"; msg.textContent = "Please fill in your name, phone and a valid email."; return; }
    const name = f.name.value.trim().split(" ")[0];
    msg.className = "form__msg ok";
    msg.innerHTML = `<i class="ri-checkbox-circle-fill"></i> Thank you, ${esc(name)}! We'll call you within one working day to book your free ${esc(f.course.value)} trial (${esc(f.time.value.toLowerCase())}, ${esc(f.mode.value.toLowerCase())}).`;
    toast('<i class="ri-checkbox-circle-fill"></i> Trial request sent');
    f.reset();
  });
  $("newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    $("newsMsg").textContent = "You're subscribed. See you in your inbox!";
    e.target.reset();
  });

  /* ---------- Reveal + counters ---------- */
  const count = (el) => {
    const end = +el.dataset.count, t0 = performance.now(), d = 1400;
    const step = (t) => { const p = Math.min((t - t0) / d, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(step); };
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
