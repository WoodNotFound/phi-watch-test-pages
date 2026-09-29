(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var LISTED = 8;

  var BANNERS = [
    'Free standard shipping on orders over $75',
    'New this week: autumn recipes from the Brightfold test kitchen',
    'Up to 30% off selected bakeware — this week only',
    'Gift cards now available in any amount from $10',
    'Join Brightfold Rewards and earn points on every order',
  ];

  var RECS = [
    { name: 'Cast Iron Grill Pan', price: '$54.00', art: 'skillet', c1: '#3a3f44', c2: '#b5532f' },
    { name: 'Enameled Braiser 3.5 qt', price: '$119.00', art: 'pot', c1: '#2f6f73', c2: '#e9e1d6' },
    { name: 'Silicone Pot Holders (pair)', price: '$16.00', art: 'box', c1: '#b5532f', c2: '#f3d9cc' },
    { name: 'Beechwood Spoon Set', price: '$22.00', art: 'box', c1: '#c49a6c', c2: '#efe1cf' },
    { name: 'Stoneware Baking Dish', price: '$38.00', art: 'box', c1: '#e9e1d6', c2: '#b5532f' },
    { name: 'Linen Apron', price: '$29.00', art: 'duvet', c1: '#7d8f69', c2: '#dfe6d6' },
    { name: 'Stainless Steel Stockpot 8 qt', price: '$74.00', art: 'pot', c1: '#9aa5ad', c2: '#e3e7ea' },
    { name: 'Countertop Grain Mill', price: '$249.00', art: 'mill', c1: '#e2d4bf', c2: '#5b4636' },
    { name: 'Cotton Oven Mitts', price: '$18.00', art: 'box', c1: '#d98c5f', c2: '#f7e3d6' },
  ];

  var LATEST_REVIEWS = [
    { stars: 5, title: 'Heirloom quality', author: 'Priya S.', body: 'Braised short ribs for four hours and the enamel still looks new.' },
    { stars: 4, title: 'Heavy but worth it', author: 'Jon B.', body: 'Takes two hands to move when full, but it holds heat brilliantly.' },
    { stars: 5, title: 'Perfect bread oven', author: 'Hanna L.', body: 'Makes a great crust for no-knead loaves at 250 °C.' },
    { stars: 5, title: 'Gorgeous colour', author: 'Marcus T.', body: 'The terracotta glaze looks even better in person.' },
    { stars: 4, title: 'Lid knob gets hot', author: 'Elena G.', body: 'Use a mitt on the knob. Otherwise flawless.' },
    { stars: 5, title: 'Second one for my sister', author: 'Rob D.', body: 'Liked mine so much that I bought another as a gift.' },
  ];

  var WATCHED_BASE = { price: 89, priceText: '$89.00', stock: 'in_stock', stockText: 'In stock' };

  /** Page noise for a raw phase number. Watched values never depend on it. */
  function noiseFor(raw) {
    var r = WF.rng('noise-only', 'phase', raw);
    return {
      banner: BANNERS[raw % BANNERS.length],
      reviewCount: 1284 + raw * 3 + (raw % 2),
      rating: [4.7, 4.7, 4.6, 4.8, 4.7][raw % 5],
      boughtLast24h: 150 + WF.rint(r, 0, 90),
      questions: 38 + Math.floor(raw / 2),
      recommendations: WF.shuffle(r, RECS.map(function (x) { return x.name; })).slice(0, 4),
      latestReview: LATEST_REVIEWS[raw % LATEST_REVIEWS.length].title,
    };
  }

  var timeline = [];
  for (var k = 0; k < LISTED; k++) timeline.push(Object.assign({}, WATCHED_BASE, noiseFor(k)));

  WF.define({
    id: 'noise-only',
    title: 'Noise only',
    path: 's/noise-only/',
    docTitle: 'Enameled Dutch Oven 5.5 qt | Brightfold Kitchen',
    watched: [
      { key: 'price', label: 'Price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
      { key: 'stock', label: 'Availability' },
      { key: 'stockText', label: 'Availability as displayed' },
    ],
    timeline: timeline,
    afterLast:
      'Watched values never change. Page noise (banner, review count, rating, bought-in-24h, recommendations, latest review, "last updated") is computed from the raw phase, so it keeps changing after the last listed phase; "people viewing now" changes every minute and the dispatch countdown changes on every load.',
    state: function (ctx) {
      var st = Object.assign({}, WATCHED_BASE, noiseFor(ctx.rawPhase));
      st.viewingNow = 6 + WF.rint(ctx.rng('minute', Math.floor(ctx.now / 60000)), 0, 40);
      st.lastUpdated = ctx.phaseStart;
      return st;
    },
    render: function (ctx, st) {
      var cutoff = Math.floor(ctx.now / WF.DAY_MS) * WF.DAY_MS + 16 * 3600000;
      var tomorrow = ctx.now >= cutoff;
      if (tomorrow) cutoff += WF.DAY_MS;
      var recs = st.recommendations.map(function (name) {
        return RECS.filter(function (x) { return x.name === name; })[0];
      });
      var lr = LATEST_REVIEWS.filter(function (x) { return x.title === st.latestReview; })[0];
      var buy =
        S.priceBlock({ now: st.priceText, note: 'Pay in 4 interest-free installments. Free standard shipping.' }) +
        S.stockLine('in', st.stockText, 'Order within ' + esc(WF.fmt.duration(cutoff - ctx.now)) + ' for dispatch ' + (tomorrow ? 'tomorrow' : 'today') + '.') +
        '<p class="small"><strong>' + st.viewingNow + ' people</strong> are viewing this right now · <strong>' + st.boughtLast24h + '</strong> bought in the last 24 hours</p>' +
        '<p class="small"><strong>Color:</strong> Terracotta &nbsp; <strong>Size:</strong> 5.5 qt</p>' +
        S.buyRow(true);
      return S.productPage({
        store: 'brightfold',
        banner: '<strong>' + esc(st.banner) + '</strong>',
        crumbs: ['Home', 'Cookware', 'Dutch ovens', 'Enameled Dutch Oven 5.5 qt'],
        name: 'Enameled Dutch Oven, 5.5 qt',
        subtitle: 'Cast iron with a chip-resistant enamel finish',
        sku: 'BK-DO55-TER',
        rating: st.rating,
        reviewCount: st.reviewCount,
        art: ['pot', '#b5532f', '#3a3f44'],
        buy: buy,
        highlights: ['Even heating cast iron core', 'Oven safe to 260 °C / 500 °F', 'Self-basting lid with condensation rings', st.questions + ' answered questions'],
        perks: ['Lifetime warranty', 'Free returns', 'Works on induction', 'Page updated ' + WF.fmt.dateTime(st.lastUpdated)],
        description: [
          'A kitchen workhorse for braises, stews, soups and bread. The heavy cast iron body holds heat for hours, while the smooth enamel interior resists sticking and never needs seasoning.',
          'The tight-fitting lid has condensation rings on its underside, so moisture drips back onto your food as it cooks.',
        ],
        specs: [
          ['Capacity', '5.5 quarts (5.2 liters)'],
          ['Diameter', '26 cm'],
          ['Weight', '5.4 kg'],
          ['Heat sources', 'Gas, electric, induction, oven'],
          ['Care', 'Hand wash recommended'],
        ],
        reviews: [
          { stars: lr.stars, title: lr.title, author: lr.author, when: 'Latest review · ' + WF.fmt.rel(st.lastUpdated - 3600000, ctx.now), body: lr.body },
          { stars: 5, title: 'Best pot I own', author: 'Clara W.', when: '2 months ago', body: 'Soups, bread, chili — it does everything.' },
          { stars: 4, title: 'Great, but check the weight', author: 'Sam O.', when: '4 months ago', body: 'It is heavy. That is also why it cooks so evenly.' },
        ],
        relatedTitle: 'Recommended for you',
        related: recs,
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
