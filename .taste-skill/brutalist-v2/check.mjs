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
const results = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ width, height: 900, mobile: width < 600 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.motionTargets = new Set();
      window.motionCounts = new Map();
      const animate = Element.prototype.animate;
      Element.prototype.animate = function(...args) { window.motionTargets.add(this); window.motionCounts.set(this, (window.motionCounts.get(this) || 0) + 1); return animate.apply(this, args); };
      addEventListener('animationstart', e => window.motionTargets.add(e.target));
      window.overflow = false;
      setInterval(() => { if (document.documentElement.scrollWidth > innerWidth + 1) window.overflow = true; }, 25);
    ` });
    await page.goto(url);
    await page.wheel(5000, { step: 200, pauseMs: 80 });
    await sleep(900);
    const state = await page.eval(() => ({
      entrances: [...document.querySelectorAll('[data-enter]')].filter(e => window.motionTargets.has(e)).length,
      expected: document.querySelectorAll('[data-enter]').length,
      moving: window.motionTargets.size,
      overflow: window.overflow,
      badAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.querySelector(a.getAttribute('href'))).length,
    }));
    assert.equal(state.entrances, state.expected);
    assert.equal(state.overflow, false, `${width}: overflow`);
    assert.equal(state.badAnchors, 0);
    const replay = await page.eval(() => {
      window.replayBaseline = [...document.querySelectorAll('[data-enter]')].map(e => [e, window.motionCounts.get(e) || 0]);
      return window.replayBaseline.length;
    });
    for (let cycle = 0; cycle < 2; cycle++) {
      await page.wheel(-5000, { step: 200, pauseMs: 40 });
      await sleep(650);
      await page.wheel(5000, { step: 200, pauseMs: 40 });
      await sleep(650);
    }
    const missingReplays = await page.eval(() => window.replayBaseline.filter(([e, count]) => (window.motionCounts.get(e) || 0) < count + 2).map(([e]) => e.textContent.trim().slice(0, 35) || e.className));
    assert.deepEqual(missingReplays, [], `${width}: replay missing`);
    state.replayedTwice = replay;
    await page.eval(() => scrollTo({top:0,behavior:'instant'}));
    await sleep(650);
    const heroBefore = await page.eval(() => getComputedStyle(document.querySelector('.hero-render img')).transform);
    await page.send('Input.dispatchMouseEvent', {type:'mouseMoved',x:width*.8,y:180});
    await sleep(80);
    assert.notEqual(await page.eval(() => getComputedStyle(document.querySelector('.hero-render img')).transform), heroBefore);
    state.heroPointer = true;
    await page.eval(() => document.querySelector('#socials').scrollIntoView({behavior:'instant'}));
    await sleep(800);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.eval(() => document.querySelector('#copy-discord').focus());
    assert.equal(await page.eval(() => document.activeElement.matches(':focus-visible')), true);
    assert.equal(await page.eval(() => getComputedStyle(document.activeElement).outlineWidth), '3px');
    await browser.send('Browser.grantPermissions', { origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
    await page.send('Page.bringToFront');
    await page.eval(() => document.querySelector('#copy-discord').focus());
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await sleep(800);
    assert.equal(await page.eval(() => document.querySelector('#copy-status').textContent), 'Copied purpledanx.');
    assert.equal(await page.eval(() => navigator.clipboard.readText()), 'purpledanx');
    await page.eval(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
      document.querySelector('#copy-discord').click();
    });
    await sleep(80);
    assert.match(await page.eval(() => document.querySelector('#copy-status').textContent), /Copy unavailable/);
    assert.equal(await page.eval(() => getSelection().toString()), 'purpledanx');
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(100);
    assert.equal(await page.eval(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    assert.equal(await page.eval(() => getComputedStyle(document.querySelector('.portrait img')).transform), 'none');
    assert.equal(await page.eval(() => getComputedStyle(document.querySelector('.hero-render img')).transform), 'none');
    const covers = [];
    for (let y = 0; y < 3000; y += 150) {
      await page.eval(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
      const f = await page.eval(frame);
      if (f.covered.length) covers.push({ y, covered: f.covered });
    }
    results.push({ width, ...state, covers, copySuccess: true, copyDenied: true, reducedMotion: true, errors: page.consoleErrors });
    assert.equal(covers.length, 0, `${width}: text overlap`);
    assert.equal(page.consoleErrors.length, 0);
    await page.close();
  }
  const page = await browser.newPage({ width: 390, height: 844, reducedMotion: true });
  await page.goto(url);
  assert.equal(await page.eval(() => document.getAnimations().length), 0);
  await page.send('Emulation.setScriptExecutionDisabled', { value: true });
  await page.goto(url);
  assert.equal(await page.eval(() => document.querySelector('#copy-discord').hidden), true);
  await page.send('Emulation.setScriptExecutionDisabled', { value: false });
  for (const file of ['war-of-the-worlds.html', 'dynamic-reverb-test.html', 'exodo-wiki.html']) {
    await page.goto(url.replace('index.html', `projects/${file}`));
    assert.equal(await page.eval(() => !!document.querySelector('h1')), true);
  }
  assert.equal(page.consoleErrors.length, 0);
  await page.close();
  writeFileSync('.taste-skill/brutalist-v2/check-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); server.close(); }
