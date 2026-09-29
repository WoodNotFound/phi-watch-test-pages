(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;

  // access: visible | login_wall
  var PHASES = [
    { access: 'visible', price: 44 },
    { access: 'visible', price: 44 },
    { access: 'login_wall' },
    { access: 'login_wall' },
    { access: 'visible', price: 44 },
    { access: 'visible', price: 39 },
    { access: 'login_wall' },
    { access: 'visible', price: 39 },
  ];

  WF.define({
    id: 'login-wall',
    title: 'Login wall / interstitial',
    path: 's/login-wall/',
    docTitle: 'Pre-seasoned Cast Iron Skillet, 12 in | Orrisfield Supply Co.',
    watched: [
      { key: 'access', label: 'visible | login_wall ("Sign in to see prices", no price anywhere in the DOM)' },
      { key: 'price', label: 'Price (USD); null when hidden behind the login wall' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      return {
        access: p.access,
        readable: p.access === 'visible',
        price: p.access === 'visible' ? p.price : null,
        priceText: p.access === 'visible' ? money(p.price) : null,
      };
    }),
    render: function (ctx, st) {
      var walled = st.access === 'login_wall';
      var buy = walled
        ? '<div class="notice warn" id="login-wall"><p style="font-size:1.15rem;margin-bottom:4px"><strong>Sign in to see prices</strong></p>' +
          '<p class="small">Trade prices are only shown to signed-in business customers.</p>' +
          '<p><button class="btn" type="button" id="sign-in">Sign in</button> <button class="btn secondary" type="button">Apply for a trade account</button></p>' +
          '<p class="small muted" id="sign-in-msg" hidden>Sign-in is disabled on this test fixture.</p></div>' +
          S.stockLine('in', 'In stock', 'Sign in to see delivery options.')
        : S.priceBlock({ now: st.priceText, sale: st.price < 44, was: st.price < 44 ? '$44.00' : null, note: 'Trade price, excluding sales tax. Volume discounts from 6 units.' }) +
          S.stockLine('in', 'In stock', 'Same-day dispatch if ordered before 2 pm.') +
          S.buyRow(true);
      return S.productPage({
        store: 'orrisfield',
        crumbs: ['Home', 'Cookware', 'Frying pans & skillets', 'Pre-seasoned Cast Iron Skillet, 12 in'],
        name: 'Pre-seasoned Cast Iron Skillet, 12 in',
        subtitle: 'Commercial grade · Oven and grill safe',
        sku: 'OSC-CI12',
        rating: 4.7,
        reviewCount: 964,
        art: ['skillet', '#34383c', '#e3b007'],
        buy: buy,
        highlights: ['Pre-seasoned with vegetable oil, ready to use', 'Pour spouts on both sides', 'Assist handle for two-handed lifting'],
        description: ['A heavy-duty skillet built for restaurant kitchens. Cast iron holds heat for perfect searing and moves from hob to oven to table.'],
        specs: [['Diameter', '30.5 cm (12 in)'], ['Weight', '3.6 kg'], ['Material', 'Cast iron'], ['Case quantity', '6']],
        reviews: [{ stars: 5, title: 'Workhorse', author: 'Chef D. (Harbour Kitchen)', when: '3 weeks ago', body: 'We run twelve of these on the line. Indestructible.' }],
        related: [
          { name: 'Cast Iron Skillet, 10 in', price: walled ? 'Sign in for price' : '$36.00', art: 'skillet', c1: '#34383c', c2: '#e3b007' },
          { name: 'Silicone Handle Sleeve', price: walled ? 'Sign in for price' : '$6.50', art: 'box', c1: '#c0392b', c2: '#f3c1bb' },
          { name: 'Chain-Mail Scrubber', price: walled ? 'Sign in for price' : '$12.00', art: 'box', c1: '#8a949c', c2: '#d9dee2' },
        ],
      });
    },
    after: function (app) {
      var b = document.getElementById('sign-in');
      if (b) {
        b.addEventListener('click', function () {
          document.getElementById('sign-in-msg').removeAttribute('hidden');
        });
      }
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
