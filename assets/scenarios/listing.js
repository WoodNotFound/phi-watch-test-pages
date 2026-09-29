(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;

  var BOOKS = {
    glass: { code: 'NWB-20417', title: 'The Glass Orchard', author: 'Maren Ostrova', format: 'Hardcover', bg: '#2f5d62' },
    salt: { code: 'NWB-19880', title: 'Salt and Starlight', author: 'Idris Kallan', format: 'Paperback', bg: '#6b3f69' },
    europa: { code: 'NWB-20102', title: 'The Long Quiet of Europa', author: 'Tamsin Vey', format: 'Hardcover', bg: '#1f3b73' },
    ninefold: { code: 'NWB-19544', title: 'Ninefold Harbor', author: 'Oren Blackwood', format: 'Paperback', bg: '#7a4b22' },
    clockwork: { code: 'NWB-18731', title: 'Clockwork Tides', author: 'Lina Marchetti', format: 'Paperback', bg: '#3f6b3a' },
    map: { code: 'NWB-20266', title: 'A Map of Falling Cities', author: 'Jun Aradi', format: 'Hardcover', bg: '#8c2f39' },
    moon: { code: 'NWB-19977', title: "The Cartographer's Moon", author: 'Priya Halden', format: 'Hardcover', bg: '#35505e' },
    signal: { code: 'NWB-20551', title: 'Signal Lost at Tarn', author: 'Ezra Moll', format: 'Paperback', bg: '#444a55' },
    companion: { code: 'NWB-20598', title: 'The Glass Orchard Companion', author: 'Delia Frane', format: 'Paperback', bg: '#5c8a86' },
  };

  // Per phase: display order ("Bestselling") and [price, stock] per book. "new" marks recently added titles.
  var PHASES = [
    { order: ['europa', 'glass', 'salt', 'moon', 'ninefold', 'map', 'clockwork'],
      p: { glass: [18.99, 'in'], salt: [16.99, 'in'], europa: [24.0, 'in'], ninefold: [21.5, 'in'], clockwork: [13.99, 'in'], map: [27.0, 'in'], moon: [18.99, 'in'] } },
    { order: ['glass', 'europa', 'salt', 'ninefold', 'moon', 'clockwork', 'map'],
      p: { glass: [18.99, 'in'], salt: [14.99, 'in'], europa: [24.0, 'in'], ninefold: [21.5, 'out'], clockwork: [13.99, 'in'], map: [27.0, 'in'], moon: [18.99, 'in'] } },
    { order: ['signal', 'glass', 'europa', 'salt', 'moon', 'map', 'ninefold', 'clockwork'], isNew: ['signal'],
      p: { glass: [18.99, 'in'], salt: [14.99, 'in'], europa: [22.0, 'in'], ninefold: [21.5, 'out'], clockwork: [13.99, 'in'], map: [27.0, 'in'], moon: [18.99, 'in'], signal: [22.0, 'in'] } },
    { order: ['glass', 'signal', 'moon', 'europa', 'salt', 'map', 'ninefold', 'clockwork'], isNew: ['signal'],
      p: { glass: [15.99, 'in'], salt: [14.99, 'in'], europa: [22.0, 'in'], ninefold: [21.5, 'out'], clockwork: [13.99, 'in'], map: [27.0, 'in'], moon: [16.49, 'in'], signal: [22.0, 'in'] } },
    { order: ['companion', 'glass', 'signal', 'europa', 'moon', 'salt', 'map', 'ninefold'], isNew: ['companion'],
      p: { glass: [15.99, 'in'], salt: [14.99, 'in'], europa: [22.0, 'in'], ninefold: [21.5, 'out'], map: [24.3, 'in'], moon: [16.49, 'in'], signal: [22.0, 'in'], companion: [9.99, 'in'] } },
    { order: ['signal', 'companion', 'europa', 'glass', 'moon', 'map', 'salt', 'ninefold'], isNew: ['companion'],
      p: { glass: [15.99, 'out'], salt: [16.99, 'in'], europa: [22.0, 'in'], ninefold: [21.5, 'in'], map: [24.3, 'in'], moon: [16.49, 'in'], signal: [22.0, 'in'], companion: [9.99, 'in'] } },
    { order: ['glass', 'companion', 'signal', 'moon', 'europa', 'salt', 'ninefold', 'map'],
      p: { glass: [15.99, 'in'], salt: [16.99, 'in'], europa: [22.0, 'in'], ninefold: [21.5, 'in'], map: [24.3, 'in'], moon: [18.99, 'in'], signal: [19.8, 'in'], companion: [9.99, 'in'] } },
  ];

  function stockText(s) {
    return s === 'in' ? 'In stock' : 'Temporarily out of stock';
  }

  var timeline = PHASES.map(function (ph) {
    var g = ph.p.glass;
    return {
      glassPrice: g[0],
      glassPriceText: money(g[0]),
      glassStock: g[1] === 'in' ? 'in_stock' : 'out_of_stock',
      glassStockText: stockText(g[1]),
      items: ph.order.map(function (k) {
        var b = BOOKS[k];
        return b.title + ' (' + b.author + ') ' + money(ph.p[k][0]) + (ph.p[k][1] === 'in' ? '' : ' [out of stock]');
      }),
      _order: ph.order,
      _p: ph.p,
      _new: ph.isNew || [],
    };
  });

  WF.define({
    id: 'listing',
    title: 'Several products on one listing page',
    path: 's/listing/',
    docTitle: 'New & Notable in Science Fiction | Northwind Books',
    watched: [
      { key: 'glassPrice', label: '"The Glass Orchard" by Maren Ostrova — price (USD)' },
      { key: 'glassPriceText', label: '"The Glass Orchard" — price as displayed' },
      { key: 'glassStock', label: '"The Glass Orchard" — availability' },
    ],
    timeline: timeline,
    render: function (ctx, st) {
      var prevPrices = ctx.phase > 0 ? timeline[ctx.phase - 1]._p : {};
      var cards = st._order
        .map(function (k) {
          var b = BOOKS[k];
          var pr = st._p[k];
          var dropped = prevPrices[k] && pr[0] < prevPrices[k][0];
          var badges = (st._new.indexOf(k) >= 0 ? '<span class="pill new">New</span> ' : '') + (dropped ? '<span class="pill bad">Price drop</span>' : '');
          return (
            '<li class="book" data-code="' + b.code + '">' +
            '<div class="cover" style="background:' + b.bg + '"><span class="ct">' + esc(b.title) + '</span><span class="ca">' + esc(b.author) + '</span></div>' +
            (badges ? '<div style="margin-top:8px">' + badges + '</div>' : '') +
            '<h3 class="book-title"><a href="#">' + esc(b.title) + '</a></h3>' +
            '<div class="author">by <span class="book-author">' + esc(b.author) + '</span></div>' +
            '<div class="format">' + esc(b.format) + '</div>' +
            '<div class="price book-price">' + esc(money(pr[0])) + '</div>' +
            '<div class="avail book-avail ' + (pr[1] === 'in' ? 'stock-in' : 'stock-out') + '">' + esc(stockText(pr[1])) + '</div>' +
            '</li>'
          );
        })
        .join('');
      var facets =
        '<aside class="facets" aria-label="Filters"><h2 style="font-size:1rem">Filter</h2>' +
        '<h3>Format</h3><label><input type="checkbox" checked> Hardcover</label><label><input type="checkbox" checked> Paperback</label><label><input type="checkbox"> E-book</label>' +
        '<h3>Price</h3><label><input type="checkbox"> Under $15</label><label><input type="checkbox"> $15 – $25</label><label><input type="checkbox"> Over $25</label>' +
        '<h3>Availability</h3><label><input type="checkbox"> In stock only</label></aside>';
      var main =
        S.crumbs(['Home', 'Science fiction', 'New & Notable']) +
        '<div class="page-head" style="padding-top:0"><h1>New &amp; Notable in Science Fiction</h1><p class="muted">Staff-picked new releases and this season\'s most talked-about science fiction.</p></div>' +
        '<div class="listing-layout">' + facets + '<div>' +
        '<div class="toolbar"><span>Showing ' + st._order.length + ' titles</span><label>Sort by <select aria-label="Sort by"><option>Bestselling</option><option>Newest</option><option>Price: low to high</option></select></label></div>' +
        '<ul class="book-grid">' + cards + '</ul></div></div>';
      return S.shell('northwind', main);
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
