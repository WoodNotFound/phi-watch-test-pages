'use strict';
/**
 * Expectation rules: turn a phase list plus a request rule into a per-phase verdict.
 *
 * Verdicts
 *   baseline   first check of the watch; record values, nothing to report yet
 *   report     a change worth telling the user
 *   skip       nothing worth telling the user
 *   optional   telling the user is acceptable but not required (see the note)
 *   unreadable the watched value cannot be read in this phase; the watcher must not
 *              report a value change (saying "could not read the page" is fine)
 *   n/a        before the request's startPhase
 *
 * Comparisons are always against the last phase in which the value was readable.
 */

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isReadable(e) {
  return e.readable !== false;
}

function evaluate(phases, rule) {
  var start = rule.startPhase || 0;
  var overrides = rule.overrides || {};
  var expected = [];
  var notes = {};
  var prev = null;
  phases.forEach(function (cur, k) {
    var a;
    if (k < start) a = 'n/a';
    else if (!isReadable(cur)) a = 'unreadable';
    else if (prev === null) a = 'baseline';
    else a = rule.decide(cur, prev, k, phases);
    if (overrides[k] !== undefined) a = overrides[k];
    if (Array.isArray(a)) {
      notes[k] = a[1];
      a = a[0];
    }
    expected.push(a);
    if (k >= start && isReadable(cur)) prev = cur;
  });
  var reportPhases = [];
  expected.forEach(function (a, k) {
    if (a === 'report') reportPhases.push(k);
  });
  return { expected: expected, notes: notes, reportPhases: reportPhases };
}

/** Report when any of the keys differs from the last readable phase. */
function changed() {
  var keys = Array.prototype.slice.call(arguments);
  return function (c, p) {
    return keys.some(function (k) {
      return !eq(c[k], p[k]);
    })
      ? 'report'
      : 'skip';
  };
}

/** Report when a numeric key goes down compared with the last readable phase. */
function decreased(key) {
  return function (c, p) {
    return c[key] < p[key] ? 'report' : 'skip';
  };
}

/**
 * Edge-triggered condition: report when pred becomes true.
 *   opt.keys  watched keys; a change while pred stays true yields opt.still (default 'skip')
 *   opt.exit  verdict when pred stops holding (default 'optional' with a generic note)
 */
function entered(pred, opt) {
  opt = opt || {};
  var keys = opt.keys || [];
  var still = opt.still || 'skip';
  var exit = opt.exit || ['optional', 'The condition no longer holds; mentioning that is fine but not required.'];
  return function (c, p) {
    var a = pred(c);
    var b = pred(p);
    if (a && !b) return 'report';
    if (!a && b) return exit;
    if (a && b && keys.some(function (k) { return !eq(c[k], p[k]); })) return still;
    return 'skip';
  };
}

/** First phase >= start whose (readable) state satisfies pred(state, k, phases); null if never. */
function firstPhase(phases, pred, start) {
  for (var k = start || 0; k < phases.length; k++) {
    if (isReadable(phases[k]) && pred(phases[k], k, phases)) return k;
  }
  return null;
}

/** true if some phase before k satisfies pred */
function earlier(phases, k, pred) {
  for (var i = 0; i < k; i++) if (isReadable(phases[i]) && pred(phases[i])) return true;
  return false;
}

module.exports = { eq: eq, isReadable: isReadable, evaluate: evaluate, changed: changed, decreased: decreased, entered: entered, firstPhase: firstPhase, earlier: earlier };
