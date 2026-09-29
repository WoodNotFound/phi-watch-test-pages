(function (WF) {
  'use strict';
  var esc = WF.esc;

  var LEVELS = [100.0, 100.3, 99.8, 101.5, 103.6, 106.1, 104.4, 101.0, 97.6, 96.2, 98.5, 100.0];
  var AMP = 0.4;
  var TICK_MS = 3000;
  var PREV_CLOSE = 100.0;
  var OPEN = 100.05;

  function round2(x) {
    return Math.round(x * 100) / 100;
  }

  /**
   * The quote at time t (epoch ms):
   *   tick  = floor(t / 3000)
   *   level = LEVELS[phase(t)]
   *   price = round2(level + 0.40 * (2u - 1)),  u = rng("live-ticker", seed, "tick", tick) in [0, 1)
   * so every phase's quotes stay within [level - 0.40, level + 0.40].
   */
  function priceAt(ctx, t) {
    var ph = ctx.phaseAtTime(t).phase;
    var u = WF.rng('live-ticker', ctx.params.seed, 'tick', Math.floor(t / TICK_MS))();
    return round2(LEVELS[ph] + AMP * (2 * u - 1));
  }

  function sign(x) {
    return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(2);
  }

  function snapshot(ctx, t) {
    var tick = Math.floor(t / TICK_MS);
    var tickStart = tick * TICK_MS;
    var price = priceAt(ctx, tickStart);
    var hist = [];
    for (var i = 59; i >= 0; i--) hist.push(priceAt(ctx, tickStart - i * TICK_MS));
    var lo = Infinity;
    var hi = -Infinity;
    for (var j = 0; j < 200; j++) {
      var v = priceAt(ctx, tickStart - j * TICK_MS);
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    var t0Tick = Math.floor(ctx.t0 / TICK_MS);
    var vol = 1200000 + Math.max(0, tick - t0Tick) * 173 + Math.floor(WF.rng('live-ticker', 'vol', tick)() * 150);
    return { t: tickStart, price: price, hist: hist, lo: lo, hi: hi, vol: vol };
  }

  function spark(hist) {
    var min = Math.min.apply(null, hist);
    var max = Math.max.apply(null, hist);
    var span = Math.max(0.01, max - min);
    var pts = hist
      .map(function (v, i) {
        return (i * (300 / (hist.length - 1))).toFixed(1) + ',' + (56 - ((v - min) / span) * 52).toFixed(1);
      })
      .join(' ');
    var up = hist[hist.length - 1] >= PREV_CLOSE;
    return '<svg viewBox="0 0 300 60" preserveAspectRatio="none" style="width:100%;height:120px" aria-hidden="true"><polyline fill="none" stroke="' + (up ? '#1d7a3e' : '#b3261e') + '" stroke-width="2" points="' + pts + '"/></svg>';
  }

  function fill(ctx, s) {
    var ch = round2(s.price - PREV_CLOSE);
    var pct = round2((ch / PREV_CLOSE) * 100);
    var cls = ch > 0 ? 'up' : ch < 0 ? 'down' : '';
    var set = function (id, html) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    set('quote-price', s.price.toFixed(2));
    set('quote-change', '<span class="' + cls + '">' + sign(ch) + ' (' + sign(pct) + '%)</span>');
    set('quote-time', 'As of ' + esc(WF.fmt.time(s.t).replace(' UTC', ':' + String(new Date(s.t).getUTCSeconds()).padStart(2, '0') + ' UTC')));
    set('quote-range', s.lo.toFixed(2) + ' – ' + s.hi.toFixed(2));
    set('quote-volume', WF.fmt.num(s.vol));
    set('quote-spark', spark(s.hist));
  }

  WF.define({
    id: 'live-ticker',
    title: 'Live ticker (updates every 3 seconds)',
    path: 's/live-ticker/',
    docTitle: 'QWKR — Quenwick Robotics Inc. stock quote | Fernmarket',
    watched: [
      { key: 'level', label: 'Center of the quote band for this phase (USD)' },
      { key: 'min', label: 'Lowest possible quote in this phase' },
      { key: 'max', label: 'Highest possible quote in this phase' },
    ],
    timeline: LEVELS.map(function (l) {
      return { level: l, min: round2(l - AMP), max: round2(l + AMP) };
    }),
    afterLast:
      'Live page: the quote re-renders every 3 s. price(t) = round2(LEVELS[phase(t)] + 0.40 * (2u - 1)) with u = rng("live-ticker", seed, "tick", floor(t / 3000)); previous close is 100.00. With ?now= pinned, the clock starts at that value and advances in real time.',
    priceAt: priceAt,
    watchedNow: function (ctx, st) {
      return { price: priceAt(ctx, ctx.clock()), level: st.level, min: st.min, max: st.max };
    },
    render: function (ctx) {
      return (
        '<style>.fm{--brand:#12355b;background:#f7f8fa}.fm header{background:#12355b;color:#fff}.fm header .logo{color:#fff}.fm header .utility a{color:#dbe4ee}' +
        '.fm .quote{background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px 24px;margin-top:22px}.fm .qhead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
        '.fm .big{font-size:2.6rem;font-weight:700;letter-spacing:-.02em}.fm .up{color:#1d7a3e}.fm .down{color:#b3261e}.fm .live{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:#1d7a3e}' +
        '.fm .live::before{content:"";width:8px;height:8px;border-radius:50%;background:#1d7a3e;animation:pulse 1.5s infinite}@keyframes pulse{50%{opacity:.3}}' +
        '.fm .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:18px}.fm .stats div{background:#f7f8fa;border-radius:8px;padding:10px 12px}' +
        '.fm .stats dt{font-size:.78rem;color:var(--ink-3)}.fm .stats dd{margin:0;font-weight:600}</style>' +
        '<div class="fm"><header><div class="wrap header-row"><a class="logo" href="#"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#fff"/><path d="M7 24l7-8 5 5 8-11" stroke="#12355b" stroke-width="3" fill="none"/></svg><span>Fernmarket</span></a>' +
        '<nav class="utility"><a href="#">Markets</a><a href="#">Watchlist</a><a href="#">Screener</a><a href="#">News</a></nav></div></header>' +
        '<main class="wrap"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#">Markets</a></li><li><a href="#">Industrials</a></li><li aria-current="page">QWKR</li></ol></nav>' +
        '<section class="quote"><div class="qhead"><div><h1 style="margin:0">Quenwick Robotics Inc.</h1><div class="muted">FMX: QWKR · USD · <span class="live">Live</span></div></div>' +
        '<div style="text-align:right"><div class="big" id="quote-price">—</div><div id="quote-change"></div><div class="muted small" id="quote-time"></div></div></div>' +
        '<div id="quote-spark"></div>' +
        '<dl class="stats"><div><dt>Previous close</dt><dd>' + PREV_CLOSE.toFixed(2) + '</dd></div><div><dt>Open</dt><dd>' + OPEN.toFixed(2) + '</dd></div>' +
        '<div><dt>Range (last 10 min)</dt><dd id="quote-range"></dd></div><div><dt>Volume</dt><dd id="quote-volume"></dd></div>' +
        '<div><dt>Market cap</dt><dd>4.82B</dd></div><div><dt>P/E (TTM)</dt><dd>31.4</dd></div></dl>' +
        '<p class="muted small" style="margin-top:12px">Quotes update every 3 seconds. Quenwick Robotics and the FMX exchange are fictional; this is not market data.</p></section>' +
        '<section class="details"><div><h2>About Quenwick Robotics</h2><p>Quenwick designs autonomous picking robots for grocery and parcel warehouses. The company employs about 2,300 people across three countries.</p></div>' +
        '<div><h2>Latest news</h2><ul class="highlights"><li>Quenwick opens a new service hub in Rotterdam</li><li>Analysts expect record robot shipments this quarter</li><li>Quenwick names a new chief operating officer</li></ul></div></section>' +
        '</main></div>'
      );
    },
    after: function (app, ctx, st) {
      var last = null;
      function tick() {
        var t = ctx.clock();
        var tk = Math.floor(t / TICK_MS);
        if (tk === last) return;
        last = tk;
        fill(ctx, snapshot(ctx, t));
        var ph = ctx.phaseAtTime(t).phase;
        var e = ctx.def.timeline[ph];
        WF.updateDebugWatched(ctx.def, ctx, { level: e.level, min: e.min, max: e.max });
      }
      tick();
      setInterval(tick, 250);
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
