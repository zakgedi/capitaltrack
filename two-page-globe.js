/* Replace the old scroll pane with a link to the standalone pipeline page. */
(() => {
  const pipeline = document.getElementById('pipeline');
  if (pipeline) pipeline.remove();
  const link = document.querySelector('#stop .pipeline-link');
  if (link) {
    link.href = 'pipeline.html';
    link.textContent = 'Pipeline →';
    link.setAttribute('aria-label', 'Open LP pipeline');
    link.setAttribute('data-page-link', '');
  }
  document.getElementById('pane-cue')?.remove();
  const style = document.createElement('style');
  style.textContent = 'html{scroll-behavior:auto}body{overflow:hidden}#stop{display:flex;flex-direction:row-reverse;align-items:flex-start;gap:8px}#stop .pipeline-link{float:none;flex:none;margin:0}#stop .search{flex:1;min-width:0}';
  document.head.appendChild(style);
  const transition = document.createElement('script');
  transition.src = 'page-transition.js';
  document.body.appendChild(transition);
})();
