/* Default website content, used wherever the database has nothing saved yet.
 * Order of priority everywhere (website + dashboard): saved content in the database > these JSON files.
 *   data/content.en.json  English (the structure: lists, numbers, photos, links)
 *   data/content.ar.json  Arabic translation (same shape, text only; empty/missing = English is shown)
 * See data/README.md for the text formatting rules. */
import en from "@/data/content.en.json";
import ar from "@/data/content.ar.json";

export const DEFAULTS = { ...en, ar };
