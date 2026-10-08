#!/usr/bin/env node
'use strict';
/**
 * Generates, from the same modules the pages run (assets/core.js, assets/shop.js, assets/scenarios/*.js):
 *   scenarios.json            answer key for the test harness
 *   s/<id>/index.html         one HTML shell per scenario page (plus extra views)
 *   index.html                scenario index
 *   README.md                 repository readme
 * and asserts the hand-written cross-checks in tools/meta.js.
 *
 * Usage: node tools/build.js [--check]   (--check: fail if any generated file is stale, write nothing)
 */
var fs = require('fs');
var path = require('path');
var R = require('./rules');

var ROOT = path.resolve(__dirname, '..');
var BASE_URL = 'https://woodnotfound.github.io/phi-watch-test-pages/';
var REPO_URL = 'https://github.com/WoodNotFound/phi-watch-test-pages';
var FOOTER = 'Test fixture for automated page-watching tests. Not a real store.';

function loadFixtures() {
  delete globalThis.WatchFixtures;
  Object.keys(require.cache).forEach(function (k) {
    if (k.indexOf(path.join(ROOT, 'assets')) === 0) delete require.cache[k];
  });
  var WF = require(path.join(ROOT, 'assets/core.js'));
  require(path.join(ROOT, 'assets/shop.js'));
  fs.readdirSync(path.join(ROOT, 'assets/scenarios'))
    .filter(function (f) { return /\.js$/.test(f); })
    .sort()
    .forEach(function (f) { require(path.join(ROOT, 'assets/scenarios', f)); });
  fs.readdirSync(path.join(ROOT, 'assets/i18n'))
    .filter(function (f) { return /\.js$/.test(f); })
    .sort()
    .forEach(function (f) { require(path.join(ROOT, 'assets/i18n', f)); });
  return WF;
}

function fail(msg) {
  throw new Error('build: ' + msg);
}

function contextOf(def, e) {
  var watched = def.watched.map(function (w) { return w.key; });
  var out = {};
  Object.keys(e).forEach(function (k) {
    if (watched.indexOf(k) >= 0 || k.charAt(0) === '_' || k === 'readable') return;
    out[k] = e[k];
  });
  return out;
}

var VERDICTS = {
  baseline: 'First check of the watch: record the values. Nothing to report yet (confirming the current value to the user is fine).',
  report: 'A change worth telling the user about.',
  skip: 'Nothing worth telling the user.',
  optional: 'Telling the user is acceptable but not required (see the note for that phase).',
  unreadable: 'The watched value cannot be read in this phase (login wall, error page). The watcher must not report a value change; saying it could not read the page is fine. Later comparisons use the last readable phase.',
  'n/a': "Before the request's startPhase (the watch has not started yet).",
};

function buildModel(WF, meta) {
  var metaIds = meta.map(function (m) { return m.id; });
  WF.order.forEach(function (id) {
    if (metaIds.indexOf(id) < 0) fail('scenario ' + id + ' has no entry in tools/meta.js');
  });
  var scenarios = meta.map(function (m) {
    var def = WF.registry[m.id];
    if (!def) fail('meta entry ' + m.id + ' has no scenario module');
    var phases = def.timeline;
    if (m.band) {
      m.band.forEach(function (x) {
        phases.forEach(function (e, k) {
          if (!(e.min > x || e.max < x)) fail(m.id + ': phase ' + k + ' band [' + e.min + ', ' + e.max + '] straddles ' + x);
        });
      });
    }
    var examples = m.examples.map(function (ex) {
      var r = R.evaluate(phases, { startPhase: ex.startPhase, decide: ex.decide, overrides: ex.overrides });
      if (!R.eq(r.reportPhases, ex.expectReport)) fail(m.id + ': "' + ex.request + '" reports at ' + JSON.stringify(r.reportPhases) + ', expected ' + JSON.stringify(ex.expectReport));
      return { request: ex.request, startPhase: ex.startPhase || 0, expected: r.expected, reportPhases: r.reportPhases, notes: r.notes };
    });
    var stops = m.stops.map(function (s) {
      var ph = R.firstPhase(phases, s.pred, s.startPhase || 0);
      if (ph !== s.expect) fail(m.id + ': stop "' + s.condition + '" true at ' + ph + ', expected ' + s.expect);
      return { condition: s.condition, startPhase: s.startPhase || 0, phase: ph };
    });
    return {
      id: m.id,
      number: m.number,
      title: def.title,
      path: def.path,
      extraPaths: (def.extraViews || []).map(function (v) { return v.path; }),
      urlTemplate: def.path + '?t0={t0}&step={step}',
      lang: def.lang || 'en',
      description: m.description,
      watched: def.watched,
      phaseCount: phases.length,
      afterLastPhase: def.loops ? 'loops' : 'holds',
      afterLastNotes: def.afterLast || null,
      phases: phases.map(function (e, k) {
        return { phase: k, startsAt: 't0 + ' + k + ' * step', readable: R.isReadable(e), watched: WF.pickWatched(def, e), context: contextOf(def, e) };
      }),
      examples: examples,
      stopConditions: stops,
      notes: m.notes || [],
    };
  });
  return {
    title: 'Page-watching test fixtures',
    version: WF.version,
    baseUrl: BASE_URL,
    repository: REPO_URL,
    timeModel: {
      parameters: {
        t0: 'Epoch milliseconds when the scenario timeline starts. Default: the most recent midnight UTC (relative to "now").',
        step: 'Seconds per phase. Default 600.',
        now: 'Optional epoch milliseconds that pins the current time (harness convenience). Live pages advance from it in real time.',
        seed: 'Optional string mixed into every PRNG (only affects noise, never watched values, except the late-render delay). Default "1".',
        debug: '1 appends an answer-key panel (phase, timeline table, watched value now). Without it the panel is not in the DOM at all.',
        lang: 'en or zh: the page language. Default: the scenario\'s own (its lang field). Only words change; numbers, prices, currencies and the timeline are the same in both languages, so this answer key holds for either.',
      },
      phase: 'rawPhase = max(0, floor((now - t0) / (step * 1000))); phase = min(rawPhase, phaseCount - 1) (all scenarios hold at their last phase; none loops).',
      phaseStart: 'phase k starts at t0 + k * step * 1000 ms',
      recompute: 'Pages compute their state once, on load (no auto-refresh). Only live-ticker re-renders on its own (every 3 s). Some noise (countdowns, "N minutes ago", viewer counters) depends on the exact load time.',
      randomness: 'No Math.random. Noise comes from mulberry32 seeded by FNV-1a of "<scenario id>|<seed>|<salt>|<time bucket>" (see assets/core.js), so it is reproducible.',
      httpStatus: 'GitHub Pages serves every page with HTTP 200; "error", "gone" and "moved" states are page content.',
    },
    verdicts: VERDICTS,
    scenarios: scenarios,
  };
}

// ------------------------------------------------------------------ HTML
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function shell(def, view) {
  var p = view ? view.path : def.path;
  var depth = p.split('/').filter(Boolean).length;
  var root = new Array(depth + 1).join('../');
  var title = view ? view.docTitle : def.docTitle;
  return (
    '<!doctype html>\n' +
    '<html lang="' + (def.lang || 'en') + '">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="robots" content="noindex, nofollow">\n' +
    '<link rel="icon" href="data:,">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<link rel="stylesheet" href="' + root + 'assets/site.css">\n' +
    '</head>\n' +
    '<body>\n' +
    '<div id="app"><noscript>This page needs JavaScript.</noscript></div>\n' +
    '<footer class="fixture-footer">' + FOOTER + '</footer>\n' +
    '<script src="' + root + 'assets/core.js"></script>\n' +
    '<script src="' + root + 'assets/shop.js"></script>\n' +
    '<script src="' + root + 'assets/scenarios/' + def.id + '.js"></script>\n' +
    '<script src="' + root + 'assets/i18n/common.js"></script>\n' +
    '<script src="' + root + 'assets/i18n/' + def.id + '.js"></script>\n' +
    "<script>WatchFixtures.mount('" + def.id + "', { view: '" + (view ? view.view : 'main') + "', root: '" + root + "' });</script>\n" +
    '</body>\n' +
    '</html>\n'
  );
}

/** Both languages are in the page; html[lang] decides which one shows (see the style block). */
function both(en, zh, tag) {
  tag = tag || 'span';
  return '<' + tag + ' data-l="en">' + en + '</' + tag + '><' + tag + ' data-l="zh">' + zh + '</' + tag + '>';
}

function indexHtml(model) {
  var zhMeta = require('./meta-zh');
  var rows = model.scenarios
    .map(function (s) {
      var zh = zhMeta[s.id];
      if (!zh) fail('scenario ' + s.id + ' has no entry in tools/meta-zh.js');
      var watch = s.watched.map(function (w) { return '<code>' + esc(w.key) + '</code>'; }).join(', ');
      return (
        '<li class="sc" data-path="' + s.path + '"><div class="sc-head"><span class="num">' + esc(s.number) + '</span><h2><a class="go" href="' + s.path + '">' + both(esc(s.title), esc(zh.title)) + '</a></h2></div>' +
        both(esc(s.description), esc(zh.description), 'p') +
        '<p class="meta"><code>' + s.path + '</code> · ' + both(s.phaseCount + ' phases · watched:', s.phaseCount + ' 个阶段 · 关注字段：') + ' ' + watch +
        ' · <a class="dbg" href="' + s.path + '?debug=1">' + both('with debug panel', '带答案面板') + '</a></p></li>'
      );
    })
    .join('\n');
  return (
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex, nofollow">\n' +
    '<link rel="icon" href="data:,">\n<title>Page-watching test fixtures</title>\n<link rel="stylesheet" href="assets/site.css">\n' +
    '<style>\n' +
    'html:not(:lang(zh)) [data-l="zh"],html:lang(zh) [data-l="en"]{display:none!important}\n' +
    '.ix header{background:#16202a;color:#fff;padding:28px 0}.ix header h1{font-size:1.8rem;margin:0 0 6px}.ix header p{color:#c9d3dc;max-width:820px}\n' +
    '.ix .controls{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid var(--line);padding:12px 0}.ix .controls .wrap{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:.92rem}\n' +
    '.ix .controls input,.ix .controls select{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:6px}.ix .controls code{background:var(--bg-2);padding:2px 6px;border-radius:4px}\n' +
    '.ix .list{list-style:none;padding:0;margin:24px 0}.ix .sc{border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-bottom:12px}\n' +
    '.ix .sc-head{display:flex;align-items:center;gap:12px}.ix .sc h2{margin:0;font-size:1.1rem}.ix .num{background:#16202a;color:#fff;border-radius:6px;padding:2px 8px;font-weight:700;font-size:.85rem}\n' +
    '.ix .sc p{margin:8px 0 0}.ix .meta{font-size:.85rem;color:var(--ink-3)}.ix .doc{max-width:820px}.ix .doc code{background:var(--bg-2);padding:1px 5px;border-radius:4px}\n' +
    '</style>\n</head>\n<body class="ix">\n' +
    '<header><div class="wrap"><h1>' + both('Page-watching test fixtures', '页面关注测试页') + '</h1>' +
    both(
      'Static pages for testing an agent that periodically opens a page, reads a value the user cares about, compares it with earlier checks, and decides whether to notify the user or stop. Every page\'s state is a pure function of the current time and its URL parameters, so the right answer is known in advance. All stores, brands and products are fictional.',
      '用来测试这样一个 agent 的静态页面：它定期打开一个页面，读取用户关心的值，和之前的结果比较，再决定是否通知用户或停止。每个页面的状态完全由当前时间和链接参数决定，所以正确答案事先就知道。所有商店、品牌和商品都是虚构的。',
      'p'
    ) +
    '</div></header>\n' +
    '<div class="controls"><div class="wrap">' +
    '<span>t0 = <code id="t0">' + both('(static links: default t0 = midnight UTC)', '（静态链接：默认 t0 = UTC 零点）') + '</code></span>' +
    '<button class="btn secondary" type="button" id="reset" style="padding:5px 12px">' + both('Set t0 = now', 't0 设为现在') + '</button>' +
    '<label>' + both('step', '每阶段') + ' <select id="step"><option value="10">10 s</option><option value="60">60 s</option><option value="300">5 min</option><option value="600" selected data-en="10 min (default)" data-zh="10 min（默认）">10 min (default)</option><option value="3600">1 h</option></select></label>' +
    '<label>' + both('language', '语言') + ' <select id="lang"><option value="" selected data-en="page default" data-zh="页面默认">page default</option><option value="en">English (en)</option><option value="zh">中文 (zh)</option></select></label>' +
    '<label><input type="checkbox" id="debug"> ' + both('debug panel', '答案面板') + '</label>' +
    '<a href="scenarios.json">scenarios.json</a><a href="' + REPO_URL + '">' + both('README / source', 'README / 源码') + '</a></div></div>\n' +
    '<main class="wrap">\n<section class="doc"><h2 style="margin-top:24px">' + both('Time model', '时间模型') + '</h2>' +
    both(
      '<code>phase = max(0, floor((now − t0) / (step × 1000)))</code>, held at the last listed phase. Parameters: <code>t0</code> (epoch ms, default: most recent midnight UTC), <code>step</code> (seconds, default 600), <code>now</code> (optional epoch ms to pin the clock), <code>seed</code> (optional, noise only), <code>debug=1</code> (answer-key panel; absent from the DOM otherwise), <code>lang=en|zh</code> (page language; default: the scenario\'s own; only words change, never numbers or prices). Pages compute their state on load only; <em>live-ticker</em> is the one page that updates itself.',
      '<code>phase = max(0, floor((now − t0) / (step × 1000)))</code>，到最后一个阶段后保持不变。参数：<code>t0</code>（毫秒时间戳，默认：最近的 UTC 零点）、<code>step</code>（秒，默认 600）、<code>now</code>（可选，毫秒时间戳，用来固定时钟）、<code>seed</code>（可选，只影响干扰内容）、<code>debug=1</code>（答案面板；不带时 DOM 里完全没有）、<code>lang=en|zh</code>（页面语言；默认用页面自己的语言；只换文字，不改数字和价格）。页面只在加载时计算状态；只有 <em>live-ticker</em> 会自己更新。',
      'p'
    ) +
    both(
      'The links below carry <code>t0</code> = the moment you opened this index (set by script), the chosen <code>step</code> and the chosen language. Without script they point at the bare paths (default t0). This index remembers the language you pick in this browser; the scenario pages themselves read the language only from their link, so a link always shows the same page wherever it is opened.',
      '下面的链接带着打开本页时的 <code>t0</code>（由脚本设置）、所选的 <code>step</code> 和语言。没有脚本时，链接指向不带参数的路径（默认 t0）。本页会在这个浏览器里记住你选的语言；场景页面本身只从链接里读语言，所以同一个链接在哪里打开都显示同样的页面。',
      'p'
    ) +
    '</section>\n' +
    '<ol class="list">\n' + rows + '\n</ol>\n</main>\n' +
    '<footer class="fixture-footer">' + both(FOOTER, '自动化页面关注测试用的测试页面，不是真实商店。') + '</footer>\n' +
    '<script>\n' +
    '(function () {\n' +
    '  var LANG_KEY = "wf-index-lang";\n' +
    '  var t0 = Date.now();\n' +
    '  var step = document.getElementById("step");\n' +
    '  var debug = document.getElementById("debug");\n' +
    '  var lang = document.getElementById("lang");\n' +
    '  function remembered() {\n' +
    '    try { return localStorage.getItem(LANG_KEY) || ""; } catch (e) { return ""; }\n' +
    '  }\n' +
    '  function remember(v) {\n' +
    '    try { if (v) localStorage.setItem(LANG_KEY, v); else localStorage.removeItem(LANG_KEY); } catch (e) { /* storage unavailable: the choice lasts for this visit */ }\n' +
    '  }\n' +
    '  function showLang() {\n' +
    '    var zh = lang.value === "zh";\n' +
    '    document.documentElement.lang = zh ? "zh-CN" : "en";\n' +
    '    document.title = zh ? "页面关注测试页" : "Page-watching test fixtures";\n' +
    '    Array.prototype.forEach.call(document.querySelectorAll("option[data-zh]"), function (o) { o.textContent = o.getAttribute(zh ? "data-zh" : "data-en"); });\n' +
    '  }\n' +
    '  function apply() {\n' +
    '    document.getElementById("t0").textContent = t0 + " (" + new Date(t0).toISOString() + ")";\n' +
    '    var lq = lang.value ? "&lang=" + lang.value : "";\n' +
    '    var q = "?t0=" + t0 + "&step=" + step.value + lq + (debug.checked ? "&debug=1" : "");\n' +
    '    Array.prototype.forEach.call(document.querySelectorAll(".sc"), function (li) {\n' +
    '      li.querySelector("a.go").href = li.getAttribute("data-path") + q;\n' +
    '      li.querySelector("a.dbg").href = li.getAttribute("data-path") + "?t0=" + t0 + "&step=" + step.value + lq + "&debug=1";\n' +
    '    });\n' +
    '  }\n' +
    '  // ?lang= on the index wins and is remembered; otherwise the remembered choice.\n' +
    '  var asked = new URLSearchParams(location.search).get("lang");\n' +
    '  if (asked === "zh" || asked === "en") { lang.value = asked; remember(asked); }\n' +
    '  else lang.value = remembered();\n' +
    '  document.getElementById("reset").addEventListener("click", function () { t0 = Date.now(); apply(); });\n' +
    '  step.addEventListener("change", apply);\n' +
    '  debug.addEventListener("change", apply);\n' +
    '  lang.addEventListener("change", function () {\n' +
    '    remember(lang.value);\n' +
    '    showLang();\n' +
    '    apply();\n' +
    '    try { history.replaceState(null, "", lang.value ? "?lang=" + lang.value : location.pathname); } catch (e) { /* not essential */ }\n' +
    '  });\n' +
    '  showLang();\n' +
    '  apply();\n' +
    '})();\n' +
    '</script>\n</body>\n</html>\n'
  );
}

function readme(model) {
  var table = model.scenarios
    .map(function (s) {
      return '| ' + s.number + ' | `' + s.id + '` | [' + s.path + '](' + BASE_URL + s.path + ') | ' + s.phaseCount + ' | ' + s.watched.map(function (w) { return '`' + w.key + '`'; }).join(', ') + ' |';
    })
    .join('\n');
  return [
    '# Page-watching test fixtures',
    '',
    'Static test pages for a "watch this page" feature: an agent periodically opens a page in a real browser, reads what the user cares about (a price, stock, new items, a status…), compares it with earlier checks, and decides whether to notify the user or whether a stop condition is met. Every page\'s state is a pure function of **(current time, URL parameters)**, so a test harness knows the right answer in advance.',
    '',
    'Live site: ' + BASE_URL,
    '',
    'All stores, brands, products, people and services here are fictional. Every page carries the footer "' + FOOTER + '" Plain HTML, CSS and vanilla JS only: no CDN, external fonts, images, analytics or trackers.',
    '',
    '## Time model',
    '',
    '| Parameter | Meaning | Default |',
    '| --- | --- | --- |',
    '| `t0` | Epoch milliseconds when the scenario timeline starts | most recent midnight UTC |',
    '| `step` | Seconds per phase | `600` |',
    '| `now` | Optional epoch ms that pins the current time (live pages advance from it in real time) | real clock |',
    '| `seed` | Optional string mixed into the PRNG (noise only; also the late-render delay) | `1` |',
    '| `debug` | `1` appends an answer-key panel (phase, timeline table, watched value now). Without it the panel is not in the DOM at all | off |',
    '| `lang` | `en` or `zh`: the page language. Only words change; numbers, prices, currencies and the timeline are identical, so `scenarios.json` holds for both | the scenario\'s own (`zh` for `zh-price`, otherwise `en`) |',
    '',
    '```',
    'rawPhase = max(0, floor((now - t0) / (step * 1000)))',
    'phase    = min(rawPhase, phaseCount - 1)      # every scenario holds at its last phase; none loops',
    'phase k starts at t0 + k * step * 1000',
    '```',
    '',
    'Pages compute their state once, on load; there is no auto-refresh. The only exception is `live-ticker`, which is about live updates and re-renders every 3 seconds. Some deliberate noise depends on the exact load time (countdowns, "N minutes ago", "N people viewing"), never the watched values. There is no `Math.random`: noise comes from mulberry32 seeded with FNV-1a of `"<scenario id>|<seed>|<salt>|<time bucket>"`.',
    '',
    'To drive a scenario, pick `t0` and `step`, then open `' + BASE_URL + 's/<id>/?t0=<t0>&step=<step>` whenever the watcher checks. With `step=60` phase *k* is live from `t0 + 60k` to `t0 + 60(k+1)` seconds. To check a specific phase directly, add `now=<t0 + k*step*1000 + 1000>`.',
    '',
    'GitHub Pages serves every page with HTTP 200, so the "error", "gone" and "moved" states are page content (and the redirect in `page-gone` is client-side).',
    '',
    '## Languages',
    '',
    'Every page exists in English and Chinese. Scenario code is written in the page\'s own language; `?lang=` asks for the other one, and `assets/core.js` translates the page on the client with the dictionaries in `assets/i18n/` (`common.js` for the shared store chrome, one file per scenario). Every text node and the `placeholder`, `aria-label`, `alt` and `title` attributes are translated, including text a scenario inserts later (a `MutationObserver`); dates and relative times are converted first. Brand, product and people\'s names, SKUs, numbers, prices and currencies stay as they are. The internal links and the `page-gone` redirect keep the query string, so the language survives them.',
    '',
    'The index page is in both languages too (`tools/meta-zh.js` holds the Chinese scenario titles and descriptions). It remembers the language you pick in that browser and writes it into every scenario link it builds. The scenario pages never read a remembered choice: their language comes from the link alone, so a link shows the same page in any browser, which is what makes the answer key hold.',
    '',
    '`node tools/i18n-extract.js --lang zh --untranslated` lists rendered text that still contains Latin words after translating (names on a scenario\'s keep list excepted); `--lang en --only zh-price` does the same the other way. Text a scenario inserts after load is checked by `tools/validate.js`, which also loads every phase of every page in the other language.',
    '',
    '## scenarios.json',
    '',
    '[`scenarios.json`](scenarios.json) is the answer key, generated from the same JavaScript the pages run (`assets/core.js`, `assets/scenarios/*.js`) plus `tools/meta.js`. Per scenario it lists:',
    '',
    '- `id`, `path`, `urlTemplate`, `description`, `watched` (keys and labels);',
    '- `phases`: for each phase the `watched` values and other visible `context`, plus `readable: false` when the value cannot be read (login wall, error page);',
    '- `afterLastPhase` (`holds` for every scenario) and `afterLastNotes`;',
    '- `examples`: 1–4 natural-language watch requests, each with `expected` (one verdict per phase: `baseline`, `report`, `skip`, `optional`, `unreadable`, `n/a`), `reportPhases`, an optional `startPhase` and per-phase `notes`;',
    '- `stopConditions`: each with the first `phase` at which it becomes true (`null` = never).',
    '',
    'Comparisons in `expected` are always against the last readable phase. Threshold requests are edge-triggered: they report when the condition becomes true; a further move while it stays true is `optional`.',
    '',
    '## Scenarios',
    '',
    '| # | id | page | phases | watched keys |',
    '| --- | --- | --- | --- | --- |',
    table,
    '',
    'See `scenarios.json` or open any page with `?debug=1` for the full timelines.',
    '',
    '## Manual test plan',
    '',
    '[`qa/`](' + BASE_URL + 'qa/) is the manual test plan (in Chinese) for watching pages with Phi and the task reports that follow, with a link generator and this site\'s answer key per phase. It is generated in the phi-ai repository and copied here as a static page; `tools/build.js` does not touch it.',
    '',
    '## Development',
    '',
    '```',
    'node tools/build.js            # regenerate scenarios.json, s/*/index.html, index.html, README.md',
    'node tools/i18n-extract.js --lang zh --untranslated   # rendered text the zh dictionaries miss',
    'node tools/build.js --check    # fail if a generated file is stale',
    'node tools/validate.js         # logic checks + every phase of every page in headless Chromium',
    'node tools/validate.js --base ' + BASE_URL + '   # same checks against the live site',
    '```',
    '',
    '`tools/validate.js` needs Node 22+ (built-in WebSocket) and a Chromium binary (`CHROME=/path/to/chrome`, or a Playwright headless shell in the default cache).',
    '',
  ].join('\n');
}

function outputs(WF, model) {
  var files = {};
  files['scenarios.json'] = JSON.stringify(model, null, 2) + '\n';
  WF.order.forEach(function (id) {
    var def = WF.registry[id];
    files[def.path + 'index.html'] = shell(def, null);
    (def.extraViews || []).forEach(function (v) {
      files[v.path + 'index.html'] = shell(def, v);
    });
  });
  files['index.html'] = indexHtml(model);
  files['README.md'] = readme(model);
  files['.nojekyll'] = '';
  return files;
}

function main() {
  var check = process.argv.indexOf('--check') >= 0;
  var WF = loadFixtures();
  var meta = require('./meta');
  var model = buildModel(WF, meta);
  var files = outputs(WF, model);
  var stale = [];
  Object.keys(files).forEach(function (rel) {
    var abs = path.join(ROOT, rel);
    var cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (cur === files[rel]) return;
    stale.push(rel);
    if (!check) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, files[rel]);
    }
  });
  if (check && stale.length) {
    console.error('stale generated files: ' + stale.join(', '));
    process.exit(1);
  }
  console.log((check ? 'checked ' : 'built ') + model.scenarios.length + ' scenarios; ' + (check ? 'all generated files up to date' : stale.length + ' file(s) written'));
}

module.exports = { loadFixtures: loadFixtures, buildModel: buildModel, ROOT: ROOT, BASE_URL: BASE_URL };

if (require.main === module) main();
