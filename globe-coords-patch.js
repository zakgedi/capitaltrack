/* City coordinates for audited allocator additions, September 29, 2026.
   Map geocoding: https://maps.google.com/ (city centers only; not office addresses). */
(function () {
  if (typeof COORDS === 'undefined') return;
  Object.assign(COORDS, {
    Victoria: [-123.3656444, 48.4284207],
    Oslo: [10.7312704, 59.9121746],
    Jeonju: [127.1293249, 35.8397174],
    Edmonton: [-113.4937355, 53.5461663]
  });
  if (typeof initGlobe === 'function') initGlobe();
})();
