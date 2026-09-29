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
    .gzoom{top:calc(78px + env(safe-area-inset-top,0px))}
    #stop{top:calc(78px + env(safe-area-inset-top,0px));right:calc(16px + env(safe-area-inset-right,0px));display:block}
    #stop .search{margin-bottom:0;background:rgba(255,255,255,.94);padding:6px 8px 8px;border-bottom-color:#141414}
    @media(min-width:761px){#stop{right:calc(436px + env(safe-area-inset-right,0px))}}
    @media(max-width:600px){.app-header{min-height:52px;padding:0 16px;gap:8px}.app-brand{font-size:12px}.app-divider{height:18px}.app-header nav{margin-left:auto}.app-header nav a{padding:8px 9px}#stop{top:calc(62px + env(safe-area-inset-top,0px))}.gzoom{top:calc(62px + env(safe-area-inset-top,0px))}}
    .app-header a:focus-visible{outline:2px solid #141414;outline-offset:2px}`;
  document.head.appendChild(style);
  // Color only locations containing LPs in the live pipeline; preserve all other dots.
  const stages = {Wishlist:'#ab708a', Warm:'#df721f', Cold:'#5884ae', Contacted:'#7457a8', 'In Process':'#bd3c56', Committed:'#257c55'};
  const legend = document.createElement('aside');
  legend.className = 'pipeline-pin-key';
  legend.setAttribute('aria-label','Pipeline pin colors');
  legend.innerHTML = Object.entries(stages).map(([stage,color]) => '<span><i style="background:'+color+'" aria-hidden="true"></i>'+stage+'</span>').join('');
  globe?.appendChild(legend);
  const legendStyle = document.createElement('style');
  legendStyle.textContent = '.pipeline-pin-key{position:absolute;z-index:58;left:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;gap:6px 13px;max-width:calc(100% - 480px);padding:8px 10px;background:rgba(255,255,255,.92);border:1px solid #dedede;font:10px/1.3 Arial,Helvetica,sans-serif;color:#4b4b4b}.pipeline-pin-key span{white-space:nowrap}.pipeline-pin-key i{display:inline-block;width:7px;height:7px;margin-right:5px}@media(max-width:760px){.pipeline-pin-key{left:12px;right:12px;bottom:auto;top:calc(112px + env(safe-area-inset-top,0px));max-width:none;gap:5px 9px;padding:6px 8px;font-size:9px}}';
  document.head.appendChild(legendStyle);
  let pipeline = Object.create(null);
  const svg = document.getElementById('globesvg');
  const colorDots = () => {
    if (!svg) return;
    svg.querySelectorAll('circle').forEach(dot => {
      const matches = [...new Set((dot.__data__?.firmIdx || []).map(id => pipeline[id]).filter(Boolean))];
      if (matches.length) dot.style.fill = stages[matches[0]];
      else if (dot.style.fill) dot.style.fill = '';
      dot.style.stroke = matches.length ? '#fff' : '';
      dot.style.strokeWidth = matches.length ? '1.6px' : '';
      dot.setAttribute('aria-label', dot.__data__?.n + (matches.length ? ' · Pipeline: ' + matches.join(', ') : ''));
    });
  };
  if (svg) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; colorDots(); });
    }).observe(svg, {childList:true, subtree:true});
  }
  async function loadPins() {
    try {
      const key = 'sb_publishable_32d3KFrWN_SVr5sdEv7ekQ_1Ycwv5Qy';
      const res = await fetch('https://pkiliwsmcxseoczfsfar.supabase.co/rest/v1/lp_pipeline?select=firm_id,stage', {headers:{apikey:key,Authorization:'Bearer '+key}});
      if (!res.ok) throw Error('Pipeline unavailable');
      const rows = await res.json();
      pipeline = Object.create(null);
      rows.forEach(row => { if (stages[row.stage]) pipeline[row.firm_id] = row.stage; });
      colorDots();
    } catch (err) { console.warn('Pipeline pins unavailable',err); }
  }
  loadPins();
  window.addEventListener('pageshow', event => { if (event.persisted) loadPins(); });
  const transition = document.createElement('script');
  transition.src = 'page-transition.js';
  document.body.appendChild(transition);
})();
