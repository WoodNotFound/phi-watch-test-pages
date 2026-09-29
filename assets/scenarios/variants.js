(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var money = WF.fmt.money;

  var VARIANTS = [
    { sku: 'RS-SL-XS', colour: 'Slate', size: 'XS' },
    { sku: 'RS-SL-S', colour: 'Slate', size: 'S' },
    { sku: 'RS-SL-M', colour: 'Slate', size: 'M' },
    { sku: 'RS-SL-L', colour: 'Slate', size: 'L' },
    { sku: 'RS-MO-S', colour: 'Moss', size: 'S' },
    { sku: 'RS-MO-M', colour: 'Moss', size: 'M' },
    { sku: 'RS-MO-L', colour: 'Moss', size: 'L' },
    { sku: 'RS-MO-XL', colour: 'Moss', size: 'XL' },
  ];

  // Cumulative changes per phase: sku -> { price?, stock?, left? }
  var CHANGES = [
    {},
    { 'RS-MO-L': { price: 124 } },
    { 'RS-SL-M': { stock: 'low', left: 2 }, 'RS-SL-L': { stock: 'out_of_stock' } },
    { 'RS-SL-M': { stock: 'out_of_stock' }, 'RS-MO-S': { price: 109 } },
    { 'RS-MO-S': { price: 99 }, 'RS-SL-XS': { stock: 'out_of_stock' }, 'RS-SL-L': { stock: 'in_stock' } },
    { 'RS-SL-M': { stock: 'in_stock', price: 119 }, 'RS-MO-S': { price: 109 } },
    { 'RS-MO-XL': { price: 115 }, 'RS-MO-M': { stock: 'low', left: 3 } },
  ];

  function stockText(v) {
    return v.stock === 'in_stock' ? 'In stock' : v.stock === 'low' ? 'Only ' + v.left + ' left' : 'Out of stock';
  }

  function buildTimeline() {
    var cur = VARIANTS.map(function (v) {
      return { sku: v.sku, colour: v.colour, size: v.size, price: v.sku === 'RS-MO-XL' ? 119 : 129, stock: 'in_stock', left: null };
    });
    return CHANGES.map(function (ch) {
      cur = cur.map(function (v) {
        var c = ch[v.sku];
        if (!c) return v;
        var n = Object.assign({}, v, c);
        if (c.stock && c.stock !== 'low') n.left = null;
        return n;
      });
      var rows = cur.map(function (v) {
        return { sku: v.sku, colour: v.colour, size: v.size, price: v.price, priceText: money(v.price), stock: v.stock, stockText: stockText(v) };
      });
      var avail = rows.filter(function (r) { return r.stock !== 'out_of_stock'; });
      var cheapest = avail.reduce(function (a, b) { return b.price < a.price ? b : a; });
      var slateM = rows.filter(function (r) { return r.sku === 'RS-SL-M'; })[0];
      var mossL = rows.filter(function (r) { return r.sku === 'RS-MO-L'; })[0];
      var fromPrice = Math.min.apply(null, rows.map(function (r) { return r.price; }));
      return {
        slateM_price: slateM.price,
        slateM_stock: slateM.stock,
        slateM_stockText: slateM.stockText,
        cheapest_price: cheapest.price,
        cheapest_variant: cheapest.colour + ' / ' + cheapest.size,
        mossL_price: mossL.price,
        fromPriceText: money(fromPrice),
        variants: rows,
      };
    });
  }

  WF.define({
    id: 'variants',
    title: 'Multiple variants',
    path: 's/variants/',
    docTitle: 'Ridgeline Rain Shell | Lumen Outfitters',
    watched: [
      { key: 'slateM_price', label: 'Slate / M price (USD)' },
      { key: 'slateM_stock', label: 'Slate / M availability' },
      { key: 'cheapest_price', label: 'Lowest price among available options (USD)' },
      { key: 'cheapest_variant', label: 'Option with the lowest price' },
      { key: 'mossL_price', label: 'Moss / L price (USD)' },
    ],
    timeline: buildTimeline(),
    render: function (ctx, st) {
      var rows = st.variants
        .map(function (v) {
          var cls = v.stock === 'in_stock' ? 'ok' : v.stock === 'low' ? 'warn' : 'bad';
          return (
            '<tr data-sku="' + v.sku + '"><td>' + esc(v.colour) + '</td><td>' + esc(v.size) + '</td><td class="muted">' + v.sku + '</td>' +
            '<td class="v-price"><strong>' + esc(v.priceText) + '</strong></td><td class="v-stock"><span class="pill ' + cls + '">' + esc(v.stockText) + '</span></td></tr>'
          );
        })
        .join('');
      var sizes = ['XS', 'S', 'M', 'L', 'XL']
        .map(function (s) { return '<button type="button" class="btn secondary" style="padding:6px 12px">' + s + '</button>'; })
        .join(' ');
      var buy =
        '<div class="price-block"><span class="muted">From</span> <span class="price-now" id="product-price">' + esc(st.fromPriceText) + '</span></div>' +
        '<p class="price-note">Price depends on colour and size. See all options below.</p>' +
        '<p class="small"><strong>Colour:</strong> Slate · Moss</p><p>' + sizes + '</p>' +
        S.buyRow(true);
      var table =
        '<section class="related" id="all-options"><h2>All options</h2><div class="table-scroll"><table class="data-table variant-table"><thead><tr><th>Colour</th><th>Size</th><th>SKU</th><th>Price</th><th>Availability</th></tr></thead><tbody>' +
        rows +
        '</tbody></table></div><p class="muted small">Prices and availability are per option. Out-of-stock options can be added to your wish list.</p></section>';
      return S.productPage({
        store: 'lumen',
        crumbs: ['Home', 'Apparel', 'Jackets', 'Ridgeline Rain Shell'],
        name: 'Ridgeline Rain Shell',
        subtitle: '3-layer waterproof breathable jacket',
        sku: 'RS',
        rating: 4.4,
        reviewCount: 523,
        art: ['jacket', '#56636e', '#9bb07a'],
        buy: buy,
        highlights: ['3-layer recycled shell, 20,000 mm waterproof rating', 'Helmet-compatible hood with one-hand adjuster', 'Pit zips for venting on climbs', 'Packs into its own chest pocket'],
        middle: table,
        description: [
          'The Ridgeline is built for long, wet days: a fully taped 3-layer shell, a stiffened hood brim that keeps rain off your face and pit zips that dump heat without letting weather in.',
          'Colour Slate is a cool blue-grey; Moss is a muted green. Sizes run true; choose one size up to layer a down jacket underneath.',
        ],
        specs: [
          ['Fabric', '3-layer recycled polyester, PFAS-free DWR'],
          ['Waterproofing', '20,000 mm'],
          ['Breathability', '20,000 g/m²/24h'],
          ['Weight (size M)', '410 g'],
          ['Fit', 'Regular'],
        ],
        reviews: [
          { stars: 5, title: 'Bone dry in a storm', author: 'Grete N.', when: '2 weeks ago', body: 'Four hours of sideways rain and not a drop inside.' },
          { stars: 4, title: 'Sleeves a bit long', author: 'Owen P.', when: '1 month ago', body: 'Great jacket; sleeves are long on me in size M.' },
        ],
      });
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
