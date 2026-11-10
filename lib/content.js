/* Rules for the content the admin dashboard may save. */
import en from "@/data/content.en.json";
import { isObj } from "./format";

/* The sections content may contain are the ones in data/content.en.json (anything else is rejected on save),
 * plus "ar": the Arabic translation, same sections, text only (see translate() in lib/format.js). */
const GROUPS = Object.keys(en);

/* -> error message, or null when the content is valid */
export function validateContent(content) {
  if (!isObj(content)) return "Content must be an object.";
  for (const k of Object.keys(content)) {
    if (!GROUPS.includes(k) && k !== "ar") return `Unknown content section "${k}".`;
    if (!isObj(content[k])) return `Section "${k}" must be an object.`;
    if (k === "ar") {
      for (const g of Object.keys(content[k])) {
        if (!GROUPS.includes(g)) return `Unknown content section "${k}.${g}".`;
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
