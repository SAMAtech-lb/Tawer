"use client";
/* The A1–C1 level tabs: pick a level to see what you'll be able to do. */
import Image from "next/image";
import { useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { arr, plain, U } from "@/lib/site-helpers";

export default function Levels({ levels }) {
  const { t, wa } = useSite();
  const items = arr(levels.items);
  const [i, setI] = useState(0);
  const l = items[i];
  return (
    <section className="section section--light" id="levels">
      <div className="container">
        <div className="title reveal">
          <span className="label"><Rich text={levels.label} /></span>
          <h2 className="h2"><Rich text={levels.title} /></h2>
          <p><Rich text={levels.text} /></p>
        </div>
        <div className="levels reveal">
          <div className="levels__tabs" role="tablist">
            {items.map((x, k) => (
              <button key={k} role="tab" aria-selected={k === i} className={k === i ? "active" : undefined} onClick={() => setI(k)}>
                <b>{x.code}</b><span><Rich text={x.name} /></span>
              </button>
            ))}
          </div>
          {l && (
            <div className="levels__panel" role="tabpanel">
              <div className="lp__text">
                <div className="lp__head">
                  <span className="lp__code">{l.code}</span>
                  <div><h3><Rich text={l.name} /></h3><p><Rich text={l.intro} /></p></div>
                </div>
                <h4>{t("level.after", "After this level you can:")}</h4>
                <ul>{arr(l.can).map((c, k) => <li key={k}><i className="ri-checkbox-circle-fill" /><Rich text={c} /></li>)}</ul>
                <div className="lp__meta">
                  <span><i className="ri-calendar-line" /> {t("level.weeks", "{n} weeks", { n: l.weeks })}</span>
                  <span><i className="ri-time-line" /> {t("level.hours", "{n} teaching hours", { n: l.hours })}</span>
                  <span><i className="ri-award-line" /> {t("level.cert", "Certificate")}</span>
                </div>
                <a {...wa("wa.level", { code: l.code })} className="btn">
                  <i className="ri-whatsapp-line" /> {t("level.start", "Start {code} with a free trial", { code: l.code })}
                </a>
              </div>
              <Image src={U(l.img, 700)} width={700} height={560} sizes="(max-width: 991px) 92vw, 560px" alt={t("level.alt", "{name} English class at Tawer Academy", { name: plain(l.name) })} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
