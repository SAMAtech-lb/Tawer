/* Top of the page: heading, intro, buttons, rating and the photo with floating cards. */
import Image from "next/image";
import Rich from "../Rich";
import { U } from "@/lib/site-helpers";

const FACES = ["1494790108377-be9c29b29330", "1507003211169-0a1dd7228f2d", "1534528741775-53994a69daeb", "1500648767791-00dcc994a43e"];

export default function Hero({ C }) {
  const h = C.hero || {};
  return (
    <section className="hero">
      <div className="container">
        <div className="hero__text">
          <span className="label"><i className="ri-sparkling-2-fill" /> <span><Rich text={h.label} /></span></span>
          <h1><Rich text={h.title} hl="hl" /></h1>
          <p><Rich text={h.text} /></p>
          <div className="hero__btns">
            <a href="#test" className="btn btn--orange btn--lg"><span><Rich text={h.button1} /></span> <i className="ri-arrow-right-line" /></a>
            <a href="#courses" className="btn btn--outline btn--lg"><Rich text={h.button2} /></a>
          </div>
          <div className="trust">
            <div className="trust__faces">
              {FACES.map((id) => <Image key={id} src={U(id, 120)} alt="" width={92} height={92} sizes="46px" />)}
            </div>
            <div>
              <div className="stars">
                {[0, 1, 2, 3, 4].map((i) => <i key={i} className="ri-star-fill" />)} <b>{h.rating}</b>
              </div>
              <small><Rich text={h.ratingText} /></small>
            </div>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__blob" />
          <Image className="hero__img" src={U("1523240795612-9a054b0db644", 900)} alt="Students practising English together at Tawer Academy"
            width={900} height={945} sizes="(max-width: 991px) 92vw, 560px" priority />
          <div className="float float--level">
            <div className="float__head"><b><Rich text={h.progressTitle} /></b><span dir="ltr">{h.progressTag}</span></div>
            <div className="ladder-mini"><i className="done" /><i className="done" /><i className="done" /><i className="now" /><i /></div>
            <small dir="ltr">A1 · A2 · B1 · <b>B2</b> · C1</small>
          </div>
          <div className="float float--class">
            <i className="ri-live-line" />
            <div><b><Rich text={h.clubTitle} /></b><small><Rich text={h.clubText} /></small></div>
          </div>
          <div className="float float--cert">
            <i className="ri-award-fill" />
            <div><b><Rich text={h.certTitle} /></b><small><Rich text={h.certText} /></small></div>
          </div>
        </div>
      </div>
    </section>
  );
}
