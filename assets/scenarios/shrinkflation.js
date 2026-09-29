(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;

  var PHASES = [
    { price: 4.99, count: 12 },
    { price: 4.99, count: 12 },
    { price: 4.99, count: 10 },
    { price: 4.99, count: 10 },
    { price: 4.49, count: 10 },
    { price: 4.49, count: 10 },
  ];

  WF.define({
    id: 'shrinkflation',
    title: 'Same shelf price, smaller pack',
    path: 's/shrinkflation/',
    docTitle: 'Oat & Honey Granola Bars | Pantry Lane Grocers',
    watched: [
      { key: 'price', label: 'Shelf price (USD)' },
      { key: 'priceText', label: 'Shelf price as displayed' },
      { key: 'packCount', label: 'Bars per pack' },
      { key: 'unitPriceText', label: 'Unit price as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      var unit = p.price / p.count;
      return { price: p.price, priceText: money(p.price), packCount: p.count, unitPrice: Math.round(unit * 1000) / 1000, unitPriceText: money(unit) + ' / bar', packText: p.count + ' × 35 g bars' };
    }),
    render: function (ctx, st) {
      var buy =
        S.priceBlock({ now: st.priceText, note: '<span id="unit-price">' + st.unitPriceText + '</span> · <span id="pack-size">' + st.packText + '</span>' }) +
        S.stockLine('in', 'In stock', 'Available for delivery and pickup.') +
        S.buyRow(true);
      return S.productPage({
        store: 'pantry',
        crumbs: ['Home', 'Snacks', 'Cereal bars', 'Oat & Honey Granola Bars'],
        brandLine: 'Meadowgrain (fictional brand)',
        name: 'Oat & Honey Granola Bars, ' + st.packCount + ' pack',
        subtitle: 'Whole-grain oats with wildflower honey',
        sku: 'PLG-MG-OH' + st.packCount,
        rating: 4.5,
        reviewCount: 2210,
        art: ['bars', '#e3a33b', '#8a5a2b'],
        buy: buy,
        highlights: ['Made with whole-grain oats', 'No artificial colours or flavours', 'Individually wrapped'],
        description: ['Chewy oat bars sweetened with wildflower honey. Perfect for lunchboxes and hikes.'],
        specs: [['Pack contents', st.packText], ['Net weight', st.packCount * 35 + ' g'], ['Allergens', 'Contains oats (gluten). May contain nuts.']],
        reviews: [{ stars: 5, title: 'Kids love them', author: 'Dana F.', when: '2 weeks ago', body: 'A lunchbox staple.' }],
        related: [
          { name: 'Dark Chocolate Oat Bars, 6 pack', price: '$3.79', art: 'bars', c1: '#5a3a26', c2: '#c48b5c' },
          { name: 'Honey Almond Granola, 500 g', price: '$5.49', art: 'bars', c1: '#e3a33b', c2: '#fff4dc' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
