/* Fixed interface text of the website (navigation, buttons, form labels, quiz…) in Arabic.
 * English is written directly in templates/home.html and as the fallback in public/site.js.
 * The editable content (headings, texts, lists) is NOT here: the admin enters it in both languages
 * in the dashboard (content.ar). Placeholders like {n} are filled in by site.js. */
export const LANGS = ["en", "ar"];

export const UI = {
  ar: {
    // Language switch (shows the language you can switch TO)
    "lang.switch": "English",
    "lang.switchLabel": "التبديل إلى الإنجليزية",

    // Header & navigation
    "nav.about": "من نحن",
    "nav.levels": "المستويات",
    "nav.courses": "الدورات",
    "nav.test": "اختبار تحديد المستوى",
    "nav.pricing": "الأسعار",
    "nav.faq": "الأسئلة الشائعة",
    "nav.contact": "تواصل معنا",
    "nav.cta": "احجز حصة تجريبية مجانية",
    "header.findLevel": "اعرف مستواك",
    "header.trial": "حصة تجريبية مجانية",

    // Accessibility labels
    "a11y.home": "الصفحة الرئيسية",
    "a11y.main": "القائمة الرئيسية",
    "a11y.menu": "فتح القائمة",
    "a11y.closeMenu": "إغلاق القائمة",
    "a11y.exams": "التحضير للاختبارات",
    "a11y.stories": "قصص نجاح الطلاب",
    "a11y.pauseStories": "إيقاف حركة قصص النجاح",
    "a11y.playStories": "تشغيل حركة قصص النجاح",
    "a11y.prevReview": "الرأي السابق",
    "a11y.nextReview": "الرأي التالي",
    "a11y.review": "الرأي {i}",
    "a11y.whatsapp": "تواصل معنا عبر واتساب",
    "a11y.top": "العودة إلى الأعلى",

    // Course filters
    "filter.all": "كل الدورات",
    "filter.adults": "الكبار",
    "filter.kids": "الأطفال واليافعون",
    "filter.business": "الأعمال",
    "filter.exam": "التحضير للاختبارات",

    // Levels
    "level.after": "بعد هذا المستوى ستتمكن من:",
    "level.weeks": "{n} أسبوعًا",
    "level.hours": "{n} ساعة تدريس",
    "level.cert": "شهادة",
    "level.start": "ابدأ مستوى {code} بحصة تجريبية مجانية",
    "level.alt": "حصة لغة إنجليزية لمستوى {name}",

    // Courses
    "course.from": "تبدأ من",
    "course.quote": "السعر حسب الطلب",
    "course.enquire": "استفسر",
    "course.enquireAria": "استفسر عن {title}",

    // Placement test
    "quiz.start": "ابدأ الاختبار",
    "quiz.progress": "السؤال {i} من {n}",
    "quiz.idk": "لا أعرف",
    "quiz.next": "السؤال التالي",
    "quiz.seeResult": "اعرض نتيجتي",
    "quiz.score": "{s} من {n} إجابات صحيحة",
    "quiz.estimated": "مستواك المتوقع: {name}",
    "quiz.recommended": "ننصحك بـ",
    "quiz.book": "احجز حصة تجريبية بمستوى {code}",
    "quiz.retake": "أعد الاختبار",

    // Pricing
    "plan.from": "تبدأ من",
    "plan.price": "السعر",
    "plan.onRequest": "حسب الطلب",
    "plan.cta": "اعرف سعري",

    // Contact
    "contact.call": "اتصل بنا أو راسلنا على واتساب",
    "contact.email": "البريد الإلكتروني",
    "contact.hours": "ساعات العمل",

    // Form

    // Prices (per course)
    "course.perCourse": "للدورة",
    "plan.perCourse": "للدورة",
    "plan.ctaCustom": "صمّم دورتي",

    // WhatsApp messages (filled in when the visitor taps a button)
    "wa.trial": "مرحبًا أكاديمية طوّر! أودّ حجز حصة تجريبية مجانية.",
    "wa.course": "مرحبًا! أودّ معرفة المزيد عن دورة {course}.",
    "wa.level": "مرحبًا! أودّ حجز حصة تجريبية مجانية في مستوى {code}.",
    "wa.plan": "مرحبًا! أودّ معرفة سعر {plan}.",

    // Request forms ("Build your own course" and "Corporate training")
    "req.name": "الاسم الكامل",
    "req.phone": "رقم الواتساب",
    "req.email": "البريد الإلكتروني (اختياري)",
    "req.level": "مستواك الحالي",
    "req.levelUnsure": "لست متأكدًا بعد",
    "req.focus": "على ماذا تريد التركيز؟",
    "req.f.speaking": "المحادثة",
    "req.f.grammar": "القواعد والمفردات",
    "req.f.writing": "الكتابة",
    "req.f.exam": "IELTS / STEP / TOEFL",
    "req.f.business": "الإنجليزية للأعمال",
    "req.f.kids": "لطفلي",
    "req.type": "نوع الحصص",
    "req.t.private": "خاصة (فردية)",
    "req.t.group": "مجموعة صغيرة",
    "req.t.unsure": "لست متأكدًا بعد",
    "req.perWeek": "عدد الحصص أسبوعيًا",
    "req.times": "الأوقات المناسبة",
    "req.morning": "صباحًا",
    "req.afternoon": "بعد الظهر",
    "req.evening": "مساءً",
    "req.weekend": "نهاية الأسبوع",
    "req.msg": "هل هناك شيء آخر؟ (اختياري)",
    "req.msgPh": "مثلًا: IELTS 7 بحلول يونيو",
    "req.company": "اسم الشركة",
    "req.contact": "اسمك",
    "req.phoneCorp": "الهاتف / واتساب",
    "req.emailCorp": "البريد الإلكتروني للعمل (اختياري)",
    "req.teamSize": "حجم الفريق",
    "req.goals": "ما الذي يحتاجه فريقك؟",
    "req.goalsPh": "مثلًا: الاجتماعات والمراسلات مع العملاء الدوليين",
    "req.send": "أرسل طلبي",
    "req.sentShort": "تم إرسال الطلب",
    "req.sending": "جارٍ الإرسال…",
    "req.missing": "يرجى تعبئة الحقول المطلوبة.",
    "req.badPhone": "يرجى إدخال رقم هاتف صحيح مع رمز الدولة.",
    "req.badEmail": "يرجى إدخال بريد إلكتروني صحيح أو تركه فارغًا.",
    "req.tooMany": "أرسلت عدة طلبات مؤخرًا. يرجى المحاولة لاحقًا أو مراسلتنا على واتساب.",
    "req.failed": "تعذّر إرسال الطلب. يرجى المحاولة مجددًا أو مراسلتنا على واتساب.",

    // Community (footer)
    "community.wa": "انضم عبر واتساب",
    "community.tg": "انضم عبر تيليجرام",

    // Footer
    "footer.courses": "الدورات",
    "footer.general": "الإنجليزية العامة",
    "footer.business": "الإنجليزية للأعمال",
    "footer.ielts": "IELTS و TOEFL",
    "footer.kids": "الأطفال واليافعون",
    "footer.private": "دروس خاصة",
    "footer.academy": "الأكاديمية",
    "footer.about": "من نحن",
    "footer.stories": "قصص النجاح",
    "footer.levels": "المستويات (CEFR)",
    "footer.test": "اختبار تحديد المستوى",
    "footer.blog": "المدونة",
    "footer.rights": "جميع الحقوق محفوظة.",
    "footer.privacy": "الخصوصية",
    "footer.terms": "الشروط",
  },
};

/* Language for a request: ?lang= (explicit choice) > tawer_lang cookie (remembered choice) >
 * the browser's Accept-Language (first visit) > English. */
export function pickLang(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("lang");
  if (LANGS.includes(q)) return { lang: q, fromQuery: true };
  const cookie = (request.headers.get("cookie") || "").match(/(?:^|;\s*)tawer_lang=(en|ar)\b/);
  if (cookie) return { lang: cookie[1], fromQuery: false };
  return { lang: browserLang(request.headers.get("accept-language")), fromQuery: false };
}

/* "ar-SA,ar;q=0.9,en;q=0.8" -> "ar". Picks the highest-ranked language we support. */
export function browserLang(header) {
  const prefs = String(header || "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? parseFloat(q.slice(2)) || 0 : 1, i };
    })
    .filter((p) => LANGS.includes(p.base) && p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return prefs[0]?.base || "en";
}
