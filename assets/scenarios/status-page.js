(function (WF) {
  'use strict';
  var esc = WF.esc;

  var COMPONENTS = [
    { key: 'api', name: 'API', uptime: '99.97%' },
    { key: 'dashboard', name: 'Dashboard', uptime: '99.99%' },
    { key: 'webhooks', name: 'Webhooks', uptime: '99.91%' },
    { key: 'storage', name: 'Object Storage', uptime: '100.0%' },
    { key: 'auth', name: 'Authentication', uptime: '99.98%' },
    { key: 'cdn', name: 'CDN', uptime: '100.0%' },
  ];
  var LABEL = { operational: 'Operational', degraded: 'Degraded performance', partial: 'Partial outage', major: 'Major outage' };
  var RANK = { operational: 0, degraded: 1, partial: 2, major: 3 };
  var OVERALL = { operational: 'All Systems Operational', degraded: 'Degraded Performance', partial: 'Partial System Outage', major: 'Major System Outage' };

  var INCIDENT_TITLE = 'Delayed and failing webhook deliveries';
  var UPDATES = [
    { phase: 2, status: 'Investigating', text: 'We are investigating reports of delayed webhook deliveries. Some events are arriving up to 15 minutes late.' },
    { phase: 3, status: 'Identified', text: 'We have identified a failing message broker node in the eu-west region. Webhook deliveries are currently failing for most customers, and API requests may see elevated latency.' },
    { phase: 4, status: 'Monitoring', text: 'A fix has been deployed and the broker cluster has been rebalanced. Deliveries are resuming; queued events will be delivered in order.' },
    { phase: 5, status: 'Monitoring', text: 'Most of the backlog has been delivered. Some customers may still see delays of up to 5 minutes while the remaining queue drains.' },
    { phase: 6, status: 'Resolved', text: 'All queued webhook events have been delivered and delivery latency is back to normal. We will publish a post-incident review within 5 business days.' },
  ];

  var PHASES = [
    { webhooks: 'operational', api: 'operational' },
    { webhooks: 'operational', api: 'operational' },
    { webhooks: 'degraded', api: 'operational' },
    { webhooks: 'major', api: 'degraded' },
    { webhooks: 'partial', api: 'operational' },
    { webhooks: 'degraded', api: 'operational' },
    { webhooks: 'operational', api: 'operational' },
    { webhooks: 'operational', api: 'operational' },
  ];

  var timeline = PHASES.map(function (p, k) {
    var comps = {};
    COMPONENTS.forEach(function (c) { comps[c.key] = p[c.key] || 'operational'; });
    var worst = Object.keys(comps).reduce(function (w, key) { return RANK[comps[key]] > RANK[w] ? comps[key] : w; }, 'operational');
    var ups = UPDATES.filter(function (u) { return u.phase <= k; });
    var incidentStatus = ups.length ? ups[ups.length - 1].status : null;
    return {
      overall: OVERALL[worst],
      allOperational: worst === 'operational',
      webhooks: comps.webhooks,
      api: comps.api,
      components: comps,
      incidentStatus: incidentStatus,
      incidentActive: !!incidentStatus && incidentStatus !== 'Resolved',
      incidentInPast: k >= 7,
    };
  });

  function bars(ctx, key, todayStatus) {
    var r = WF.rng('status-page', 'bars', key);
    var out = '';
    for (var i = 0; i < 60; i++) {
      var bad = r() < 0.03;
      var col = i === 59 ? { operational: '#2fa84f', degraded: '#e0a100', partial: '#e8742a', major: '#d23b2f' }[todayStatus] : bad ? '#e0a100' : '#2fa84f';
      out += '<rect x="' + i * 5 + '" y="0" width="3.4" height="22" rx="1" fill="' + col + '"/>';
    }
    return '<svg viewBox="0 0 300 22" class="bars" aria-hidden="true" preserveAspectRatio="none">' + out + '</svg>';
  }

  WF.define({
    id: 'status-page',
    title: 'Service status page',
    path: 's/status-page/',
    docTitle: 'Veltrane Cloud Status',
    watched: [
      { key: 'overall', label: 'Overall status banner' },
      { key: 'webhooks', label: 'Webhooks component status' },
      { key: 'api', label: 'API component status' },
      { key: 'allOperational', label: 'Every component is operational' },
      { key: 'incidentStatus', label: 'Latest incident update status' },
    ],
    timeline: timeline,
    render: function (ctx, st) {
      var worstClass = st.allOperational ? 'ok' : /Major/.test(st.overall) ? 'bad' : 'warn';
      var comps = COMPONENTS.map(function (c) {
        var s = st.components[c.key];
        var cls = s === 'operational' ? 'ok' : s === 'major' ? 'bad' : 'warn';
        return (
          '<li class="component" data-component="' + c.key + '"><div class="c-head"><span class="c-name">' + esc(c.name) + '</span>' +
          '<span class="c-status pill ' + cls + '">' + LABEL[s] + '</span></div>' + bars(ctx, c.key, s) +
          '<div class="c-foot muted small"><span>60 days ago</span><span>' + c.uptime + ' uptime</span><span>Today</span></div></li>'
        );
      }).join('');
      var ups = UPDATES.filter(function (u) { return u.phase <= ctx.phase; }).reverse();
      var updatesHtml = ups.map(function (u) {
        return '<div class="update"><strong>' + u.status + '</strong> — ' + esc(u.text) + '<div class="muted small">' + esc(WF.fmt.dateTime(ctx.startOf(u.phase))) + '</div></div>';
      }).join('');
      var active = ups.length && !st.incidentInPast
        ? '<section class="incident ' + (st.incidentStatus === 'Resolved' ? 'resolved' : '') + '" id="active-incident"><h2>' + esc(INCIDENT_TITLE) + '</h2>' + updatesHtml +
          '<p class="muted small">This incident affected: Webhooks' + (ctx.phase >= 3 ? ', API' : '') + '.</p></section>'
        : '';
      var maint = ctx.t0 + 3 * WF.DAY_MS + 2 * 3600000;
      var past = [];
      if (st.incidentInPast) past.push({ at: ctx.startOf(2), title: INCIDENT_TITLE, text: 'Resolved — All queued webhook events have been delivered and delivery latency is back to normal.' });
      past.push({ at: ctx.t0 - 6 * WF.DAY_MS + 9 * 3600000, title: 'Elevated error rates on the Dashboard', text: 'Resolved — A faulty configuration change was rolled back.' });
      past.push({ at: ctx.t0 - 19 * WF.DAY_MS + 14 * 3600000, title: 'Slow object uploads in us-east', text: 'Resolved — Storage nodes were replaced and upload latency returned to normal.' });
      var pastHtml = past.map(function (p) {
        return '<li><div class="muted small">' + esc(WF.fmt.dateShort(p.at)) + '</div><strong>' + esc(p.title) + '</strong><p>' + esc(p.text) + '</p></li>';
      }).join('');
      return (
        '<style>' +
        '.vt{--brand:#0f6fbd;background:#f5f7fa;min-height:100vh}.vt header{background:#0b1f33;color:#fff;padding:18px 0}.vt header .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}' +
        '.vt .brand{font-weight:700;font-size:1.15rem}.vt .subscribe{background:#fff;color:#0b1f33;border:0;border-radius:6px;padding:8px 14px;font-weight:600}' +
        '.vt .overall{margin:26px 0;padding:18px 22px;border-radius:10px;color:#fff;font-size:1.25rem;font-weight:700}.vt .overall.ok{background:#2fa84f}.vt .overall.warn{background:#e0a100}.vt .overall.bad{background:#d23b2f}' +
        '.vt .components{list-style:none;padding:0;margin:0;background:#fff;border:1px solid var(--line);border-radius:10px}.vt .component{padding:14px 18px;border-bottom:1px solid var(--line)}.vt .component:last-child{border-bottom:0}' +
        '.vt .c-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.vt .c-name{font-weight:600}.vt .bars{width:100%;height:22px;display:block}.vt .c-foot{display:flex;justify-content:space-between;margin-top:4px}' +
        '.vt .incident{background:#fff;border:1px solid #f0c36d;border-left:5px solid #e0a100;border-radius:10px;padding:16px 20px;margin-bottom:22px}.vt .incident.resolved{border-color:#b6dfc1;border-left-color:#2fa84f}' +
        '.vt .update{padding:10px 0;border-top:1px solid var(--line)}.vt .past{list-style:none;padding:0}.vt .past li{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin-bottom:10px}' +
        '.vt .maint{background:#eaf3fb;border:1px solid #bcd9f2;border-radius:10px;padding:12px 16px;margin-bottom:22px}' +
        '</style><div class="vt">' +
        '<header><div class="wrap"><span class="brand">Veltrane Cloud · Status</span><span><button class="subscribe" type="button">Subscribe to updates</button></span></div></header>' +
        '<main class="wrap">' +
        '<div class="overall ' + worstClass + '" id="overall-status">' + esc(st.overall) + '</div>' +
        active +
        '<div class="maint"><strong>Scheduled maintenance:</strong> Object Storage metadata database upgrade on ' + esc(WF.fmt.dateLong(maint)) + ', 02:00–04:00 UTC. No downtime is expected.</div>' +
        '<h2>Components</h2><ul class="components">' + comps + '</ul>' +
        '<h2 style="margin-top:28px">Past incidents</h2><ul class="past">' + pastHtml + '</ul>' +
        '<p class="muted small">Page generated ' + esc(WF.fmt.dateTime(ctx.now)) + '. Veltrane Cloud is a fictional service.</p>' +
        '</main></div>'
      );
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
