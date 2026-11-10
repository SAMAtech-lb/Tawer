/* Shows text with the content formatting as real elements (never as HTML, so typed text can't inject markup):
 *   [[words]] -> <span> (highlighted; className = hl)   **words** -> <b>   new line -> <br>
 * Works in server and client components. */
import { Fragment } from "react";

function toNodes(text, hl, keyBase = "r") {
  const out = [];
  const re = /\[\[(.+?)\]\]|\*\*(.+?)\*\*|\n/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) out.push(<span key={key} className={hl || undefined}>{toNodes(m[1], hl, key)}</span>);
    else if (m[2] !== undefined) out.push(<b key={key}>{toNodes(m[2], hl, key)}</b>);
    else out.push(<br key={key} />);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Rich({ text, hl }) {
  if (text === undefined || text === null) return null;
  return <Fragment>{toNodes(String(text), hl)}</Fragment>;
}
