(function (WF) {
  'use strict';
  var esc = WF.esc;

  var SHOWS = [
    { key: 'portsmere', city: 'Portsmere', venue: 'Tidewater Hall', offsetDays: 14, from: '$42.00' },
    { key: 'aldbury', city: 'Aldbury Cross', venue: 'Linden Assembly Rooms', offsetDays: 15, from: '$38.00' },
    { key: 'wrenfield', city: 'Wrenfield', venue: 'Old Mill Theatre', offsetDays: 16, from: '$38.00' },
    { key: 'halloway', city: 'Halloway Bay', venue: 'Pier Pavilion', offsetDays: 17, from: '$45.00' },
  ];

  // Seats left per phase; null = date not announced yet.
  var SEATS = [
    { portsmere: 120, aldbury: 45, wrenfield: 200, halloway: null },
    { portsmere: 96, aldbury: 22, wrenfield: 188, halloway: null },
    { portsmere: 71, aldbury: 8, wrenfield: 175, halloway: null },
    { portsmere: 50, aldbury: 0, wrenfield: 160, halloway: null },
    { portsmere: 32, aldbury: 0, wrenfield: 149, halloway: 250 },
    { portsmere: 12, aldbury: 0, wrenfield: 130, halloway: 238 },
    { portsmere: 5, aldbury: 4, wrenfield: 118, halloway: 221 },
    { portsmere: 0, aldbury: 0, wrenfield: 101, halloway: 205 },
  ];
  var RETURNED = { 6: ['aldbury'] };

  function seatsText(n) {
    if (n === 0) return 'Sold out';
    if (n < 20) return 'Only ' + n + ' left';
    return n + ' seats left';
  }

  var timeline = SEATS.map(function (s, k) {
    var e = {};
    SHOWS.forEach(function (sh) {
      e[sh.key] = s[sh.key];
      e[sh.key + 'Text'] = s[sh.key] == null ? null : seatsText(s[sh.key]);
    });
    e.dateCount = SHOWS.filter(function (sh) { return s[sh.key] != null; }).length;
    e.returned = RETURNED[k] || [];
    return e;
  });

  WF.define({
    id: 'event-tickets',
    title: 'Event tickets / availability',
    path: 's/event-tickets/',
    docTitle: 'The Lantern Quartet — Autumn Tour | Tidewater Live',
    watched: [
      { key: 'portsmere', label: 'Portsmere seats left (null = not listed)' },
      { key: 'aldbury', label: 'Aldbury Cross seats left' },
      { key: 'wrenfield', label: 'Wrenfield seats left' },
      { key: 'halloway', label: 'Halloway Bay seats left (added later)' },
      { key: 'dateCount', label: 'Number of tour dates listed' },
    ],
    timeline: timeline,
    render: function (ctx, st) {
      var rows = SHOWS.filter(function (sh) { return st[sh.key] != null; })
        .map(function (sh) {
          var n = st[sh.key];
          var when = ctx.t0 + sh.offsetDays * WF.DAY_MS + 19.5 * 3600000;
          var cls = n === 0 ? 'bad' : n < 20 ? 'warn' : 'ok';
          var isNewDate = sh.key === 'halloway';
          var returned = st.returned.indexOf(sh.key) >= 0;
          return (
            '<tr data-show="' + sh.key + '"><td><strong>' + esc(WF.fmt.dayShort(when)) + '</strong><div class="muted small">Doors 18:45 · Show 19:30</div></td>' +
            '<td><span class="show-city">' + esc(sh.city) + '</span>' + (isNewDate ? ' <span class="pill new">New date</span>' : '') + '<div class="muted small">' + esc(sh.venue) + '</div></td>' +
            '<td>From ' + sh.from + '</td>' +
            '<td><span class="seats pill ' + cls + '">' + esc(seatsText(n)) + '</span>' + (returned ? '<div class="muted small">Returned tickets just released</div>' : '') + '</td>' +
            '<td>' + (n === 0 ? '<button class="btn secondary" type="button">Join waitlist</button>' : '<button class="btn" type="button">Select seats</button>') + '</td></tr>'
          );
        })
        .join('');
      return (
        '<style>.tw{--brand:#0e5a6b;--brand-soft:#e3f1f4}.tw .hero{background:linear-gradient(120deg,#0e5a6b,#113a4a 60%,#1d2233);color:#fff;padding:36px 0}' +
        '.tw .hero h1{font-size:2rem;margin-bottom:6px}.tw .hero p{opacity:.9}.tw table td{vertical-align:middle}.tw .btn{padding:8px 14px}</style>' +
        '<div class="tw">' +
        '<header class="site-header"><div class="wrap header-row"><a class="logo" href="#"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#0e5a6b"/><path d="M6 22q5-8 11 0t11 0" stroke="#fff" stroke-width="3" fill="none"/></svg><span>Tidewater Live</span></a>' +
        '<nav class="utility"><a href="#">Concerts</a><a href="#">Theatre</a><a href="#">Comedy</a><a href="#">Venues</a><a href="#">My tickets</a></nav></div></header>' +
        '<section class="hero"><div class="wrap"><p class="small">CHAMBER MUSIC · ALL AGES</p><h1>The Lantern Quartet — Autumn Tour</h1><p>Four strings, candlelit halls and a programme of Haydn, folk songs and new commissions.</p></div></section>' +
        '<main class="wrap"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#">Home</a></li><li><a href="#">Concerts</a></li><li aria-current="page">The Lantern Quartet</li></ol></nav>' +
        '<h2>Tour dates</h2><div class="table-scroll"><table class="data-table" id="tour-dates"><thead><tr><th>Date</th><th>City &amp; venue</th><th>Price</th><th>Availability</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="muted small">Seat counts are updated regularly. Maximum 6 tickets per order. All times are local.</p>' +
        '<section class="details"><div><h2>About the show</h2><p>The Lantern Quartet return with a programme built around lamplight and late evenings: two Haydn quartets, arrangements of coastal folk songs, and the premiere of a new piece written for the tour.</p><p>Running time approximately 2 hours including a 20-minute interval.</p></div>' +
        '<div><h2>Good to know</h2><table class="specs"><tbody><tr><th scope="row">Age</th><td>All ages; under-16s with an adult</td></tr><tr><th scope="row">Accessibility</th><td>Step-free access at all venues</td></tr><tr><th scope="row">Refunds</th><td>Exchanges up to 48 h before the show</td></tr></tbody></table></div></section>' +
        '</main><footer class="store-footer"><div class="wrap"><p class="legal">Tidewater Live and The Lantern Quartet are fictional. Tickets on this page cannot be bought.</p></div></footer></div>'
      );
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
