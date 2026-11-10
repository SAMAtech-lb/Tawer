"use client";
/* Editor for a list (courses, FAQ, stories…): open an item to edit it, move it up/down, delete it, add a new one.
 * The Arabic list (content.ar) is kept in the same order, so translations stay with their item. */
import { useState } from "react";
import { FieldList } from "./Fields";
import { arItem, arList, getP, plain, setP, translatable } from "./util";

// Stable ids per item object, so React keeps each item's editors attached to it when items move.
const ids = new WeakMap();
let nextId = 1;
const idOf = (o) => { if (!ids.has(o)) ids.set(o, nextId++); return ids.get(o); };

function Item({ def, item, index, count, content, onChange, onMove, onDelete, open, onToggle }) {
  const [, setTick] = useState(0);
  const title = plain(def.title(item, index)) || "(untitled)";
  const translated = def.fields.some(translatable);
  const tool = (icon, label, fn, cls = "") => (
    <button type="button" className={"btn btn--icon btn--sm " + cls} aria-label={label} title={label}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); fn(); }}><i className={icon} /></button>
  );
  return (
    <details className="item" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <span className="item__n">{index + 1}</span>
        <span className="item__title">{title}</span>
        <span className="item__tools">
          {index > 0 ? tool("ri-arrow-up-line", "Move up", () => onMove(index, index - 1)) : null}
          {index < count - 1 ? tool("ri-arrow-down-line", "Move down", () => onMove(index, index + 1)) : null}
          {tool("ri-delete-bin-6-line", "Delete", () => { if (confirm(`Delete "${title}"?`)) onDelete(index); }, "del")}
        </span>
        <i className="ri-arrow-down-s-line item__chev" />
      </summary>
      {open ? (
        <div className="item__body">
          <FieldList defs={def.fields} enObj={item} arObj={translated ? arItem(content, def.p, index) : {}}
            onChange={() => { onChange(); setTick((n) => n + 1); }} />
        </div>
      ) : null}
    </details>
  );
}

export default function ListEditor({ def, content, onChange }) {
  const [, setTick] = useState(0);
  const [openIds, setOpenIds] = useState(() => new Set());
  const rerender = () => setTick((n) => n + 1);
  if (!Array.isArray(getP(content, def.p))) setP(content, def.p, []);
  const items = getP(content, def.p);

  const move = (from, to) => {
    [items[from], items[to]] = [items[to], items[from]];
    const tr = arList(content, def.p);
    while (tr.length <= Math.max(from, to)) tr.push({});
    [tr[from], tr[to]] = [tr[to], tr[from]];
    onChange(); rerender();
  };
  const remove = (i) => { items.splice(i, 1); arList(content, def.p).splice(i, 1); onChange(); rerender(); };
  const add = () => { const item = def.make(); items.push(item); setOpenIds((s) => new Set(s).add(idOf(item))); onChange(); rerender(); };

  return (
    <div className="list">
      {items.map((item, i) => {
        const id = idOf(item);
        return (
          <Item key={id} def={def} item={item} index={i} count={items.length} content={content} onChange={onChange}
            onMove={move} onDelete={remove} open={openIds.has(id)}
            onToggle={(o) => setOpenIds((s) => { const n = new Set(s); o ? n.add(id) : n.delete(id); return n; })} />
        );
      })}
      <button type="button" className="btn btn--add" onClick={add}><i className="ri-add-line" /> Add {def.noun}</button>
    </div>
  );
}
