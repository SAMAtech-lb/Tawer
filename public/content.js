/*
 * Default website content.
 *
 * This is what the site shows until the admin saves changes from /admin.
 * After that, the saved version (stored in Cloudflare KV) is used instead and
 * this file only fills in any fields the saved version doesn't have.
 *
 * Text formatting supported in most text fields:
 *   [[word]]   highlighted word (purple/orange accent in headings)
 *   **word**   bold
 *   new line   line break
 *
 * Image fields ("img") are Unsplash photo IDs and are not editable from the dashboard.
 */
window.TAWER_DEFAULT = {
  seo: {
    title: "Tawer Academy — English Courses for Every Level",
    description: "Tawer Academy offers English courses for kids, teens and adults from beginner (A1) to advanced (C1): general English, business English, IELTS & TOEFL preparation, in-class and online. Take the free placement test and book a free trial lesson.",
    shareTitle: "Tawer Academy — English Courses for Every Level",
    shareDescription: "Small classes, certified teachers and a clear path from A1 to C1. Find your level in 3 minutes and book a free trial lesson."
  },

  contact: {
    phone: "+000 00 000 000",
    whatsapp: "",
    email: "hello@tawer-academy.com",
    address: "Cedar Tower, 3rd floor, Main Street, City Center",
    hours: "Mon–Fri 9:00–21:00 · Sat 10:00–16:00",
    intake: "New intake starts **3 November**",
    label: "Contact us",
    title: "Book your [[free trial lesson]]",
    text: "Fill in the form and our coordinator will call you within one working day to choose a time."
  },

  social: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    youtube: "#",
    linkedin: "#"
  },

  hero: {
    label: "English courses · A1 to C1 · In-class & online",
    title: "Speak English with [[confidence]], at every level.",
    text: "Tawer Academy helps kids, teens and adults go from their first words to fluent conversation, with certified teachers, small classes of up to 8 students and a clear path you can follow.",
    button1: "Find my level, free",
    button2: "Explore courses",
    rating: "4.9",
    ratingText: "from 412 reviews by 2,500+ students",
    progressTitle: "Your progress",
    progressTag: "B1 → B2",
    clubTitle: "Speaking Club",
    clubText: "Today · 6:00 pm · 5 seats left",
    certTitle: "Certified",
    certText: "CEFR-aligned levels"
  },

  exams: {
    label: "We prepare students for",
    items: ["IELTS Academic", "IELTS General", "TOEFL iBT", "Cambridge B2 First", "Cambridge C1 Advanced", "Duolingo English Test"]
  },

  about: {
    label: "About Tawer Academy",
    title: "Built by teachers who wanted English to [[feel alive]].",
    text: "Tawer means growth. We help learners of every age turn English from a school subject into a skill they **actually use**, in class, at work and abroad.",
    years: 9,
    yearsText: "years\nteaching English",
    storyTitle: "Our story, since 2017",
    storyText: "It started with two teachers, one rented classroom and six students who were tired of memorising grammar tables. We built every lesson around real conversation, and word spread. Today Tawer teaches learners from age 6 to 60, in class and live online.",
    ticks: ["Lessons built around speaking", "Progress you can measure", "Teachers who know your name", "A level for every age"]
  },

  levels: {
    label: "Course levels",
    title: "One clear path from [[A1 to C1]]",
    text: "Our levels follow the Common European Framework of Reference (CEFR), the international standard used by universities and employers. Pick a level to see what you'll be able to do.",
    items: [
      { code: "A1", name: "Beginner", weeks: 12, hours: 72, img: "1456513080510-7bf3a84b82f8",
        intro: "Your first steps in English. No previous knowledge needed.",
        can: ["Introduce yourself and others", "Ask and answer simple personal questions", "Order food, shop and ask for directions", "Understand slow, clear everyday speech"] },
      { code: "A2", name: "Elementary", weeks: 12, hours: 72, img: "1531482615713-2afd69097998",
        intro: "Build confidence for everyday situations and simple conversations.",
        can: ["Talk about your past, work and family", "Handle travel and hotel situations", "Write short messages and emails", "Follow the main point of short announcements"] },
      { code: "B1", name: "Intermediate", weeks: 14, hours: 84, img: "1522202176988-66273c2fd55f",
        intro: "The independent-user level: express opinions and keep a conversation going.",
        can: ["Describe experiences, plans and ambitions", "Give reasons and explain opinions", "Deal with most situations while travelling", "Understand the main points of TV and podcasts"] },
      { code: "B2", name: "Upper-Intermediate", weeks: 14, hours: 84, img: "1517486808906-6ca8b3f04846",
        intro: "Fluent, spontaneous English for work, study and university entry.",
        can: ["Take part in discussions and meetings", "Write clear, detailed essays and reports", "Understand films and native-speed speech", "Prepare for IELTS 6.0–6.5 / Cambridge B2 First"] },
      { code: "C1", name: "Advanced", weeks: 16, hours: 96, img: "1552664730-d307ca884978",
        intro: "Precise, flexible English for professional and academic life.",
        can: ["Present and negotiate with confidence", "Use idioms and nuance naturally", "Read complex academic and business texts", "Prepare for IELTS 7.0+ / Cambridge C1 Advanced"] }
    ]
  },

  courses: {
    label: "Our courses",
    title: "English courses for [[every goal]]",
    items: [
      { cat: "adults", title: "General English", level: "A1 – C1", dur: "12 weeks / level", mode: "In-class & online", price: 89, img: "1522202176988-66273c2fd55f", desc: "Grammar, vocabulary, listening and lots of speaking in a structured CEFR course.", badge: "Best seller" },
      { cat: "adults", title: "Conversation English", level: "B1 – C1", dur: "8 weeks", mode: "In-class", price: 69, img: "1543269865-cbf427effbad", desc: "Discussion-based classes to build fluency, pronunciation and confidence.", badge: "" },
      { cat: "exam", title: "IELTS Preparation", level: "B1 – C1", dur: "8 weeks", mode: "In-class & online", price: 129, img: "1434030216411-0b793f4b4173", desc: "Strategies for all four papers, weekly mock tests and marked writing tasks.", badge: "Avg. band 7.0" },
      { cat: "exam", title: "TOEFL iBT Preparation", level: "B2 – C1", dur: "8 weeks", mode: "Online", price: 129, img: "1606761568499-6d2451b23c66", desc: "Integrated tasks, note-taking and timed practice on real test formats.", badge: "" },
      { cat: "business", title: "Business English", level: "B1 – C1", dur: "10 weeks", mode: "In-class & online", price: 119, img: "1552664730-d307ca884978", desc: "Emails, meetings, presentations and negotiations for your career.", badge: "" },
      { cat: "business", title: "Corporate Training", level: "All levels", dur: "Custom", mode: "On-site & online", price: null, img: "1600880292203-757bb62b4baf", desc: "Tailored programmes for teams, with level testing and progress reporting.", badge: "" },
      { cat: "kids", title: "English for Kids", level: "Ages 6 – 11", dur: "Term-based", mode: "In-class", price: 75, img: "1503676260728-1c00da094a0b", desc: "Games, stories and projects that make English fun. Max 6 per class.", badge: "Ages 6+" },
      { cat: "kids", title: "English for Teens", level: "Ages 12 – 17", dur: "Term-based", mode: "In-class & online", price: 79, img: "1571260899304-425eee4c7efc", desc: "School support, speaking practice and a head start on IELTS / Cambridge.", badge: "" }
    ]
  },

  test: {
    label: "Free placement test",
    title: "What's your English level? Find out in [[3 minutes]].",
    text: "Answer 10 quick questions. We'll estimate your CEFR level and recommend the course that fits you. No sign-up needed.",
    perks: ["About 3 minutes", "Instant result, A1 to C1", "Speaking check in your free trial"],
    startTitle: "Ready to find your level?",
    startText: "10 grammar & vocabulary questions, from beginner to advanced. Don't guess. If you don't know, choose \"I don't know\".",
    questions: [
      { q: "She ___ a teacher at the local school.", a: ["are", "is", "am", "be"], c: 1 },
      { q: "I ___ to the cinema with my friends last weekend.", a: ["go", "gone", "went", "going"], c: 2 },
      { q: "If it rains tomorrow, we ___ at home.", a: ["stay", "will stay", "stayed", "would stayed"], c: 1 },
      { q: "I've lived in this city ___ 2019.", a: ["for", "from", "during", "since"], c: 3 },
      { q: "By the time we arrived, the film ___.", a: ["had already started", "has already started", "already starts", "was already start"], c: 0 },
      { q: "I wish I ___ more free time to read.", a: ["have", "had", "will have", "having"], c: 1 },
      { q: "He suggested ___ a taxi because it was late.", a: ["to take", "take", "taking", "took"], c: 2 },
      { q: "The meeting was ___ because the manager was ill.", a: ["called off", "called up", "called out", "called in"], c: 0 },
      { q: "Hardly ___ the house when it started to pour.", a: ["I had left", "had I left", "I left", "did I left"], c: 1 },
      { q: "His explanation was so ___ that nobody could follow it.", a: ["concise", "candid", "convoluted", "cordial"], c: 2 }
    ],
    results: [
      { code: "A1", name: "Beginner", course: "General English · A1", text: "You're at the start of your journey. Perfect! Our A1 course builds strong foundations with lots of speaking from day one." },
      { code: "A2", name: "Elementary", course: "General English · A2", text: "You can handle simple everyday English. A2 will get you talking about your life, work and travel with confidence." },
      { code: "B1", name: "Intermediate", course: "General English · B1 or Conversation English", text: "You're an independent user. Now it's time to build fluency and express opinions naturally." },
      { code: "B2", name: "Upper-Intermediate", course: "General English · B2, IELTS or Business English", text: "Strong level! B2 opens doors to university and international jobs. Exam prep is a great next step." },
      { code: "C1", name: "Advanced", course: "C1 Advanced, IELTS 7+ or Business English", text: "Impressive! Polish nuance, idioms and academic writing for top exam scores and professional life." }
    ]
  },

  how: {
    label: "How it works",
    title: "Start learning in [[4 simple steps]]",
    items: [
      { icon: "ri-survey-line", title: "Take the placement test", text: "Ten online questions give us a first estimate of your level." },
      { icon: "ri-calendar-check-line", title: "Book a free trial lesson", text: "Meet a teacher, do a short speaking check and try a real class." },
      { icon: "ri-team-line", title: "Join your small group", text: "Morning, evening or weekend, in-class or live online. Your choice." },
      { icon: "ri-award-line", title: "Level up & get certified", text: "Pass the end-of-level assessment and receive your CEFR certificate." }
    ]
  },

  why: {
    label: "Why Tawer",
    title: "English that fits [[your goals]], not a textbook",
    items: [
      { icon: "ri-refresh-line", title: "A curriculum that keeps up", text: "Customised to each group and updated every term with fresh topics, real-world materials and the latest exam formats." },
      { icon: "ri-puzzle-line", title: "Build your own course", text: "Pick the skills, schedule and pace you need, from exam prep to business meetings, and we shape the course around you." },
      { icon: "ri-live-line", title: "Live online, from anywhere", text: "Join real-time classes with your teacher and group from home, work or abroad. Same lessons, no commute." }
    ],
    stats: [
      { value: 2500, suffix: "+", label: "Students taught" },
      { value: 18, suffix: "", label: "Certified teachers" },
      { value: 96, suffix: "%", label: "Move up a level on time" },
      { value: 7, suffix: ".0", label: "Average IELTS score" }
    ]
  },

  // Placeholder (dummy) stories and testimonials: replace with real ones before launch.
  stories: {
    label: "Success stories",
    title: "Real students, [[real results]]",
    text: "Every learner starts somewhere. Here's where a few of them ended up.",
    items: [
      { name: "Lea N.", role: "Started at 10 · now 14", img: "1534528741775-53994a69daeb", result: "8.0", resultLabel: "IELTS band at 14", text: "Joined English for Kids at 10 with almost no English. Four years and four levels later, she scored IELTS Academic band 8.0." },
      { name: "Sara H.", role: "University student", img: "1494790108377-be9c29b29330", result: "7.5", resultLabel: "IELTS, first attempt", text: "Needed band 7 for a master's abroad. Eight weeks of mock tests and marked writing got her 7.5." },
      { name: "Hadi Y.", role: "Engineer, live online", img: "1500648767791-00dcc994a43e", result: "A2 → B2", resultLabel: "in 11 months", text: "Studied live online after work with a course built around technical English. Now leads calls with international clients." },
      { name: "Nour A.", role: "Marketing lead", img: "1573496359142-b8d87734a5a2", result: "C1", resultLabel: "Business English", text: "Built her own course around presentations and negotiation. Six months later she was promoted to a regional role." },
      { name: "Rami T.", role: "Pre-university, age 17", img: "1506794778202-cad84cf45f1d", result: "104", resultLabel: "TOEFL iBT", text: "Went from B1 to a TOEFL score of 104 in one year and got into his first-choice engineering programme." }
    ]
  },

  reviews: {
    label: "Testimonials",
    title: "What students and parents [[say about us]]",
    items: [
      { name: "Karim Mansour", role: "Sales manager · Business English", img: "1507003211169-0a1dd7228f2d", text: "I used to avoid calls with our UK clients. After two terms I run the meetings myself. The lessons are practical, it's English I use the next day." },
      { name: "Maya K.", role: "Mother of Adam, 9", img: "1544005313-94ddf0286df2", text: "Adam actually asks to go to class! The teachers are patient and playful, and the monthly report shows exactly how he's improving." },
      { name: "Omar S.", role: "Online student · Conversation English", img: "1472099645785-5658abf4ff4e", text: "I join live from a different city most weeks because of work travel. Same group, same teacher, and the lessons never feel like a video call." },
      { name: "Rima D.", role: "Mother of Jad, 13", img: "1580489944761-15a19d654956", text: "The curriculum changes with what the kids care about. Jad's class wrote a podcast last term, and he still talks about it at dinner." }
    ]
  },

  pricing: {
    label: "Pricing",
    title: "Simple plans, [[no hidden fees]]",
    termSave: "Save 15%",
    note: "One term = 12 weeks. Sibling and family discounts available. Ask us!",
    plans: [
      { name: "Group Classes", desc: "General English in a small group", monthly: 89, term: 227, popular: false, tag: "",
        included: ["2 lessons a week · 90 min", "Max 8 students", "Course book & online portal", "Weekly speaking club"],
        excluded: ["1-to-1 feedback sessions"] },
      { name: "Intensive", desc: "Faster progress & exam focus", monthly: 149, term: 380, popular: true, tag: "Most popular",
        included: ["4 lessons a week · 90 min", "Max 8 students", "All materials included", "Unlimited speaking clubs", "Monthly 1-to-1 feedback"],
        excluded: [] },
      { name: "Private 1-to-1", desc: "Fully personalised lessons", monthly: 199, term: 507, popular: false, tag: "",
        included: ["8 private lessons · 60 min", "Your schedule, your topics", "IELTS / business options", "In-class or online", "Weekly progress notes"],
        excluded: [] }
    ]
  },

  faq: {
    label: "FAQ",
    title: "Questions? [[We've got answers.]]",
    text: "Can't find what you're looking for? Message us on WhatsApp and a coordinator will reply within the hour.",
    button: "Chat on WhatsApp",
    items: [
      { q: "How do I know which level to join?", a: "Take our free 3-minute online placement test, then a short speaking check with a teacher during your free trial lesson. We place you in the right CEFR level, from A1 to C1." },
      { q: "How many students are in a class?", a: "Group classes have a maximum of 8 students, so everyone speaks in every lesson. Kids' classes are capped at 6." },
      { q: "What ages do you teach?", a: "We teach children from 6 years old, teenagers and adults. Kids and teens are grouped by age and level, with playful, project-based lessons." },
      { q: "Do I get a certificate?", a: "Yes. After passing each level's final assessment you receive a Tawer Academy certificate stating your CEFR level, which you can add to your CV or university application." },
      { q: "Can I study online?", a: "Absolutely. Every course runs in-class and live online with the same teachers, materials and certificate. You can switch between the two at any time." },
      { q: "What if I miss a lesson?", a: "All online lessons are recorded, and you can join a make-up class in another group at the same level during the same week." }
    ]
  },

  blog: {
    label: "English tips",
    title: "From our [[blog]]",
    allLabel: "All articles",
    allUrl: "#",
    items: [
      { tag: "IELTS · 6 min read", title: "How to go from IELTS 6.0 to 7.0 in 8 weeks", excerpt: "The four habits our highest-scoring students have in common.", url: "#", img: "1434030216411-0b793f4b4173" },
      { tag: "Speaking · 4 min read", title: "12 phrases that make you sound natural in meetings", excerpt: "Polite ways to interrupt, agree, disagree and wrap things up.", url: "#", img: "1517486808906-6ca8b3f04846" },
      { tag: "Parents · 5 min read", title: "Helping your child practise English at home", excerpt: "Simple, screen-light routines that build vocabulary every day.", url: "#", img: "1503676260728-1c00da094a0b" }
    ]
  },

  cta: {
    title: "Your first lesson is on us.",
    text: "Book a free 45-minute trial class and get your level assessed by a teacher.",
    button: "Book my free trial"
  },

  footer: {
    about: "English courses for kids, teens and adults, from A1 to C1. Small classes, certified teachers, real results.",
    newsTitle: "Get English tips",
    newsText: "One short lesson in your inbox every week."
  }
};
