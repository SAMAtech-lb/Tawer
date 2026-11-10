"use client";
/* The website's only two forms: "Build your own course" and "Corporate training".
 * Shown as two tabs; only the selected form is on the page. Sent to /api/requests (dashboard → Requests). */
import { useEffect, useState } from "react";
import Rich from "../Rich";
import { useSite } from "./SiteContext";
import { arr, plain } from "@/lib/site-helpers";

const ERRORS = {
  missing: ["req.missing", "Please fill in the required fields."],
  phone: ["req.badPhone", "Please enter a valid phone number, with the country code."],
  email: ["req.badEmail", "Please enter a valid email, or leave it empty."],
  "too-many": ["req.tooMany", "You've sent several requests recently. Please try again later or message us on WhatsApp."],
  failed: ["req.failed", "Sorry, that didn't go through. Please try again or message us on WhatsApp."],
};

/* A row of pill-shaped options (radio = pick one, checkbox = pick several). */
function Chips({ legend, name, type = "radio", options, defaultValue }) {
  return (
    <fieldset className="chips">
      <legend>{legend}</legend>
      {options.map(([value, label]) => (
        <label key={value}>
          <input type={type} name={name} value={value} defaultChecked={value === defaultValue} /> <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Field({ label, children }) {
  return <label><span>{label}</span>{children}</label>;
}

export default function RequestForms({ forms, levels }) {
  const { t, lang } = useSite();
  const [type, setType] = useState("custom");
  const [status, setStatus] = useState(null);   // { kind: "ok" | "bad", text }
  const [sending, setSending] = useState(false);
  const [invalid, setInvalid] = useState([]);   // names of fields shown in red

  const show = (form) => { setType(form); setStatus(null); setInvalid([]); };

  // Buttons elsewhere ("Build my course", Corporate "Enquire") switch the form.
  useEffect(() => {
    const open = (e) => { if (e.detail === "custom" || e.detail === "corporate") show(e.detail); };
    addEventListener("tawer:open-form", open);
    return () => removeEventListener("tawer:open-form", open);
  }, []);

  const err = (key) => { const [k, en] = ERRORS[key] || ERRORS.failed; return t(k, en); };
  const cls = (name) => (invalid.includes(name) ? "err" : undefined);

  async function submit(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const missing = [...f.querySelectorAll("[required]")].filter((i) => !i.value.trim()).map((i) => i.name);
    setInvalid(missing);
    if (missing.length) { setStatus({ kind: "bad", text: err("missing") }); f.elements[missing[0]]?.focus(); return; }

    const fd = new FormData(f), data = {};
    for (const [k, v] of fd.entries()) {
      if (k === "website") continue;
      if (k === "focus" || k === "times") (data[k] ||= []).push(v); else data[k] = String(v);
    }
    setSending(true); setStatus(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, data, lang, website: fd.get("website") || "" }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (out.error === "phone" || out.error === "email") setInvalid([out.error]);
        setStatus({ kind: "bad", text: err(out.error) });
        return;
      }
      f.reset(); setInvalid([]);
      setStatus({ kind: "ok", text: forms.sent || "Thank you! We received your request and will contact you on WhatsApp within one working day." });
    } catch {
      setStatus({ kind: "bad", text: err("failed") });
    } finally {
      setSending(false);
    }
  }

  const tab = (value, icon, text) => (
    <button type="button" role="tab" aria-selected={type === value} aria-controls="requestForm" className={type === value ? "active" : undefined}
      onClick={() => show(value)}>
      <i className={icon} /> <span><Rich text={text} /></span>
    </button>
  );
  const phonePh = "+966 5x xxx xxxx";

  return (
    <div className="request reveal" id="request">
      <p className="request__label"><Rich text={forms.label} /></p>
      <div className="request__tabs" role="tablist" aria-label="Request forms">
        {tab("custom", "ri-puzzle-line", forms.customTab)}
        {tab("corporate", "ri-building-2-line", forms.corporateTab)}
      </div>

      <form className="form" id="requestForm" role="tabpanel" key={type} onSubmit={submit} noValidate>
        <p className="form__intro"><Rich text={type === "custom" ? forms.customText : forms.corporateText} /></p>
        {/* Spam trap: invisible to people, bots fill it in */}
        <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {type === "custom" ? (
          <>
            <div className="form__row">
              <Field label={t("req.name", "Full name")}><input name="name" required maxLength={80} autoComplete="name" className={cls("name")} /></Field>
              <Field label={t("req.phone", "WhatsApp number")}><input name="phone" type="tel" dir="ltr" required maxLength={30} autoComplete="tel" placeholder={phonePh} className={cls("phone")} /></Field>
            </div>
            <div className="form__row">
              <Field label={t("req.email", "Email (optional)")}><input name="email" type="email" dir="ltr" maxLength={120} autoComplete="email" className={cls("email")} /></Field>
              <Field label={t("req.level", "Your current level")}>
                <select name="level" defaultValue="">
                  <option value="">{t("req.levelUnsure", "Not sure yet")}</option>
                  {arr(levels).map((l) => { const v = `${l.code} · ${plain(l.name)}`; return <option key={l.code} value={v}>{v}</option>; })}
                </select>
              </Field>
            </div>
            <Chips legend={t("req.focus", "What do you want to focus on?")} name="focus" type="checkbox" options={[
              ["speaking", t("req.f.speaking", "Speaking & conversation")], ["grammar", t("req.f.grammar", "Grammar & vocabulary")],
              ["writing", t("req.f.writing", "Writing")], ["exam", t("req.f.exam", "IELTS / STEP / TOEFL")],
              ["business", t("req.f.business", "Business English")], ["kids", t("req.f.kids", "For my child")]]} />
            <Chips legend={t("req.type", "Lesson type")} name="lessonType" defaultValue="unsure" options={[
              ["private", t("req.t.private", "Private (1-to-1)")], ["group", t("req.t.group", "Small group")], ["unsure", t("req.t.unsure", "Not sure yet")]]} />
            <div className="form__row">
              <Chips legend={t("req.perWeek", "Lessons per week")} name="perWeek" defaultValue="2" options={[["1", "1"], ["2", "2"], ["3", "3"], ["4+", "4+"]]} />
              <Chips legend={t("req.times", "Best times")} name="times" type="checkbox" options={[
                ["morning", t("req.morning", "Morning")], ["afternoon", t("req.afternoon", "Afternoon")],
                ["evening", t("req.evening", "Evening")], ["weekend", t("req.weekend", "Weekend")]]} />
            </div>
            <Field label={t("req.msg", "Anything else? (optional)")}>
              <textarea name="message" rows={3} maxLength={1500} placeholder={t("req.msgPh", "e.g. IELTS 7 by June")} />
            </Field>
          </>
        ) : (
          <>
            <div className="form__row">
              <Field label={t("req.company", "Company name")}><input name="company" required maxLength={120} autoComplete="organization" className={cls("company")} /></Field>
              <Field label={t("req.contact", "Your name")}><input name="name" required maxLength={80} autoComplete="name" className={cls("name")} /></Field>
            </div>
            <div className="form__row">
              <Field label={t("req.phoneCorp", "Phone / WhatsApp")}><input name="phone" type="tel" dir="ltr" required maxLength={30} autoComplete="tel" placeholder={phonePh} className={cls("phone")} /></Field>
              <Field label={t("req.emailCorp", "Work email (optional)")}><input name="email" type="email" dir="ltr" maxLength={120} autoComplete="email" className={cls("email")} /></Field>
            </div>
            <Chips legend={t("req.teamSize", "Team size")} name="teamSize" defaultValue="6-15" options={[["2-5", "2–5"], ["6-15", "6–15"], ["16-50", "16–50"], ["50+", "50+"]]} />
            <Field label={t("req.goals", "What does your team need?")}>
              <textarea name="message" rows={4} required maxLength={1500} className={cls("message")}
                placeholder={t("req.goalsPh", "e.g. Meetings and emails with international clients")} />
            </Field>
          </>
        )}

        <button className="btn btn--orange btn--lg btn--full" type="submit" disabled={sending}>
          <span>{sending ? t("req.sending", "Sending…") : t("req.send", "Send my request")}</span> <i className="ri-send-plane-line" />
        </button>
        <p className={"form__msg" + (status ? " " + status.kind : "")} role="status">
          {status?.kind === "ok" ? <><i className="ri-checkbox-circle-fill" /> <Rich text={status.text} /></> : status?.text}
        </p>
      </form>
    </div>
  );
}
