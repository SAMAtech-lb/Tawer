/* Tawer Academy: builds the page from content.js, switches language and theme. */
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const U = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const icon = (name, cls = "") => `<i class="ri-${name} ${cls}" aria-hidden="true"></i>`;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

/* ---------- Language helpers ---------- */
let lang = root.lang === "en" ? "en" : "ar";
const tr = (pair) => (Array.isArray(pair) ? pair[lang === "ar" ? 1 : 0] : pair);
const t = (key, vars = {}) => tr(S[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const applyStatic = () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.innerHTML = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = t(el.dataset.i18nAlt)));
  document.title = t("metaTitle");
  // The language button always shows the *other* language, written in that language.
  const other = lang === "ar" ? "en" : "ar";
  $("langLabel").textContent = other === "ar" ? "العربية" : "English";
  $("langLabel").lang = other;
  $("langBtn").setAttribute("aria-label", other === "ar" ? "التبديل إلى العربية" : "Switch to English");
};

/* ---------- Sections ---------- */
const renderFeatures = () => {
  $("features").innerHTML = DATA.features.map((f) => `
    <article class="feat">${icon(f.icon)}<h3>${tr(f.title)}</h3><p>${tr(f.text)}</p></article>`).join("");
};

const renderCourses = () => {
  $("courses").innerHTML = DATA.courses.map((c, i) => `
    <article class="course">
      <img src="${U(c.img, 640)}" alt="" loading="lazy" />
      <div class="course__body">
        <span class="chip">${tr(c.tag)}</span>
        <h3>${tr(c.title)}</h3>
        <p>${tr(c.text)}</p>
        <div class="course__price">${t("from")} <b dir="ltr">$${c.price}</b> ${t("perMonth")}</div>
        <a href="#contact" class="btn btn--ghost btn--full" data-course="${i}">${t("courseAsk")}</a>
      </div>
    </article>`).join("");
};

const renderLevels = () => {
  $("levels").innerHTML = DATA.levels.map((l, i) => `
    <li class="level level--${i + 1}">
      <span class="level__code">${l.code}</span>
      <div><h3>${tr(l.name)}</h3><p>${tr(l.text)}</p></div>
    </li>`).join("");
};

const renderSteps = () => {
  $("steps").innerHTML = DATA.steps.map((s, i) => `
    <li class="step">
      <span class="step__icon">${icon(s.icon)}<span class="step__n">${i + 1}</span></span>
      <h3>${tr(s.title)}</h3><p>${tr(s.text)}</p>
    </li>`).join("");
};

const renderReviews = () => {
  const stars = icon("star-fill").repeat(5);
  $("reviews").innerHTML = DATA.reviews.map((r) => `
    <figure class="review">
      <div class="stars" aria-label="5/5">${stars}</div>
      <blockquote>${tr(r.text)}</blockquote>
      <figcaption><span class="avatar" aria-hidden="true">${tr(r.name).charAt(0)}</span><div><b>${tr(r.name)}</b><small>${tr(r.role)}</small></div></figcaption>
    </figure>`).join("");
};

const renderPlans = () => {
  $("plans").innerHTML = DATA.plans.map((p) => `
    <article class="plan${p.pop ? " plan--pop" : ""}">
      ${p.pop ? `<span class="plan__tag">${t("popular")}</span>` : ""}
      <h3>${tr(p.name)}</h3>
      <div class="plan__price"><b dir="ltr">$${p.price}</b> ${t("perMonth")}</div>
      <ul>${p.items.map((x) => `<li>${icon("checkbox-circle-fill")}${tr(x)}</li>`).join("")}</ul>
      <a href="#contact" class="btn btn--full${p.pop ? "" : " btn--ghost"}">${t("choose")}</a>
    </article>`).join("");
};

const renderFaq = () => {
  const list = $("faqList");
  const open = list.children.length ? [...list.children].map((d) => d.open) : [true];
  list.innerHTML = DATA.faq.map((f, i) => `
    <details${open[i] ? " open" : ""}><summary>${tr(f.q)}</summary><p>${tr(f.a)}</p></details>`).join("");
};

const fillSelect = (el, items) => {
  const keep = Math.max(el.selectedIndex, 0);
  el.innerHTML = items.map((x) => `<option>${x}</option>`).join("");
  el.selectedIndex = keep;
};
const renderFormOptions = () => {
  fillSelect($("fCourse"), [t("notSure"), ...DATA.courses.map((c) => tr(c.title))]);
  fillSelect($("fLevel"), [t("notSure"), ...DATA.levels.map((l) => `${l.code} · ${tr(l.name)}`)]);
};

/* ---------- Level test ---------- */
const quiz = { step: "start", i: 0, score: 0, picked: null, level: 0 };

const renderQuiz = () => {
  const box = $("quiz"), n = DATA.quiz.length, arrow = icon("arrow-right-line", "flip");
  if (quiz.step === "start") {
    box.innerHTML = `
      <div class="quiz__start">
        ${icon("question-answer-line", "quiz__icon")}
        <h3>${t("quizReady")}</h3>
        <p>${t("quizIntro")}</p>
        <button type="button" class="btn btn--lg" data-act="start">${t("quizStart")} ${arrow}</button>
      </div>`;
  } else if (quiz.step === "q") {
    const q = DATA.quiz[quiz.i];
    box.innerHTML = `
      <div class="quiz__top">${t("quizQ", { n: quiz.i + 1, t: n })}</div>
      <div class="quiz__bar"><i style="width:${(quiz.i / n) * 100}%"></i></div>
      <p class="quiz__q" lang="en" dir="ltr">${q.q.replace("___", '<span class="gap">_____</span>')}</p>
      <div class="quiz__opts" lang="en" dir="ltr">
        ${q.a.map((o, k) => `<button type="button" data-pick="${k}"${quiz.picked === k ? ' class="sel"' : ""}><b>${"ABCD"[k]}</b>${o}</button>`).join("")}
      </div>
      <button type="button" class="quiz__idk${quiz.picked === -1 ? " sel" : ""}" data-pick="-1">${t("quizIdk")}</button>
      <button type="button" class="btn btn--full" data-act="next"${quiz.picked === null ? " disabled" : ""}>${t(quiz.i === n - 1 ? "quizFinish" : "quizNext")} ${arrow}</button>`;
  } else {
    const lv = DATA.levels[quiz.level];
    box.innerHTML = `
      <div class="quiz__result">
        <span class="chip chip--accent">${t("quizScore", { s: quiz.score, t: n })}</span>
        <p class="quiz__your">${t("quizYour")}</p>
        <div class="quiz__lvl">${lv.code}</div>
        <h3>${tr(lv.name)}</h3>
        <div class="ladder">${DATA.levels.map((x, k) => `<span class="${k < quiz.level ? "done" : k === quiz.level ? "now" : ""}">${x.code}</span>`).join("")}</div>
        <div class="quiz__rec">${icon("lightbulb-flash-line")}<div><small>${t("quizRec")}</small><b>${tr(DATA.quizRec[quiz.level])}</b></div></div>
        <p class="quiz__note">${t("quizNote")}</p>
        <div class="quiz__actions">
          <a href="#contact" class="btn" data-act="book">${t("quizBook")}</a>
          <button type="button" class="btn btn--ghost" data-act="again">${icon("restart-line")} ${t("quizAgain")}</button>
        </div>
      </div>`;
  }
};

$("quiz").addEventListener("click", (e) => {
  const box = $("quiz");
  const pick = e.target.closest("[data-pick]");
  if (pick) {
    quiz.picked = +pick.dataset.pick;
    box.querySelectorAll("[data-pick]").forEach((x) => x.classList.toggle("sel", x === pick));
    box.querySelector('[data-act="next"]').disabled = false;
    return;
  }
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  if (act === "book") { $("fLevel").selectedIndex = quiz.level + 1; return; }
  if (act === "start" || act === "again") Object.assign(quiz, { step: "q", i: 0, score: 0, picked: null });
  if (act === "next") {
    if (quiz.picked === DATA.quiz[quiz.i].c) quiz.score++;
    quiz.i++;
    quiz.picked = null;
    if (quiz.i >= DATA.quiz.length) {
      const s = quiz.score;
      quiz.level = s <= 2 ? 0 : s <= 4 ? 1 : s <= 6 ? 2 : s <= 8 ? 3 : 4;
      quiz.step = "result";
    }
  }
  box.classList.remove("anim"); void box.offsetWidth; box.classList.add("anim");
  renderQuiz();
});

/* ---------- Theme ---------- */
const setTheme = (theme) => {
  const dark = theme === "dark";
  root.dataset.theme = theme;
  $("themeBtn").innerHTML = icon(dark ? "sun-line" : "moon-line");
  $("themeBtn").setAttribute("aria-label", t(dark ? "lightMode" : "darkMode"));
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0f0b1d" : "#ffffff";
};
$("themeBtn").addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  store.set("theme", next);
  setTheme(next);
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!store.get("theme")) setTheme(e.matches ? "dark" : "light");
});

/* ---------- Language ---------- */
const renderAll = () => {
  applyStatic();
  renderFeatures(); renderCourses(); renderLevels(); renderSteps();
  renderReviews(); renderPlans(); renderFaq(); renderFormOptions(); renderQuiz();
  setTheme(root.dataset.theme);
  $("formMsg").className = "form__msg";
};
$("langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  store.set("lang", lang);
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
  renderAll();
});

/* ---------- Header & mobile menu ---------- */
const nav = $("nav"), burger = $("burger");
const setNav = (open) => {
  nav.classList.toggle("open", open);
  $("overlay").classList.toggle("on", open);
  document.body.classList.toggle("lock", open);
  burger.setAttribute("aria-expanded", open);
  burger.innerHTML = icon(open ? "close-line" : "menu-line");
};
burger.addEventListener("click", () => setNav(!nav.classList.contains("open")));
$("overlay").addEventListener("click", () => setNav(false));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
const onScroll = () => $("header").classList.toggle("scrolled", scrollY > 10);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Contact form ---------- */
$("courses").addEventListener("click", (e) => {
  const a = e.target.closest("[data-course]");
  if (a) $("fCourse").selectedIndex = +a.dataset.course + 1;
});
$("trialForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target, msg = $("formMsg");
  const fields = [f.elements.fullname, f.elements.phone];
  const bad = fields.filter((i) => !i.value.trim());
  fields.forEach((i) => i.classList.toggle("err", bad.includes(i)));
  if (bad.length) {
    msg.className = "form__msg bad";
    msg.textContent = t("fErr");
    bad[0].focus();
    return;
  }
  msg.className = "form__msg ok";
  msg.textContent = t("fOk", { name: f.elements.fullname.value.trim().split(" ")[0] });
  f.reset();
});

/* ---------- Start ---------- */
renderAll();
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  io.unobserve(en.target);
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
$("year").textContent = new Date().getFullYear();
root.classList.add("ready");
