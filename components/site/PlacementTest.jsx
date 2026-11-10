"use client";
/* Free placement test: 10 English questions -> estimated CEFR level + recommended course.
 * The questions stay English in both languages (it tests English). */
import { useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { arr } from "@/lib/site-helpers";

const PERK_ICONS = ["ri-timer-line", "ri-bar-chart-2-line", "ri-user-voice-line"];

function Question({ q }) {
  const [before, after] = String(q).split("___");
  return <>{before}{after !== undefined ? <><span className="gap">_____</span>{after}</> : null}</>;
}

export default function PlacementTest({ test }) {
  const { t, wa } = useSite();
  const quiz = arr(test.questions).filter((q) => q && q.q && arr(q.a).length);
  const results = arr(test.results);
  const [step, setStep] = useState(-1);      // -1 = start screen, quiz.length = result
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);

  const start = () => { setScore(0); setPicked(null); setStep(quiz.length ? 0 : -1); };
  const next = () => {
    if (picked === +quiz[step].c) setScore((s) => s + 1);
    setPicked(null);
    setStep((s) => s + 1);
  };

  let body;
  if (step < 0) {
    body = (
      <div className="quiz__start">
        <i className="ri-question-answer-line" />
        <h3><Rich text={test.startTitle} /></h3>
        <p><Rich text={test.startText} /></p>
        <button className="btn btn--orange btn--lg" onClick={start}>{t("quiz.start", "Start the test")} <i className="ri-arrow-right-line" /></button>
      </div>
    );
  } else if (step < quiz.length) {
    const q = quiz[step], pct = (step / quiz.length) * 100;
    body = (
      <>
        <div className="quiz__top"><span>{t("quiz.progress", "Question {i} of {n}", { i: step + 1, n: quiz.length })}</span><span>{Math.round(pct)}%</span></div>
        <div className="quiz__bar"><i style={{ width: `${pct}%` }} /></div>
        <h3 className="quiz__q" lang="en" dir="ltr"><Question q={q.q} /></h3>
        <div className="quiz__opts">
          {arr(q.a).map((o, i) => (
            <button key={i} lang="en" dir="ltr" className={picked === i ? "sel" : undefined} onClick={() => setPicked(i)}><b>{"ABCDEF"[i]}</b>{o}</button>
          ))}
          <button className={"idk" + (picked === -1 ? " sel" : "")} onClick={() => setPicked(-1)}><b>?</b>{t("quiz.idk", "I don't know")}</button>
        </div>
        <button className="btn btn--full" disabled={picked === null} onClick={next}>
          {step === quiz.length - 1 ? t("quiz.seeResult", "See my result") : t("quiz.next", "Next question")} <i className="ri-arrow-right-line" />
        </button>
      </>
    );
  } else {
    // The score range is split evenly across the result levels (10 questions / 5 levels = 2 per level).
    const n = results.length || 1;
    const li = Math.min(n - 1, Math.max(0, Math.ceil((score / quiz.length) * n) - 1));
    const r = results[li] || { code: "", name: "", course: "", text: "" };
    const [estBefore, estAfter] = t("quiz.estimated", "Estimated level: {name}", { name: "\u0000" }).split("\u0000");
    body = (
      <div className="quiz__result">
        <span className="quiz__score">{t("quiz.score", "{s}/{n} correct", { s: score, n: quiz.length })}</span>
        <div className="quiz__lvl">{r.code}</div>
        <h3>{estBefore}<Rich text={r.name} />{estAfter}</h3>
        <div className="ladder">{results.map((x, i) => <span key={i} className={i < li ? "done" : i === li ? "now" : undefined}>{x.code}</span>)}</div>
        <p><Rich text={r.text} /></p>
        <div className="quiz__rec"><i className="ri-lightbulb-flash-line" /><div><small>{t("quiz.recommended", "Recommended for you")}</small><b><Rich text={r.course} /></b></div></div>
        <div className="quiz__actions">
          <a {...wa("wa.level", { code: r.code })} className="btn btn--orange"><i className="ri-whatsapp-line" /> {t("quiz.book", "Book a free trial at {code}", { code: r.code })}</a>
          <button className="btn btn--outline" onClick={() => setStep(-1)}><i className="ri-restart-line" /> {t("quiz.retake", "Retake")}</button>
        </div>
      </div>
    );
  }

  return (
    <section className="section test" id="test">
      <div className="container test__grid">
        <div className="test__intro reveal">
          <span className="label label--light"><Rich text={test.label} /></span>
          <h2 className="h2"><Rich text={test.title} /></h2>
          <p><Rich text={test.text} /></p>
          <ul className="test__perks">{arr(test.perks).map((x, i) => <li key={i}><i className={PERK_ICONS[i % PERK_ICONS.length]} /> <Rich text={x} /></li>)}</ul>
        </div>
        <div className="quiz reveal" aria-live="polite">{body}</div>
      </div>
    </section>
  );
}
