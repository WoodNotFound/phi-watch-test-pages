/*
 * Page-watching test fixtures: shared core.
 *
 * Every scenario page loads this file, then assets/shop.js, then its own
 * assets/scenarios/<id>.js, then calls WatchFixtures.mount('<id>').
 * The Node tools (tools/build.js, tools/validate.js) load the very same files,
 * so the page logic and scenarios.json cannot drift apart.
 *
 * Time model
 *   t0    epoch ms when the scenario timeline starts (default: most recent midnight UTC)
 *   step  seconds per phase (default 600)
 *   now   optional epoch ms that pins "current time" (harness convenience)
 *   seed  optional string mixed into every PRNG (default "1")
 *   debug 1 shows the answer-key panel at the bottom (absent from the DOM otherwise)
 *   lang  en | zh: the page language (default: the scenario's own, English except zh-price).
 *         Only words change: numbers, prices, currencies and the timeline are the same in
 *         every language, so scenarios.json holds for both.
 *
 *   rawPhase = max(0, floor((now - t0) / (step * 1000)))
 *   phase    = min(rawPhase, phaseCount - 1)          (or rawPhase % phaseCount if the scenario loops)
 */
(function (root) {
  'use strict';

  var DAY_MS = 86400000;
  var DEFAULT_STEP_S = 600;

  // ---------------------------------------------------------------- PRNG
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** rng('a', 1, 'b') -> deterministic PRNG seeded by the joined key "a|1|b". */
  function rng() {
    return mulberry32(fnv1a(Array.prototype.slice.call(arguments).join('|')));
  }

  function rint(rand, lo, hi) {
    return lo + Math.floor(rand() * (hi - lo + 1));
  }

  function shuffle(rand, list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // ---------------------------------------------------------------- params / time
  function toNum(v, dflt) {
    if (v === null || v === undefined || v === '') return dflt;
    var n = Number(v);
    return isFinite(n) ? n : dflt;
  }

  function parseParams(search, realNow) {
    var q = new URLSearchParams(search || '');
    var nowRaw = q.get('now');
    var nowPinned = nowRaw !== null && nowRaw !== '' && isFinite(Number(nowRaw));
    var now = nowPinned ? Number(nowRaw) : realNow != null ? realNow : Date.now();
    var t0 = toNum(q.get('t0'), Math.floor(now / DAY_MS) * DAY_MS);
    var step = toNum(q.get('step'), DEFAULT_STEP_S);
    if (!(step > 0)) step = DEFAULT_STEP_S;
    var dbg = q.get('debug');
    var lang = (q.get('lang') || '').toLowerCase();
    return {
      now: now,
      t0: t0,
      step: step,
      seed: q.get('seed') || '1',
      lang: lang === 'zh' || lang === 'zh-cn' ? 'zh' : lang === 'en' ? 'en' : null,
      debug: dbg === '1' || dbg === 'true',
      nowPinned: nowPinned,
      search: search || '',
    };
  }

  function phaseAt(def, p, at) {
    var stepMs = p.step * 1000;
    var raw = Math.max(0, Math.floor((at - p.t0) / stepMs));
    var n = def.timeline.length;
    return { raw: raw, phase: def.loops ? raw % n : Math.min(raw, n - 1) };
  }

  function makeCtx(def, p, opts) {
    opts = opts || {};
    var stepMs = p.step * 1000;
    var at = phaseAt(def, p, p.now);
    var loadedAt = Date.now();
    var ctx = {
      id: def.id,
      def: def,
      params: p,
      now: p.now,
      t0: p.t0,
      step: p.step,
      stepMs: stepMs,
      rawPhase: at.raw,
      phase: at.phase,
      phaseCount: def.timeline.length,
      phaseStart: p.t0 + at.raw * stepMs,
      nextPhaseAt: p.t0 + (at.raw + 1) * stepMs,
      view: opts.view || 'main',
      root: opts.root || '../../',
      entry: def.timeline[at.phase],
      nativeLang: nativeLang(def),
      lang: p.lang || nativeLang(def),
    };
    ctx.startOf = function (k) {
      return p.t0 + k * stepMs;
    };
    ctx.rng = function () {
      return rng.apply(null, [def.id, p.seed].concat(Array.prototype.slice.call(arguments)));
    };
    /** Current time for live pages: real time, or the pinned `now` advancing in real time. */
    ctx.clock = function () {
      return p.nowPinned ? p.now + (Date.now() - loadedAt) : Date.now();
    };
    ctx.phaseAtTime = function (t) {
      return phaseAt(def, p, t);
    };
    return ctx;
  }

  function clone(o) {
    return o === undefined ? o : JSON.parse(JSON.stringify(o));
  }

  function computeState(def, ctx) {
    return def.state ? def.state(ctx) : clone(def.timeline[ctx.phase]);
  }

  function pickWatched(def, obj) {
    var out = {};
    def.watched.forEach(function (w) {
      out[w.key] = obj[w.key] === undefined ? null : obj[w.key];
    });
    return out;
  }

  /** The watched values the page shows right now (default: pick(state, watched keys)). */
  function watchedNow(def, ctx, state) {
    return def.watchedNow ? def.watchedNow(ctx, state) : pickWatched(def, state);
  }

  // ---------------------------------------------------------------- formatting
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function group(intStr, sep) {
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  var fmt = {
    /** money(1299, {symbol:'¥'}) -> "¥1,299.00" */
    money: function (n, o) {
      o = o || {};
      var sym = o.symbol == null ? '$' : o.symbol;
      var dec = o.decimals == null ? 2 : o.decimals;
      var parts = Math.abs(n).toFixed(dec).split('.');
      var body = group(parts[0], o.group == null ? ',' : o.group) + (parts.length > 1 ? (o.point || '.') + parts[1] : '');
      return (n < 0 ? '-' : '') + (o.after ? body + sym : sym + body);
    },
    num: function (n, dec) {
      var parts = Math.abs(n).toFixed(dec || 0).split('.');
      return (n < 0 ? '-' : '') + group(parts[0], ',') + (parts.length > 1 ? '.' + parts[1] : '');
    },
    /** "Monday, October 5, 2026" (UTC) */
    dateLong: function (ms) {
      var d = new Date(ms);
      return WEEKDAYS[d.getUTCDay()] + ', ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
    },
    /** "Oct 5, 2026" (UTC) */
    dateShort: function (ms) {
      var d = new Date(ms);
      return MONTHS[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
    },
    /** "Mon, Oct 5" (UTC) */
    dayShort: function (ms) {
      var d = new Date(ms);
      return WEEKDAYS[d.getUTCDay()].slice(0, 3) + ', ' + MONTHS[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCDate();
    },
    /** "14:20 UTC" */
    time: function (ms) {
      var d = new Date(ms);
      return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ' UTC';
    },
    /** "Oct 5, 2026, 14:20 UTC" */
    dateTime: function (ms) {
      return fmt.dateShort(ms) + ', ' + fmt.time(ms);
    },
    iso: function (ms) {
      return new Date(ms).toISOString();
    },
    /** "2026-10-05" (UTC) */
    ymd: function (ms) {
      return new Date(ms).toISOString().slice(0, 10);
    },
    /** "10月5日" (UTC) */
    zhMonthDay: function (ms) {
      var d = new Date(ms);
      return d.getUTCMonth() + 1 + '月' + d.getUTCDate() + '日';
    },
    /** "2026年10月5日" (UTC) */
    zhDate: function (ms) {
      var d = new Date(ms);
      return d.getUTCFullYear() + '年' + (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日';
    },
    /** relative time in English: "just now", "12 minutes ago", "3 hours ago", "2 days ago" */
    rel: function (ms, now) {
      var s = Math.max(0, Math.round((now - ms) / 1000));
      if (s < 60) return 'just now';
      var m = Math.floor(s / 60);
      if (m < 60) return m === 1 ? '1 minute ago' : m + ' minutes ago';
      var h = Math.floor(m / 60);
      if (h < 24) return h === 1 ? '1 hour ago' : h + ' hours ago';
      var d = Math.floor(h / 24);
      return d === 1 ? '1 day ago' : d + ' days ago';
    },
    /** duration: "2 days 3 hours", "1 hour 5 minutes", "8 minutes" */
    duration: function (ms) {
      var m = Math.max(0, Math.floor(ms / 60000));
      var d = Math.floor(m / 1440);
      var h = Math.floor((m % 1440) / 60);
      var mm = m % 60;
      function u(n, w) {
        return n + ' ' + w + (n === 1 ? '' : 's');
      }
      if (d > 0) return u(d, 'day') + (h ? ' ' + u(h, 'hour') : '');
      if (h > 0) return u(h, 'hour') + (mm ? ' ' + u(mm, 'minute') : '');
      return mm > 0 ? u(mm, 'minute') : 'less than a minute';
    },
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Keep the current query string (t0, step, seed, debug, now) on an internal link. */
  function keepParams(path) {
    var search = root.location ? root.location.search : '';
    return path + (search || '');
  }

  // ---------------------------------------------------------------- language
  /*
   * Scenario code is written in the page's own language (def.lang, English
   * unless set). When ?lang= asks for the other one, the page is translated on
   * the client: every text node and the placeholder / aria-label / alt / title
   * attributes go through the dictionaries in assets/i18n/, including text a
   * scenario inserts later (a MutationObserver), so scenario logic stays in one
   * language and the timeline cannot drift between languages.
   *
   * An entry matches a whole text node with its whitespace collapsed. Dates and
   * relative times are converted first, so patterns see them in the target
   * language. Text without an entry stays as it is: brand, product and people's
   * names, SKUs, numbers and prices.
   */
  function nativeLang(def) {
    return def.lang && def.lang.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  var dicts = {}; // dicts[lang][scope] = { exact, patterns, keep }; scope '*' is shared

  function collapse(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function addTranslations(scope, spec) {
    Object.keys(spec).forEach(function (key) {
      var m = /^(en|zh)(Patterns|Keep)?$/.exec(key);
      if (!m) throw new Error('i18n: unknown key ' + key + ' in ' + scope);
      var byScope = (dicts[m[1]] = dicts[m[1]] || {});
      var d = (byScope[scope] = byScope[scope] || { exact: {}, patterns: [], keep: [] });
      if (m[2] === 'Patterns') d.patterns = d.patterns.concat(spec[key]);
      else if (m[2] === 'Keep') d.keep = d.keep.concat(spec[key]);
      else
        Object.keys(spec[key]).forEach(function (k) {
          d.exact[collapse(k)] = spec[key][k];
        });
    });
  }

  var MONTH_RE = MONTHS.join('|');
  var MONTH3_RE = MONTHS.map(function (m) { return m.slice(0, 3); }).join('|');
  var WEEKDAY_RE = WEEKDAYS.join('|');
  var WEEKDAY3_RE = WEEKDAYS.map(function (d) { return d.slice(0, 3); }).join('|');
  var ZH_WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];
  var ZH_UNIT = { second: '秒', minute: '分钟', hour: '小时', day: '天', week: '周', month: '个月', year: '年' };

  function monthIndex(name) {
    for (var i = 0; i < 12; i++) if (MONTHS[i].indexOf(name) === 0) return i;
    return -1;
  }
  function weekdayIndex(name) {
    for (var i = 0; i < 7; i++) if (WEEKDAYS[i].indexOf(name) === 0) return i;
    return -1;
  }

  /** Dates, relative times and durations in the target language (the words around them stay). */
  var generic = {
    zh: function (s) {
      return s
        .replace(new RegExp('\\b(' + WEEKDAY_RE + '), (' + MONTH_RE + ') (\\d{1,2}), (\\d{4})\\b', 'g'), function (_, w, mo, d, y) {
          return y + '年' + (monthIndex(mo) + 1) + '月' + d + '日（星期' + ZH_WEEKDAY[weekdayIndex(w)] + '）';
        })
        .replace(new RegExp('\\b(' + WEEKDAY3_RE + '), (' + MONTH3_RE + ') (\\d{1,2})\\b', 'g'), function (_, w, mo, d) {
          return monthIndex(mo) + 1 + '月' + d + '日（周' + ZH_WEEKDAY[weekdayIndex(w)] + '）';
        })
        .replace(new RegExp('\\b(' + MONTH_RE + '|' + MONTH3_RE + ') (\\d{1,2}), (\\d{4})\\b', 'g'), function (_, mo, d, y) {
          return y + '年' + (monthIndex(mo) + 1) + '月' + d + '日';
        })
        .replace(/(\d{4}年\d{1,2}月\d{1,2}日), (\d{2}:\d{2} UTC)/g, '$1 $2')
        .replace(/\bjust now\b/g, '刚刚')
        .replace(/\bless than a minute\b/g, '不到 1 分钟')
        .replace(/\b(\d+) (second|minute|hour|day|week|month|year)s? ago\b/g, function (_, n, u) {
          return n + ' ' + ZH_UNIT[u] + '前';
        })
        .replace(/\b(\d+) (day|hour|minute)s? (\d+) (hour|minute)s?\b/g, function (_, a, u1, b, u2) {
          return a + ' ' + ZH_UNIT[u1] + ' ' + b + ' ' + ZH_UNIT[u2];
        })
        .replace(/\b(\d+) (day|hour|minute)s?\b/g, function (_, n, u) {
          return n + ' ' + ZH_UNIT[u];
        });
    },
    en: function (s) {
      return s
        .replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, function (_, y, m, d) {
          return MONTHS[m - 1] + ' ' + d + ', ' + y;
        })
        .replace(/(\d{1,2})月(\d{1,2})日/g, function (_, m, d) {
          return MONTHS[m - 1].slice(0, 3) + ' ' + d;
        });
    },
  };

  function scopes(lang, scope) {
    var byScope = dicts[lang] || {};
    return [byScope[scope], byScope['*']].filter(Boolean);
  }

  function lookup(lang, scope, s) {
    var list = scopes(lang, scope);
    for (var i = 0; i < list.length; i++) if (Object.prototype.hasOwnProperty.call(list[i].exact, s)) return list[i].exact[s];
    return null;
  }

  function byPattern(lang, scope, s) {
    var list = scopes(lang, scope);
    var tr = function (x) {
      return translateText(x, lang, scope);
    };
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < list[i].patterns.length; j++) {
        var re = list[i].patterns[j][0];
        var rep = list[i].patterns[j][1];
        var m = re.exec(s);
        if (!m) continue;
        return typeof rep === 'function' ? rep(m, tr) : s.replace(re, rep);
      }
    }
    return null;
  }

  /** Translate one text (a text node's value or an attribute) into lang. */
  function translateText(s, lang, scope) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(String(s));
    var core = collapse(m[2]);
    if (!core) return s;
    var hit = lookup(lang, scope, core);
    if (hit === null) {
      var g = generic[lang] ? generic[lang](core) : core;
      if (g !== core) hit = lookup(lang, scope, g);
      if (hit === null) hit = byPattern(lang, scope, g);
      if (hit === null && g !== core) hit = g;
    }
    return hit === null ? s : m[1] + hit + m[3];
  }

  /** Words of a scope that legitimately stay Latin in lang (names, SKUs); used by tools/i18n-extract.js. */
  function keepPattern(scope, lang) {
    var words = [];
    scopes(lang || 'zh', scope).forEach(function (d) {
      words = words.concat(d.keep);
    });
    if (!words.length) return /$^/;
    words.sort(function (a, b) { return b.length - a.length; });
    var alt = words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
    return new RegExp('(?<![A-Za-z])(?:' + alt + ')(?![A-Za-z])', 'g');
  }

  /**
   * Whether a shown text still reads in the source language after translating
   * into lang: Han characters for en; for zh, Latin words other than the
   * scope's keep list, people's names ("Mara K.") and codes (SKUs, references).
   */
  function missing(text, lang, scope) {
    if (lang === 'en') return /[\u3400-\u9fff]/.test(text);
    var rest = String(text)
      .replace(keepPattern(scope, lang), '')
      .replace(/\p{Lu}\p{Ll}+ \p{Lu}\./gu, '')
      .replace(/#?[A-Z][A-Z0-9]*(?:-[A-Za-z0-9]+)+/g, '');
    return /[A-Za-z]{2,}/.test(rest);
  }

  var ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];

  function translateAttrs(el, lang, scope) {
    ATTRS.forEach(function (a) {
      var v = el.getAttribute(a);
      if (v === null) return;
      var t = translateText(v, lang, scope);
      if (t !== v) el.setAttribute(a, t);
    });
  }

  function skipped(el) {
    return el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.id === 'wf-debug';
  }

  function translateNode(node, lang, scope) {
    if (node.nodeType === 3) {
      var t = translateText(node.nodeValue, lang, scope);
      if (t !== node.nodeValue) node.nodeValue = t;
      return;
    }
    if (node.nodeType !== 1 || skipped(node)) return;
    translateAttrs(node, lang, scope);
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.nodeType === 1 && skipped(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === 3) {
        var v = translateText(n.nodeValue, lang, scope);
        if (v !== n.nodeValue) n.nodeValue = v;
      } else {
        translateAttrs(n, lang, scope);
      }
    }
  }

  /** Keep translating whatever the scenario changes after the first render. */
  function watchTranslations(lang, scope) {
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === 'characterData') translateNode(r.target, lang, scope);
        else if (r.type === 'attributes') {
          if (r.target.nodeType === 1 && !skipped(r.target)) translateAttrs(r.target, lang, scope);
        } else
          Array.prototype.forEach.call(r.addedNodes, function (n) {
            translateNode(n, lang, scope);
          });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // ---------------------------------------------------------------- registry / mount
  var registry = {};
  var order = [];

  function define(def) {
    if (!def || !def.id) throw new Error('scenario needs an id');
    if (!def.timeline || !def.timeline.length) throw new Error(def.id + ': timeline is required');
    if (!def.watched || !def.watched.length) throw new Error(def.id + ': watched keys are required');
    if (registry[def.id]) throw new Error('duplicate scenario ' + def.id);
    registry[def.id] = def;
    order.push(def.id);
    return def;
  }

  function describeValue(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  function debugHtml(def, ctx, state) {
    var p = ctx.params;
    var rows = def.timeline
      .map(function (entry, k) {
        var w = pickWatched(def, entry);
        var cells = def.watched
          .map(function (wk) {
            return '<td>' + esc(describeValue(w[wk.key])) + '</td>';
          })
          .join('');
        return (
          '<tr' + (k === ctx.phase ? ' class="current"' : '') + '><td>' + k + '</td><td>' + esc(fmt.iso(ctx.startOf(k))) + '</td>' + cells + '</tr>'
        );
      })
      .join('');
    var head = def.watched
      .map(function (wk) {
        return '<th>' + esc(wk.key) + '</th>';
      })
      .join('');
    var after = def.loops
      ? 'The timeline loops: phase = rawPhase mod ' + def.timeline.length + '.'
      : 'After phase ' + (def.timeline.length - 1) + ' the state holds at the last phase.';
    if (def.afterLast) after += ' ' + def.afterLast;
    return (
      '<h2>DEBUG &middot; scenario <code>' + esc(def.id) + '</code></h2>' +
      '<dl>' +
      '<dt>phase</dt><dd id="wf-debug-phase">' + ctx.phase + ' of ' + (ctx.phaseCount - 1) + ' (raw ' + ctx.rawPhase + ')</dd>' +
      '<dt>t0</dt><dd>' + esc(p.t0) + ' = ' + esc(fmt.iso(p.t0)) + '</dd>' +
      '<dt>step</dt><dd>' + esc(p.step) + ' s</dd>' +
      '<dt>now</dt><dd>' + esc(p.now) + ' = ' + esc(fmt.iso(p.now)) + (p.nowPinned ? ' (pinned by ?now=)' : '') + '</dd>' +
      '<dt>next phase at</dt><dd>' + esc(fmt.iso(ctx.nextPhaseAt)) + '</dd>' +
      '<dt>seed</dt><dd>' + esc(p.seed) + '</dd>' +
      '<dt>watched now</dt><dd><code id="wf-debug-watched">' + esc(JSON.stringify(watchedNow(def, ctx, state))) + '</code></dd>' +
      '</dl>' +
      '<div class="scroll"><table><thead><tr><th>phase</th><th>starts (UTC)</th>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p>' + esc(after) + '</p>'
    );
  }

  function renderDebug(def, ctx, state) {
    var el = document.createElement('section');
    el.id = 'wf-debug';
    el.className = 'wf-debug';
    el.setAttribute('aria-label', 'Test debug panel');
    el.innerHTML = debugHtml(def, ctx, state);
    document.body.appendChild(el);
  }

  /** Live pages call this to refresh the "watched now" line of the debug panel (no-op without ?debug=1). */
  function updateDebugWatched(def, ctx, state) {
    var el = document.getElementById('wf-debug-watched');
    if (el) el.textContent = JSON.stringify(watchedNow(def, ctx, state));
  }

  function mount(id, opts) {
    var def = registry[id];
    if (!def) throw new Error('unknown scenario ' + id);
    var p = parseParams(root.location.search);
    var ctx = makeCtx(def, p, opts);
    var state = computeState(def, ctx);
    var out = def.render(ctx, state);
    if (out && typeof out === 'object' && out.redirect) {
      root.location.replace(out.redirect);
      return;
    }
    var app = document.getElementById('app');
    app.innerHTML = out;
    if (def.after) def.after(app, ctx, state);
    if (p.debug) renderDebug(def, ctx, state);
    document.documentElement.lang = ctx.lang === 'zh' ? 'zh-CN' : 'en';
    if (ctx.lang !== ctx.nativeLang) {
      document.title = translateText(document.title, ctx.lang, def.id);
      translateNode(document.body, ctx.lang, def.id);
      watchTranslations(ctx.lang, def.id);
    }
  }

  var WF = {
    version: '1.0.0',
    DAY_MS: DAY_MS,
    DEFAULT_STEP_S: DEFAULT_STEP_S,
    registry: registry,
    order: order,
    define: define,
    mount: mount,
    parseParams: parseParams,
    makeCtx: makeCtx,
    computeState: computeState,
    pickWatched: pickWatched,
    watchedNow: watchedNow,
    updateDebugWatched: updateDebugWatched,
    rng: rng,
    rint: rint,
    shuffle: shuffle,
    fnv1a: fnv1a,
    fmt: fmt,
    esc: esc,
    keepParams: keepParams,
    clone: clone,
    nativeLang: nativeLang,
    i18n: {
      add: addTranslations,
      text: translateText,
      node: translateNode,
      keepPattern: keepPattern,
      missing: missing,
      dicts: dicts,
    },
  };

  root.WatchFixtures = WF;
  if (typeof module !== 'undefined' && module.exports) module.exports = WF;
})(typeof globalThis !== 'undefined' ? globalThis : this);
