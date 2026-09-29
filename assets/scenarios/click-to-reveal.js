(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;
  var DELIVERY = 12;
  var PRICES = [249, 249, 229, 229, 219, 219];

  function detailsHtml(st) {
    return (
      '<div class="panel" id="price-details">' +
      '<table class="breakdown"><tbody>' +
      '<tr><td>Item price</td><td><strong id="product-price">' + st.priceText + '</strong></td></tr>' +
      '<tr><td>Standard delivery</td><td>' + money(DELIVERY) + '</td></tr>' +
      '<tr class="total"><td>Estimated total</td><td id="price-total">' + money(st.price + DELIVERY) + '</td></tr>' +
      '</tbody></table><p class="muted small">Sales tax is calculated at checkout.</p></div>'
    );
  }

  WF.define({
    id: 'click-to-reveal',
    title: 'Price behind a click (not in the DOM before the click)',
    path: 's/click-to-reveal/',
    docTitle: 'Stoneheart Countertop Grain Mill | Brightfold Kitchen',
    watched: [
      { key: 'price', label: 'Item price (USD), inside "Show price details"' },
      { key: 'priceText', label: 'Item price as displayed' },
    ],
    timeline: PRICES.map(function (p) {
      return { price: p, priceText: money(p), totalText: money(p + DELIVERY) };
    }),
    afterLast:
      'The price-details panel is NOT in the DOM until the "Show price details" button is clicked (it is inserted by script on click and removed again on the next click).',
    render: function (ctx, st) {
      var buy =
        '<p class="price-note" style="font-size:1rem">Our prices vary with delivery region. Open price details to see today\'s price.</p>' +
        '<div class="disclosure"><button type="button" id="toggle-price-details" aria-expanded="false" aria-controls="price-details-slot">Show price details <span aria-hidden="true">▾</span></button><div id="price-details-slot"></div></div>' +
        S.stockLine('in', 'In stock', 'Ships in 3–5 business days.') +
        S.buyRow(true);
      return S.productPage({
        store: 'brightfold',
        crumbs: ['Home', 'Small appliances', 'Grain mills', 'Stoneheart Countertop Grain Mill'],
        name: 'Stoneheart Countertop Grain Mill',
        subtitle: 'Corundum-ceramic millstones · Beech housing',
        sku: 'BK-GM-STH',
        rating: 4.6,
        reviewCount: 143,
        art: ['mill', '#e2d4bf', '#5b4636'],
        buy: buy,
        highlights: ['Mills wheat, spelt, rye and rice from coarse to fine', '360 W motor, about 100 g of flour per minute', 'Self-cleaning stones'],
        description: ['Fresh flour in seconds: the Stoneheart mill grinds whole grains between corundum-ceramic stones for a flavour you cannot get from a bag.'],
        specs: [
          ['Motor', '360 W'],
          ['Hopper', '850 g'],
          ['Housing', 'Solid beech'],
          ['Dimensions', '17 × 17 × 32 cm'],
        ],
        reviews: [{ stars: 5, title: 'Game changer for sourdough', author: 'Leni K.', when: '5 days ago', body: 'Freshly milled rye makes such a difference.' }],
      });
    },
    after: function (app, ctx, st) {
      var btn = document.getElementById('toggle-price-details');
      var slot = document.getElementById('price-details-slot');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        if (open) {
          slot.innerHTML = '';
          btn.setAttribute('aria-expanded', 'false');
          btn.firstChild.nodeValue = 'Show price details ';
        } else {
          slot.innerHTML = detailsHtml(st);
          btn.setAttribute('aria-expanded', 'true');
          btn.firstChild.nodeValue = 'Hide price details ';
        }
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
