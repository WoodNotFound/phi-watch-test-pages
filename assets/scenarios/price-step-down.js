(function (WF) {
  'use strict';
  var S = WF.shop;
  var money = WF.fmt.money;
  var LIST = 59.99;
  var PRICES = [59.99, 59.99, 54.99, 49.99, 44.99, 39.99];

  WF.define({
    id: 'price-step-down',
    title: 'Price step-down',
    path: 's/price-step-down/',
    docTitle: 'Trailhead 28L Daypack | Lumen Outfitters',
    watched: [
      { key: 'price', label: 'Current price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p) {
      return {
        price: p,
        priceText: money(p),
        wasText: p < LIST ? money(LIST) : null,
        stockText: 'In stock',
      };
    }),
    render: function (ctx, st) {
      var off = LIST - st.price;
      var buy =
        S.priceBlock({
          now: st.priceText,
          sale: off > 0,
          was: st.wasText,
          save: off > 0 ? 'Save ' + money(off) + ' (' + Math.round((off / LIST) * 100) + '%)' : null,
          note: 'Or 4 interest-free payments with Lumen Pay. Members earn 10% back in trail credit.',
        }) +
        S.stockLine('in', st.stockText, 'Ships in 1–2 business days · Free pickup at Lumen Outfitters stores') +
        '<p class="small"><strong>Color:</strong> Juniper green &nbsp; <strong>Volume:</strong> 28 L</p>' +
        S.buyRow(true);
      return S.productPage({
        store: 'lumen',
        crumbs: ['Home', 'Packs & bags', 'Daypacks', 'Trailhead 28L Daypack'],
        name: 'Trailhead 28L Daypack',
        subtitle: 'Ventilated back panel · Rain cover included',
        sku: 'LO-TH28-JUN',
        rating: 4.6,
        reviewCount: 312,
        art: ['backpack', '#2f6b52', '#e08a2c'],
        buy: buy,
        highlights: ['28 L main compartment with laptop sleeve (fits 15")', 'Suspended mesh back panel keeps you cool', 'Hip belt pockets for phone and snacks', 'Stowable rain cover in the base pocket'],
        perks: ['Free returns within 60 days', 'Lifetime repair program', 'Made with 100% recycled nylon', 'Weighs 1.1 kg'],
        description: [
          'The Trailhead 28L is our do-everything daypack: big enough for a full day in the hills, slim enough for the daily commute. A suspended mesh back panel lets air move between you and the pack, while the padded hip belt takes weight off your shoulders on longer climbs.',
          'Inside you will find a padded laptop sleeve, a zippered valuables pocket and a hydration port. Outside there are stretch side pockets for bottles, a front shove-it pocket for layers, and trekking-pole loops.',
        ],
        specs: [
          ['Volume', '28 liters'],
          ['Weight', '1.1 kg (2.4 lb)'],
          ['Dimensions', '52 × 30 × 22 cm'],
          ['Material', '210D recycled ripstop nylon, PFAS-free DWR'],
          ['Back system', 'Suspended mesh, fits torso 41–53 cm'],
          ['Warranty', 'Lifetime repair program'],
        ],
        reviews: [
          { stars: 5, title: 'Comfortable even when full', author: 'Mara K.', when: '3 weeks ago', body: 'Carried it on a 22 km ridge walk with 3 liters of water and never felt hot spots. The hip pockets fit my phone.' },
          { stars: 4, title: 'Great pack, rain cover is small', author: 'Devon A.', when: '1 month ago', body: 'Love the ventilation. The rain cover only just fits when the front pocket is stuffed.' },
          { stars: 5, title: 'My commute bag now', author: 'Ilse V.', when: '2 months ago', body: 'Laptop sleeve is well padded and the pack stands up on its own.' },
        ],
        related: [
          { name: 'Summit 40L Trekking Pack', price: '$119.00', art: 'backpack', c1: '#3b4e7a', c2: '#e0b12c' },
          { name: 'Ridgeline Rain Shell', price: '$129.00', art: 'jacket', c1: '#566b78', c2: '#c6d3da' },
          { name: 'Alpine Trekking Poles (pair)', price: '$79.00', art: 'poles', c1: '#4a5a64', c2: '#e08a2c' },
          { name: 'Trail Hydration Bladder 2L', price: '$34.95', art: 'box', c1: '#2e7aa8', c2: '#bfe0f2' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
