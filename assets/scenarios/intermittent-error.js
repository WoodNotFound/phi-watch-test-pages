(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;

  // null = the page renders a "503 Service temporarily unavailable" error state
  var PRICES = [149, null, 149, 149, null, null, 129, 129, null, 129];

  WF.define({
    id: 'intermittent-error',
    title: 'Intermittent error',
    path: 's/intermittent-error/',
    docTitle: 'Summit Down Vest | Lumen Outfitters',
    watched: [
      { key: 'status', label: 'ok | error (503 page instead of the product)' },
      { key: 'price', label: 'Price (USD); null on error phases' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p) {
      return { status: p == null ? 'error' : 'ok', readable: p != null, price: p, priceText: p == null ? null : money(p) };
    }),
    afterLast: 'The error page is rendered by script; the HTTP status is still 200 (GitHub Pages cannot vary it).',
    render: function (ctx, st) {
      if (st.status === 'error') {
        document.title = '503 Service Temporarily Unavailable';
        var ref = 'LO-' + Math.floor(ctx.rng('ref', ctx.rawPhase)() * 0xffffff).toString(16).padStart(6, '0');
        return (
          '<style>.err{min-height:70vh;display:flex;align-items:center;justify-content:center;background:#f4f5f6;padding:40px 16px}' +
          '.err .box{max-width:560px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:36px 40px;text-align:center}' +
          '.err .code{font-size:4rem;font-weight:800;color:#c3c9ce;margin:0;line-height:1}</style>' +
          '<div class="err" id="error-page"><div class="box"><p class="code">503</p><h1>Service Temporarily Unavailable</h1>' +
          '<p>The server is temporarily unable to handle your request due to maintenance downtime or capacity problems. Please try again in a few minutes.</p>' +
          '<p class="muted small">Reference #' + ref + ' · ' + WF.esc(WF.fmt.dateTime(ctx.now)) + '</p></div></div>'
        );
      }
      var buy =
        S.priceBlock({ now: st.priceText, sale: st.price < 149, was: st.price < 149 ? '$149.00' : null, save: st.price < 149 ? 'Save $20.00' : null, note: 'Members earn 10% back in trail credit.' }) +
        S.stockLine('in', 'In stock', 'Ships in 1–2 business days.') +
        '<p class="small"><strong>Colour:</strong> Ember &nbsp; <strong>Size:</strong> M</p>' +
        S.buyRow(true);
      return S.productPage({
        store: 'lumen',
        crumbs: ['Home', 'Apparel', 'Insulation', 'Summit Down Vest'],
        name: 'Summit Down Vest',
        subtitle: '800-fill responsibly sourced down',
        sku: 'LO-SDV-EMB-M',
        rating: 4.8,
        reviewCount: 277,
        art: ['vest', '#c4552f', '#3b2a22'],
        buy: buy,
        highlights: ['800-fill-power down, 110 g fill weight', 'Packs into its own pocket', 'Water-resistant ripstop shell'],
        description: ['A warm, featherweight layer for cold mornings and belay stances. Wear it alone on crisp days or under a shell when the weather turns.'],
        specs: [['Fill', '800-fill down (RDS certified)'], ['Weight (M)', '240 g'], ['Shell', '20D recycled ripstop nylon']],
        reviews: [{ stars: 5, title: 'Warm and tiny', author: 'Joss P.', when: '1 month ago', body: 'Packs smaller than my water bottle.' }],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
