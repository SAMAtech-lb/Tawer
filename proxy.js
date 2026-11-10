/* Runs before the website page: picks the language and passes it to the page in the x-tawer-lang header.
 * Order: ?lang=en|ar (the switch in the header, remembered in a cookie for a year) > remembered choice >
 * the browser's language (Accept-Language) > English. */
import { NextResponse } from "next/server";
import { LANGS, browserLang } from "./lib/ui-strings";

export function proxy(request) {
  const q = request.nextUrl.searchParams.get("lang");
  let lang = LANGS.includes(q) ? q : request.cookies.get("tawer_lang")?.value;
  if (!LANGS.includes(lang)) lang = browserLang(request.headers.get("accept-language"));

  const forward = new Headers(request.headers);
  forward.set("x-tawer-lang", lang);
  const res = NextResponse.next({ request: { headers: forward } });
  if (LANGS.includes(q)) res.cookies.set("tawer_lang", q, { path: "/", maxAge: 31536000, sameSite: "lax" });
  res.headers.set("vary", "Cookie, Accept-Language");
  return res;
}

export const config = { matcher: ["/"] };
