"use client";
/* Testimonials slider (2 cards on wide screens, 1 on small ones), auto-advancing every 5.5 s. */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { arr, initials, plain, U } from "@/lib/site-helpers";

export default function Reviews({ reviews }) {
  const { t, rtl } = useSite();
  const items = arr(reviews.items);
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(2);
  const [offset, setOffset] = useState(0);
  const max = Math.max(0, items.length - perView);

  // Measure card width (layout-dependent) and keep the position valid when the window is resized.
  const measure = useCallback(() => {
    const pv = innerWidth < 900 ? 1 : 2;
    setPerView(pv);
    const card = track.current?.children[0];
    setOffset(card ? card.offsetWidth + 24 : 0);
  }, []);
  useEffect(() => { measure(); addEventListener("resize", measure); return () => removeEventListener("resize", measure); }, [measure]);

  const go = useCallback((i) => setIndex(i < 0 ? max : i > max ? 0 : i), [max]);
  useEffect(() => { const id = setInterval(() => setIndex((i) => (i >= max ? 0 : i + 1)), 5500); return () => clearInterval(id); }, [max, index]);
  useEffect(() => { if (index > max) setIndex(max); }, [index, max]);

  return (
    <section className="section section--purple" id="reviews">
      <div className="container">
        <div className="title title--light reveal">
          <span className="label label--light"><Rich text={reviews.label} /></span>
          <h2 className="h2"><Rich text={reviews.title} /></h2>
        </div>
        <div className="slider reveal">
          <div className="slider__track" ref={track} style={{ transform: `translateX(${rtl ? "" : "-"}${index * offset}px)` }}>
            {items.map((r, i) => (
              <figure className="review" key={i}>
                <i className="ri-double-quotes-l review__q" />
                <div className="stars">{[0, 1, 2, 3, 4].map((s) => <i key={s} className="ri-star-fill" />)}</div>
                <blockquote><Rich text={r.text} /></blockquote>
                <figcaption>
                  {r.img ? <Image src={U(r.img, 120)} alt={plain(r.name)} width={104} height={104} sizes="52px" /> : <span className="avatar-fallback avatar-fallback--sm">{initials(r.name)}</span>}
                  <div><b><Rich text={r.name} /></b><small><Rich text={r.role} /></small></div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="slider__nav">
            <button aria-label={t("a11y.prevReview", "Previous review")} onClick={() => go(index - 1)}><i className="ri-arrow-left-line" /></button>
            <div className="slider__dots">
              {items.map((_, i) => (
                <button key={i} hidden={i > max} className={i === index ? "active" : undefined} aria-label={t("a11y.review", "Review {i}", { i: i + 1 })} onClick={() => go(i)} />
              ))}
            </div>
            <button aria-label={t("a11y.nextReview", "Next review")} onClick={() => go(index + 1)}><i className="ri-arrow-right-line" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
