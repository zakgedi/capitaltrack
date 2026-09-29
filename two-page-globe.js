/* LP Globe's shared navigation shell. The legacy inline globe remains untouched. */
(() => {
  document.getElementById('pipeline')?.remove();
  document.getElementById('pane-cue')?.remove();
  const stop = document.getElementById('stop');
  const old = stop?.querySelector('.pipeline-link');
  if (!stop || !old) return;
  old.remove();
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = '<a class="app-brand" href="index.html" aria-label="LP Globe home">LP GLOBE</a><span class="app-divider" aria-hidden="true"></span><nav aria-label="App panes"><a href="index.html" aria-current="page">Globe</a><a href="pipeline.html" data-page-link>Pipeline</a></nav>';
  const globe = document.getElementById('globe-pane');
  globe?.prepend(header);
  const style = document.createElement('style');
  style.textContent = `
    html{scroll-behavior:auto}body{overflow:hidden}
    .app-header{position:absolute;z-index:60;top:0;left:0;right:0;min-height:64px;padding:0 28px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #dedede;background:rgba(255,255,255,.97)}
    .app-brand{font:700 13px/1 Arial,Helvetica,sans-serif;letter-spacing:.09em;text-decoration:none;white-space:nowrap}
    .app-divider{height:22px;width:1px;background:#dedede}
    .app-header nav{display:flex;gap:4px}
    .app-header nav a{border:1px solid transparent;padding:9px 12px;font:600 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.07em;text-transform:uppercase;text-decoration:none}
    .app-header nav a:hover,.app-header nav a[aria-current=page]{border-color:#141414}
    #stop{top:calc(78px + env(safe-area-inset-top,0px));right:calc(16px + env(safe-area-inset-right,0px));display:block}
    #stop .search{margin-bottom:0;background:rgba(255,255,255,.94);padding:6px 8px 8px;border-bottom-color:#141414}
    @media(min-width:761px){#stop{right:calc(436px + env(safe-area-inset-right,0px))}}
    @media(max-width:600px){.app-header{min-height:52px;padding:0 16px;gap:8px}.app-brand{font-size:12px}.app-divider{height:18px}.app-header nav{margin-left:auto}.app-header nav a{padding:8px 9px}#stop{top:calc(62px + env(safe-area-inset-top,0px))}}
    .app-header a:focus-visible{outline:2px solid #141414;outline-offset:2px}`;
  document.head.appendChild(style);
  const transition = document.createElement('script');
  transition.src = 'page-transition.js';
  document.body.appendChild(transition);
})();
