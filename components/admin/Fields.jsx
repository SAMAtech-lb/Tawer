"use client";
/* Dashboard field editors. Fields edit the content object in place (it lives in a ref in AdminApp) and call
 * onChange() so the dashboard knows there are unsaved changes. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getP, plain, setP, translatable } from "./util";

/* ---------- Rich text box ----------
 * Bold and coloured words look like they will on the website (no ** or [[ ]] marks on screen),
 * but the box saves the same simple marks: **bold**, [[coloured]], new line. */
const escHtml = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const marksToHtml = (v) => escHtml(v).replace(/\[\[(.+?)\]\]/g, "<mark>$1</mark>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
function htmlToMarks(root) {
  const walk = (node) => [...node.childNodes].map((c) => {
    if (c.nodeType === 3) return c.nodeValue.replace(/ /g, " ");
    if (c.nodeType !== 1) return "";
    if (c.nodeName === "BR") return "\n";
    const inner = walk(c);
    if (/^(DIV|P)$/.test(c.nodeName)) return "\n" + inner;
    if (!inner.trim()) return inner;
    const bold = c.nodeName === "B" || c.nodeName === "STRONG" || +(c.style?.fontWeight) >= 600 || c.style?.fontWeight === "bold";
    if (c.nodeName === "MARK") return "[[" + inner + "]]";
    if (bold) return "**" + inner + "**";
    return inner;
  }).join("");
  return walk(root).replace(/^\n/, "").replace(/\*\*\*\*/g, "").replace(/\]\]\[\[/g, "");
}

export function RichBox({ value, multiline, onText, ...attrs }) {
  const ref = useRef(null);
  // Fill the box once; afterwards the browser owns its content (React must not overwrite what the user types).
  useLayoutEffect(() => { if (ref.current) ref.current.innerHTML = marksToHtml(value); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className={"rte" + (multiline ? " rte--multi" : "")} contentEditable suppressContentEditableWarning role="textbox"
      aria-multiline={multiline ? "true" : "false"} spellCheck {...attrs}
      onInput={() => onText(htmlToMarks(ref.current))}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (multiline) document.execCommand("insertLineBreak"); } }}
      onPaste={(e) => {
        // Pasted text arrives as plain text (no fonts or colours from Word or websites).
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain") || "";
        document.execCommand("insertText", false, multiline ? text : text.replace(/\s*\n\s*/g, " "));
      }} />
  );
}

/* Small bubble above selected words in a rich text box: Bold / Colour. One for the whole dashboard. */
export function SelectionBubble() {
  const [pos, setPos] = useState(null);
  const box = useRef(null);
  const bar = useRef(null);
  useEffect(() => {
    const place = () => {
      const sel = getSelection();
      const node = sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
      box.current = node && (node.nodeType === 1 ? node : node.parentElement)?.closest(".rte");
      if (!box.current || sel.isCollapsed) { setPos(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const w = bar.current?.offsetWidth || 150, h = bar.current?.offsetHeight || 40;
      setPos({ left: Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), top: r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8 });
    };
    document.addEventListener("selectionchange", place);
    addEventListener("scroll", place, { passive: true });
    addEventListener("resize", place);
    return () => { document.removeEventListener("selectionchange", place); removeEventListener("scroll", place); removeEventListener("resize", place); };
  }, []);
  // Tell the box its content changed, so it saves the new marks.
  const changed = () => box.current?.dispatchEvent(new Event("input", { bubbles: true }));
  const toggleColour = () => {
    const sel = getSelection(); if (!sel.rangeCount || !box.current) return;
    const r = sel.getRangeAt(0);
    const markOf = (n) => (n.nodeType === 1 ? n : n.parentElement)?.closest("mark");
    const m = markOf(r.startContainer);
    if (m && box.current.contains(m) && m === markOf(r.endContainer)) { m.replaceWith(...m.childNodes); changed(); return; }
    const mark = document.createElement("mark");
    mark.appendChild(r.extractContents());
    mark.querySelectorAll("mark").forEach((x) => x.replaceWith(...x.childNodes));
    r.insertNode(mark);
    sel.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(mark); sel.addRange(nr);
    changed();
  };
  const keep = (e) => e.preventDefault(); // keep the text selection when clicking the bubble
  return (
    <div ref={bar} className="seltool" role="toolbar" aria-label="Text style" hidden={!pos} style={pos ? { left: pos.left, top: pos.top } : undefined}>
      <button type="button" title="Bold" aria-label="Bold" onMouseDown={keep} onClick={() => { document.execCommand("bold"); changed(); }}><b>B</b></button>
      <button type="button" title="Coloured words" aria-label="Coloured words" onMouseDown={keep} onClick={toggleColour}><span className="seltool__dot" /> Colour</button>
    </div>
  );
}

/* ---------- Single (not translated) field ---------- */
function Answers({ obj, onChange }) {
  if (!Array.isArray(obj.a)) obj.a = ["", "", "", ""];
  while (obj.a.length < 4) obj.a.push("");
  const [correct, setCorrect] = useState(+obj.c || 0);
  const [name] = useState(() => "c" + Math.random().toString(36).slice(2));
  return (
    <div className="field field--wide">
      <span>Answers</span>
      <div className="answers">
        {obj.a.slice(0, 4).map((a, i) => (
          <div key={i} className={"answer" + (correct === i ? " correct" : "")}>
            <b>{"ABCD"[i]}</b>
            <input type="text" aria-label={`Answer ${"ABCD"[i]}`} defaultValue={a} onChange={(e) => { obj.a[i] = e.target.value; onChange(); }} />
            <label><input type="radio" name={name} defaultChecked={correct === i} onChange={() => { obj.c = i; setCorrect(i); onChange(); }} /> Correct</label>
          </div>
        ))}
      </div>
      <small>Pick which answer is correct. Visitors also get an &quot;I don&apos;t know&quot; option automatically.</small>
    </div>
  );
}

export function Field({ def, obj, onChange }) {
  const val = getP(obj, def.k);
  const set = (v) => { setP(obj, def.k, v); onChange(); };
  const wide = def.wide ? " field--wide" : "";
  if (def.type === "answers") return <Answers obj={obj} onChange={onChange} />;
  if (def.type === "checkbox") {
    return <label className={"field check" + wide}><input type="checkbox" defaultChecked={!!val} onChange={(e) => set(e.target.checked)} />{def.label}</label>;
  }
  let control;
  switch (def.type) {
    case "textarea":
      control = <textarea rows={def.rows || 3} defaultValue={val ?? ""} onChange={(e) => set(e.target.value)} />;
      break;
    case "lines":
      control = <textarea rows={def.rows || Math.max(3, (val || []).length + 1)} defaultValue={(Array.isArray(val) ? val : []).join("\n")}
        onChange={(e) => set(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />;
      break;
    case "number":
      control = <input type="number" step="any" placeholder={def.placeholder} defaultValue={val ?? ""}
        onChange={(e) => set(e.target.value === "" ? (def.nullable ? null : 0) : Number(e.target.value))} />;
      break;
    case "select":
      control = (
        <select defaultValue={val ?? def.options[0][0]} onChange={(e) => set(e.target.value)}>
          {def.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      );
      break;
    default:
      control = <input type={def.type === "url" ? "url" : "text"} placeholder={def.placeholder} defaultValue={val ?? ""} onChange={(e) => set(e.target.value)} />;
  }
  return <label className={"field" + wide}><span>{def.label}</span>{control}{def.hint ? <small>{def.hint}</small> : null}</label>;
}

/* ---------- Translated field: English and Arabic side by side ---------- */
function LangBox({ def, obj, enObj, ar, onChange }) {
  const lines = def.type === "lines";
  const val = getP(obj, def.k);
  const enVal = getP(enObj, def.k);
  const set = (v) => { setP(obj, def.k, v); onChange(); };
  // An empty Arabic box shows the English text faintly: that is what the Arabic site will show.
  const hint = ar ? plain(lines ? (enVal || []).join("\n") : enVal ?? "") : def.placeholder || "";
  const attrs = ar ? { dir: "rtl", lang: "ar" } : { dir: "ltr", lang: "en" };
  const label = `${def.label} (${ar ? "Arabic" : "English"})`;
  return (
    <div className={"pair__col" + (ar ? " pair__col--ar" : "")}>
      <span className="pair__tag" lang={attrs.lang}>{ar ? "العربية" : "English"}</span>
      {lines ? (
        <textarea {...attrs} aria-label={label} placeholder={hint} rows={def.rows || Math.max(3, (Array.isArray(enVal) ? enVal.length : 0) + 1)}
          defaultValue={(Array.isArray(val) ? val : []).join("\n")}
          // English lines drop empty ones; Arabic lines keep their position (line 2 translates English line 2).
          onChange={(e) => { const parts = e.target.value.split("\n").map((x) => x.trim()); set(ar ? parts : parts.filter(Boolean)); }} />
      ) : (
        <RichBox {...attrs} aria-label={label} data-placeholder={hint} value={val ?? ""} multiline={def.type === "textarea"} onText={set} />
      )}
    </div>
  );
}

export function PairField({ def, enObj, arObj, onChange }) {
  return (
    <div className="field field--wide pair">
      <span className="field__label">{def.label}</span>
      <div className="pair__grid">
        <LangBox def={def} obj={enObj} enObj={enObj} onChange={onChange} />
        <LangBox def={def} obj={arObj} enObj={enObj} ar onChange={onChange} />
      </div>
      {def.type === "lines" ? <small>One item per line.</small> : def.hint ? <small>{def.hint}</small> : null}
    </div>
  );
}

/* Fields of a card or list item: translated ones as English|Arabic pairs, the rest (numbers, codes, links…) once. */
export function FieldList({ defs, enObj, arObj, onChange }) {
  return (
    <div className="fields">
      {defs.map((def) => (translatable(def)
        ? <PairField key={def.k} def={def} enObj={enObj} arObj={arObj} onChange={onChange} />
        : <Field key={def.k} def={def} obj={enObj} onChange={onChange} />))}
    </div>
  );
}
