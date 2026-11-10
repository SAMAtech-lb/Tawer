/* "How it works" (4 steps) and "Why Tawer" (value cards + numbers bar). */
import Rich from "../Rich";
import { Counter } from "./Effects";
import { arr } from "@/lib/site-helpers";

export function HowItWorks({ C }) {
  const how = C.how || {};
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="title reveal">
          <span className="label"><Rich text={how.label} /></span>
          <h2 className="h2"><Rich text={how.title} /></h2>
        </div>
        <div className="steps">
          {arr(how.items).map((s, i) => (
            <div className="step reveal" key={i}>
              <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
              <i className={s.icon || "ri-checkbox-circle-line"} />
              <h3><Rich text={s.title} /></h3>
              <p><Rich text={s.text} /></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Why({ C }) {
  const why = C.why || {};
  return (
    <section className="section section--light why" id="why">
      <div className="container">
        <div className="title reveal">
          <span className="label"><Rich text={why.label} /></span>
          <h2 className="h2"><Rich text={why.title} /></h2>
        </div>
        <div className="why__grid">
          {arr(why.items).map((f, i) => (
            <article className="feat reveal" key={i}><i className={f.icon || "ri-star-line"} /><h3><Rich text={f.title} /></h3><p><Rich text={f.text} /></p></article>
          ))}
        </div>
        <div className="stats reveal">
          {arr(why.stats).map((s, i) => (
            <div key={i}><b><Counter value={s.value} />{s.suffix}</b><small><Rich text={s.label} /></small></div>
          ))}
        </div>
      </div>
    </section>
  );
}
