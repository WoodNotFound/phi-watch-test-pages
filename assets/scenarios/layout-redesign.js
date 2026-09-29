(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;

  var PHASES = [
    { price: 79, layout: 'classic' },
    { price: 79, layout: 'classic' },
    { price: 79, layout: 'classic' },
    { price: 79, layout: 'redesign' },
    { price: 79, layout: 'redesign' },
    { price: 72, layout: 'redesign' },
    { price: 72, layout: 'redesign' },
  ];

  var NAME = 'Alpine Trekking Poles (pair)';

  function classic(st) {
    var buy =
      S.priceBlock({ now: st.priceText, note: 'Members earn 10% back in trail credit.' }) +
      S.stockLine('in', 'In stock', 'Ships in 1–2 business days.') +
      S.buyRow(true);
    return S.productPage({
      store: 'lumen',
      crumbs: ['Home', 'Hiking', 'Trekking poles', NAME],
      name: NAME,
      subtitle: 'Carbon shafts · Cork grips · Flick-lock adjustment',
      sku: 'LO-ATP-CRB',
      rating: 4.7,
      reviewCount: 402,
      art: ['poles', '#3b4750', '#e08a2c'],
      buy: buy,
      highlights: ['Carbon fibre shafts, 460 g per pair', 'Adjustable 105–135 cm', 'Natural cork grips with EVA extensions'],
      description: ['Light, stiff and quick to adjust, these poles take the load off your knees on long descents.'],
      specs: [['Weight', '460 g per pair'], ['Length', '105–135 cm'], ['Shaft', 'Carbon fibre'], ['Grip', 'Cork']],
      reviews: [{ stars: 5, title: 'Light and solid', author: 'Björn L.', when: '3 weeks ago', body: 'Locks never slipped on a week-long trek.' }],
    });
  }

  function redesign(st) {
    var inst = money(Math.round((st.price / 4) * 100) / 100);
    return (
      '<style>.lx{font-family:var(--font);--ink:#10231c;background:#f1efe8;color:var(--ink)}.lx .topbar{background:#0e3b2e;color:#f1efe8;padding:14px 0}' +
      '.lx .topbar .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.lx .wordmark{font-weight:800;letter-spacing:.2em;text-transform:uppercase}' +
      '.lx .topbar nav a{color:#f1efe8;text-decoration:none;margin-left:18px;font-size:.9rem}.lx .intro{padding:40px 0 10px}.lx .intro h1{font-size:2.6rem;letter-spacing:-.03em;margin:0}' +
      '.lx .grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:40px;padding:24px 0 120px}@media (max-width:820px){.lx .grid{grid-template-columns:1fr}}' +
      '.lx .stage{background:#fff;border-radius:24px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}.lx .stage svg{width:60%;height:80%}' +
      '.lx .facts dl{display:grid;grid-template-columns:auto 1fr;gap:6px 18px}.lx .facts dt{color:#5d6b64}.lx .facts dd{margin:0}' +
      '.lx .buybar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #d9d5c7;z-index:5}.lx .buybar .wrap{display:flex;align-items:center;gap:18px;padding-top:12px;padding-bottom:12px;flex-wrap:wrap}' +
      '.lx .buybar .amount{font-size:1.6rem;font-weight:800}.lx .buybar .go{margin-left:auto;background:#ff6b3d;color:#fff;border:0;border-radius:999px;padding:12px 26px;font-weight:700}' +
      '.lx .welcome{background:#ff6b3d;color:#fff;text-align:center;padding:8px 12px;font-size:.9rem}</style>' +
      '<div class="lx"><div class="welcome">Welcome to the new Lumen Outfitters website. Same gear, fresh look.</div>' +
      '<div class="topbar"><div class="wrap"><span class="wordmark">Lumen</span><nav><a href="#">Shop</a><a href="#">Journal</a><a href="#">Repairs</a><a href="#">Stores</a><a href="#">Bag · 0</a></nav></div></div>' +
      '<div class="wrap"><section class="intro"><p class="muted small">Hiking / Trekking poles</p><h1>' + esc(NAME) + '</h1><p>Carbon shafts. Cork grips. Built for long descents.</p></section>' +
      '<div class="grid"><div class="stage">' + S.art('poles', '#0e3b2e', '#ff6b3d') + '</div>' +
      '<div class="facts"><h2>Why you will like them</h2><p>Light, stiff and quick to adjust, these poles take the load off your knees on long descents.</p>' +
      '<dl><dt>Weight</dt><dd>460 g per pair</dd><dt>Length</dt><dd>105–135 cm</dd><dt>Shaft</dt><dd>Carbon fibre</dd><dt>Grip</dt><dd>Cork</dd><dt>Rating</dt><dd>4.7 / 5 from 402 reviews</dd></dl>' +
      '<p class="small">Or 4 interest-free payments of ' + inst + '.</p></div></div></div>' +
      '<div class="buybar" role="region" aria-label="Buy"><div class="wrap"><div><div class="small">' + esc(NAME) + '</div><div class="small" style="color:#1d7a3e">In stock · ships in 1–2 days</div></div>' +
      '<span class="amount" data-price-amount>' + esc(st.priceText) + '</span><button class="go" type="button">Add to bag</button></div></div></div>'
    );
  }

  WF.define({
    id: 'layout-redesign',
    title: 'Site redesign without a price change',
    path: 's/layout-redesign/',
    docTitle: 'Alpine Trekking Poles (pair) | Lumen Outfitters',
    watched: [
      { key: 'price', label: 'Price (USD)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      return { price: p.price, priceText: money(p.price), layout: p.layout };
    }),
    afterLast: 'From phase 3 the page uses completely different markup (no #product-price; the price sits in a fixed bottom buy bar, .buybar [data-price-amount]) and a new visual theme.',
    render: function (ctx, st) {
      return st.layout === 'classic' ? classic(st) : redesign(st);
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
