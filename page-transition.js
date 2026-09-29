/* A short paper-wipe between Globe and Pipeline, never between in-page controls. */
(() => {
  if (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/lp-globe/')) { for (const src of ['globe-roster-patch.js', 'roster-shard-a.js', 'roster-shard-b.js', 'roster-shard-c.js', 'pipeline-roster-priority.js']) { const roster = document.createElement('script'); roster.src = src; document.body.appendChild(roster); } }
  const key = 'lp-globe-page-transition';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const curtain = document.createElement('div');
  curtain.setAttribute('aria-hidden', 'true');
  curtain.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;border-left:1px solid #141414;pointer-events:none;transform:translateX(101%);transition:transform 320ms cubic-bezier(.65,0,.25,1)';
  document.body.appendChild(curtain);
  let navigating = false;
  const incoming = sessionStorage.getItem(key) === '1';
  if (incoming) sessionStorage.removeItem(key);
  if (incoming && !reduce.matches) {
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateX(0)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.style.transition = 'transform 390ms cubic-bezier(.65,0,.25,1)';
      curtain.style.transform = 'translateX(-101%)';
    }));
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-page-link]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
    if (reduce.matches) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    curtain.style.transition = 'none';
    curtain.style.transform = 'translateX(101%)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.style.transition = 'transform 320ms cubic-bezier(.65,0,.25,1)';
      curtain.style.transform = 'translateX(0)';
    }));
    sessionStorage.setItem(key, '1');
    setTimeout(() => { location.assign(destination.href); }, 340);
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      navigating = false;
      curtain.style.transition = 'none';
      curtain.style.transform = 'translateX(101%)';
      sessionStorage.removeItem(key);
    }
  });
})();
