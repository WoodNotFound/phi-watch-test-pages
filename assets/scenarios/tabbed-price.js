(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;
  var PRICES = [189, 189, 189, 169, 169, 159];

  WF.define({
    id: 'tabbed-price',
    title: 'Price in a secondary tab (in the DOM but hidden before the click)',
    path: 's/tabbed-price/',
    docTitle: 'Walnut Bedside Table | Harbor & Pine Home',
    watched: [
      { key: 'price', label: 'Price (USD), in the "Price & delivery" tab' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p) {
      return { price: p, priceText: money(p) };
    }),
    afterLast:
      'The "Price & delivery" tab panel IS in the DOM from the start but carries the hidden attribute until its tab is clicked: textContent contains the price, innerText and the accessibility tree do not.',
    render: function (ctx, st) {
      var buy =
        '<p class="price-note" style="font-size:1rem">Handmade to order. See the <a href="#product-tabs">Price &amp; delivery</a> tab for today\'s price and lead time.</p>' +
        S.stockLine('in', 'Available to order', 'Made to order in our Vermont workshop.') +
        S.buyRow(true);
      var tabs =
        '<section class="tabs" id="product-tabs"><div class="tablist" role="tablist" aria-label="Product information">' +
        '<button type="button" role="tab" id="tab-overview" aria-controls="panel-overview" aria-selected="true">Overview</button>' +
        '<button type="button" role="tab" id="tab-dimensions" aria-controls="panel-dimensions" aria-selected="false">Dimensions</button>' +
        '<button type="button" role="tab" id="tab-pricing" aria-controls="panel-pricing" aria-selected="false">Price &amp; delivery</button></div>' +
        '<div class="tabpanel" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview"><p>A compact bedside table in solid walnut with one soft-close drawer and an open shelf for books. Oiled by hand; the grain deepens with age.</p></div>' +
        '<div class="tabpanel" role="tabpanel" id="panel-dimensions" aria-labelledby="tab-dimensions" hidden><table class="specs"><tbody><tr><th scope="row">Width</th><td>45 cm</td></tr><tr><th scope="row">Depth</th><td>38 cm</td></tr><tr><th scope="row">Height</th><td>55 cm</td></tr></tbody></table></div>' +
        '<div class="tabpanel" role="tabpanel" id="panel-pricing" aria-labelledby="tab-pricing" hidden>' +
        '<div class="price-block"><span class="muted">Price</span> <span class="price-now" id="product-price">' + st.priceText + '</span></div>' +
        '<p>White-glove delivery: <strong>$49.00</strong> · Lead time: ships in 2–3 weeks.</p><p class="muted small">Price per table. Local sales tax added at checkout.</p></div>' +
        '</section>';
      return S.productPage({
        store: 'harbor',
        crumbs: ['Home', 'Bedroom', 'Bedside tables', 'Walnut Bedside Table'],
        name: 'Walnut Bedside Table',
        subtitle: 'Solid American walnut · One drawer',
        sku: 'HP-BT-WAL',
        rating: 4.9,
        reviewCount: 58,
        art: ['table', '#6b4a2f', '#3a2718'],
        buy: buy,
        middle: tabs,
        description: ['Each table is cut, joined and finished by hand. Drawer runners are soft-close, and the back is finished so it can stand away from a wall.'],
        specs: [
          ['Material', 'Solid American walnut'],
          ['Finish', 'Hardwax oil'],
          ['Assembly', 'None required'],
        ],
        reviews: [{ stars: 5, title: 'Beautiful joinery', author: 'Ruth A.', when: '2 months ago', body: 'Worth the wait. The drawer glides perfectly.' }],
      });
    },
    after: function (app) {
      var tabs = app.querySelectorAll('[role="tab"]');
      Array.prototype.forEach.call(tabs, function (tab) {
        tab.addEventListener('click', function () {
          Array.prototype.forEach.call(tabs, function (t) {
            var sel = t === tab;
            t.setAttribute('aria-selected', sel ? 'true' : 'false');
            var panel = document.getElementById(t.getAttribute('aria-controls'));
            if (sel) panel.removeAttribute('hidden');
            else panel.setAttribute('hidden', '');
          });
        });
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
