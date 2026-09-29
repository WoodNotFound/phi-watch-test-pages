/*
 * Page-watching test fixtures: fictional store chrome and a product-page template.
 * All stores, brands and products here are invented. No external assets.
 */
(function (WF) {
  'use strict';
  var esc = WF.esc;

  var stores = {
    lumen: {
      name: 'Lumen Outfitters',
      theme: 'theme-lumen',
      mark: 'L',
      promo: 'Free shipping on orders over $75 · 60-day returns on unused gear',
      search: 'Search packs, jackets, tents…',
      nav: ['New arrivals', 'Hiking', 'Camping', 'Climbing', 'Apparel', 'Packs & bags', 'Sale'],
    },
    harbor: {
      name: 'Harbor & Pine Home',
      theme: 'theme-harbor',
      mark: 'H',
      promo: 'Free delivery on orders over $99 · Easy 30-day returns',
      search: 'Search furniture, kitchen, bedding…',
      nav: ['Kitchen', 'Bedroom', 'Living room', 'Bath', 'Outdoor', 'Lighting', 'Clearance'],
    },
    harborUK: {
      name: 'Harbor & Pine Home',
      theme: 'theme-harbor',
      mark: 'H',
      promo: 'Free UK delivery on orders over £60 · 30-night trial on all bedding',
      search: 'Search bedding, towels, furniture…',
      nav: ['Bedding', 'Bath', 'Kitchen', 'Living room', 'Lighting', 'Gifts', 'Offers'],
      region: 'United Kingdom · GBP £',
    },
    brightfold: {
      name: 'Brightfold Kitchen',
      theme: 'theme-brightfold',
      mark: 'B',
      promo: 'Free standard shipping on orders over $75',
      search: 'Search cookware, bakeware, tools…',
      nav: ['Cookware', 'Bakeware', 'Knives', 'Small appliances', 'Tableware', 'Recipes', 'Sale'],
    },
    kestrel: {
      name: 'Kestrel Audio',
      theme: 'theme-kestrel',
      mark: 'K',
      promo: '2-year warranty on all Kestrel products · Free returns within 45 days',
      search: 'Search headphones, speakers, accessories…',
      nav: ['Headphones', 'Earbuds', 'Speakers', 'Accessories', 'Support', 'Deals'],
    },
    northwind: {
      name: 'Northwind Books',
      theme: 'theme-northwind',
      mark: 'N',
      promo: 'Free delivery on orders over $35 · Signed editions while they last',
      search: 'Search by title, author or ISBN',
      nav: ['Fiction', 'Science fiction', 'Non-fiction', 'Travel', 'Children', 'Gift cards', 'Bargains'],
    },
    orrisfield: {
      name: 'Orrisfield Supply Co.',
      theme: 'theme-orrisfield',
      mark: 'O',
      promo: 'Trade prices for registered business customers · Same-day dispatch before 2 pm',
      search: 'Search by product, SKU or brand',
      nav: ['Cookware', 'Catering equipment', 'Janitorial', 'Packaging', 'Tableware', 'Clearance'],
    },
    wrenfield: {
      name: 'Wrenfield Garden Supply',
      theme: 'theme-wrenfield',
      mark: 'W',
      promo: 'Autumn bulbs are in · Free click & collect',
      search: 'Search tools, seeds, planters…',
      nav: ['Tools', 'Watering', 'Seeds & bulbs', 'Planters', 'Outdoor living', 'Offers'],
    },
    pantry: {
      name: 'Pantry Lane Grocers',
      theme: 'theme-pantry',
      mark: 'P',
      promo: 'Free delivery on grocery orders over $50 · Order by 10 pm for next-day slots',
      search: 'Search groceries',
      nav: ['Fresh', 'Bakery', 'Pantry', 'Snacks', 'Drinks', 'Household', 'Offers'],
    },
  };

  // ---------------------------------------------------------------- inline SVG art
  function svg(inner, vb) {
    return '<svg viewBox="' + (vb || '0 0 200 170') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  var drawings = {
    backpack: function (a, b) {
      return (
        '<path d="M78 34q22-26 44 0" fill="none" stroke="' + b + '" stroke-width="7" stroke-linecap="round"/>' +
        '<rect x="55" y="30" width="90" height="122" rx="28" fill="' + a + '"/>' +
        '<rect x="63" y="44" width="74" height="30" rx="13" fill="#fff" opacity=".16"/>' +
        '<rect x="70" y="92" width="60" height="46" rx="11" fill="' + b + '"/>' +
        '<line x1="76" y1="104" x2="124" y2="104" stroke="#000" stroke-opacity=".2" stroke-width="3"/>' +
        '<rect x="44" y="70" width="12" height="54" rx="6" fill="' + b + '" opacity=".7"/><rect x="144" y="70" width="12" height="54" rx="6" fill="' + b + '" opacity=".7"/>'
      );
    },
    headphones: function (a, b) {
      return (
        '<path d="M50 105V92a50 50 0 0 1 100 0v13" fill="none" stroke="' + a + '" stroke-width="12" stroke-linecap="round"/>' +
        '<rect x="36" y="96" width="34" height="56" rx="14" fill="' + a + '"/><rect x="130" y="96" width="34" height="56" rx="14" fill="' + a + '"/>' +
        '<rect x="62" y="102" width="12" height="44" rx="6" fill="' + b + '"/><rect x="126" y="102" width="12" height="44" rx="6" fill="' + b + '"/>'
      );
    },
    kettle: function (a, b) {
      return (
        '<path d="M60 70h70l10 76H50z" fill="' + a + '"/>' +
        '<path d="M130 88q30-10 40-46" fill="none" stroke="' + a + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M62 70q-26 10-18 44" fill="none" stroke="' + b + '" stroke-width="8" stroke-linecap="round"/>' +
        '<rect x="72" y="58" width="46" height="12" rx="5" fill="' + b + '"/><circle cx="95" cy="52" r="6" fill="' + b + '"/>' +
        '<rect x="50" y="140" width="90" height="8" rx="3" fill="#000" opacity=".15"/>'
      );
    },
    pot: function (a, b) {
      return (
        '<ellipse cx="100" cy="68" rx="66" ry="14" fill="' + b + '"/><rect x="92" y="46" width="16" height="12" rx="4" fill="' + b + '"/>' +
        '<path d="M38 74h124v44a28 28 0 0 1-28 28H66a28 28 0 0 1-28-28z" fill="' + a + '"/>' +
        '<rect x="20" y="84" width="22" height="12" rx="6" fill="' + a + '"/><rect x="158" y="84" width="22" height="12" rx="6" fill="' + a + '"/>' +
        '<path d="M50 90h100" stroke="#fff" stroke-opacity=".2" stroke-width="5"/>'
      );
    },
    jacket: function (a, b) {
      return (
        '<path d="M70 26l30 14 30-14 34 22 18 74-22 6-12-50v88H52V78l-12 50-22-6 18-74z" fill="' + a + '"/>' +
        '<path d="M86 22q14 22 28 0" fill="' + b + '"/><line x1="100" y1="42" x2="100" y2="156" stroke="' + b + '" stroke-width="3"/>' +
        '<rect x="64" y="104" width="24" height="5" rx="2" fill="' + b + '"/><rect x="112" y="104" width="24" height="5" rx="2" fill="' + b + '"/>'
      );
    },
    vest: function (a, b) {
      return (
        '<path d="M70 26l30 14 30-14 22 20v110H48V46z" fill="' + a + '"/>' +
        '<path d="M48 70h104M48 96h104M48 122h104" stroke="#000" stroke-opacity=".14" stroke-width="3"/>' +
        '<line x1="100" y1="40" x2="100" y2="156" stroke="' + b + '" stroke-width="3"/><path d="M86 22q14 20 28 0" fill="' + b + '"/>'
      );
    },
    speaker: function (a, b) {
      return (
        '<rect x="46" y="36" width="108" height="110" rx="30" fill="' + a + '"/>' +
        '<circle cx="100" cy="92" r="32" fill="' + b + '"/><circle cx="100" cy="92" r="12" fill="' + a + '" opacity=".6"/>' +
        '<circle cx="80" cy="52" r="4" fill="#fff" opacity=".5"/><circle cx="96" cy="52" r="4" fill="#fff" opacity=".5"/>'
      );
    },
    hub: function (a, b) {
      return (
        '<rect x="40" y="70" width="120" height="40" rx="10" fill="' + a + '"/>' +
        '<rect x="52" y="84" width="14" height="10" rx="2" fill="' + b + '"/><rect x="72" y="84" width="14" height="10" rx="2" fill="' + b + '"/>' +
        '<rect x="92" y="84" width="10" height="10" rx="2" fill="' + b + '"/><rect x="108" y="84" width="18" height="10" rx="2" fill="' + b + '"/>' +
        '<rect x="132" y="85" width="16" height="8" rx="4" fill="' + b + '"/>' +
        '<path d="M160 90q24 0 24 30v24" fill="none" stroke="' + a + '" stroke-width="6" stroke-linecap="round"/>'
      );
    },
    skillet: function (a, b) {
      return (
        '<circle cx="84" cy="92" r="54" fill="' + a + '"/><circle cx="84" cy="92" r="42" fill="#000" opacity=".2"/>' +
        '<rect x="132" y="84" width="58" height="16" rx="8" fill="' + a + '"/><circle cx="180" cy="92" r="4" fill="' + b + '"/>'
      );
    },
    desk: function (a, b) {
      return (
        '<rect x="24" y="56" width="152" height="14" rx="3" fill="' + a + '"/>' +
        '<rect x="44" y="70" width="10" height="80" fill="' + b + '"/><rect x="146" y="70" width="10" height="80" fill="' + b + '"/>' +
        '<rect x="34" y="146" width="30" height="6" rx="2" fill="' + b + '"/><rect x="136" y="146" width="30" height="6" rx="2" fill="' + b + '"/>' +
        '<rect x="128" y="74" width="16" height="8" rx="2" fill="' + b + '" opacity=".6"/>'
      );
    },
    duvet: function (a, b) {
      return (
        '<rect x="30" y="50" width="140" height="96" rx="10" fill="' + a + '"/>' +
        '<path d="M30 76h140M30 102h140M30 126h140" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>' +
        '<rect x="48" y="30" width="48" height="30" rx="10" fill="' + b + '"/><rect x="104" y="30" width="48" height="30" rx="10" fill="' + b + '"/>'
      );
    },
    mill: function (a, b) {
      return (
        '<path d="M70 26h60l-10 36H80z" fill="' + b + '"/>' +
        '<rect x="56" y="62" width="88" height="80" rx="10" fill="' + a + '"/>' +
        '<circle cx="100" cy="100" r="18" fill="' + b + '"/><path d="M144 90h22v-22" fill="none" stroke="' + b + '" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="84" y="142" width="32" height="10" rx="3" fill="' + b + '"/>'
      );
    },
    table: function (a, b) {
      return (
        '<rect x="54" y="42" width="92" height="84" rx="6" fill="' + a + '"/>' +
        '<rect x="62" y="54" width="76" height="28" rx="4" fill="#000" opacity=".12"/><circle cx="100" cy="68" r="4" fill="' + b + '"/>' +
        '<rect x="62" y="126" width="8" height="28" fill="' + b + '"/><rect x="130" y="126" width="8" height="28" fill="' + b + '"/>' +
        '<rect x="84" y="24" width="30" height="18" rx="4" fill="' + b + '" opacity=".5"/>'
      );
    },
    can: function (a, b) {
      return (
        '<path d="M58 60h72v84H58z" fill="' + a + '"/><ellipse cx="94" cy="60" rx="36" ry="8" fill="' + b + '"/>' +
        '<path d="M58 108L22 60" stroke="' + a + '" stroke-width="10" stroke-linecap="round"/><rect x="12" y="50" width="20" height="12" rx="3" fill="' + b + '" transform="rotate(-35 22 56)"/>' +
        '<path d="M130 76q36 0 30 44" fill="none" stroke="' + b + '" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M70 44q24-24 48 0" fill="none" stroke="' + b + '" stroke-width="7"/>'
      );
    },
    bars: function (a, b) {
      return (
        '<rect x="34" y="50" width="132" height="84" rx="8" fill="' + a + '"/>' +
        '<rect x="46" y="64" width="108" height="26" rx="6" fill="#fff" opacity=".85"/>' +
        '<rect x="50" y="100" width="46" height="22" rx="4" fill="' + b + '"/><rect x="104" y="100" width="46" height="22" rx="4" fill="' + b + '"/>' +
        '<circle cx="62" cy="77" r="6" fill="' + b + '"/>'
      );
    },
    poles: function (a, b) {
      return (
        '<line x1="70" y1="20" x2="96" y2="158" stroke="' + a + '" stroke-width="7" stroke-linecap="round"/>' +
        '<line x1="130" y1="20" x2="104" y2="158" stroke="' + a + '" stroke-width="7" stroke-linecap="round"/>' +
        '<rect x="62" y="16" width="16" height="36" rx="7" fill="' + b + '" transform="rotate(-10 70 34)"/>' +
        '<rect x="122" y="16" width="16" height="36" rx="7" fill="' + b + '" transform="rotate(10 130 34)"/>'
      );
    },
    book: function (a, b) {
      return (
        '<rect x="56" y="22" width="92" height="128" rx="4" fill="' + a + '"/><rect x="56" y="22" width="12" height="128" fill="#000" opacity=".18"/>' +
        '<rect x="78" y="46" width="56" height="6" rx="2" fill="' + b + '"/><rect x="78" y="58" width="40" height="5" rx="2" fill="' + b + '" opacity=".7"/>' +
        '<circle cx="106" cy="104" r="20" fill="' + b + '" opacity=".6"/>'
      );
    },
    box: function (a, b) {
      return '<rect x="50" y="40" width="100" height="100" rx="12" fill="' + a + '"/><rect x="66" y="56" width="68" height="18" rx="4" fill="' + b + '"/>';
    },
  };

  function art(kind, a, b) {
    var f = drawings[kind] || drawings.box;
    return svg(f(a || '#5c6b73', b || '#c9d2d8'));
  }

  function logo(s) {
    return (
      '<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" style="fill:var(--brand)"/>' +
      '<text x="17" y="23.5" text-anchor="middle" font-size="17" font-weight="700" fill="#fff" font-family="system-ui, sans-serif">' +
      esc(s.mark) +
      '</text></svg><span>' +
      esc(s.name) +
      '</span>'
    );
  }

  function stars(r) {
    var full = Math.round(r);
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= full ? '★' : '<span class="off">★</span>';
    return '<span class="stars" aria-label="' + r + ' out of 5 stars">' + out + '</span>';
  }

  // ---------------------------------------------------------------- chrome
  function header(s, o) {
    o = o || {};
    var nav = s.nav
      .map(function (n, i) {
        return '<a href="#"' + (i === s.nav.length - 1 ? ' class="sale"' : '') + '>' + esc(n) + '</a>';
      })
      .join('');
    return (
      (o.promo === false ? '' : '<div class="promo-strip">' + esc(o.promo || s.promo) + '</div>') +
      '<header class="site-header"><div class="wrap header-row">' +
      '<a class="logo" href="#">' + logo(s) + '</a>' +
      '<form class="search" role="search" onsubmit="return false"><input type="search" placeholder="' + esc(s.search) + '" aria-label="Search"><button type="button">Search</button></form>' +
      '<nav class="utility" aria-label="Account">' + (s.region ? '<a href="#">' + esc(s.region) + '</a>' : '') + '<a href="#">Help</a><a href="#">Account</a><a href="#">Cart (0)</a></nav>' +
      '</div><nav class="main-nav wrap" aria-label="Departments">' + nav + '</nav></header>'
    );
  }

  function storeFooter(s) {
    return (
      '<footer class="store-footer"><div class="wrap"><div class="cols">' +
      '<div><h4>' + esc(s.name) + '</h4><ul><li><a href="#">About us</a></li><li><a href="#">Careers</a></li><li><a href="#">Store locator</a></li></ul></div>' +
      '<div><h4>Help</h4><ul><li><a href="#">Delivery</a></li><li><a href="#">Returns</a></li><li><a href="#">Contact us</a></li></ul></div>' +
      '<div><h4>Account</h4><ul><li><a href="#">Order status</a></li><li><a href="#">Wish list</a></li><li><a href="#">Gift cards</a></li></ul></div>' +
      '</div><p class="legal">&copy; ' + esc(s.name) + ' (fictional). Prices include applicable taxes unless stated otherwise.</p></div></footer>'
    );
  }

  function crumbs(list) {
    return (
      '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>' +
      list
        .map(function (c, i) {
          return i === list.length - 1 ? '<li aria-current="page">' + esc(c) + '</li>' : '<li><a href="#">' + esc(c) + '</a></li>';
        })
        .join('') +
      '</ol></nav>'
    );
  }

  /** Store chrome around arbitrary main content. */
  function shell(storeKey, mainHtml, o) {
    var s = stores[storeKey];
    o = o || {};
    return (
      '<div class="store ' + s.theme + '">' + header(s, o) +
      (o.banner ? '<div class="site-banner"><div class="wrap">' + o.banner + '</div></div>' : '') +
      '<main class="wrap">' + mainHtml + '</main>' + storeFooter(s) + '</div>'
    );
  }

  // ---------------------------------------------------------------- buy box helpers
  function priceBlock(o) {
    return (
      '<div class="price-block">' +
      '<span class="price-now' + (o.sale ? ' on-sale' : '') + '" id="product-price">' + (o.html || esc(o.now)) + '</span>' +
      (o.was ? '<s class="price-was">Was ' + esc(o.was) + '</s>' : '') +
      (o.save ? '<span class="price-save">' + esc(o.save) + '</span>' : '') +
      '</div>' +
      (o.note ? '<p class="price-note">' + o.note + '</p>' : '')
    );
  }

  function stockLine(kind, text, sub) {
    return (
      '<p class="stock stock-' + kind + '"><span class="dot" aria-hidden="true"></span><span id="stock-status">' + esc(text) + '</span></p>' +
      (sub ? '<p class="stock-sub" id="stock-note">' + sub + '</p>' : '')
    );
  }

  function buyRow(enabled, altLabel) {
    return (
      '<div class="buy-row"><span class="qty"><button type="button" aria-label="Decrease quantity">−</button><input value="1" aria-label="Quantity" inputmode="numeric"><button type="button" aria-label="Increase quantity">+</button></span>' +
      (enabled
        ? '<button class="btn" type="button">Add to cart</button>'
        : '<button class="btn" type="button" disabled>' + esc(altLabel || 'Out of stock') + '</button><button class="btn secondary" type="button">Email me when available</button>') +
      '</div>'
    );
  }

  function perks(list) {
    return '<div class="perks">' + list.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</div>';
  }

  // ---------------------------------------------------------------- product page
  /**
   * o = { store, crumbs, brandLine, name, subtitle, sku, rating, reviewCount, art:[kind,c1,c2],
   *       buy (html), highlights[], description[], specs[[k,v]], reviews[], related[], banner, notice, promo }
   */
  function productPage(o) {
    var a = o.art || ['box'];
    var thumbs = '<div class="thumbs">' + [0, 1, 2].map(function (i) { return '<span>' + art(a[0], i === 2 ? a[2] : a[1], i === 2 ? a[1] : a[2]) + '</span>'; }).join('') + '</div>';
    var main =
      crumbs(o.crumbs) +
      (o.notice || '') +
      '<div class="product">' +
      '<div class="gallery"><div class="hero-art">' + art(a[0], a[1], a[2]) + '</div>' + thumbs + '</div>' +
      '<div class="buy">' +
      '<p class="brand-line">' + esc(o.brandLine || stores[o.store].name) + '</p>' +
      '<h1 class="product-title">' + esc(o.name) + '</h1>' +
      (o.subtitle ? '<p class="subtitle">' + esc(o.subtitle) + '</p>' : '') +
      '<div class="rating">' + stars(o.rating) + ' <a href="#reviews">' + o.rating.toFixed(1) + ' (' + WF.fmt.num(o.reviewCount) + ' reviews)</a>' + (o.sku ? ' <span class="sku">SKU ' + esc(o.sku) + '</span>' : '') + '</div>' +
      o.buy +
      (o.highlights ? '<ul class="highlights">' + o.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
      (o.perks ? perks(o.perks) : '') +
      '</div></div>' +
      (o.middle || '') +
      '<section class="details"><div><h2>Description</h2>' +
      (o.description || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '</div><div><h2>Specifications</h2><table class="specs"><tbody>' +
      (o.specs || []).map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>' +
      reviewsSection(o) +
      relatedSection(o);
    return shell(o.store, main, { banner: o.banner, promo: o.promo });
  }

  function reviewsSection(o) {
    if (!o.reviews) return '';
    return (
      '<section class="reviews" id="reviews"><h2>Customer reviews</h2>' +
      '<div class="review-summary"><span class="big">' + o.rating.toFixed(1) + '</span><div>' + stars(o.rating) + '<div class="muted small">Based on ' + WF.fmt.num(o.reviewCount) + ' reviews</div></div></div>' +
      o.reviews
        .map(function (r) {
          return (
            '<article class="review">' + stars(r.stars) + '<h3>' + esc(r.title) + '</h3><p class="meta">' + esc(r.author) + ' · ' + esc(r.when) + (r.verified === false ? '' : ' · Verified purchase') + '</p><p>' + esc(r.body) + '</p></article>'
          );
        })
        .join('') +
      '</section>'
    );
  }

  function relatedSection(o) {
    if (!o.related) return '';
    return (
      '<section class="related"><h2>' + esc(o.relatedTitle || 'You may also like') + '</h2><ul class="cards">' +
      o.related
        .map(function (r) {
          return (
            '<li class="card"><div class="art">' + art(r.art, r.c1, r.c2) + '</div><div class="body"><div class="name"><a href="#">' + esc(r.name) + '</a></div>' +
            '<div class="price">' + esc(r.price) + '</div>' + (r.note ? '<div class="muted small">' + esc(r.note) + '</div>' : '') + '</div></li>'
          );
        })
        .join('') +
      '</ul></section>'
    );
  }

  WF.shop = {
    stores: stores,
    art: art,
    stars: stars,
    shell: shell,
    crumbs: crumbs,
    productPage: productPage,
    priceBlock: priceBlock,
    stockLine: stockLine,
    buyRow: buyRow,
    perks: perks,
    header: header,
    storeFooter: storeFooter,
    logo: logo,
  };
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
