import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { Browser, sleep } from '../../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { frame } from '../../.agents/skills/design-taste-frontend/scripts/lib/probe.mjs';

const root = resolve('.');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  try {
    const file = resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!file.startsWith(root + sep)) throw new Error('Outside workspace');
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await Browser.launch();
try {
 const page = await browser.newPage({width:1440,height:900,reducedMotion:true});
 await page.goto(url);
 await page.eval(() => scrollTo({top:1800,behavior:'instant'}));
 console.log(JSON.stringify(await page.eval(() => {
  const el = document.querySelector('.contact-top h2');
  const range = document.createRange(); range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  const s = getComputedStyle(el);
  return {box:el.getBoundingClientRect().toJSON(), range:r.toJSON(), font:s.font, hits:[-.2,.2].map(d=>{ const x=r.left+r.width*.37, y=r.top+r.height*.55+parseFloat(s.lineHeight)*d; const hit=document.elementFromPoint(x,y);return {x,y,hit:hit?.outerHTML.slice(0,300),box:hit?.getBoundingClientRect().toJSON()};})};
 }),null,2));
 await page.close();
} finally { await browser.close(); server.close(); }
