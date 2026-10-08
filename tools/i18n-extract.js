#!/usr/bin/env node
'use strict';
/**
 * Lists the visible text a scenario renders, over every phase and view, so
 * the translations can be checked for coverage.
 *
 * Usage: node tools/i18n-extract.js [--lang zh] [--only id1,id2] [--untranslated] [--json]
 *   --lang zh        translate each segment with the zh dictionaries first
 *   --untranslated   print only segments that still contain Latin words after translating
 */
var build = require('./build');

var args = process.argv.slice(2);
function arg(name, dflt) {
  var i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
}
var LANG = arg('--lang', null);
var ONLY = arg('--only', null);
var UNTRANSLATED = args.indexOf('--untranslated') >= 0;
var JSON_OUT = args.indexOf('--json') >= 0;

// Some renders set document.title; a stand-in records it.
globalThis.document = globalThis.document || { title: '' };

var WF = build.loadFixtures();
var T0 = Date.UTC(2026, 9, 1, 0, 0, 0);
var STEP = 600;

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&copy;/g, '©')
    .replace(/&deg;/g, '°')
    .replace(/&bull;/g, '•')
    .replace(/&times;/g, '×')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&rarr;/g, '→')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); });
}

function segments(html) {
  var out = [];
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  html.replace(/>([^<]+)</g, function (_, text) {
    var t = decode(text).replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
    return _;
  });
  html.replace(/\s(placeholder|aria-label|alt|title)="([^"]*)"/g, function (_, attr, v) {
    var t = decode(v).replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
    return _;
  });
  return out;
}

function untranslated(text, id) {
  return WF.i18n.missing(text, LANG || 'zh', id);
}
var found = {};
WF.order.forEach(function (id) {
  if (ONLY && ONLY.split(',').indexOf(id) < 0) return;
  var def = WF.registry[id];
  if (LANG && WF.nativeLang(def) === LANG) return;
  var views = [{ view: 'main', docTitle: def.docTitle }].concat(def.extraViews || []);
  var seen = {};
  views.forEach(function (v) {
    for (var k = 0; k < def.timeline.length; k++) {
      var q = '?t0=' + T0 + '&step=' + STEP + '&now=' + (T0 + k * STEP * 1000 + 1000) + (LANG ? '&lang=' + LANG : '');
      var ctx = WF.makeCtx(def, WF.parseParams(q), { view: v.view });
      var st = WF.computeState(def, ctx);
      document.title = '';
      var out = def.render(ctx, st);
      var texts = [v.docTitle, document.title].filter(Boolean).concat(typeof out === 'string' ? segments(out) : []);
      if (def.extraText) texts = texts.concat(def.extraText(ctx, st).map(function (h) { return segments('>' + h + '<'); }).reduce(function (a, b) { return a.concat(b); }, []));
      texts.forEach(function (t) {
        var shown = LANG && WF.i18n ? WF.i18n.text(t, LANG, id) : t;
        if (UNTRANSLATED && !untranslated(shown, id)) return;
        if (!seen[t]) seen[t] = shown;
      });
    }
  });
  found[id] = seen;
});

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(found, null, 1));
} else {
  var total = 0;
  Object.keys(found).forEach(function (id) {
    var keys = Object.keys(found[id]);
    total += keys.length;
    console.log('## ' + id + ' (' + keys.length + ')');
    keys.forEach(function (k) { console.log(LANG ? k + '  =>  ' + found[id][k] : k); });
  });
  console.log('TOTAL', total);
}
