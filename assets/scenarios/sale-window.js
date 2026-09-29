(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;
  var REGULAR = 199;

  // saleEndsPhase: the phase at whose start the sale price stops applying.
  var PHASES = [
    { price: 199 },
    { price: 199, teaser: true },
    { price: 149, saleName: 'Autumn Sound Sale', saleEndsPhase: 5 },
    { price: 149, saleName: 'Autumn Sound Sale', saleEndsPhase: 5 },
    { price: 149, saleName: 'Autumn Sound Sale', saleEndsPhase: 5 },
    { price: 199, saleEnded: 'Autumn Sound Sale' },
    { price: 199 },
    { price: 159, saleName: 'Flash deal', saleEndsPhase: 8 },
    { price: 199, saleEnded: 'Flash deal' },
  ];

  WF.define({
    id: 'sale-window',
    title: 'Price with a sale window',
    path: 's/sale-window/',
    docTitle: 'Kestrel Aria ANC Wireless Headphones | Kestrel Audio',
    watched: [
      { key: 'price', label: 'Current price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
      { key: 'onSale', label: 'A sale price applies' },
    ],
    timeline: PHASES.map(function (p) {
      return {
        price: p.price,
        priceText: money(p.price),
        onSale: p.price < REGULAR,
        saleName: p.saleName || null,
        saleEndsPhase: p.saleEndsPhase == null ? null : p.saleEndsPhase,
        teaser: !!p.teaser,
        saleEnded: p.saleEnded || null,
      };
    }),
    afterLast: 'The countdown text ("Sale ends in …") is computed from the load time, so it differs on every load within a sale phase.',
    render: function (ctx, st) {
      var banner;
      if (st.onSale) {
        var left = ctx.startOf(st.saleEndsPhase) - ctx.now;
        banner = '<strong>' + esc(st.saleName) + ':</strong> save on Aria headphones &middot; <span id="sale-countdown">Sale ends in ' + esc(WF.fmt.duration(left)) + '</span>';
      } else if (st.teaser) {
        banner = '<strong>Coming soon:</strong> the Autumn Sound Sale. Sign up for early access to deals.';
      } else if (st.saleEnded) {
        banner = 'The ' + esc(st.saleEnded) + ' has ended. Thanks for shopping with us!';
      } else {
        banner = '<strong>Trade in</strong> your old headphones and get store credit toward a new pair.';
      }
      var off = REGULAR - st.price;
      var buy =
        S.priceBlock({
          now: st.priceText,
          sale: st.onSale,
          was: st.onSale ? money(REGULAR) : null,
          save: st.onSale ? 'Save ' + money(off) : null,
          note: st.onSale ? esc(st.saleName) + ' price. Limited time only.' : 'Free 2-day shipping. 45-day returns.',
        }) +
        S.stockLine('in', 'In stock', 'Ships today if ordered before 3 pm.') +
        '<p class="small"><strong>Finish:</strong> Graphite &nbsp; <strong>Connectivity:</strong> Bluetooth 5.3</p>' +
        S.buyRow(true);
      return S.productPage({
        store: 'kestrel',
        banner: banner,
        crumbs: ['Home', 'Headphones', 'Over-ear', 'Kestrel Aria ANC'],
        name: 'Kestrel Aria ANC Wireless Headphones',
        subtitle: 'Adaptive noise cancelling · 40-hour battery',
        sku: 'KA-ARIA-GRP',
        rating: 4.5,
        reviewCount: 2041,
        art: ['headphones', '#2b2f36', '#2b59c3'],
        buy: buy,
        highlights: ['Adaptive noise cancelling with transparency mode', 'Up to 40 hours of playback, 10 minutes of charge = 5 hours', 'Multipoint pairing with two devices', 'Foldable design with hard case'],
        perks: ['2-year warranty', 'Free returns in 45 days', 'USB-C charging', 'Weighs 254 g'],
        description: [
          'Aria blends into your day: it turns down the rumble of trains and open-plan offices, then lets the world back in with a tap. Custom 40 mm drivers deliver a warm, detailed sound tuned by the Kestrel acoustics team.',
          'Memory-foam cushions and a lightweight headband make long listening sessions comfortable.',
        ],
        specs: [
          ['Drivers', '40 mm dynamic'],
          ['Battery life', 'Up to 40 h (ANC on: 32 h)'],
          ['Charging', 'USB-C, fast charge'],
          ['Codecs', 'SBC, AAC, LC3'],
          ['Weight', '254 g'],
        ],
        reviews: [
          { stars: 5, title: 'Quiet commute at last', author: 'Noor H.', when: '1 week ago', body: 'Noise cancelling is excellent on the metro.' },
          { stars: 4, title: 'Great sound, tight fit', author: 'Felix R.', when: '3 weeks ago', body: 'A bit snug at first but loosened up after a few days.' },
        ],
        related: [
          { name: 'Kestrel Pebble Bluetooth Speaker', price: '$79.00', art: 'speaker', c1: '#2b2f36', c2: '#2b59c3' },
          { name: 'Kestrel Buds Pro', price: '$129.00', art: 'box', c1: '#2b2f36', c2: '#9fb3e6' },
          { name: 'Aria Replacement Ear Cushions', price: '$29.00', art: 'box', c1: '#555b66', c2: '#c6ccd6' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
