/* Prices per course (starting prices only, never discount amounts) + "Ways to save". */
import Rich from "../Rich";
import { OpenFormLink } from "./Effects";
import { arr, plain } from "@/lib/site-helpers";

export default function Pricing({ C, t, wa }) {
  const p = C.pricing || {};
  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="title reveal">
          <span className="label"><Rich text={p.label} /></span>
          <h2 className="h2"><Rich text={p.title} /></h2>
          <p><Rich text={p.text} /></p>
        </div>
        <div className="plans">
          {arr(p.plans).map((plan, i) => {
            const btn = "btn " + (plan.popular ? "btn--orange" : "btn--outline");
            return (
              <article className={"plan reveal" + (plan.popular ? " plan--pop" : "")} key={i}>
                {plan.tag ? <span className="plan__tag"><Rich text={plan.tag} /></span> : null}
                <h3><Rich text={plan.name} /></h3>
                <p><Rich text={plan.desc} /></p>
                <div className="plan__price">
                  {plan.from || plan.from === 0
                    ? <><small>{t("plan.from", "Starting from")}</small><b>${plan.from}</b><span>{t("plan.perCourse", "per course")}</span></>
                    : <><small>{t("plan.price", "Price")}</small><b className="plan__quote">{t("plan.onRequest", "On request")}</b></>}
                </div>
                <ul>
                  {arr(plan.included).map((x, k) => <li key={"i" + k}><i className="ri-check-line" /> <Rich text={x} /></li>)}
                  {arr(plan.excluded).map((x, k) => <li key={"x" + k} className="off"><i className="ri-close-line" /> <Rich text={x} /></li>)}
                </ul>
                {plan.action === "custom"
                  ? <OpenFormLink form="custom" className={btn}>{t("plan.ctaCustom", "Build my course")}</OpenFormLink>
                  : <a {...wa("wa.plan", { plan: plain(plan.name) })} className={btn}><i className="ri-whatsapp-line" /> {t("plan.cta", "Get my price")}</a>}
              </article>
            );
          })}
        </div>
        <div className="savings reveal">
          <h3 className="savings__title"><Rich text={p.savingsTitle} /></h3>
          <div className="savings__grid">
            {arr(p.savings).map((x, i) => (
              <div className="saving" key={i}><i className={x.icon || "ri-price-tag-3-line"} /><div><h4><Rich text={x.title} /></h4><p><Rich text={x.text} /></p></div></div>
            ))}
          </div>
        </div>
        <p className="plans__note"><i className="ri-information-line" /> <span><Rich text={p.note} /></span></p>
      </div>
    </section>
  );
}
