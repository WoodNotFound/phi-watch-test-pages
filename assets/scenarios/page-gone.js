(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;
  var MOVED_FROM = 5;

  // status (as seen at the ORIGINAL url s/page-gone/): available | gone | moved | redirect
  // price: the product's current price wherever it lives (for moved/redirect: on the new url s/page-gone/new/)
  var PHASES = [
    { status: 'available', price: 42 },
    { status: 'available', price: 42 },
    { status: 'available', price: 38 },
    { status: 'gone', price: null },
    { status: 'gone', price: null },
    { status: 'moved', price: 36 },
    { status: 'redirect', price: 36 },
    { status: 'redirect', price: 34 },
  ];

  function oldProduct(st) {
    var buy =
      S.priceBlock({ now: st.priceText, sale: st.price < 42, was: st.price < 42 ? '$42.00' : null, note: 'Free delivery on orders over $35.' }) +
      S.stockLine('in', 'In stock', 'Dispatched within 1 business day.') +
      S.buyRow(true);
    return S.productPage({
      store: 'northwind',
      crumbs: ['Home', 'Travel', 'Atlases', 'Atlas of Quiet Places'],
      name: 'Atlas of Quiet Places (Hardcover)',
      subtitle: 'by Linnea Harwood · First edition',
      sku: 'NWB-17720',
      rating: 4.7,
      reviewCount: 214,
      art: ['book', '#3d5a4c', '#e6d9b8'],
      buy: buy,
      highlights: ['320 pages, 140 hand-drawn maps', 'Clothbound with ribbon marker', 'Printed on FSC paper'],
      description: ['A cartographer\'s journey to fifty of the quietest places on earth, from salt flats to sound-proofed chapels. Each chapter pairs an essay with a hand-drawn map.'],
      specs: [['Format', 'Hardcover'], ['Pages', '320'], ['Publisher', 'Lanternfield Press (fictional)'], ['Edition', 'First edition']],
      reviews: [{ stars: 5, title: 'Lovely object', author: 'Anselm T.', when: '1 month ago', body: 'The maps alone are worth it.' }],
    });
  }

  function newProduct(st) {
    var buy =
      S.priceBlock({ now: st.priceText, note: 'Free delivery on orders over $35.' }) +
      S.stockLine('in', 'In stock', 'Dispatched within 1 business day.') +
      S.buyRow(true);
    return S.productPage({
      store: 'northwind',
      notice: '<div class="notice">You were looking for <em>Atlas of Quiet Places</em>? This is the revised edition, which replaces the first edition.</div>',
      crumbs: ['Home', 'Travel', 'Atlases', 'Atlas of Quiet Places — Revised Edition'],
      name: 'Atlas of Quiet Places — Revised Edition (Hardcover)',
      subtitle: 'by Linnea Harwood · Revised and expanded',
      sku: 'NWB-21904',
      rating: 4.8,
      reviewCount: 37,
      art: ['book', '#2f4a5e', '#e6d9b8'],
      buy: buy,
      highlights: ['352 pages, 160 hand-drawn maps', 'Eight new chapters', 'Clothbound with ribbon marker'],
      description: ['The revised edition adds eight new chapters and updated maps throughout.'],
      specs: [['Format', 'Hardcover'], ['Pages', '352'], ['Publisher', 'Lanternfield Press (fictional)'], ['Edition', 'Revised edition']],
    });
  }

  function notFound() {
    return S.shell(
      'northwind',
      '<div class="page-head" style="text-align:center;padding:60px 0"><p class="muted" style="font-size:3rem;margin:0">404</p><h1>We couldn\'t find that page</h1>' +
        '<p>The page you are looking for does not exist or is not available yet.</p><p><a class="btn" href="#">Browse all books</a></p></div>'
    );
  }

  WF.define({
    id: 'page-gone',
    title: 'Page disappears, then moves',
    path: 's/page-gone/',
    docTitle: 'Atlas of Quiet Places (Hardcover) | Northwind Books',
    extraViews: [{ view: 'new', path: 's/page-gone/new/', docTitle: 'Atlas of Quiet Places — Revised Edition | Northwind Books' }],
    watched: [
      { key: 'status', label: 'Original URL shows: available | gone | moved (notice + link) | redirect (script redirect to the new URL)' },
      { key: 'price', label: 'Current price (USD) wherever the product now lives (null when discontinued)' },
      { key: 'priceText', label: 'Price as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      return {
        status: p.status,
        price: p.price,
        priceText: p.price == null ? null : money(p.price),
        newUrlShows: p.status === 'moved' || p.status === 'redirect' ? 'product' : 'not_found',
        newUrl: 's/page-gone/new/',
      };
    }),
    afterLast:
      'The new URL s/page-gone/new/ shows a 404-style "page not found" page before phase ' + MOVED_FROM + ' and the revised edition from phase ' + MOVED_FROM + ' on. From phase 6 the original URL immediately redirects there with location.replace, keeping the query string. GitHub Pages returns HTTP 200 for every state.',
    render: function (ctx, st) {
      if (ctx.view === 'new') {
        if (st.newUrlShows !== 'product') {
          document.title = 'Page not found | Northwind Books';
          return notFound();
        }
        return newProduct(st);
      }
      if (st.status === 'available') return oldProduct(st);
      if (st.status === 'gone') {
        document.title = 'No longer available | Northwind Books';
        return S.shell(
          'northwind',
          S.crumbs(['Home', 'Travel', 'Atlases', 'Atlas of Quiet Places']) +
            '<div class="notice bad" id="product-gone"><h1 style="font-size:1.4rem">This product is no longer available</h1><p>Atlas of Quiet Places (Hardcover) has been discontinued by the publisher and can no longer be ordered.</p></div>' +
            '<section class="related"><h2>Similar books</h2><ul class="cards">' +
            '<li class="card"><div class="art">' + S.art('book', '#6b3f69', '#e6d9b8') + '</div><div class="body"><div class="name"><a href="#">The Slow Road North</a></div><div class="price">$29.00</div></div></li>' +
            '<li class="card"><div class="art">' + S.art('book', '#8c2f39', '#e6d9b8') + '</div><div class="body"><div class="name"><a href="#">Islands of Fog</a></div><div class="price">$33.50</div></div></li>' +
            '</ul></section>'
        );
      }
      if (st.status === 'moved') {
        document.title = 'This product has moved | Northwind Books';
        return S.shell(
          'northwind',
          S.crumbs(['Home', 'Travel', 'Atlases', 'Atlas of Quiet Places']) +
            '<div class="notice" id="product-moved"><h1 style="font-size:1.4rem">This product has moved</h1><p>Atlas of Quiet Places now has a new page for its revised edition.</p>' +
            '<p><a class="btn" id="moved-link" href="' + esc(WF.keepParams('new/')) + '">Go to the new page</a></p></div>'
        );
      }
      return { redirect: WF.keepParams('new/') };
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
