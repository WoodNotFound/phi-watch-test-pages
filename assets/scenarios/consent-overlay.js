(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;
  var PRICES = [32, 32, 32, 27.5, 27.5];

  WF.define({
    id: 'consent-overlay',
    title: 'Cookie-consent overlay over the product',
    path: 's/consent-overlay/',
    docTitle: 'Galvanised Watering Can, 9 L | Wrenfield Garden Supply',
    watched: [
      { key: 'price', label: 'Price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PRICES.map(function (p, k) {
      return { price: p, priceText: money(p), noticeVersion: '3.' + (k + 1) };
    }),
    afterLast:
      'A modal cookie-consent dialog covers the page on every load (nothing is remembered). The product, including its price, is in the DOM underneath the whole time; the dialog text (policy version) changes every phase. "Accept all", "Reject non-essential" and "Save choices" all just close the dialog for this load.',
    render: function (ctx, st) {
      var buy =
        S.priceBlock({ now: st.priceText, sale: st.price < 32, was: st.price < 32 ? '$32.00' : null, note: 'Free click & collect from all Wrenfield stores.' }) +
        S.stockLine('in', 'In stock', 'Home delivery in 2–3 days.') +
        S.buyRow(true);
      var page = S.productPage({
        store: 'wrenfield',
        crumbs: ['Home', 'Watering', 'Watering cans', 'Galvanised Watering Can, 9 L'],
        name: 'Galvanised Watering Can, 9 L',
        subtitle: 'Hot-dip galvanised steel with brass rose',
        sku: 'WGS-WC9-GAL',
        rating: 4.6,
        reviewCount: 318,
        art: ['can', '#9aa7ad', '#6b7a55'],
        buy: buy,
        highlights: ['Removable brass rose for a gentle shower', 'Balanced handle for easy pouring', 'Rust-proof galvanised finish'],
        description: ['A classic watering can that will last for decades. The long spout reaches the back of borders and the brass rose gives seedlings a soft shower.'],
        specs: [['Capacity', '9 liters'], ['Material', 'Galvanised steel, brass rose'], ['Weight', '1.6 kg']],
        reviews: [{ stars: 5, title: 'Built to last', author: 'Moira E.', when: '1 month ago', body: 'Heavy-duty and pours beautifully.' }],
      });
      var dialog =
        '<div id="consent-backdrop" style="position:fixed;inset:0;background:rgba(15,20,25,.55);z-index:50;display:flex;align-items:flex-end;justify-content:center;padding:16px">' +
        '<div role="dialog" aria-modal="true" aria-labelledby="consent-title" style="background:#fff;max-width:760px;width:100%;border-radius:14px;padding:24px 26px;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
        '<h2 id="consent-title">We value your privacy</h2>' +
        '<p>Wrenfield Garden Supply uses cookies to run this site, remember your basket and, with your consent, measure how the site is used and personalise offers. You can change your choice at any time under "Cookie settings".</p>' +
        '<p class="muted small">Privacy notice v' + esc(st.noticeVersion) + ' · updated ' + esc(WF.fmt.dateShort(ctx.startOf(ctx.phase))) + '</p>' +
        '<details style="margin:8px 0 14px"><summary>Manage preferences</summary><p class="small"><label><input type="checkbox" checked disabled> Strictly necessary</label><br><label><input type="checkbox"> Analytics</label><br><label><input type="checkbox"> Personalised offers</label></p></details>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="button" data-consent="accept">Accept all</button><button class="btn secondary" type="button" data-consent="reject">Reject non-essential</button><button class="btn link" type="button" data-consent="save">Save choices</button></div>' +
        '</div></div>';
      return page + dialog;
    },
    after: function (app) {
      Array.prototype.forEach.call(app.querySelectorAll('[data-consent]'), function (b) {
        b.addEventListener('click', function () {
          var el = document.getElementById('consent-backdrop');
          if (el) el.parentNode.removeChild(el);
        });
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
