"use client";
/* Sticky header: navigation (highlights the section you're in), language switch, mobile menu. */
import { useEffect, useState } from "react";
import { useSite } from "./SiteContext";
import { onScrollFrame } from "./Effects";

const LINKS = [
  ["#about", "nav.about", "About"], ["#levels", "nav.levels", "Levels"], ["#courses", "nav.courses", "Courses"],
  ["#test", "nav.test", "Placement test"], ["#pricing", "nav.pricing", "Pricing"], ["#faq", "nav.faq", "FAQ"], ["#contact", "nav.contact", "Contact"],
];

export default function Header() {
  const { lang, t, wa } = useSite();
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    // Sticky look + the link of the section you're in. Once per frame at most (it reads the page layout).
    const sections = [...document.querySelectorAll("main section[id]")];
    const stop = onScrollFrame(() => {
      const y = scrollY;
      setSticky(y > 40);
      let cur = "";
      for (const s of sections) { if (y >= s.offsetTop - 140) cur = s.id; else break; }
      setCurrent(cur);
    });
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    return () => { stop(); removeEventListener("keydown", onKey); };
  }, []);

  const other = lang === "ar" ? "en" : "ar";
  return (
    <header className={"header" + (sticky ? " sticky" : "")} id="header">
      <div className="container">
        <a href="#top" className="logo" aria-label={t("a11y.home", "Tawer Academy home")}>
          <span className="logo__mark">T<i /></span>
          <span className="logo__text">Tawer<small>Academy</small></span>
        </a>
        <nav className={"nav" + (open ? " open" : "")} id="nav" aria-label={t("a11y.main", "Main")}
          onClick={(e) => { if (e.target.closest("a")) setOpen(false); }}>
          {LINKS.map(([href, key, en]) => (
            <a key={href} href={href} className={current && href === "#" + current ? "active" : undefined}>{t(key, en)}</a>
          ))}
          <a {...wa("wa.trial")} className="btn nav__cta">{t("nav.cta", "Book a free trial")}</a>
        </nav>
        <div className="header__right">
          <a href={`?lang=${other}`} className="lang-switch" lang={other} hrefLang={other} aria-label={t("lang.switchLabel", "Switch to Arabic")}>
            <i className="ri-translate-2" /><span>{t("lang.switch", "العربية")}</span>
          </a>
          <a href="#test" className="link-test"><i className="ri-survey-line" /> <span>{t("header.findLevel", "Find my level")}</span></a>
          <a {...wa("wa.trial")} className="btn">{t("header.trial", "Free trial lesson")}</a>
          <button className="burger" aria-expanded={open} aria-controls="nav"
            aria-label={open ? t("a11y.closeMenu", "Close menu") : t("a11y.menu", "Open menu")} onClick={() => setOpen((o) => !o)}>
            <i className={open ? "ri-close-line" : "ri-menu-3-line"} />
          </button>
        </div>
      </div>
    </header>
  );
}
