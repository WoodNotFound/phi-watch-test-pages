(function (WF) {
  'use strict';
  var esc = WF.esc;
  var HOUR = 3600000;

  // agoDays: posted before t0. phase: posted at the start of that phase.
  var JOBS = {
    'QJ-4101': { title: 'Senior Go Engineer', company: 'Fernhill Logistics', location: 'Berlin, Germany', tags: ['Go', 'Kubernetes', 'PostgreSQL'], salary: '€80,000–95,000', agoDays: 1.2, snippet: 'Own the routing services that plan 40,000 deliveries a day.' },
    'QJ-4098': { title: 'Rust Developer', company: 'Tessellate Robotics', location: 'Munich, Germany', tags: ['Rust', 'Embedded', 'ROS 2'], salary: '€75,000–90,000', agoDays: 2.3, snippet: 'Write firmware and motion-planning code for warehouse robots.' },
    'QJ-4093': { title: 'Frontend Engineer (React)', company: 'Pallas Health', location: 'Berlin, Germany', tags: ['React', 'TypeScript'], salary: '€65,000–80,000', agoDays: 3.1, snippet: 'Build the patient booking app used by 300 clinics.' },
    'QJ-4090': { title: 'Rust Engineer', company: 'Corvid Data', location: 'Remote (EU)', tags: ['Rust', 'Distributed systems'], salary: '€85,000–105,000', agoDays: 4.4, snippet: 'Work on a columnar storage engine. Fully remote within EU time zones.' },
    'QJ-4087': { title: 'Site Reliability Engineer', company: 'Marlowe Pay', location: 'Amsterdam, Netherlands', tags: ['Terraform', 'AWS', 'Go'], salary: '€70,000–88,000', agoDays: 5.2, snippet: 'Keep a payments platform at 99.99% availability.' },
    'QJ-4082': { title: 'Platform Engineer', company: 'Brightwater Games', location: 'Berlin, Germany', tags: ['Terraform', 'GCP', 'Python'], salary: '€72,000–86,000', agoDays: 6.1, snippet: 'Run the build farm and game-server fleet. Experience with Rust is a plus.' },
    'QJ-4077': { title: 'Backend Engineer (Kotlin)', company: 'Nordlys Mobility', location: 'Oslo, Norway', tags: ['Kotlin', 'Spring'], salary: 'NOK 850,000–1,000,000', agoDays: 7.3, snippet: 'Design APIs for an e-scooter fleet across 12 cities.' },
    'QJ-4071': { title: 'Data Scientist', company: 'Umbra Analytics', location: 'Berlin, Germany', tags: ['Python', 'SQL'], salary: '€68,000–82,000', agoDays: 9.0, snippet: 'Forecast demand for grocery retailers.' },
    'QJ-4110': { title: 'Backend Engineer (Python)', company: 'Kiteline Travel', location: 'Berlin, Germany', tags: ['Python', 'Django', 'PostgreSQL'], salary: '€70,000–85,000', phase: 1, snippet: 'Build booking and pricing services for rail travel.' },
    'QJ-4114': { title: 'Embedded Rust Engineer', company: 'Haldor Marine', location: 'Hamburg, Germany', tags: ['Rust', 'Embedded', 'CAN bus'], salary: '€78,000–92,000', phase: 2, snippet: 'Write safety-critical firmware for electric ferries.' },
    'QJ-4117': { title: 'Rust Systems Engineer', company: 'Lattice Grid Energy', location: 'Berlin, Germany', tags: ['Rust', 'Linux', 'Networking'], salary: 'Salary not disclosed', phase: 3, snippet: 'Build the control plane that balances a city-scale battery network.' },
    'QJ-4123': { title: 'Staff Rust Engineer', company: 'Quarry Labs', location: 'Berlin, Germany (Hybrid)', tags: ['Rust', 'WebAssembly'], salary: '€110,000–130,000', phase: 5, snippet: 'Lead the team behind a WebAssembly plugin runtime.' },
    'QJ-4126': { title: 'Data Engineer', company: 'Solenne Retail', location: 'Berlin, Germany', tags: ['Scala', 'Spark'], salary: '€70,000–84,000', phase: 6, snippet: 'Own the pipelines that feed pricing and inventory models.' },
  };

  // Edits and removals, applied cumulatively from their phase on.
  var EDITS = [
    { phase: 2, id: 'QJ-4101', set: { salary: '€85,000–100,000' } },
    { phase: 4, id: 'QJ-4114', set: { title: 'Embedded Rust Engineer (Hybrid)' } },
    { phase: 6, id: 'QJ-4117', set: { salary: '€90,000–110,000' } },
  ];
  var REMOVALS = [{ phase: 4, id: 'QJ-4093' }];
  var PHASE_COUNT = 7;

  function jobsAt(k) {
    var ids = Object.keys(JOBS).filter(function (id) {
      var j = JOBS[id];
      if (j.phase != null && j.phase > k) return false;
      return !REMOVALS.some(function (r) { return r.id === id && r.phase <= k; });
    });
    var jobs = ids.map(function (id) {
      var j = Object.assign({ id: id, updatedPhase: null }, JOBS[id]);
      EDITS.forEach(function (e) {
        if (e.id === id && e.phase <= k) {
          Object.assign(j, e.set);
          j.updatedPhase = e.phase;
        }
      });
      return j;
    });
    // newest first: postings made during the timeline sort above older ones
    jobs.sort(function (a, b) {
      var ka = a.phase != null ? a.phase : -a.agoDays;
      var kb = b.phase != null ? b.phase : -b.agoDays;
      return kb - ka;
    });
    return jobs;
  }

  function isRustBerlin(j) {
    return (j.tags.indexOf('Rust') >= 0 || /\bRust\b/.test(j.title)) && /Berlin/.test(j.location);
  }

  var timeline = [];
  for (var k = 0; k < PHASE_COUNT; k++) {
    var jobs = jobsAt(k);
    timeline.push({
      listings: jobs.map(function (j) { return j.id + ': ' + j.title + ' | ' + j.company + ' | ' + j.location + ' | ' + j.salary; }),
      rustBerlinIds: jobs.filter(isRustBerlin).map(function (j) { return j.id; }),
      newestId: jobs[0].id,
      count: jobs.length,
    });
  }

  function postedAt(ctx, j) {
    return j.phase != null ? ctx.startOf(j.phase) : ctx.t0 - Math.round(j.agoDays * 24) * HOUR;
  }

  WF.define({
    id: 'job-board',
    title: 'New items list (job board)',
    path: 's/job-board/',
    docTitle: 'Engineering jobs in Europe | Quillstack Jobs',
    watched: [
      { key: 'listings', label: 'All listings, newest first (id: title | company | location | salary)' },
      { key: 'rustBerlinIds', label: 'Listings that are Rust jobs in Berlin' },
      { key: 'count', label: 'Number of listings' },
    ],
    timeline: timeline,
    render: function (ctx) {
      var jobs = jobsAt(ctx.phase);
      var items = jobs
        .map(function (j) {
          var at = postedAt(ctx, j);
          var isNew = ctx.now - at < 24 * HOUR;
          var upd = j.updatedPhase != null ? ' · <span class="job-updated">Updated ' + esc(WF.fmt.rel(ctx.startOf(j.updatedPhase), ctx.now)) + '</span>' : '';
          return (
            '<li class="job" data-job-id="' + j.id + '">' +
            '<div class="job-top"><h3 class="job-title"><a href="#">' + esc(j.title) + '</a></h3>' + (isNew ? '<span class="pill new">New</span>' : '') + '</div>' +
            '<div class="job-meta"><span class="job-company">' + esc(j.company) + '</span> · <span class="job-location">' + esc(j.location) + '</span> · <span class="job-salary">' + esc(j.salary) + '</span></div>' +
            '<p class="job-snippet">' + esc(j.snippet) + '</p>' +
            '<div class="job-tags">' + j.tags.map(function (t) { return '<span class="pill">' + esc(t) + '</span>'; }).join(' ') + '</div>' +
            '<div class="job-posted muted small">Posted <time datetime="' + WF.fmt.iso(at) + '">' + esc(WF.fmt.rel(at, ctx.now)) + '</time> (' + esc(WF.fmt.dateTime(at)) + ')' + upd + ' · Ref ' + j.id + '</div>' +
            '</li>'
          );
        })
        .join('');
      return (
        '<style>' +
        '.qs{--brand:#5b3cc4;--brand-soft:#f0ecfb}.qs .site-header{background:#fff}.qs .hero{background:linear-gradient(135deg,#5b3cc4,#3d2a8a);color:#fff;padding:28px 0}' +
        '.qs .hero h1{font-size:1.7rem}.qs .jobsearch{display:flex;gap:8px;flex-wrap:wrap}.qs .jobsearch input{flex:1 1 200px;padding:10px 12px;border-radius:8px;border:0;font:inherit}' +
        '.qs .jobsearch button{background:#ffb938;border:0;border-radius:8px;padding:10px 18px;font-weight:700}.job-list{list-style:none;padding:0;margin:0}' +
        '.job{border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-bottom:12px;background:#fff}.job-top{display:flex;gap:10px;align-items:center}' +
        '.job-title{margin:0;font-size:1.1rem}.job-title a{color:var(--ink);text-decoration:none}.job-meta{color:var(--ink-2);font-size:.92rem;margin:4px 0 8px}' +
        '.job-snippet{margin-bottom:8px}.job-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.qs-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:28px;margin-top:22px}' +
        '@media (max-width:820px){.qs-layout{grid-template-columns:1fr}}.qs aside .box{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px;font-size:.92rem}' +
        '</style>' +
        '<div class="qs">' +
        '<header class="site-header"><div class="wrap header-row"><a class="logo" href="#"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="17" fill="#5b3cc4"/><text x="17" y="23" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Q</text></svg><span>Quillstack Jobs</span></a>' +
        '<nav class="utility"><a href="#">Find jobs</a><a href="#">Companies</a><a href="#">Salaries</a><a href="#">Post a job</a><a href="#">Sign in</a></nav></div></header>' +
        '<section class="hero"><div class="wrap"><h1>Engineering jobs in Europe</h1><p>Hand-checked roles from product companies. Updated throughout the day.</p>' +
        '<form class="jobsearch" onsubmit="return false"><input type="search" placeholder="Keywords, e.g. Rust" aria-label="Keywords"><input type="search" placeholder="Location, e.g. Berlin" aria-label="Location"><button type="button">Search jobs</button></form></div></section>' +
        '<main class="wrap"><div class="qs-layout"><div>' +
        '<div class="toolbar"><span id="job-count">' + jobs.length + ' jobs</span><span>Sorted by: Most recent</span></div>' +
        '<ol class="job-list">' + items + '</ol></div>' +
        '<aside><div class="box"><strong>Job alerts</strong><p class="small muted">Get new jobs by email. (Disabled on this test fixture.)</p></div>' +
        '<div class="box"><strong>Popular searches</strong><p class="small">Rust · Go · React · Data engineering · Remote EU</p></div></aside>' +
        '</div></main>' +
        '<footer class="store-footer"><div class="wrap"><p class="legal">Quillstack Jobs is a fictional job board. Companies and roles on this page are invented.</p></div></footer>' +
        '</div>'
      );
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
