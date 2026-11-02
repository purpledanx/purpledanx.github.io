import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let scroller;

function syncScrolling() {
  scroller?.destroy();
  scroller = reduced.matches ? null : new Lenis({
    autoRaf: true,
    lerp: .085,
    syncTouch: false,
    stopInertiaOnNavigate: true,
    prevent: node => node instanceof Element && node.matches('.gallery-track, video, input, textarea, select, [contenteditable]')
  });
}

document.addEventListener('click', event => {
  if (!scroller || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
  let id;
  try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  if (location.hash !== url.hash) history.pushState(null, '', url.hash);
  scroller.scrollTo(target, {
    onComplete: () => {
      const temporary = !target.hasAttribute('tabindex');
      if (temporary) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (temporary) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  });
});

reduced.addEventListener('change', syncScrolling);
window.addEventListener('pagehide', () => { scroller?.destroy(); scroller = null; });
window.addEventListener('pageshow', () => { if (!scroller) syncScrolling(); });
syncScrolling();
