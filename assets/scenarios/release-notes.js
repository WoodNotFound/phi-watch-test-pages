(function (WF) {
  'use strict';
  var esc = WF.esc;

  // agoDays: released before t0. phase: released at the start of that phase.
  var RELEASES = [
    { v: '2.7.3', agoDays: 70, notes: ['Fix WAL replay when the last segment is empty.', 'Reduce memory use of the page cache by 12%.'] },
    { v: '2.7.4', agoDays: 51, notes: ['Security: reject oversized batch headers.', 'Fix a rare deadlock during checkpointing.'] },
    { v: '2.8.0', agoDays: 33, notes: ['New: incremental backups (driftwood backup --incremental).', 'New: per-table compression settings.', 'Deprecated: the legacy v1 wire protocol.'] },
    { v: '2.8.1', agoDays: 12, notes: ['Fix incorrect row counts after ALTER TABLE on compressed tables.'] },
    { v: '2.8.2', phase: 1, notes: ['Fix a crash when compacting empty segments.', 'Improve error message for unsupported collations.'] },
    { v: '3.0.0-rc.1', phase: 2, pre: true, notes: ['First release candidate for Driftwood 3.0.', 'New storage format (automatic migration on first start).', 'Removed: legacy v1 wire protocol.'] },
    { v: '3.0.0-rc.2', phase: 4, pre: true, notes: ['Fix migration of tables with more than 4,096 columns.', 'Faster startup on large data directories.'] },
    { v: '3.0.0', phase: 5, notes: ['Driftwood 3.0 is here: new storage format, 2× faster range scans, and native JSON columns.', 'See the upgrade guide before migrating production data.'] },
    { v: '3.0.1', phase: 6, notes: ['Fix JSON path queries on NULL values.', 'Packaging fixes for ARM64 Linux.'] },
  ];
  // Edit: from phase 3 the rc.1 entry gains a "Known issues" note.
  var RC1_KNOWN_ISSUES_FROM = 3;
  var PHASE_COUNT = 7;

  function releasesAt(k) {
    return RELEASES.filter(function (r) { return r.phase == null || r.phase <= k; })
      .slice()
      .reverse();
  }

  var timeline = [];
  for (var k = 0; k < PHASE_COUNT; k++) {
    var rs = releasesAt(k);
    var stable = rs.filter(function (r) { return !r.pre; });
    timeline.push({
      versions: rs.map(function (r) { return r.v; }),
      latest: rs[0].v,
      latestStable: stable[0].v,
      rc1KnownIssues: k >= RC1_KNOWN_ISSUES_FROM,
    });
  }

  WF.define({
    id: 'release-notes',
    title: 'Release notes / changelog',
    path: 's/release-notes/',
    docTitle: 'Releases · Driftwood DB',
    watched: [
      { key: 'versions', label: 'Versions listed, newest first' },
      { key: 'latest', label: 'Newest release (including pre-releases)' },
      { key: 'latestStable', label: 'Newest stable release (the "Latest stable" box)' },
    ],
    timeline: timeline,
    render: function (ctx, st) {
      var rs = releasesAt(ctx.phase);
      var entries = rs.map(function (r) {
        var at = r.phase != null ? ctx.startOf(r.phase) : ctx.t0 - r.agoDays * WF.DAY_MS + 15 * 3600000;
        var badge = r.pre ? '<span class="pill warn">Pre-release</span>' : r.v === st.latestStable ? '<span class="pill ok">Latest stable</span>' : '';
        var notes = r.notes.slice();
        if (r.v === '3.0.0-rc.1' && st.rc1KnownIssues) notes.push('Known issues: backups created with 2.x cannot yet be restored into 3.0.0-rc.1; fixed in the next candidate.');
        return (
          '<article class="release" data-version="' + r.v + '"><header><h2 class="release-version">Driftwood ' + esc(r.v) + '</h2> ' + badge + '</header>' +
          '<p class="muted small">Released <time datetime="' + WF.fmt.iso(at) + '">' + esc(WF.fmt.dateTime(at)) + '</time></p>' +
          '<ul>' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
          '<p class="small"><a href="#">Download</a> · <a href="#">Checksums</a> · <a href="#">Full changelog</a></p></article>'
        );
      }).join('');
      return (
        '<style>.dw{--brand:#8a4b1f;--brand-soft:#f7eee6}.dw header.top{border-bottom:1px solid var(--line)}.dw .release{border-bottom:1px solid var(--line);padding:18px 0}' +
        '.dw .release header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dw .release h2{margin:0}.dw .layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:32px}' +
        '@media (max-width:820px){.dw .layout{grid-template-columns:1fr}}.dw .box{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-top:18px}</style>' +
        '<div class="dw"><header class="top site-header"><div class="wrap header-row"><a class="logo" href="#"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#8a4b1f"/><path d="M6 21c6-6 16-6 22 0M9 26c5-4 11-4 16 0" stroke="#fff" stroke-width="2.5" fill="none"/></svg><span>Driftwood DB</span></a>' +
        '<nav class="utility"><a href="#">Docs</a><a href="#">Download</a><a href="#">Releases</a><a href="#">Community</a></nav></div></header>' +
        '<main class="wrap"><div class="layout"><div><div class="page-head"><h1>Releases</h1><p class="muted">Every Driftwood DB release, newest first. Pre-releases are for testing only.</p></div>' + entries + '</div>' +
        '<aside><div class="box" id="latest-stable"><strong>Latest stable</strong><p style="font-size:1.5rem;margin:6px 0" id="latest-stable-version">' + esc(st.latestStable) + '</p><a class="btn" href="#">Download</a></div>' +
        '<div class="box"><strong>Release cadence</strong><p class="small">Patch releases as needed; minor releases about every six weeks.</p></div></aside></div></main>' +
        '<footer class="store-footer"><div class="wrap"><p class="legal">Driftwood DB is a fictional open-source project.</p></div></footer></div>'
      );
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
