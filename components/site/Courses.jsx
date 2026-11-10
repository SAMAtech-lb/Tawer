"use client";
/* Course cards with category filters. "Enquire" opens WhatsApp, or the corporate / custom form. */
import Image from "next/image";
import { useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { OpenFormLink } from "./Effects";
import { arr, plain, U } from "@/lib/site-helpers";

const FILTERS = [["all", "filter.all", "All courses"], ["adults", "filter.adults", "Adults"], ["kids", "filter.kids", "Kids & Teens"],
  ["business", "filter.business", "Business"], ["exam", "filter.exam", "Exam prep"]];

export default function Courses({ courses }) {
  const { t, wa } = useSite();
  const [filter, setFilter] = useState("all");
  const items = arr(courses.items).filter((c) => filter === "all" || c.cat === filter);
  return (
    <section className="section" id="courses">
      <div className="container">
        <div className="title title--row reveal">
          <div>
            <span className="label"><Rich text={courses.label} /></span>
            <h2 className="h2"><Rich text={courses.title} /></h2>
          </div>
          <div className="filters">
            {FILTERS.map(([f, key, en]) => (
              <button key={f} className={f === filter ? "active" : undefined} aria-pressed={f === filter} onClick={() => setFilter(f)}>{t(key, en)}</button>
            ))}
          </div>
        </div>
        <div className="courses">
          {items.map((c, k) => {
            const label = t("course.enquireAria", "Enquire about {title}", { title: plain(c.title) });
            const inner = <>{t("course.enquire", "Enquire")} <i className="ri-arrow-right-up-line" /></>;
            return (
              <article className="course" key={`${filter}-${k}`}>
                <div className="course__img">
                  <Image src={U(c.img, 600)} alt={plain(c.title)} width={600} height={413} sizes="(max-width: 600px) 92vw, (max-width: 991px) 46vw, 380px" />
                  {c.badge ? <span className="course__badge"><Rich text={c.badge} /></span> : null}
                </div>
                <div className="course__body">
                  <span className="course__lvl"><i className="ri-bar-chart-fill" /> <Rich text={c.level} /></span>
                  <h3><Rich text={c.title} /></h3>
                  <p><Rich text={c.desc} /></p>
                  <div className="course__meta">
                    <span><i className="ri-time-line" /> <Rich text={c.dur} /></span>
                    <span><i className="ri-live-line" /> <Rich text={c.mode} /></span>
                  </div>
                  <div className="course__foot">
                    <span className="course__price">
                      {c.price || c.price === 0
                        ? <><small>{t("course.from", "from")}</small> ${c.price}<small>{t("course.perCourse", "per course")}</small></>
                        : t("course.quote", "Custom quote")}
                    </span>
                    {c.action === "corporate" || c.action === "custom"
                      ? <OpenFormLink form={c.action} className="course__btn" aria-label={label}>{inner}</OpenFormLink>
                      : <a {...wa("wa.course", { course: plain(c.title) })} className="course__btn" aria-label={label}>{inner}</a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
