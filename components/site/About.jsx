/* The exams strip under the hero, and the "About" section (founding story + four points). */
import Image from "next/image";
import Rich from "../Rich";
import { Counter } from "./Effects";
import { arr, U } from "@/lib/site-helpers";

export function ExamStrip({ C, t }) {
  return (
    <section className="strip" aria-label={t("a11y.exams", "Exam preparation")}>
      <div className="container">
        <p><Rich text={C.exams?.label} /></p>
        <ul>{arr(C.exams?.items).map((x, i) => <li key={i}><i className="ri-medal-line" /> <Rich text={x} /></li>)}</ul>
      </div>
    </section>
  );
}

export default function About({ C }) {
  const a = C.about || {};
  return (
    <section className="section about" id="about">
      <div className="container about__grid">
        <div className="about__media reveal">
          <Image className="about__a" src={U("1524178232363-1fb2b075b655", 800)} alt="Teacher leading an English class at Tawer Academy" width={800} height={860} sizes="(max-width: 991px) 92vw, 540px" />
          <Image className="about__b" src={U("1543269865-cbf427effbad", 600)} alt="Students chatting in English during a speaking club" width={600} height={600} sizes="(max-width: 991px) 48vw, 300px" />
          <div className="about__badge"><b><Counter value={a.years} /></b><span><Rich text={a.yearsText} /></span></div>
        </div>
        <div className="about__text reveal">
          <span className="label"><Rich text={a.label} /></span>
          <h2 className="h2"><Rich text={a.title} /></h2>
          <p><Rich text={a.text} /></p>
          <div className="vm">
            <div className="vm__item">
              <i className="ri-seedling-line" />
              <div><h3><Rich text={a.storyTitle} /></h3><p><Rich text={a.storyText} /></p></div>
            </div>
          </div>
          <ul className="ticks">{arr(a.ticks).map((x, i) => <li key={i}><i className="ri-check-line" /> <Rich text={x} /></li>)}</ul>
        </div>
      </div>
    </section>
  );
}
