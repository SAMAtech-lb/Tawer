/* Smaller server-rendered sections: FAQ, blog, the orange free-trial banner. */
import Image from "next/image";
import Rich from "../Rich";
import { arr, plain, safeUrl, U } from "@/lib/site-helpers";

export function Faq({ C, wa }) {
  const f = C.faq || {};
  return (
    <section className="section section--light" id="faq">
      <div className="container faq__grid">
        <div className="reveal">
          <span className="label"><Rich text={f.label} /></span>
          <h2 className="h2"><Rich text={f.title} /></h2>
          <p className="faq__lead"><Rich text={f.text} /></p>
          <a {...wa("wa.trial")} className="btn btn--wa"><i className="ri-whatsapp-line" /> <span><Rich text={f.button} /></span></a>
        </div>
        <div className="faq reveal">
          {arr(f.items).map((x, i) => (
            <details key={i} open={i === 0}><summary><Rich text={x.q} /></summary><p><Rich text={x.a} /></p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Blog({ C }) {
  const b = C.blog || {};
  const ext = (url) => (/^https?:/i.test(url) ? { target: "_blank", rel: "noopener" } : {});
  return (
    <section className="section" id="blog">
      <div className="container">
        <div className="title title--row reveal">
          <div>
            <span className="label"><Rich text={b.label} /></span>
            <h2 className="h2"><Rich text={b.title} /></h2>
          </div>
          <a href={safeUrl(b.allUrl)} className="btn btn--outline"><span><Rich text={b.allLabel} /></span> <i className="ri-arrow-right-line" /></a>
        </div>
        <div className="posts">
          {arr(b.items).map((p, i) => {
            const url = safeUrl(p.url);
            return (
              <article className="post reveal" key={i}>
                <Image src={U(p.img, 700)} alt={plain(p.title)} width={700} height={438} sizes="(max-width: 600px) 92vw, (max-width: 991px) 46vw, 380px" />
                <div className="post__body"><span><Rich text={p.tag} /></span><h3><a href={url} {...ext(url)}><Rich text={p.title} /></a></h3><p><Rich text={p.excerpt} /></p></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ C, wa }) {
  const c = C.cta || {};
  return (
    <section className="cta">
      <div className="container cta__box reveal">
        <div>
          <h2><Rich text={c.title} /></h2>
          <p><Rich text={c.text} /></p>
        </div>
        <a {...wa("wa.trial")} className="btn btn--orange btn--lg"><i className="ri-whatsapp-line" /> <span><Rich text={c.button} /></span> <i className="ri-arrow-right-line" /></a>
      </div>
    </section>
  );
}
