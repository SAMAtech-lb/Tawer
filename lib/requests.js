/* Rules for the website's two forms. Only the fields listed here are accepted; everything is plain text. */
const TEXT = (max, required = false) => ({ kind: "text", max, required });
const CHOICES = (options) => ({ kind: "choices", options });   // several ticked options
const CHOICE = (options) => ({ kind: "choice", options });      // one option

export const REQUEST_TYPES = {
  custom: {
    name: TEXT(80, true),
    phone: TEXT(30, true),
    email: TEXT(120),
    level: TEXT(60),
    focus: CHOICES(["speaking", "grammar", "writing", "exam", "business", "kids"]),
    lessonType: CHOICE(["private", "group", "unsure"]),
    perWeek: CHOICE(["1", "2", "3", "4+"]),
    times: CHOICES(["morning", "afternoon", "evening", "weekend"]),
    message: TEXT(1500),
  },
  corporate: {
    company: TEXT(120, true),
    name: TEXT(80, true),
    phone: TEXT(30, true),
    email: TEXT(120),
    teamSize: CHOICE(["2-5", "6-15", "16-50", "50+"]),
    message: TEXT(1500, true),
  },
};

/* -> { data } (cleaned) or { error } */
export function cleanRequest(type, input) {
  const rules = REQUEST_TYPES[type];
  if (!rules) return { error: "Unknown form." };
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Bad request." };
  const data = {};
  for (const [key, rule] of Object.entries(rules)) {
    const v = input[key];
    if (rule.kind === "text") {
      const s = typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n") : "";
      if (s.length > rule.max) return { error: "A field is too long." };
      if (rule.required && !s) return { error: "missing" };
      if (s) data[key] = s;
    } else if (rule.kind === "choice") {
      if (typeof v === "string" && rule.options.includes(v)) data[key] = v;
    } else if (rule.kind === "choices") {
      const list = Array.isArray(v) ? [...new Set(v.filter((x) => rule.options.includes(x)))] : [];
      if (list.length) data[key] = list;
    }
  }
  if (data.phone && !/\d{6,}/.test(data.phone.replace(/\D/g, ""))) return { error: "phone" };
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return { error: "email" };
  return { data };
}
