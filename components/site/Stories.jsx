"use client";
/* Success stories: an endless, slowly moving row of small cards, with a pause/play button.
 * The cards appear twice so the loop is seamless (the second copy is hidden from screen readers). */
import Image from "next/image";
import { useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { arr, initials, plain, U } from "@/lib/site-helpers";

function StoryCard({ st, copy }) {
  return (
    <article className="story" aria-hidden={copy || undefined}>
      <div className="story__result"><b><Rich text={st.result} /></b>{st.resultLabel ? <span><Rich text={st.resultLabel} /></span> : null}</div>
      <p><Rich text={st.text} /></p>
      <div className="story__who">
        {st.img
          ? <Image src={U(st.img, 120)} alt={copy ? "" : plain(st.name)} width={92} height={92} sizes="46px" />
          : <span className="avatar-fallback avatar-fallback--sm">{initials(st.name)}</span>}
        <div><b><Rich text={st.name} /></b><small><Rich text={st.role} /></small></div>
      </div>
    </article>
  );
}

export default function Stories({ stories }) {
  const { t } = useSite();
  const [paused, setPaused] = useState(false);
  const items = arr(stories.items);
  return (
    <section className="section" id="stories">
      <div className="container">
        <div className="title reveal">
          <span className="label"><Rich text={stories.label} /></span>
          <h2 className="h2"><Rich text={stories.title} /></h2>
          <p><Rich text={stories.text} /></p>
        </div>
      </div>
      <div className="marquee reveal" aria-label={t("a11y.stories", "Student success stories")}>
        <div className={"marquee__track" + (paused ? " is-paused" : "")}>
          {items.map((st, i) => <StoryCard key={"a" + i} st={st} />)}
          {items.map((st, i) => <StoryCard key={"b" + i} st={st} copy />)}
        </div>
      </div>
      <div className="marquee__ctrl">
        <button aria-pressed={paused} onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("a11y.playStories", "Play success stories") : t("a11y.pauseStories", "Pause success stories")}>
          <i className={paused ? "ri-play-line" : "ri-pause-line"} />
        </button>
      </div>
    </section>
  );
}
