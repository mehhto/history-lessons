import { readFile } from 'node:fs/promises';
import { parse, serialize } from 'parse5';
const dir = '/opt/data/history-production/2026-11-16/grade8/sources/';
function text(n) { return n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(' '); }
function walk(n, fn) { fn(n); for (const c of n.childNodes || []) walk(c, fn); }
for (const file of ['zpe-poczatek-zelazna-kurtyna.html', 'state-berlin-airlift.html']) {
  const doc = parse(await readFile(dir + file, 'utf8'));
  console.log(file);
  walk(doc, n => {
    if (n.tagName === 'figure' && /Marshall|Churchill|Tempelhof/i.test(text(n))) console.log(serialize(n));
    if (file.startsWith('state') && n.tagName === 'img') console.log(n.attrs);
  });
}
