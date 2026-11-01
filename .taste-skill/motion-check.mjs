import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';

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
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.motionTargets = new Set();
      const animate = Element.prototype.animate;
      Element.prototype.animate = function(...args) { window.motionTargets.add(this); return animate.apply(this, args); };
      addEventListener('animationstart', e => window.motionTargets.add(e.target));
      window.overflow = false;
      setInterval(() => { if (document.documentElement.scrollWidth > innerWidth + 1) window.overflow = true; }, 25);
    ` });
    await page.goto(url, { settleMs: 1000 });
    await page.eval(`window.scrollTo({top: 260, behavior: 'instant'})`);
    await sleep(80);
    const covered = await page.eval(() => {
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const img = document.querySelector('.hero-scene img').getBoundingClientRect();
      return img.top <= hero.top && img.bottom >= hero.bottom;
    });
    assert(covered, `${width}: image covers hero during drift`);
    await page.wheel(4000, { step: 200, pauseMs: 80 });
    await sleep(900);
    const state = await page.eval(() => ({
      entrances: [...document.querySelectorAll('[data-enter]')].filter(e => window.motionTargets.has(e)).length,
      expected: document.querySelectorAll('[data-enter]').length,
      moving: window.motionTargets.size,
      overflow: window.overflow,
      hidden: [...document.querySelectorAll('[data-enter]')].some(e => getComputedStyle(e).opacity !== '1'),
      badAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.querySelector(a.getAttribute('href'))).length,
    }));
    assert.equal(state.entrances, state.expected, `${width}: every marked section enters`);
    assert.equal(state.overflow, false, `${width}: no animated overflow`);
    assert.equal(state.hidden, false, `${width}: all sections visible`);
    assert.equal(state.badAnchors, 0);
    assert.equal(page.consoleErrors.length, 0);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.eval(() => document.querySelector('.work-references a').focus());
    await sleep(320);
    const focus = await page.eval(() => ({ visible: document.activeElement.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outlineWidth, transform: getComputedStyle(document.activeElement.firstElementChild).transform }));
    assert.equal(focus.visible, true);
    assert.equal(focus.outline, '3px');
    assert.notEqual(focus.transform, 'none');
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await sleep(100);
    const reduced = await page.eval(() => ({ active: document.getAnimations().filter(a => a.playState === 'running').length, image: getComputedStyle(document.querySelector('.hero-scene img')).transform, drift: document.querySelector('.hero').style.getPropertyValue('--hero-type-drift'), scroll: getComputedStyle(document.documentElement).scrollBehavior }));
    assert.equal(reduced.active, 0);
    assert.equal(reduced.image, 'none');
    assert.equal(reduced.drift, '0px');
    assert.equal(reduced.scroll, 'auto');
    results.push({ width, ...state, focus, reduced, consoleErrors: page.consoleErrors });
    await page.close();
  }
  const reducedPage = await browser.newPage({ width: 390, height: 844, reducedMotion: true });
  await reducedPage.goto(url);
  await reducedPage.wheel(4000);
  assert.equal(await reducedPage.eval(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
  assert.equal(await reducedPage.eval(() => [...document.querySelectorAll('[data-enter]')].every(e => getComputedStyle(e).opacity === '1')), true);
  await reducedPage.close();
  const page = await browser.newPage();
  for (const file of ['war-of-the-worlds.html', 'dynamic-reverb-test.html', 'exodo-wiki.html']) {
    await page.goto(url.replace('index.html', `projects/${file}`));
    assert.equal(await page.eval(() => !!document.querySelector('h1')), true);
  }
  assert.equal(page.consoleErrors.length, 0);
  await page.close();
  writeFileSync('.taste-skill/motion-check-results.json', JSON.stringify({ results, reducedInitialLoad: 'pass', projectPages: 'pass' }, null, 2));
  console.log(JSON.stringify({ results, reducedInitialLoad: 'pass', projectPages: 'pass' }, null, 2));
} finally {
  await browser.close();
  server.close();
}
