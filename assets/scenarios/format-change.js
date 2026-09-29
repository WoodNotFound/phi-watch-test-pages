(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;

  function gbp(n, style) {
    var v = n.toFixed(2);
    switch (style) {
      case 'code-prefix':
        return 'GBP ' + v;
      case 'code-suffix':
        return v + ' GBP';
      case 'three-decimals':
        return '£' + n.toFixed(3);
      default:
        return '£' + v;
    }
  }

  var PHASES = [
    { price: 51.77, style: 'symbol' },
    { price: 51.77, style: 'code-prefix' },
    { price: 51.77, style: 'code-suffix' },
    { price: 51.77, style: 'three-decimals' },
    { price: 51.77, style: 'split-markup' },
    { price: 46.59, style: 'symbol', was: 51.77 },
    { price: 46.59, style: 'code-prefix', was: 51.77 },
  ];

  WF.define({
    id: 'format-change',
    title: 'Format change without value change',
    path: 's/format-change/',
    docTitle: 'Washed Linen Duvet Cover, King | Harbor & Pine Home UK',
    watched: [
      { key: 'price', label: 'Price (GBP, numeric)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      return {
        price: p.price,
        priceText: gbp(p.price, p.style),
        format: p.style,
        wasText: p.was ? gbp(p.was, p.style) : null,
      };
    }),
    render: function (ctx, st) {
      var html = null;
      if (st.format === 'split-markup') {
        var parts = st.price.toFixed(2).split('.');
        html = '<span class="int">£' + parts[0] + '</span><span class="dec">.' + parts[1] + '</span>';
      }
      var buy =
        S.priceBlock({
          now: st.priceText,
          html: html,
          sale: !!st.wasText,
          was: st.wasText,
          save: st.wasText ? 'Save 10%' : null,
          note: 'Price includes VAT. Free UK delivery on orders over £60.',
        }) +
        S.stockLine('in', 'In stock', 'Delivered in 2–4 working days.') +
        '<p class="small"><strong>Size:</strong> King (230 × 220 cm) &nbsp; <strong>Colour:</strong> Oat</p>' +
        S.buyRow(true);
      return S.productPage({
        store: 'harborUK',
        crumbs: ['Home', 'Bedding', 'Duvet covers', 'Washed Linen Duvet Cover'],
        name: 'Washed Linen Duvet Cover, King',
        subtitle: '100% European flax linen · Stone washed for softness',
        sku: 'HP-UK-LDC-K-OAT',
        rating: 4.7,
        reviewCount: 406,
        art: ['duvet', '#d8cbb5', '#a39277'],
        buy: buy,
        highlights: ['Relaxed, lived-in texture from day one', 'Hidden button closure and corner ties', 'Gets softer with every wash'],
        perks: ['30-night trial', 'Free returns', 'OEKO-TEX certified', 'Machine washable at 40 °C'],
        description: [
          'Our washed linen duvet cover is garment-dyed and stone washed, giving it a soft handle and a gently crumpled look that never needs ironing. Linen is naturally breathable, keeping you cool in summer and cosy in winter.',
          'Pair it with our linen pillowcases (sold separately).',
        ],
        specs: [
          ['Size', 'King, 230 × 220 cm'],
          ['Material', '100% linen, 165 gsm'],
          ['Closure', 'Hidden coconut buttons'],
          ['Care', 'Machine wash 40 °C, tumble dry low'],
        ],
        reviews: [
          { stars: 5, title: 'Lovely weight', author: 'Harriet F.', when: '3 weeks ago', body: 'Not too heavy, and the oat colour is gorgeous.' },
          { stars: 4, title: 'Runs slightly large', author: 'Callum B.', when: '2 months ago', body: 'Generous size, which I actually prefer.' },
        ],
        related: [
          { name: 'Washed Linen Pillowcases (pair)', price: '£24.00', art: 'duvet', c1: '#d8cbb5', c2: '#a39277' },
          { name: 'Waffle Cotton Throw', price: '£38.50', art: 'duvet', c1: '#b9c4c9', c2: '#e4e9eb' },
          { name: 'Walnut Bedside Table', price: '£149.00', art: 'table', c1: '#6b4a2f', c2: '#3a2718' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
