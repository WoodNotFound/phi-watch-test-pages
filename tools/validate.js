#!/usr/bin/env node
'use strict';
/**
 * Validates the fixtures.
 *   A. Logic: scenarios.json is fresh; the state function (same code as the pages) yields the
 *      phase's watched values for every phase, before t0, after the last phase, with other steps;
 *      live-ticker quotes stay inside their bands; late-render delays stay within 4–6 s.
 *   B. Browser: loads every phase of every page in headless Chromium (raw CDP over Node's
 *      built-in WebSocket), reads the rendered watched value from the DOM (clicking / waiting
 *      where the scenario requires it) and compares it with scenarios.json. Also checks the
 *      fixture footer, that the debug panel is absent without ?debug=1 and correct with it,
 *      the real-clock path (no ?now=), JS errors, and that no request leaves the site origin.
 *
 * Usage: node tools/validate.js [--base https://…/] [--only id1,id2] [--concurrency 6] [--no-browser]
 */
var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var childProcess = require('child_process');
var build = require('./build');
var R = require('./rules');

var args = process.argv.slice(2);
function arg(name, dflt) {
  var i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
}
var BASE = arg('--base', null);
var ONLY = arg('--only', null);
var CONCURRENCY = Number(arg('--concurrency', 6));
var NO_BROWSER = args.indexOf('--no-browser') >= 0;
var FOOTER = 'Test fixture for automated page-watching tests. Not a real store.';
var T0 = Date.UTC(2026, 9, 1, 0, 0, 0); // fixed t0 for pinned checks
var STEP = 600;

var failures = [];
var passes = 0;
function ok(cond, msg) {
  if (cond) passes++;
  else failures.push(msg);
}

// ------------------------------------------------------------------ A. logic
var WF = build.loadFixtures();
var meta = require('./meta');
var model = build.buildModel(WF, meta);
var onDisk = JSON.parse(fs.readFileSync(path.join(build.ROOT, 'scenarios.json'), 'utf8'));
ok(JSON.stringify(onDisk) === JSON.stringify(model), 'scenarios.json is stale: run node tools/build.js');

function query(o) {
  return '?' + Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&');
}

function stateFor(def, q, realNow) {
  var ctx = WF.makeCtx(def, WF.parseParams(q, realNow), {});
  return { ctx: ctx, state: WF.computeState(def, ctx) };
}

var scenarios = model.scenarios.filter(function (s) { return !ONLY || ONLY.split(',').indexOf(s.id) >= 0; });

scenarios.forEach(function (s) {
  var def = WF.registry[s.id];
  var n = s.phaseCount;
  s.phases.forEach(function (ph, k) {
    [
      { t0: T0, step: STEP, now: T0 + k * STEP * 1000 + 1 },
      { t0: T0, step: STEP, now: T0 + (k + 1) * STEP * 1000 - 1 },
      { t0: T0 + 12345, step: 60, now: T0 + 12345 + k * 60000 + 30000 },
    ].forEach(function (p) {
      var r = stateFor(def, query(p));
      ok(r.ctx.phase === k, s.id + ': phase ' + k + ' computed as ' + r.ctx.phase + ' for ' + JSON.stringify(p));
      ok(R.eq(WF.pickWatched(def, r.state), ph.watched), s.id + ': phase ' + k + ' watched mismatch ' + JSON.stringify(WF.pickWatched(def, r.state)) + ' vs ' + JSON.stringify(ph.watched));
    });
  });
  var before = stateFor(def, query({ t0: T0, now: T0 - 3600000 }));
  ok(before.ctx.phase === 0 && before.ctx.rawPhase === 0, s.id + ': before t0 should be phase 0');
  var after = stateFor(def, query({ t0: T0, now: T0 + (n + 5) * STEP * 1000 }));
  ok(after.ctx.phase === n - 1 && R.eq(WF.pickWatched(def, after.state), s.phases[n - 1].watched), s.id + ': should hold at the last phase');
  var dflt = stateFor(def, '', Date.UTC(2026, 9, 3, 0, 25, 0));
  ok(dflt.ctx.t0 === Date.UTC(2026, 9, 3) && dflt.ctx.rawPhase === 2, s.id + ': default t0 should be midnight UTC');
  var bad = stateFor(def, '?t0=abc&step=-5&now=' + (T0 + 1), null);
  ok(bad.ctx.step === 600, s.id + ': invalid step should fall back to 600');
});

(function tickerChecks() {
  var def = WF.registry['live-ticker'];
  if (!def) return;
  def.timeline.forEach(function (e, k) {
    var ctx = WF.makeCtx(def, WF.parseParams(query({ t0: T0, step: STEP, now: T0 + k * STEP * 1000 + 1 })), {});
    var lo = Infinity;
    var hi = -Infinity;
    for (var t = T0 + k * STEP * 1000; t < T0 + (k + 1) * STEP * 1000; t += 3000) {
      var v = def.priceAt(ctx, t);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    ok(lo >= e.min && hi <= e.max, 'live-ticker phase ' + k + ': quotes ' + lo + '..' + hi + ' outside band ' + e.min + '..' + e.max);
  });
})();

(function delayChecks() {
  var def = WF.registry['late-render'];
  if (!def) return;
  for (var seed = 1; seed <= 20; seed++) {
    for (var k = 0; k < 40; k++) {
      var st = stateFor(def, query({ t0: T0, now: T0 + k * STEP * 1000 + 1, seed: seed })).state;
      ok(st.delayMs >= 4000 && st.delayMs <= 6000, 'late-render delay ' + st.delayMs + ' out of range');
    }
  }
})();

(function noiseChecks() {
  var def = WF.registry['noise-only'];
  if (!def) return;
  var prev = null;
  for (var k = 0; k < 12; k++) {
    var st = stateFor(def, query({ t0: T0, now: T0 + k * STEP * 1000 + 1 })).state;
    if (prev) ok(st.banner !== prev.banner && st.reviewCount !== prev.reviewCount, 'noise-only: noise should change between phases ' + (k - 1) + ' and ' + k);
    ok(st.price === 89 && st.stock === 'in_stock', 'noise-only: watched values must be constant');
    prev = st;
  }
})();

console.log('logic checks: ' + passes + ' passed, ' + failures.length + ' failed');

// ------------------------------------------------------------------ B. browser
var HELPERS =
  'const T=(s,r)=>{const e=(r||document).querySelector(s);return e?e.innerText.replace(/\\s+/g," ").trim():null};' +
  'const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));' +
  'const waitFor=async(s,ms)=>{const t=Date.now();while(Date.now()-t<ms){if(document.querySelector(s))return true;await sleep(50)}return false};' +
  'const common=()=>({footer:T(".fixture-footer"),debug:!!document.getElementById("wf-debug"),path:location.pathname,search:location.search,title:document.title});';

function eqMsg(errs, label, got, want) {
  if (!R.eq(got, want)) errs.push(label + ': got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
}

var PROBES = {
  'price-step-down': { js: 'return {price:T("#product-price")}', check: function (g, e, errs) { eqMsg(errs, 'price', g.price, e.priceText); } },
  'stock-cycle': {
    js: 'return {stock:T("#stock-status"),note:T("#stock-note"),price:T("#product-price")}',
    check: function (g, e, errs, i) {
      eqMsg(errs, 'stock', g.stock, e.stockText);
      eqMsg(errs, 'price', g.price, '$34.00');
      if (e.stock === 'out_of_stock') {
        var d = WF.fmt.dateLong(i.t0 + 5 * WF.DAY_MS);
        if (!g.note || g.note.indexOf(d) < 0) errs.push('restock note should mention ' + d + ': ' + g.note);
      }
    },
  },
  'noise-only': {
    js: 'return {price:T("#product-price"),stock:T("#stock-status"),banner:T(".site-banner")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'price', g.price, e.priceText);
      eqMsg(errs, 'stock', g.stock, e.stockText);
      eqMsg(errs, 'banner', g.banner, e.banner);
    },
  },
  'sale-window': {
    js: 'return {price:T("#product-price"),countdown:T("#sale-countdown")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'price', g.price, e.priceText);
      if (e.onSale !== (g.countdown !== null && /^Sale ends in /.test(g.countdown))) errs.push('countdown presence wrong: ' + g.countdown);
    },
  },
  variants: {
    js: 'return {from:T("#product-price"),rows:[...document.querySelectorAll("tr[data-sku]")].map(tr=>[tr.dataset.sku,T(".v-price",tr),T(".v-stock",tr)])}',
    check: function (g, e, errs) {
      eqMsg(errs, 'from', g.from, e.fromPriceText);
      eqMsg(errs, 'rows', g.rows, e.variants.map(function (v) { return [v.sku, v.priceText, v.stockText]; }));
    },
  },
  listing: {
    js: 'return {books:[...document.querySelectorAll("li.book")].map(li=>T(".book-title",li)+" ("+T(".book-author",li)+") "+T(".book-price",li)+(T(".book-avail",li)==="In stock"?"":" [out of stock]"))}',
    check: function (g, e, errs) {
      eqMsg(errs, 'books', g.books, e.items);
      var glass = g.books.filter(function (b) { return b.indexOf('The Glass Orchard (Maren Ostrova) ') === 0; });
      eqMsg(errs, 'watched book', glass, ['The Glass Orchard (Maren Ostrova) ' + e.glassPriceText + (e.glassStock === 'in_stock' ? '' : ' [out of stock]')]);
    },
  },
  'format-change': { js: 'return {price:T("#product-price")}', check: function (g, e, errs) { eqMsg(errs, 'price', g.price, e.priceText); } },
  'zh-price': {
    js: 'return {price:T("#product-price"),stock:T("#stock-status"),note:T("#stock-note"),lang:document.documentElement.lang}',
    check: function (g, e, errs, i) {
      eqMsg(errs, 'price', g.price, e.priceText);
      eqMsg(errs, 'stock', g.stock, e.stockText);
      eqMsg(errs, 'lang', g.lang, 'zh-CN');
      if (e.stock === 'out_of_stock') {
        var d = WF.fmt.zhMonthDay(i.t0 + 8 * WF.DAY_MS);
        if (!g.note || g.note.indexOf(d) < 0) errs.push('restock note should mention ' + d + ': ' + g.note);
      }
    },
  },
  'job-board': {
    js: 'return {jobs:[...document.querySelectorAll("li.job")].map(li=>li.dataset.jobId+": "+T(".job-title",li)+" | "+T(".job-company",li)+" | "+T(".job-location",li)+" | "+T(".job-salary",li))}',
    check: function (g, e, errs) { eqMsg(errs, 'jobs', g.jobs, e.listings); },
  },
  'status-page': {
    js: 'return {overall:T("#overall-status"),comps:Object.fromEntries([...document.querySelectorAll("li.component")].map(li=>[li.dataset.component,T(".c-status",li)])),incident:T("#active-incident h2")}',
    check: function (g, e, errs) {
      var L = { operational: 'Operational', degraded: 'Degraded performance', partial: 'Partial outage', major: 'Major outage' };
      eqMsg(errs, 'overall', g.overall, e.overall);
      eqMsg(errs, 'webhooks', g.comps.webhooks, L[e.webhooks]);
      eqMsg(errs, 'api', g.comps.api, L[e.api]);
      var others = ['dashboard', 'storage', 'auth', 'cdn'].map(function (k) { return g.comps[k]; });
      eqMsg(errs, 'others', others, ['Operational', 'Operational', 'Operational', 'Operational']);
      eqMsg(errs, 'active incident', g.incident !== null, e.incidentStatus !== null && !e.incidentInPast);
    },
  },
  'event-tickets': {
    js: 'return {rows:[...document.querySelectorAll("tr[data-show]")].map(tr=>[tr.dataset.show,T(".seats",tr)])}',
    check: function (g, e, errs) {
      var want = ['portsmere', 'aldbury', 'wrenfield', 'halloway'].filter(function (k) { return e[k] !== null; }).map(function (k) { return [k, e[k + 'Text']]; });
      eqMsg(errs, 'rows', g.rows, want);
    },
  },
  'late-render': {
    js: 'const early=T("#product-price");const skel=!!document.getElementById("buybox-loading");const found=await waitFor("#product-price",9000);return {early,skel,found,at:Math.round(performance.now()),price:T("#product-price")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'price before render', g.early, null);
      eqMsg(errs, 'skeleton', g.skel, true);
      eqMsg(errs, 'price', g.price, e.priceText);
      if (!(g.at >= 3900 && g.at <= 7500)) errs.push('price appeared at ' + g.at + ' ms after navigation start (want 4000–6000)');
    },
  },
  'click-to-reveal': {
    js: 'const inDom=!!document.getElementById("price-details")||!!document.getElementById("product-price");const btn=document.getElementById("toggle-price-details");btn.click();await sleep(50);const r={inDom,price:T("#product-price"),total:T("#price-total"),expanded:btn.getAttribute("aria-expanded")};btn.click();await sleep(50);r.afterClose=!!document.getElementById("product-price");return r',
    check: function (g, e, errs) {
      eqMsg(errs, 'panel in DOM before click', g.inDom, false);
      eqMsg(errs, 'price', g.price, e.priceText);
      eqMsg(errs, 'total', g.total, e.totalText);
      eqMsg(errs, 'aria-expanded', g.expanded, 'true');
      eqMsg(errs, 'panel removed after second click', g.afterClose, false);
    },
  },
  'tabbed-price': {
    js: 'const p=document.getElementById("product-price");const r={inDom:!!p,textContent:p?p.textContent:null,visible:document.getElementById("app").innerText.includes(p?p.textContent:"@@")};document.getElementById("tab-pricing").click();await sleep(50);r.price=T("#product-price");r.hidden=document.getElementById("panel-pricing").hidden;return r',
    check: function (g, e, errs) {
      eqMsg(errs, 'panel in DOM before click', g.inDom, true);
      eqMsg(errs, 'textContent before click', g.textContent, e.priceText);
      eqMsg(errs, 'visible text before click', g.visible, false);
      eqMsg(errs, 'price after click', g.price, e.priceText);
      eqMsg(errs, 'panel hidden after click', g.hidden, false);
    },
  },
  'page-gone': {
    settleMs: 900,
    js: 'return {price:T("#product-price"),gone:T("#product-gone h1"),moved:T("#product-moved h1"),link:(document.getElementById("moved-link")||{getAttribute:()=>null}).getAttribute("href"),name:T(".product-title")}',
    check: function (g, e, errs, i) {
      var p = i.common.path;
      if (e.status === 'available') {
        eqMsg(errs, 'price', g.price, e.priceText);
        eqMsg(errs, 'path', /\/s\/page-gone\/$/.test(p), true);
      } else if (e.status === 'gone') {
        eqMsg(errs, 'gone', g.gone, 'This product is no longer available');
        eqMsg(errs, 'price', g.price, null);
      } else if (e.status === 'moved') {
        eqMsg(errs, 'moved', g.moved, 'This product has moved');
        eqMsg(errs, 'link keeps params', /^new\/\?t0=/.test(g.link || ''), true);
        eqMsg(errs, 'price', g.price, null);
      } else {
        eqMsg(errs, 'redirected path', /\/s\/page-gone\/new\/$/.test(p), true);
        eqMsg(errs, 'query kept', i.common.search.indexOf('t0=') >= 0, true);
        eqMsg(errs, 'price', g.price, e.priceText);
      }
    },
  },
  'page-gone#new': {
    path: 's/page-gone/new/',
    js: 'return {price:T("#product-price"),h1:T("h1"),name:T(".product-title")}',
    check: function (g, e, errs) {
      if (e.newUrlShows === 'product') {
        eqMsg(errs, 'price', g.price, e.priceText);
        eqMsg(errs, 'name', g.name, 'Atlas of Quiet Places — Revised Edition (Hardcover)');
      } else {
        eqMsg(errs, 'not found', g.h1, "We couldn't find that page");
        eqMsg(errs, 'price', g.price, null);
      }
    },
  },
  'login-wall': {
    js: 'const wall=T("#login-wall strong");const r={price:T("#product-price"),wall,dollars:/\\$\\s?\\d/.test(document.body.textContent)};const b=document.getElementById("sign-in");if(b){b.click();await sleep(30);r.msg=T("#sign-in-msg")}return r',
    check: function (g, e, errs) {
      if (e.access === 'visible') {
        eqMsg(errs, 'price', g.price, e.priceText);
        eqMsg(errs, 'wall', g.wall, null);
      } else {
        eqMsg(errs, 'price', g.price, null);
        eqMsg(errs, 'wall', g.wall, 'Sign in to see prices');
        eqMsg(errs, 'any $ amount in DOM', g.dollars, false);
        eqMsg(errs, 'sign-in message', g.msg, 'Sign-in is disabled on this test fixture.');
      }
    },
  },
  'intermittent-error': {
    js: 'return {price:T("#product-price"),err:T("#error-page h1")}',
    check: function (g, e, errs, i) {
      if (e.status === 'ok') {
        eqMsg(errs, 'price', g.price, e.priceText);
        eqMsg(errs, 'error', g.err, null);
      } else {
        eqMsg(errs, 'error', g.err, 'Service Temporarily Unavailable');
        eqMsg(errs, 'title', i.common.title, '503 Service Temporarily Unavailable');
        eqMsg(errs, 'price', g.price, null);
      }
    },
  },
  'live-ticker': {
    js: 'await sleep(200);const a={p:Number(T("#quote-price")),t:T("#quote-time")};await sleep(3300);const b={p:Number(T("#quote-price")),t:T("#quote-time")};return {a,b}',
    check: function (g, e, errs, i) {
      var def = WF.registry['live-ticker'];
      var ctx = WF.makeCtx(def, WF.parseParams(i.query), {});
      [g.a.p, g.b.p].forEach(function (v) {
        if (!(v >= e.min && v <= e.max)) errs.push('quote ' + v + ' outside band ' + e.min + '..' + e.max);
      });
      var allowed = [];
      for (var d = -3000; d <= 12000; d += 3000) allowed.push(def.priceAt(ctx, Math.floor((i.now + d) / 3000) * 3000));
      if (allowed.indexOf(g.a.p) < 0) errs.push('first quote ' + g.a.p + ' is not priceAt(t) for any tick near now: ' + allowed.join(','));
      if (g.a.t === g.b.t) errs.push('quote time did not advance (live update missing): ' + g.a.t);
    },
  },
  'threshold-approach': {
    js: 'return {price:T("#product-price"),note:T(".price-note")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'price', g.price, e.priceText);
      if (e.lowest30dText && (g.note || '').indexOf('Lowest price in the last 30 days: ' + e.lowest30dText) < 0) errs.push('missing lowest-30-days note: ' + g.note);
    },
  },
  'consent-overlay': {
    js: 'const r={price:T("#product-price"),dialog:!!document.querySelector("[role=dialog]"),version:T("[role=dialog] .muted")};document.querySelector("[data-consent=reject]").click();await sleep(30);r.after=!!document.querySelector("[role=dialog]");return r',
    check: function (g, e, errs) {
      eqMsg(errs, 'price', g.price, e.priceText);
      eqMsg(errs, 'dialog', g.dialog, true);
      if ((g.version || '').indexOf('v' + e.noticeVersion) < 0) errs.push('notice version: ' + g.version);
      eqMsg(errs, 'dialog closed after reject', g.after, false);
    },
  },
  shrinkflation: {
    js: 'return {price:T("#product-price"),unit:T("#unit-price"),pack:T("#pack-size"),name:T(".product-title")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'price', g.price, e.priceText);
      eqMsg(errs, 'unit', g.unit, e.unitPriceText);
      eqMsg(errs, 'pack', g.pack, e.packText);
      eqMsg(errs, 'name', g.name, 'Oat & Honey Granola Bars, ' + e.packCount + ' pack');
    },
  },
  'release-notes': {
    js: 'return {versions:[...document.querySelectorAll("article.release")].map(a=>a.dataset.version),stable:T("#latest-stable-version")}',
    check: function (g, e, errs) {
      eqMsg(errs, 'versions', g.versions, e.versions);
      eqMsg(errs, 'latest stable', g.stable, e.latestStable);
    },
  },
  'layout-redesign': {
    js: 'return {classic:T("#product-price"),redesign:T(".buybar [data-price-amount]")}',
    check: function (g, e, errs) {
      if (e.layout === 'classic') {
        eqMsg(errs, 'classic price', g.classic, e.priceText);
        eqMsg(errs, 'redesign price', g.redesign, null);
      } else {
        eqMsg(errs, 'classic price', g.classic, null);
        eqMsg(errs, 'redesign price', g.redesign, e.priceText);
      }
    },
  },
};

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  var cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(cache)) {
    var dirs = fs.readdirSync(cache).filter(function (d) { return /^chromium_headless_shell-\d+$/.test(d); }).sort();
    for (var i = dirs.length - 1; i >= 0; i--) {
      var sub = path.join(cache, dirs[i]);
      var inner = fs.readdirSync(sub).filter(function (d) { return /^chrome-headless-shell/.test(d); });
      for (var j = 0; j < inner.length; j++) {
        var bin = path.join(sub, inner[j], 'chrome-headless-shell');
        if (fs.existsSync(bin)) return bin;
      }
    }
  }
  var mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(mac)) return mac;
  throw new Error('No Chromium found; set CHROME=/path/to/chrome');
}

function staticServer(root) {
  var types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml' };
  var srv = http.createServer(function (req, res) {
    var u = decodeURIComponent(req.url.split('?')[0]);
    var f = path.join(root, u);
    if (f.indexOf(root) !== 0) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
      if (!/\/$/.test(u)) { res.writeHead(301, { Location: u + '/' + (req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?')) : '') }); return res.end(); }
      f = path.join(f, 'index.html');
    }
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(function (resolve) {
    srv.listen(0, '127.0.0.1', function () { resolve(srv); });
  });
}

function Cdp(ws) {
  var self = this;
  this.ws = ws;
  this.seq = 0;
  this.pending = new Map();
  this.listeners = new Set();
  ws.addEventListener('message', function (ev) {
    var m = JSON.parse(ev.data);
    if (m.id != null) {
      var p = self.pending.get(m.id);
      if (!p) return;
      self.pending.delete(m.id);
      if (m.error) p.reject(new Error(p.method + ': ' + m.error.message));
      else p.resolve(m.result);
    } else {
      self.listeners.forEach(function (fn) { fn(m); });
    }
  });
}
Cdp.prototype.send = function (method, params, sessionId) {
  var id = ++this.seq;
  var msg = { id: id, method: method, params: params || {} };
  if (sessionId) msg.sessionId = sessionId;
  var self = this;
  return new Promise(function (resolve, reject) {
    self.pending.set(id, { resolve: resolve, reject: reject, method: method });
    self.ws.send(JSON.stringify(msg));
  });
};
Cdp.prototype.once = function (method, sessionId, timeoutMs) {
  var self = this;
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { self.listeners.delete(fn); reject(new Error('timeout waiting for ' + method)); }, timeoutMs || 15000);
    function fn(m) {
      if (m.method === method && m.sessionId === sessionId) {
        clearTimeout(timer);
        self.listeners.delete(fn);
        resolve(m.params);
      }
    }
    self.listeners.add(fn);
  });
};

async function launch() {
  var bin = findChrome();
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wf-chrome-'));
  var flags = ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--remote-debugging-port=0', '--user-data-dir=' + dir, 'about:blank'];
  if (/Google Chrome$/.test(bin)) flags[0] = '--headless=new';
  var proc = childProcess.spawn(bin, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  var wsUrl = await new Promise(function (resolve, reject) {
    var buf = '';
    var t = setTimeout(function () { reject(new Error('Chromium did not start')); }, 20000);
    proc.stderr.on('data', function (d) {
      buf += d;
      var m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); resolve(m[1]); }
    });
    proc.on('exit', function (c) { reject(new Error('Chromium exited ' + c)); });
  });
  var ws = new WebSocket(wsUrl);
  await new Promise(function (resolve, reject) { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  return { proc: proc, dir: dir, cdp: new Cdp(ws), ws: ws };
}

async function openTab(cdp) {
  var t = await cdp.send('Target.createTarget', { url: 'about:blank' });
  var a = await cdp.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  var sid = a.sessionId;
  var tab = { sid: sid, targetId: t.targetId, requests: [], errors: [] };
  cdp.listeners.add(function (m) {
    if (m.sessionId !== sid) return;
    if (m.method === 'Network.requestWillBeSent') tab.requests.push(m.params.request.url);
    if (m.method === 'Runtime.exceptionThrown') tab.errors.push(m.params.exceptionDetails.text + ' ' + ((m.params.exceptionDetails.exception || {}).description || ''));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') tab.errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  await cdp.send('Page.enable', {}, sid);
  await cdp.send('Runtime.enable', {}, sid);
  await cdp.send('Network.enable', {}, sid);
  await cdp.send('Log.enable', {}, sid);
  return tab;
}

async function run(cdp, tab, url, js, settleMs) {
  tab.requests = [];
  tab.errors = [];
  var loaded = cdp.once('Page.loadEventFired', tab.sid, 20000);
  await cdp.send('Page.navigate', { url: url }, tab.sid);
  await loaded;
  await new Promise(function (r) { setTimeout(r, settleMs || 60); });
  var expr = '(async()=>{' + HELPERS + 'const __r=await (async()=>{' + js + '})();__r.__common=common();return __r})()';
  var res = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, tab.sid);
  if (res.exceptionDetails) throw new Error('probe threw: ' + (res.exceptionDetails.exception || {}).description);
  return res.result.value;
}

async function browserChecks() {
  var server = null;
  var base = BASE;
  if (!base) {
    server = await staticServer(build.ROOT);
    base = 'http://127.0.0.1:' + server.address().port + '/';
  }
  if (!/\/$/.test(base)) base += '/';
  var origin = new URL(base).origin;
  var b = await launch();
  var jobs = [];
  scenarios.forEach(function (s) {
    var probeKeys = [s.id].concat(s.extraPaths.length ? [s.id + '#new'] : []);
    probeKeys.forEach(function (pk) {
      var probe = PROBES[pk];
      if (!probe) { failures.push('no browser probe for ' + pk); return; }
      s.phases.forEach(function (ph, k) {
        var now = T0 + k * STEP * 1000 + 30000;
        var q = query({ t0: T0, step: STEP, now: now });
        jobs.push({ s: s, pk: pk, probe: probe, k: k, now: now, query: q, t0: T0, kind: 'pinned' });
      });
    });
    // real clock (no ?now=): t0 chosen so that the page is 20 s into phase k
    var k2 = Math.min(2, s.phaseCount - 1);
    jobs.push({ s: s, pk: s.id, probe: PROBES[s.id], k: k2, kind: 'real-clock' });
    // debug panel
    jobs.push({ s: s, pk: s.id, probe: PROBES[s.id], k: s.phaseCount - 1, kind: 'debug' });
  });

  var done = 0;
  async function worker() {
    var tab = await openTab(b.cdp);
    while (jobs.length) {
      var j = jobs.shift();
      var path_ = j.probe.path || j.s.path;
      var url;
      if (j.kind === 'real-clock') {
        j.t0 = Date.now() - j.k * STEP * 1000 - 20000;
        j.now = Date.now();
        j.query = query({ t0: j.t0, step: STEP });
        url = base + path_ + j.query;
      } else if (j.kind === 'debug') {
        j.now = T0 + j.k * STEP * 1000 + 30000;
        j.t0 = T0;
        j.query = query({ t0: T0, step: STEP, now: j.now, debug: 1 });
        url = base + path_ + j.query;
      } else {
        url = base + path_ + j.query;
      }
      var label = j.pk + ' phase ' + j.k + ' [' + j.kind + ']';
      try {
        var got = await run(b.cdp, tab, url, j.probe.js, j.probe.settleMs);
        var errs = [];
        var entry = WF.registry[j.s.id].timeline[j.k];
        j.probe.check(got, entry, errs, { t0: j.t0, now: j.now, query: j.query, common: got.__common, phase: j.k });
        eqMsg(errs, 'fixture footer', got.__common.footer, FOOTER);
        if (j.kind === 'debug') {
          var d = await b.cdp.send('Runtime.evaluate', { expression: '({phase:(document.getElementById("wf-debug-phase")||{}).textContent,rows:document.querySelectorAll("#wf-debug tbody tr").length,cur:(document.querySelector("#wf-debug tr.current td")||{}).textContent,watched:(document.getElementById("wf-debug-watched")||{}).textContent})', returnByValue: true }, tab.sid);
          var dv = d.result.value;
          eqMsg(errs, 'debug phase', (dv.phase || '').split(' ')[0], String(j.k));
          eqMsg(errs, 'debug rows', dv.rows, j.s.phaseCount);
          eqMsg(errs, 'debug current row', dv.cur, String(j.k));
          var w = JSON.parse(dv.watched || '{}');
          j.s.watched.forEach(function (wk) { eqMsg(errs, 'debug watched ' + wk.key, w[wk.key], j.s.phases[j.k].watched[wk.key]); });
        } else {
          eqMsg(errs, 'debug panel absent', got.__common.debug, false);
        }
        tab.requests.forEach(function (u) {
          if (!/^(data:|about:)/.test(u) && u.indexOf(origin) !== 0) errs.push('request left the site: ' + u);
        });
        tab.errors.forEach(function (e) { errs.push('page error: ' + e); });
        if (errs.length) failures.push(label + ': ' + errs.join('; '));
        else passes++;
      } catch (e) {
        failures.push(label + ': ' + e.message);
      }
      done++;
      if (done % 25 === 0) process.stdout.write('  browser checks: ' + done + ' done\n');
    }
    await b.cdp.send('Target.closeTarget', { targetId: tab.targetId });
  }
  var total = jobs.length;
  var workers = [];
  for (var i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);
  b.ws.close();
  b.proc.kill('SIGTERM');
  await new Promise(function (r) { setTimeout(r, 300); });
  try { fs.rmSync(b.dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  if (server) server.close();
  console.log('browser checks against ' + base + ': ' + total + ' page loads');
}

(async function main() {
  if (!NO_BROWSER) await browserChecks();
  if (failures.length) {
    console.log('\nFAILURES (' + failures.length + '):');
    failures.forEach(function (f) { console.log(' - ' + f); });
    console.log('\n' + passes + ' passed, ' + failures.length + ' failed');
    process.exit(1);
  }
  console.log('all ' + passes + ' checks passed');
})().catch(function (e) {
  console.error(e);
  process.exit(2);
});
