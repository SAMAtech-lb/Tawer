"use client";
/* Requests inbox: what visitors sent with the website's two forms.
 * Filter New / Handled / All, by form type, or search a name or phone; reply on WhatsApp, then mark as handled. */
import { useMemo, useState } from "react";
import { initials, waDigits } from "@/lib/site-helpers";

const LABELS = {
  type: { custom: "Build your own course", corporate: "Corporate training" },
  focus: { speaking: "Speaking", grammar: "Grammar & vocabulary", writing: "Writing", exam: "IELTS / STEP / TOEFL", business: "Business English", kids: "For a child" },
  lessonType: { private: "Private (1-to-1)", group: "Small group", unsure: "Lesson type not sure yet" },
  times: { morning: "Morning", afternoon: "Afternoon", evening: "Evening", weekend: "Weekend" },
};

/* "Just now", "40 min ago", "5 h ago", "Yesterday", "4 days ago", then the date. Full date and time on hover. */
function when(iso) {
  const d = new Date(iso), mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function Chip({ icon, label, children, ltr }) {
  if (!children) return null;
  return <span className="chip" title={label}><i className={icon} aria-hidden="true" /><span className="sr">{label}: </span><span dir={ltr ? "ltr" : "auto"}>{children}</span></span>;
}

function RequestCard({ r, onToggleDone, onCopy }) {
  const d = r.data || {};
  const corporate = r.type === "corporate";
  const digits = waDigits(d.phone);   // "055…" / "00966…" -> "96655…" so the WhatsApp link works
  const first = String(d.name || "").split(/\s+/)[0];
  const greeting = r.lang === "ar" ? `مرحبًا ${first}، شكرًا لتواصلك مع أكاديمية طوّر!` : `Hi ${first}, thank you for contacting Tawer Academy!`;
  const list = (key) => (Array.isArray(d[key]) && d[key].length ? d[key].map((x) => LABELS[key][x] || x).join(", ") : "");
  const title = corporate ? d.company || d.name : d.name;
  const [open, setOpen] = useState(false);
  const longMessage = String(d.message || "").length > 220;

  return (
    <article className={"req" + (r.done ? " req--done" : "") + (corporate ? " req--corporate" : "")}>
      <div className="req__avatar" aria-hidden="true">{corporate ? <i className="ri-building-2-line" /> : initials(d.name) || "?"}</div>
      <div className="req__main">
        <header className="req__head">
          <div className="req__who">
            <h3 className="req__name" dir="auto">{title}</h3>
            <p className="req__sub">
              <span className="req__type">{LABELS.type[r.type] || r.type}</span>
              {corporate && d.name ? <span dir="auto">· {d.name}</span> : null}
              <span className="req__lang" title={r.lang === "ar" ? "Sent from the Arabic website" : "Sent from the English website"}>· {r.lang === "ar" ? "Arabic site" : "English site"}</span>
            </p>
          </div>
          <div className="req__meta">
            {!r.done ? <span className="req__new">New</span> : <span className="req__handled"><i className="ri-check-line" /> Handled</span>}
            <time dateTime={r.createdAt} title={new Date(r.createdAt).toLocaleString()}>{when(r.createdAt)}</time>
          </div>
        </header>

        <div className="req__chips">
          <Chip icon="ri-phone-line" label="Phone" ltr>{d.phone}</Chip>
          <Chip icon="ri-mail-line" label="Email" ltr>{d.email}</Chip>
          <Chip icon="ri-bar-chart-line" label="Level">{d.level}</Chip>
          <Chip icon="ri-user-line" label="Lesson type">{LABELS.lessonType[d.lessonType]}</Chip>
          <Chip icon="ri-calendar-line" label="Lessons per week">{d.perWeek ? `${d.perWeek} a week` : ""}</Chip>
          <Chip icon="ri-time-line" label="Best times">{list("times")}</Chip>
          <Chip icon="ri-team-line" label="Team size">{d.teamSize ? `${d.teamSize} people` : ""}</Chip>
          <Chip icon="ri-focus-3-line" label="Wants to focus on">{list("focus")}</Chip>
        </div>

        {d.message ? (
          <blockquote className={"req__msg" + (longMessage && !open ? " req__msg--clamp" : "")} dir="auto">
            {d.message}
          </blockquote>
        ) : null}
        {longMessage ? <button type="button" className="req__more" onClick={() => setOpen((o) => !o)}>{open ? "Show less" : "Show the whole message"}</button> : null}

        <footer className="req__actions">
          {digits ? <a className="btn btn--primary btn--sm" href={`https://wa.me/${digits}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noopener"><i className="ri-whatsapp-line" /> Reply on WhatsApp</a> : null}
          {d.phone ? <a className="btn btn--ghost btn--sm" href={`tel:${String(d.phone).replace(/[^\d+]/g, "")}`}><i className="ri-phone-line" /> Call</a> : null}
          {d.email ? <a className="btn btn--ghost btn--sm" href={`mailto:${d.email}`}><i className="ri-mail-line" /> Email</a> : null}
          {d.phone ? <button type="button" className="btn btn--ghost btn--sm" onClick={() => onCopy(d.phone)} title="Copy the phone number"><i className="ri-file-copy-line" /> Copy number</button> : null}
          <button type="button" className={"btn btn--sm req__done" + (r.done ? " btn--ghost" : " req__done--todo")} onClick={() => onToggleDone(r)}>
            <i className={r.done ? "ri-arrow-go-back-line" : "ri-checkbox-circle-line"} /> {r.done ? "Move back to New" : "Mark as handled"}
          </button>
        </footer>
      </div>
    </article>
  );
}

export default function Inbox({ tab, inbox, error, onRefresh, onToggleDone, onToast }) {
  const items = inbox || [];
  const [show, setShow] = useState("new");          // new | handled | all
  const [type, setType] = useState("all");          // all | custom | corporate
  const [q, setQ] = useState("");

  const counts = useMemo(() => ({ new: items.filter((r) => !r.done).length, handled: items.filter((r) => r.done).length, all: items.length }), [items]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase(), digits = needle.replace(/\D/g, "");
    return items.filter((r) => {
      if (show === "new" && r.done) return false;
      if (show === "handled" && !r.done) return false;
      if (type !== "all" && r.type !== type) return false;
      if (!needle) return true;
      const d = r.data || {};
      const text = [d.name, d.company, d.email, d.message].join(" ").toLowerCase();
      return text.includes(needle) || (digits.length >= 3 && String(d.phone || "").replace(/\D/g, "").includes(digits));
    });
  }, [items, show, type, q]);

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); onToast?.("Phone number copied."); }
    catch { onToast?.("Couldn't copy. Select the number and copy it by hand.", true); }
  };

  const filter = (value, label) => (
    <button type="button" role="tab" aria-selected={show === value} className={show === value ? "active" : undefined} onClick={() => setShow(value)}>
      {label} <span className="count">{counts[value]}</span>
    </button>
  );

  return (
    <>
      <div className="panel__head">
        <div><h1>{tab.label}</h1><p className="muted">Messages from the website&apos;s two forms. Reply on WhatsApp, then mark them as handled.</p></div>
        <div className="panel__links"><button type="button" className="btn btn--ghost btn--sm" onClick={onRefresh}><i className="ri-refresh-line" /> Refresh</button></div>
      </div>
      {error ? <p className="msg">{error}</p> : null}

      {inbox === null ? <p className="muted">Loading requests…</p> : !items.length ? (
        <section className="card inbox-empty">
          <i className="ri-inbox-2-line" />
          <h2>No requests yet</h2>
          <p className="muted">When someone sends the “Build your own course” or “Corporate training” form on the website, it appears here.</p>
        </section>
      ) : (
        <>
          <div className="inbox-bar">
            <div className="seg" role="tablist" aria-label="Show">
              {filter("new", "New")}{filter("handled", "Handled")}{filter("all", "All")}
            </div>
            <label className="inbox-search">
              <i className="ri-search-line" aria-hidden="true" />
              <input type="search" placeholder="Search a name, phone or word" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search requests" />
            </label>
            <select className="inbox-type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Form">
              <option value="all">Both forms</option>
              <option value="custom">Build your own course</option>
              <option value="corporate">Corporate training</option>
            </select>
          </div>

          {shown.length ? (
            <div className="inbox-list">
              {shown.map((r) => <RequestCard key={r.id} r={r} onToggleDone={onToggleDone} onCopy={copy} />)}
            </div>
          ) : (
            <section className="card inbox-empty inbox-empty--small">
              <i className={show === "new" && !q && type === "all" ? "ri-checkbox-circle-line" : "ri-search-line"} />
              <h2>{show === "new" && !q && type === "all" ? "All caught up" : "Nothing found"}</h2>
              <p className="muted">{show === "new" && !q && type === "all" ? "Every request has been handled. New ones will appear here." : "Try another word, or show all requests."}</p>
            </section>
          )}
        </>
      )}
    </>
  );
}
