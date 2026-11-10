"use client";
/* Small client-side behaviours used across the page. */
import { useEffect, useRef, useState } from "react";

/* Runs fn at most once per screen frame while the page scrolls (scroll events can fire many times per frame). */
export function onScrollFrame(fn) {
  let queued = false;
  const handler = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
  addEventListener("scroll", handler, { passive: true });
  addEventListener("resize", handler, { passive: true });
  fn();
  return () => { removeEventListener("scroll", handler); removeEventListener("resize", handler); };
}

/* Fades sections in as they scroll into view (adds .in to every .reveal element). */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    }), { threshold: 0.15 });
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/* Number that counts up when it scrolls into view (2,500+, 96%…). Western digits in both languages. */
export function Counter({ value }) {
  const end = Number(value) || 0;
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), d = 1400;
      const step = (t) => { const p = Math.min((t - t0) / d, 1); setN(Math.round(end * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [end]);
  return <span ref={ref}>{n.toLocaleString("en-US")}</span>;
}

/* "Back to top" button, shown after scrolling down. */
export function BackToTop({ label }) {
  const [on, setOn] = useState(false);
  useEffect(() => onScrollFrame(() => setOn(scrollY > 600)), []);
  return (
    <button className={"totop" + (on ? " on" : "")} aria-label={label} onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>
      <i className="ri-arrow-up-line" />
    </button>
  );
}

/* A link that opens one of the two request forms ("custom" / "corporate") in the contact section. */
export function OpenFormLink({ form, className, children, ...rest }) {
  return (
    <a href="#request" className={className} {...rest}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("tawer:open-form", { detail: form }));
        document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}>
      {children}
    </a>
  );
}
