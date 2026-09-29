(function (WF) {
  'use strict';
  var S = WF.shop;
  var RESTOCK_DAYS = 5;

  var STATES = [
    { stock: 'in_stock', stockText: 'In stock' },
    { stock: 'in_stock', stockText: 'In stock' },
    { stock: 'low', stockText: 'Only 3 left in stock' },
    { stock: 'out_of_stock', stockText: 'Out of stock', restockOffsetDays: RESTOCK_DAYS },
    { stock: 'out_of_stock', stockText: 'Out of stock', restockOffsetDays: RESTOCK_DAYS },
    { stock: 'in_stock', stockText: 'In stock', backInStock: true },
    { stock: 'in_stock', stockText: 'In stock' },
  ];

  WF.define({
    id: 'stock-cycle',
    title: 'Stock cycle',
    path: 's/stock-cycle/',
    docTitle: 'Stoneware Pour-Over Kettle | Harbor & Pine Home',
    watched: [
      { key: 'stock', label: 'Availability (in_stock | low | out_of_stock)' },
      { key: 'stockText', label: 'Availability as displayed' },
    ],
    timeline: STATES.map(function (s) {
      return {
        stock: s.stock,
        stockText: s.stockText,
        restockOffsetDays: s.restockOffsetDays || null,
        backInStock: !!s.backInStock,
        price: 34,
        priceText: '$34.00',
      };
    }),
    render: function (ctx, st) {
      var kind = st.stock === 'in_stock' ? 'in' : st.stock === 'low' ? 'low' : 'out';
      var sub =
        st.stock === 'out_of_stock'
          ? 'Expected back in stock on ' + WF.esc(WF.fmt.dateLong(ctx.t0 + st.restockOffsetDays * WF.DAY_MS)) + '. We will email you when it is available again.'
          : st.stock === 'low'
            ? 'Order soon: only a few units left at our warehouse.'
            : 'Usually ships within 24 hours.';
      var buy =
        S.priceBlock({ now: st.priceText, note: 'Free delivery on orders over $99.' }) +
        S.stockLine(kind, st.stockText, sub) +
        S.buyRow(st.stock !== 'out_of_stock', 'Out of stock');
      return S.productPage({
        store: 'harbor',
        crumbs: ['Home', 'Kitchen', 'Coffee & tea', 'Stoneware Pour-Over Kettle'],
        name: 'Stoneware Pour-Over Kettle',
        subtitle: '1.0 L gooseneck kettle · Speckled oat glaze',
        sku: 'HP-KT-1024',
        rating: 4.8,
        reviewCount: 89,
        art: ['kettle', '#d9cbb3', '#23395b'],
        notice: st.backInStock ? '<div class="notice" role="status"><strong>Back in stock!</strong> The pour-over kettle is available again.</div>' : '',
        buy: buy,
        highlights: ['Hand-glazed stoneware body with stainless steel core', 'Precise gooseneck spout for slow, even pours', 'Suitable for gas and electric hobs'],
        perks: ['Free delivery over $99', '30-day returns', 'Dishwasher safe lid', 'Made in Portugal'],
        description: [
          'Our pour-over kettle pairs a speckled stoneware shell with a stainless steel core, so it heats evenly and keeps water hot while you bloom the grounds. The slim gooseneck spout gives you a steady, controllable stream.',
          'Each kettle is glazed by hand, so the speckles on yours will be unique.',
        ],
        specs: [
          ['Capacity', '1.0 liter'],
          ['Materials', 'Stoneware, stainless steel core, beech handle'],
          ['Hob compatibility', 'Gas, electric, ceramic (not induction)'],
          ['Dimensions', '28 × 14 × 19 cm'],
          ['Care', 'Hand wash body; lid is dishwasher safe'],
        ],
        reviews: [
          { stars: 5, title: 'Pours beautifully', author: 'Tomasz R.', when: '2 weeks ago', body: 'The flow control is excellent and it looks lovely on the stove.' },
          { stars: 5, title: 'Worth the wait', author: 'Aiko M.', when: '1 month ago', body: 'Ordered during the last restock and it arrived well packed.' },
        ],
        related: [
          { name: 'Ceramic Pour-Over Dripper', price: '$22.00', art: 'box', c1: '#d9cbb3', c2: '#23395b' },
          { name: 'Beech Serving Board', price: '$39.00', art: 'box', c1: '#b98a58', c2: '#e8d6bd' },
          { name: 'Linen Tea Towels (set of 3)', price: '$24.00', art: 'duvet', c1: '#8fa3b8', c2: '#dfe6ee' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
