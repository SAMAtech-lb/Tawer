"use client";
/* The content dashboard (/admin). The boxes show the saved content from the database; anything not saved yet
 * comes from the defaults (data/*.json, passed in by the page). Saving sends everything to /api/content. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TABS } from "./schema";
import { api, arRoot, clone, merge, missingArabic, translatable } from "./util";
import { FieldList, SelectionBubble } from "./Fields";
import ListEditor from "./ListEditor";
import Inbox from "./Inbox";
import { Brand, Guide, HistoryDialog, Login, SaveBar } from "./Panels";

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

export default function AdminApp({ defaults }) {
  const [phase, setPhase] = useState("loading");      // loading | login | app
  const [loginMsg, setLoginMsg] = useState("");
  const content = useRef(null);                       // the content being edited (mutated by the field editors)
  const [rev, setRev] = useState(0);                  // bump to re-create the editors after loading other content
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(null);
  const [tab, setTab] = useState("requests");
  const [badgeTick, setBadgeTick] = useState(0);
  const [inbox, setInbox] = useState(null);
  const [inboxError, setInboxError] = useState("");
  const [guide, setGuide] = useState(false);
  const [history, setHistory] = useState({ open: false, versions: null, error: "" });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const badgeTimer = useRef(null);
  const tabsRef = useRef(null);

  const say = useCallback((text, bad = false) => {
    setToast({ text, bad });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), bad ? 6000 : 3000);
  }, []);

  const showLogin = useCallback((msg = "") => { setLoginMsg(msg); setPhase("login"); }, []);

  const loadContent = useCallback(async () => {
    const data = await api("/api/content");
    content.current = merge(clone(defaults), data.content || {});
    setBaseUpdatedAt(data.updatedAt);
    setDirty(false);
    setRev((r) => r + 1);
  }, [defaults]);

  const loadInbox = useCallback(async () => {
    try { setInbox((await api("/api/requests")).requests); setInboxError(""); }
    catch (e) { if (e.status === 401) return showLogin("Your session expired. Log in again."); setInboxError(e.message); setInbox((x) => x || []); }
  }, [showLogin]);

  // Start: are we logged in?
  useEffect(() => {
    const saved = store.get("tawer-admin-tab");
    if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
    setGuide(store.get("tawer-admin-guide") !== "done");
    (async () => {
      try {
        const s = await api("/api/session");
        if (!s.configured.password) return showLogin("The admin password isn't set up on the server yet (ADMIN_PASSWORD). See the README.");
        if (!s.configured.storage) return showLogin("The database isn't set up on the server yet (DATABASE_URL). See the README.");
        if (!s.admin) return showLogin();
        await loadContent();
        setPhase("app");
        loadInbox();
      } catch (e) { showLogin(e.message); }
    })();
  }, [loadContent, loadInbox, showLogin]);

  const onLogin = async (password) => {
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      if (!content.current) await loadContent();
      setPhase("app");
      loadInbox();
      return null;
    } catch (e) { return e.message; }
  };

  // Any edit: mark unsaved and (a moment later) recount the missing-Arabic badges.
  const onChange = useCallback(() => {
    setDirty(true);
    clearTimeout(badgeTimer.current);
    badgeTimer.current = setTimeout(() => setBadgeTick((n) => n + 1), 200);
  }, []);

  const save = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const r = await api("/api/content", { method: "PUT", body: JSON.stringify({ content: content.current, baseUpdatedAt }) });
      setBaseUpdatedAt(r.updatedAt);
      setDirty(false);
      say("Saved. The website is updated.");
    } catch (e) {
      if (e.status === 401) showLogin("Your session expired. Log in again. Your changes are kept, press Save after logging in.");
      else say(e.message, true);
    } finally { setSaving(false); }
  }, [dirty, saving, baseUpdatedAt, say, showLogin]);

  const replaceContent = (next, label) => {
    if (dirty && !confirm("You have unsaved changes. Replace them with this version?")) return;
    content.current = merge(clone(defaults), next || {});
    setDirty(true);
    setRev((r) => r + 1);
    setHistory((h) => ({ ...h, open: false }));
    say(`${label} loaded. Press "Save & publish" to put it live.`);
  };

  const undo = async () => {
    if (!confirm("Undo all the changes you made since the last save?")) return;
    try { await loadContent(); say("Your changes were undone."); } catch (e) { say(e.message, true); }
  };

  const openHistory = async () => {
    setHistory({ open: true, versions: null, error: "" });
    try { setHistory({ open: true, versions: (await api("/api/history")).versions, error: "" }); }
    catch (e) {
      if (e.status === 401) { setHistory({ open: false, versions: null, error: "" }); return showLogin("Your session expired. Log in again."); }
      setHistory({ open: true, versions: [], error: e.message });
    }
  };

  const toggleDone = async (r) => {
    try {
      await api("/api/requests", { method: "PATCH", body: JSON.stringify({ id: r.id, done: !r.done }) });
      setInbox((list) => list.map((x) => (x.id === r.id ? { ...x, done: !r.done } : x)));
      say(!r.done ? "Marked as handled." : "Moved back to New.");
    } catch (e) { if (e.status === 401) return showLogin("Your session expired. Log in again."); say(e.message, true); }
  };

  const logout = async () => {
    if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
    try { await api("/api/logout", { method: "POST", body: "{}" }); } catch { /* ignore */ }
    content.current = null; setDirty(false);
    showLogin();
  };

  // Ctrl+S saves; leaving the page with unsaved changes asks first.
  useEffect(() => {
    const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && phase === "app") { e.preventDefault(); save(); } };
    const leave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    addEventListener("keydown", key); addEventListener("beforeunload", leave);
    return () => { removeEventListener("keydown", key); removeEventListener("beforeunload", leave); };
  }, [phase, save, dirty]);

  // On phones the tabs are one scrolling row: keep the current section visible in it.
  useEffect(() => {
    const tabs = tabsRef.current, active = tabs?.querySelector(".active");
    if (active && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2;
  }, [tab, phase]);

  const badges = useMemo(() => {
    if (!content.current) return {};
    const out = {};
    for (const t of TABS) out[t.id] = t.inbox ? (inbox || []).filter((r) => !r.done).length : missingArabic(t, content.current);
    return out;
  }, [badgeTick, rev, inbox]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "loading") return <p className="loading">Loading…</p>;
  if (phase === "login") return <Login message={loginMsg} onLogin={onLogin} />;

  const current = TABS.find((t) => t.id === tab) || TABS[0];
  const C = content.current;
  const pick = (id) => { setTab(id); store.set("tawer-admin-tab", id); scrollTo({ top: 0 }); };
  const closeGuide = () => { setGuide(false); store.set("tawer-admin-guide", "done"); };

  return (
    <>
      <div className="app">
        <header className="top">
          <Brand />
          <div className={"top__status" + (dirty ? " dirty" : baseUpdatedAt ? " ok" : "")} aria-live="polite">
            {dirty ? <><i className="ri-edit-circle-line" /> Unsaved changes</>
              : baseUpdatedAt ? <><i className="ri-checkbox-circle-line" /> Published {new Date(baseUpdatedAt).toLocaleString()}</>
              : <><i className="ri-information-line" /> Showing default content</>}
          </div>
          <div className="top__actions">
            <div className="viewsw" role="group" aria-label="View the website">
              <a className="btn btn--ghost" href="/?lang=en" target="_blank" rel="noopener" title="View the English website"><i className="ri-external-link-line" /><span>View site</span></a>
              <a className="btn btn--ghost viewsw__ar" href="/?lang=ar" target="_blank" rel="noopener" lang="ar" title="عرض الموقع بالعربية" aria-label="عرض الموقع بالعربية">عربي</a>
            </div>
            <button className="btn btn--ghost" title="How to use this dashboard" onClick={() => { setGuide(true); scrollTo({ top: 0, behavior: "smooth" }); }}><i className="ri-question-line" /><span>Help</span></button>
            <button className="btn btn--ghost" onClick={openHistory}><i className="ri-history-line" /><span>History</span></button>
            <button className="btn btn--primary" disabled={!dirty || saving} onClick={save}><i className="ri-save-3-line" /><span>{saving ? "Saving…" : "Save & publish"}</span></button>
            <button className="btn btn--icon" aria-label="Log out" title="Log out" onClick={logout}><i className="ri-logout-box-r-line" /></button>
          </div>
        </header>

        <div className="layout">
          <nav className="tabs" ref={tabsRef} aria-label="Sections">
            {TABS.map((t) => {
              const n = badges[t.id] || 0;
              return (
                <button key={t.id} type="button" className={t.id === current.id ? "active" : undefined} aria-current={t.id === current.id ? "page" : undefined} onClick={() => pick(t.id)}>
                  <i className={t.icon} /><span className="tab__label">{t.label}</span>
                  {n ? <span className="tab__badge" title={t.inbox ? `${n} new request${n > 1 ? "s" : ""}` : `${n} text${n > 1 ? "s" : ""} without Arabic translation`}>{n}</span> : null}
                </button>
              );
            })}
          </nav>

          <main className="panel" key={`${current.id}-${rev}`}>
            {guide ? <Guide onClose={closeGuide} /> : null}
            {current.inbox ? (
              <Inbox tab={current} inbox={inbox} error={inboxError} onRefresh={() => { setInbox(null); loadInbox(); }} onToggleDone={toggleDone} onToast={say} />
            ) : (
              <>
                <div className="panel__head">
                  <div><h1>{current.label}</h1>{current.desc ? <p className="muted">{current.desc}</p> : null}</div>
                  {current.anchor ? (
                    <div className="panel__links">
                      <a className="btn btn--ghost btn--sm" href={`/?lang=en${current.anchor}`} target="_blank" rel="noopener"><i className="ri-eye-line" /> See it on the website</a>
                      <a className="btn btn--ghost btn--sm" href={`/?lang=ar${current.anchor}`} target="_blank" rel="noopener" lang="ar">بالعربية</a>
                    </div>
                  ) : null}
                </div>
                {current.cards.map((card) => {
                  const defs = card.list ? card.list.fields : card.fields;
                  return (
                    <section className="card" key={card.title}>
                      <h2>{card.title}{card.sub ? <small>· {card.sub}</small> : null}</h2>
                      {card.formatTip ? <p className="tip"><i className="ri-lightbulb-line" /> Tip: select words to make them <b>bold</b> or <mark>coloured</mark>.</p> : null}
                      {card.hint ? <div className="hint"><i className="ri-lightbulb-line" /><div>{card.hint}</div></div> : null}
                      {defs.some(translatable) ? <div className="langcols" aria-hidden="true"><span>English</span><span lang="ar">العربية</span></div> : null}
                      {card.list
                        ? <ListEditor def={card.list} content={C} onChange={onChange} />
                        : <FieldList defs={card.fields} enObj={C} arObj={arRoot(C)} onChange={onChange} />}
                    </section>
                  );
                })}
              </>
            )}
          </main>
        </div>
      </div>

      {dirty ? <SaveBar saving={saving} onSave={save} onUndo={undo} /> : null}
      <HistoryDialog open={history.open} versions={history.versions} error={history.error}
        onClose={() => setHistory((h) => ({ ...h, open: false }))}
        onLoad={(c) => replaceContent(c, "Older version")}
        onLoadDefaults={() => replaceContent(clone(defaults), "Original default content")} />
      <SelectionBubble />
      <div className={"toast" + (toast ? " on" : "") + (toast?.bad ? " bad" : "")} role="status">
        {toast ? <><i className={toast.bad ? "ri-error-warning-line" : "ri-checkbox-circle-line"} /> {toast.text}</> : null}
      </div>
    </>
  );
}
