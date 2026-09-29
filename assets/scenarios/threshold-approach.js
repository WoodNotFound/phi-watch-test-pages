(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;
  var LIST = 49.99;
  var PRICES = [49.99, 47.99, 46.49, 45.2, 45.0, 44.8, 45.3, 44.6];

  WF.define({
    id: 'threshold-approach',
    title: 'Gradual approach to a threshold',
    path: 's/threshold-approach/',
    docTitle: 'Kestrel Dock 7-in-1 USB-C Hub | Kestrel Audio',
    watched: [
      { key: 'price', label: 'Current price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p, k) {
      var low = Math.min.apply(null, PRICES.slice(0, k + 1));
      return { price: p, priceText: money(p), lowest30dText: low < p ? money(low) : null };
    }),
    render: function (ctx, st) {
      var off = Math.round((LIST - st.price) * 100) / 100;
      var buy =
        S.priceBlock({
          now: st.priceText,
          sale: off > 0,
          was: off > 0 ? money(LIST) : null,
          save: off > 0 ? 'Save ' + money(off) : null,
          note: st.lowest30dText ? 'Lowest price in the last 30 days: ' + st.lowest30dText + '.' : 'Free shipping on this item.',
        }) +
        S.stockLine('in', 'In stock', 'Ships today if ordered before 3 pm.') +
        S.buyRow(true);
      return S.productPage({
        store: 'kestrel',
        crumbs: ['Home', 'Accessories', 'Hubs & docks', 'Kestrel Dock 7-in-1'],
        name: 'Kestrel Dock 7-in-1 USB-C Hub',
        subtitle: '4K HDMI · 100 W pass-through · SD card reader',
        sku: 'KA-DOCK7',
        rating: 4.4,
        reviewCount: 1187,
        art: ['hub', '#3a3f47', '#9aa4b2'],
        buy: buy,
        highlights: ['HDMI 4K at 60 Hz', '2 × USB-A 3.2, 1 × USB-C data', '100 W USB-C power pass-through', 'SD and microSD card slots'],
        description: ['One cable to connect your laptop to a monitor, keyboard, camera cards and power. Aluminium housing with a braided 20 cm cable.'],
        specs: [['Ports', 'HDMI, 2 × USB-A, USB-C data, USB-C PD, SD, microSD'], ['Power pass-through', '100 W'], ['Cable', '20 cm braided'], ['Housing', 'Aluminium']],
        reviews: [{ stars: 4, title: 'Does everything', author: 'Tariq B.', when: '2 weeks ago', body: 'Runs my 4K monitor and charges the laptop. Gets warm.' }],
        related: [
          { name: 'Kestrel USB-C Cable 2 m', price: '$14.99', art: 'box', c1: '#3a3f47', c2: '#9aa4b2' },
          { name: 'Kestrel 65 W GaN Charger', price: '$44.99', art: 'box', c1: '#f0f1f3', c2: '#3a3f47' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
