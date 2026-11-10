"use client";
/* Smaller dashboard pieces: login screen, welcome guide, version history dialog, unsaved-changes bar. */
import { useEffect, useRef, useState } from "react";

export function Brand() {
  return <div className="brand"><span className="brand__mark">T</span><div><b>Tawer Academy</b><small>Content dashboard</small></div></div>;
}

export function Login({ message, onLogin }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(message || "");
  useEffect(() => setMsg(message || ""), [message]);
  return (
    <section className="login">
      <form className="login__card" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        const err = await onLogin(e.currentTarget.password.value);
        if (err) { setMsg(err); setBusy(false); }
      }}>
        <Brand />
        <label>Admin password
          <div className="pw">
            <input type={show ? "text" : "password"} name="password" autoComplete="current-password" required autoFocus />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}><i className={show ? "ri-eye-off-line" : "ri-eye-line"} /></button>
          </div>
        </label>
        <button className="btn btn--primary btn--full" type="submit" disabled={busy}><i className="ri-login-box-line" /> Log in</button>
        <p className="msg" role="alert">{msg}</p>
        <a className="back" href="/"><i className="ri-arrow-left-line" /> Back to website</a>
      </form>
    </section>
  );
}

export function Guide({ onClose }) {
  return (
    <section className="guide" aria-label="How to use this dashboard">
      <div className="guide__head">
        <h2><i className="ri-hand-heart-line" /> Welcome! Here&apos;s how it works</h2>
        <button type="button" className="btn btn--icon btn--sm" aria-label="Close the guide" title="Close" onClick={onClose}><i className="ri-close-line" /></button>
      </div>
      <ol className="guide__steps">
        <li><b>Pick a section</b><span>on the left. “Requests” shows what visitors sent you; the others are parts of your website (“See it on the website” shows where).</span></li>
        <li><b>Change the text</b><span>in English (left) and Arabic (right). An orange number on a section means some Arabic is still missing.</span></li>
        <li><b>Press “Save &amp; publish”</b><span>and the website updates right away. Nothing changes until you save, and History lets you go back to an earlier version.</span></li>
      </ol>
      <div className="guide__foot"><button type="button" className="btn btn--primary btn--sm" onClick={onClose}>Got it</button></div>
    </section>
  );
}

export function HistoryDialog({ open, versions, error, onClose, onLoad, onLoadDefaults }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog className="dialog" ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="dialog__head"><h2>Version history</h2><button className="btn btn--icon" aria-label="Close" onClick={onClose}><i className="ri-close-line" /></button></div>
      <p className="muted">Every time you save, the previous version is kept (last 10). Loading a version puts it in the editor. Nothing changes on the website until you press <b>Save &amp; publish</b>.</p>
      <div className="history">
        {error ? <p className="msg">{error}</p>
          : versions === null ? <p className="muted">Loading…</p>
          : !versions.length ? <p className="muted">No older versions yet. They appear here after you save a few times.</p>
          : versions.map((v, i) => (
            <div className="history__row" key={i}>
              <div><b>{new Date(v.updatedAt).toLocaleString()}</b><small>Saved version</small></div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onLoad(v.content)}><i className="ri-arrow-go-back-line" /> Load</button>
            </div>
          ))}
      </div>
      <div className="dialog__foot">
        <button className="btn btn--danger-ghost" onClick={onLoadDefaults}><i className="ri-restart-line" /> Load original default content</button>
      </div>
    </dialog>
  );
}

export function SaveBar({ saving, onSave, onUndo }) {
  return (
    <div className="savebar" role="region" aria-label="Unsaved changes">
      <span className="savebar__text"><i className="ri-error-warning-line" /> You have changes that aren&apos;t on the website yet.</span>
      <div className="savebar__actions">
        <button className="btn btn--ghost" type="button" onClick={onUndo}><i className="ri-arrow-go-back-line" /><span>Undo my changes</span></button>
        <button className="btn btn--primary" type="button" onClick={onSave} disabled={saving}><i className="ri-save-3-line" /><span>{saving ? "Saving…" : "Save & publish"}</span></button>
      </div>
    </div>
  );
}
