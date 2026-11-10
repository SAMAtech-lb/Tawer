/* Rules for the content the admin dashboard may save. */

/* Top-level groups the content may contain (anything else is rejected on save).
 * Adding a new section to the site? Add its group here too. */
export const CONTENT_GROUPS = [
  "seo", "contact", "social", "hero", "exams", "about", "levels", "courses", "test",
  "how", "why", "stories", "reviews", "forms", "teachers" /* legacy, no longer shown */, "pricing", "faq", "blog", "cta", "footer",
];

/* "ar" holds the Arabic translation: the same groups as above, text only (see translate() in lib/format.js). */
export const TRANSLATIONS = ["ar"];

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/* -> error message, or null when the content is valid */
export function validateContent(content) {
  if (!isObj(content)) return "Content must be an object.";
  for (const k of Object.keys(content)) {
    if (!CONTENT_GROUPS.includes(k) && !TRANSLATIONS.includes(k)) return `Unknown content section "${k}".`;
    if (!isObj(content[k])) return `Section "${k}" must be an object.`;
    if (TRANSLATIONS.includes(k)) {
      for (const g of Object.keys(content[k])) {
        if (!CONTENT_GROUPS.includes(g)) return `Unknown content section "${k}.${g}".`;
        if (!isObj(content[k][g])) return `Section "${k}.${g}" must be an object.`;
      }
    }
  }
  // Only plain JSON values, limited nesting.
  const walk = (v, depth) => {
    if (depth > 7) return "Content is nested too deeply.";
    if (v === null || ["string", "number", "boolean"].includes(typeof v)) {
      if (typeof v === "string" && v.length > 20000) return "A text field is too long.";
      return null;
    }
    if (Array.isArray(v)) {
      if (v.length > 200) return "A list has too many items.";
      for (const x of v) { const p = walk(x, depth + 1); if (p) return p; }
      return null;
    }
    if (isObj(v)) {
      for (const x of Object.values(v)) { const p = walk(x, depth + 1); if (p) return p; }
      return null;
    }
    return "Content contains an unsupported value.";
  };
  return walk(content, 0);
}
