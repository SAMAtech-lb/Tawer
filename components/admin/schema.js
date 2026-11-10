/* The dashboard's sections and fields. Each field: F(path, label, type, options).
 * Types: text, textarea, lines (one item per line), number, select, checkbox, url, answers (placement test).
 * Text fields are edited in English and Arabic side by side, unless marked { tr: false }.
 * Adding a field to the website? Add its editor here (and its default text in data/content.*.json). */

const FILL = "1522202176988-66273c2fd55f";
const F = (k, label, type = "text", extra = {}) => ({ k, label, type, ...extra });
const TXT = (k, label, extra) => F(k, label, "textarea", { wide: true, ...extra });
const LINES = (k, label, extra) => F(k, label, "lines", { wide: true, hint: "One item per line.", ...extra });
const NO_PHOTO = "New items get a standard photo. Photos can't be changed from the dashboard.";
const CAT = [["adults", "Adults"], ["kids", "Kids & Teens"], ["business", "Business"], ["exam", "Exam prep"]];

export const TABS = [
  { id: "requests", label: "Requests", icon: "ri-inbox-2-line", inbox: true, cards: [],
    desc: "What visitors send with the website's two forms: \u201cBuild your own course\u201d and \u201cCorporate training\u201d. Reply on WhatsApp, then mark it as handled." },
  { id: "contact", label: "Contact & links", icon: "ri-contacts-book-3-line", desc: "Phone, WhatsApp, email and opening hours, the contact section with its two forms, and your social and community links.", anchor: "#contact",
    cards: [
      { title: "Contact details", fields: [
        F("contact.phone", "Phone", "text", { tr: false }),
        F("contact.whatsapp", "WhatsApp number", "text", { tr: false, placeholder: "e.g. 966551234567", hint: "Country code + number, digits only. Leave empty to use the phone number." }),
        F("contact.email", "Email", "text", { tr: false }),
        F("contact.hours", "Opening hours"),
        F("contact.intake", "Top bar announcement", "text", { wide: true, hint: "e.g. New intake starts **3 November**" }),
      ] },
      { title: "Contact section", formatTip: true, fields: [F("contact.label", "Small label"), F("contact.title", "Heading"), TXT("contact.text", "Text"),
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
      { title: "Main text", formatTip: true, fields: [
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
      { title: "About section", formatTip: true, fields: [
        F("about.label", "Small label"), F("about.title", "Heading"), TXT("about.text", "Text", { rows: 5 }),
        F("about.years", "Years badge number", "number"), F("about.yearsText", "Years badge text", "textarea", { rows: 2 }),
        F("about.storyTitle", "Founding story title", "text", { wide: true }), TXT("about.storyText", "Founding story", { rows: 4 }),
        LINES("about.ticks", "Checklist"),
      ] },
    ] },
  { id: "levels", label: "Levels", icon: "ri-bar-chart-line", desc: "The A1–C1 level tabs: what students can do after each level.", anchor: "#levels",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("levels.label", "Small label"), F("levels.title", "Heading"), TXT("levels.text", "Text")] },
      { title: "Levels", sub: NO_PHOTO, list: { p: "levels.items", noun: "level", title: (x) => `${x.code || "?"} · ${x.name || ""}`,
        make: () => ({ code: "", name: "New level", weeks: 12, hours: 72, img: FILL, intro: "", can: [] }),
        fields: [F("code", "Code", "text", { tr: false, placeholder: "e.g. B2" }), F("name", "Name"), F("weeks", "Weeks", "number"), F("hours", "Teaching hours", "number"),
          TXT("intro", "Intro", { rows: 2 }), LINES("can", "After this level you can…")] } },
    ] },
  { id: "courses", label: "Courses", icon: "ri-book-2-line", desc: "The course cards with their price, duration and format.", anchor: "#courses",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("courses.label", "Small label"), F("courses.title", "Heading")] },
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
      { title: "Section text", formatTip: true, fields: [F("test.label", "Small label"), F("test.title", "Heading"), TXT("test.text", "Text"),
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
      { title: "Section text", formatTip: true, fields: [F("how.label", "Small label"), F("how.title", "Heading")] },
      { title: "Steps", list: { p: "how.items", noun: "step", title: (x) => x.title,
        make: () => ({ icon: "ri-checkbox-circle-line", title: "New step", text: "" }),
        fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
    ] },
  { id: "why", label: "Why Tawer & stats", icon: "ri-star-smile-line", desc: "The “Why Tawer” cards and the purple bar with numbers.", anchor: "#why",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("why.label", "Small label"), F("why.title", "Heading")] },
      { title: "Reasons", list: { p: "why.items", noun: "reason", title: (x) => x.title,
        make: () => ({ icon: "ri-star-line", title: "New reason", text: "" }),
        fields: [F("title", "Title", "text", { wide: true }), TXT("text", "Text", { rows: 2 })] } },
      { title: "Numbers", list: { p: "why.stats", noun: "number", title: (x) => `${x.value ?? ""}${x.suffix || ""} ${x.label || ""}`,
        make: () => ({ value: 0, suffix: "", label: "" }),
        fields: [F("value", "Number", "number"), F("suffix", "After the number", "text", { tr: false, placeholder: "e.g. + or %" }), F("label", "Label", "text", { wide: true })] } },
    ] },
  { id: "stories", label: "Success stories", icon: "ri-trophy-line", desc: "The moving row of student success stories.", anchor: "#stories",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("stories.label", "Small label"), F("stories.title", "Heading"), TXT("stories.text", "Text")] },
      { title: "Stories", sub: "New stories are shown with initials instead of a photo. They scroll automatically on the site.", list: { p: "stories.items", noun: "story", title: (x) => [x.result, x.name].filter(Boolean).join(" · "),
        make: () => ({ name: "", role: "", result: "", resultLabel: "", text: "", img: "" }),
        fields: [F("result", "Result (big)", "text", { tr: false, placeholder: "e.g. 8.0 or A2 → B2" }), F("resultLabel", "Result label", "text", { placeholder: "e.g. IELTS band at 14" }),
          F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Started at 10 · now 14" }), TXT("text", "Story", { rows: 3 })] } },
    ] },
  { id: "reviews", label: "Reviews", icon: "ri-chat-quote-line", desc: "Short quotes from students and parents (the purple slider).", anchor: "#reviews",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("reviews.label", "Small label"), F("reviews.title", "Heading")] },
      { title: "Reviews", sub: "New reviews are shown with initials instead of a photo.", list: { p: "reviews.items", noun: "review", title: (x) => x.name,
        make: () => ({ name: "", role: "", text: "", img: "" }),
        fields: [F("name", "Name"), F("role", "Description", "text", { placeholder: "e.g. Engineer · A2 → B2" }), TXT("text", "Review", { rows: 3 })] } },
    ] },
  { id: "pricing", label: "Pricing", icon: "ri-price-tag-3-line", desc: "The price plans and the “Ways to save” cards.", anchor: "#pricing",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("pricing.label", "Small label"), F("pricing.title", "Heading"),
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
      { title: "Section text", formatTip: true, fields: [F("faq.label", "Small label"), F("faq.title", "Heading"), TXT("faq.text", "Text", { rows: 2 }), F("faq.button", "WhatsApp button")] },
      { title: "Questions", list: { p: "faq.items", noun: "question", title: (x) => x.q,
        make: () => ({ q: "New question", a: "" }),
        fields: [F("q", "Question", "text", { wide: true }), TXT("a", "Answer", { rows: 3 })] } },
    ] },
  { id: "blog", label: "Blog", icon: "ri-article-line", desc: "The three blog article cards.", anchor: "#blog",
    cards: [
      { title: "Section text", formatTip: true, fields: [F("blog.label", "Small label"), F("blog.title", "Heading"),
        F("blog.allLabel", "\"All articles\" button"), F("blog.allUrl", "\"All articles\" link", "url")] },
      { title: "Posts", sub: NO_PHOTO, list: { p: "blog.items", noun: "post", title: (x) => x.title,
        make: () => ({ tag: "", title: "New post", excerpt: "", url: "#", img: FILL }),
        fields: [F("title", "Title", "text", { wide: true }), F("tag", "Category · read time", "text", { placeholder: "e.g. IELTS · 6 min read" }),
          F("url", "Link", "url", { placeholder: "https://…" }), TXT("excerpt", "Short summary", { rows: 2 })] } },
    ] },
  { id: "other", label: "Banner, footer & SEO", icon: "ri-layout-bottom-2-line", desc: "The orange free-trial banner, the footer (with the \u201cJoin our community\u201d box), and how the site looks on Google and when shared on WhatsApp.", anchor: "#contact",
    cards: [
      { title: "Free trial banner", formatTip: true, fields: [F("cta.title", "Heading"), F("cta.button", "Button"), TXT("cta.text", "Text", { rows: 2 })] },
      { title: "Footer", sub: "The WhatsApp / Telegram links are in Contact & links.", fields: [TXT("footer.about", "About text", { rows: 2 }),
        F("footer.communityTitle", "Community title", "text", { wide: true }), TXT("footer.communityText", "Community text", { rows: 2 })] },
      { title: "Google & link previews", hint: "What Google shows in search results, and what WhatsApp / Facebook show when someone shares the link.", fields: [
        F("seo.title", "Page title", "text", { wide: true }), TXT("seo.description", "Search description", { rows: 3, hint: "Best kept under 160 characters." }),
        F("seo.shareTitle", "Share title", "text", { wide: true }), TXT("seo.shareDescription", "Share description", { rows: 2 }),
      ] },
    ] },
];
