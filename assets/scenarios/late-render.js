(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;
  var PRICES = [79, 79, 69, 69, 64];

  /** Render delay in ms: 4000..6000, a pure function of (seed, raw phase). */
  function delayFor(ctx) {
    return 4000 + Math.floor(ctx.rng('delay', ctx.rawPhase)() * 2001);
  }

  function skeleton() {
    return (
      '<div id="buybox-loading" aria-busy="true" aria-label="Loading price and availability">' +
      '<span class="skeleton price"></span><span class="skeleton line" style="width:70%"></span><span class="skeleton line" style="width:45%"></span><span class="skeleton btn"></span></div>'
    );
  }

  function buyBox(st) {
    return (
      S.priceBlock({ now: st.priceText, sale: st.price < 79, was: st.price < 79 ? '$79.00' : null, note: 'Free 2-day shipping. 45-day returns.' }) +
      S.stockLine('in', 'In stock', 'Ships today if ordered before 3 pm.') +
      '<p class="small"><strong>Colour:</strong> Harbour blue</p>' +
      S.buyRow(true)
    );
  }

  WF.define({
    id: 'late-render',
    title: 'Content loaded late',
    path: 's/late-render/',
    docTitle: 'Kestrel Pebble Bluetooth Speaker | Kestrel Audio',
    watched: [
      { key: 'price', label: 'Price (USD), rendered 4–6 s after load' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p) {
      return { price: p, priceText: money(p) };
    }),
    afterLast: 'Price, stock and the buy button render 4–6 s after load (skeleton placeholders before that): delay = 4000 + floor(rng(id, seed, "delay", rawPhase) * 2001) ms.',
    state: function (ctx) {
      var st = WF.clone(ctx.def.timeline[ctx.phase]);
      st.delayMs = delayFor(ctx);
      return st;
    },
    render: function (ctx, st) {
      return S.productPage({
        store: 'kestrel',
        crumbs: ['Home', 'Speakers', 'Portable', 'Kestrel Pebble'],
        name: 'Kestrel Pebble Bluetooth Speaker',
        subtitle: 'Pocket-size, waterproof, 16-hour battery',
        sku: 'KA-PEB-HBL',
        rating: 4.3,
        reviewCount: 781,
        art: ['speaker', '#2d5d8a', '#9fc3e6'],
        buy: '<div id="buybox">' + skeleton() + '</div>',
        highlights: ['IP67 dust and waterproof', 'Pair two Pebbles for stereo sound', '16 hours of playback'],
        description: ['Pebble packs a surprisingly full sound into a speaker that fits in a jacket pocket. Clip it to a bag, drop it in the pool, pair two for stereo.'],
        specs: [
          ['Battery', 'Up to 16 h'],
          ['Water resistance', 'IP67'],
          ['Bluetooth', '5.3, range 30 m'],
          ['Weight', '290 g'],
        ],
        reviews: [{ stars: 4, title: 'Loud for its size', author: 'Mei C.', when: '1 week ago', body: 'Great at the beach. Bass is modest, as expected.' }],
        related: [
          { name: 'Kestrel Aria ANC Headphones', price: '$199.00', art: 'headphones', c1: '#2b2f36', c2: '#2b59c3' },
          { name: 'Pebble Carry Strap', price: '$12.00', art: 'box', c1: '#2d5d8a', c2: '#9fc3e6' },
        ],
      });
    },
    after: function (app, ctx, st) {
      setTimeout(function () {
        var box = document.getElementById('buybox');
        if (box) box.innerHTML = buyBox(st);
      }, st.delayMs);
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
