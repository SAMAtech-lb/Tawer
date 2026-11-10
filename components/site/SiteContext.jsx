"use client";
/* Language, interface text and WhatsApp links for the interactive (client) parts of the website. */
import { createContext, useContext, useMemo } from "react";
import { makeT, makeWa } from "@/lib/site-helpers";

const SiteContext = createContext(null);

export function SiteProvider({ lang, ui, waNum, children }) {
  const value = useMemo(() => {
    const t = makeT(ui);
    return { lang, rtl: lang === "ar", t, wa: makeWa(waNum, t) };
  }, [lang, ui, waNum]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
