'use strict';
/**
 * Answer key: descriptions, example watch requests, expected verdicts and stop conditions.
 * Verdicts are computed from the scenario timelines (assets/scenarios/*.js) by the rules in
 * rules.js; `expectReport` / `expect` are hand-written cross-checks asserted by build.js.
 */
var R = require('./rules');
var changed = R.changed;
var decreased = R.decreased;
var entered = R.entered;
var earlier = R.earlier;

function ids(e) {
  return e.listings.map(function (s) { return s.split(':')[0]; });
}
function newIds(c, p) {
  var before = ids(p);
  return ids(c).filter(function (id) { return before.indexOf(id) < 0; });
}
function listingOf(e, id) {
  return e.listings.filter(function (s) { return s.split(':')[0] === id; })[0] || '';
}

var FURTHER = ['optional', 'Already reported the crossing; mentioning a further move is fine but not required.'];

module.exports = [
  // ------------------------------------------------------------------ 1
  {
    id: 'price-step-down',
    number: '1',
    description:
      'Lumen Outfitters product page for the "Trailhead 28L Daypack" with full page furniture (breadcrumbs, gallery, description, specifications, reviews, related products). The price steps down over the phases: $59.99 → $59.99 → $54.99 → $49.99 → $44.99 → $39.99. Once discounted, a struck-through "Was $59.99" and a "Save …" badge appear, and the related products carry their own static prices.',
    examples: [
      { request: 'Tell me when the Trailhead 28L daypack drops below $50.', decide: entered(function (e) { return e.price < 50; }, { keys: ['price'], still: FURTHER }), expectReport: [3] },
      { request: 'Let me know whenever the price of this backpack changes.', decide: changed('price'), expectReport: [2, 3, 4, 5] },
      { request: 'Tell me if it gets down to $40 or less.', decide: entered(function (e) { return e.price <= 40; }), expectReport: [5] },
    ],
    stops: [
      { condition: 'Stop watching once the price is below $50.', pred: function (e) { return e.price < 50; }, expect: 3 },
      { condition: 'Stop once it costs $40 or less.', pred: function (e) { return e.price <= 40; }, expect: 5 },
    ],
    notes: ['Phase 2 is a real drop ($54.99) that does not cross $50: a threshold watcher must stay quiet.', '"Was $59.99", "Save $…", "Lumen Pay" installments and related-product prices are other numbers on the same page.'],
  },
  // ------------------------------------------------------------------ 2
  {
    id: 'stock-cycle',
    number: '2',
    description:
      'Harbor & Pine Home product page for a "Stoneware Pour-Over Kettle" ($34.00, never changes). Availability cycles: In stock → In stock → "Only 3 left in stock" → Out of stock (with "Expected back in stock on <t0 + 5 days>") → Out of stock → In stock with a "Back in stock!" notice → In stock.',
    examples: [
      { request: "Tell me whenever the kettle's availability changes.", decide: changed('stock'), expectReport: [2, 3, 5] },
      {
        request: 'Let me know if it is about to sell out or sells out.',
        decide: function (c, p) {
          if (c.stock === p.stock) return 'skip';
          if (c.stock === 'low' || c.stock === 'out_of_stock') return 'report';
          return ['optional', 'Back in stock was not asked for, but is a natural follow-up.'];
        },
        expectReport: [2, 3],
      },
      { request: 'Tell me when the kettle is back in stock.', startPhase: 3, decide: entered(function (e) { return e.stock !== 'out_of_stock'; }), expectReport: [5] },
    ],
    stops: [
      { condition: "Stop once it's back in stock (watch started while it was sold out).", startPhase: 3, pred: function (e) { return e.stock !== 'out_of_stock'; }, expect: 5 },
      { condition: 'Stop if it sells out.', pred: function (e) { return e.stock === 'out_of_stock'; }, expect: 3 },
    ],
    notes: ['The restock date text (t0 + 5 days, UTC, e.g. "Monday, October 5, 2026") appears in phases 3–4 only; it is not a separate change.', 'The price is $34.00 in every phase.'],
  },
  // ------------------------------------------------------------------ 3
  {
    id: 'noise-only',
    number: '3',
    description:
      'Brightfold Kitchen product page for an "Enameled Dutch Oven, 5.5 qt". The watched price ($89.00) and availability (In stock) NEVER change. Everything around them does: the promo banner, review count and rating, "N people are viewing this right now" (changes every minute), "N bought in the last 24 hours", the recommendation carousel, the latest review, a "Page updated <phase start>" stamp and an "Order within … for dispatch today" countdown (changes on every load). One banner advertises "Up to 30% off selected bakeware", which does not apply to this product.',
    examples: [
      { request: 'Tell me if the price of the Dutch oven changes.', decide: changed('price'), expectReport: [] },
      { request: 'Let me know if it goes out of stock.', decide: entered(function (e) { return e.stock !== 'in_stock'; }), expectReport: [] },
      { request: 'Tell me if it drops below $80.', decide: entered(function (e) { return e.price < 80; }), expectReport: [] },
    ],
    stops: [{ condition: "Stop once it's under $80.", pred: function (e) { return e.price < 80; }, expect: null }],
    notes: ['A correct watcher reports nothing after the baseline, in any phase, including after the last listed phase.'],
  },
  // ------------------------------------------------------------------ 4
  {
    id: 'sale-window',
    number: '4',
    description:
      'Kestrel Audio product page for "Kestrel Aria ANC Wireless Headphones", regular price $199.00. Phase 1 shows a "coming soon" sale teaser (no price change). Phases 2–4 apply the "Autumn Sound Sale" price $149.00 with "Was $199.00" and a "Sale ends in …" countdown (computed from load time, so it differs on every load). Phase 5 reverts to $199.00 ("The Autumn Sound Sale has ended"). Phase 7 is a one-phase "Flash deal" at $159.00, then phase 8 reverts to $199.00.',
    examples: [
      { request: 'Tell me when the Aria headphones go on sale.', decide: entered(function (e) { return e.onSale; }, { exit: ['optional', 'The sale ended and the price went back to $199.00.'] }), expectReport: [2, 7] },
      { request: 'Tell me if the price drops below $160.', decide: entered(function (e) { return e.price < 160; }, { keys: ['price'], still: FURTHER, exit: ['optional', 'The price went back above $160.'] }), expectReport: [2, 7] },
      { request: 'Let me know whenever the price changes.', decide: changed('price'), expectReport: [2, 5, 7, 8] },
    ],
    stops: [
      { condition: "Stop once it's on sale.", pred: function (e) { return e.onSale; }, expect: 2 },
      { condition: 'Stop after the sale has ended.', pred: function (e, k, ph) { return !e.onSale && earlier(ph, k, function (x) { return x.onSale; }); }, expect: 5 },
    ],
    notes: ['The countdown text changes on every load within a sale phase and is never a change by itself.', 'Phase 1 only adds a teaser banner.'],
  },
  // ------------------------------------------------------------------ 5
  {
    id: 'variants',
    number: '5',
    description:
      'Lumen Outfitters "Ridgeline Rain Shell" with eight colour/size options in an "All options" table (colour, size, SKU, price, availability) and a "From $…" price at the top. Options change independently: Moss / L drops to $124 in phase 1; Slate / M goes "Only 2 left" (phase 2), Out of stock (3), and returns In stock at $119 (5); Moss / S drops to $109 (3), $99 (4), back to $109 (5); Slate / L and Slate / XS go out of stock at various times; Moss / XL drops to $115 (6). "Watch Slate / M", "watch the cheapest" and "watch Moss / L" give different answers.',
    examples: [
      { request: 'Watch the Slate jacket in size M and tell me about any change in its price or availability.', decide: changed('slateM_price', 'slateM_stock'), expectReport: [2, 3, 5] },
      { request: 'Tell me when the cheapest option of this jacket drops below $110.', decide: entered(function (e) { return e.cheapest_price < 110; }, { keys: ['cheapest_price'], still: FURTHER }), expectReport: [3] },
      { request: 'Let me know if the Moss / L price changes.', decide: changed('mossL_price'), expectReport: [1] },
      { request: 'Tell me whenever the lowest price for this jacket changes.', decide: changed('cheapest_price'), expectReport: [3, 4, 5] },
    ],
    stops: [
      { condition: 'Stop once Slate / M is back in stock after selling out.', pred: function (e, k, ph) { return e.slateM_stock === 'in_stock' && earlier(ph, k, function (x) { return x.slateM_stock === 'out_of_stock'; }); }, expect: 5 },
      { condition: 'Stop when any option is under $100.', pred: function (e) { return e.cheapest_price < 100; }, expect: 4 },
    ],
    notes: ['"Cheapest" means the lowest price among options that are not out of stock; in this timeline it always equals the "From" price.'],
  },
  // ------------------------------------------------------------------ 6
  {
    id: 'listing',
    number: '6',
    description:
      'Northwind Books "New & Notable in Science Fiction" listing with 7–8 books. The user watches "The Glass Orchard" by Maren Ostrova: $18.99 (phases 0–2), $15.99 from phase 3, "Temporarily out of stock" in phase 5 only. Every phase the other books change price or stock, the sort order changes, a new title appears in phase 2, one disappears in phase 4, and phase 4 adds "The Glass Orchard Companion" by Delia Frane at $9.99 — a different book with the same words in its title.',
    examples: [
      { request: 'Tell me if The Glass Orchard by Maren Ostrova gets cheaper.', decide: decreased('glassPrice'), expectReport: [3] },
      { request: 'Tell me about any price or availability change for The Glass Orchard.', decide: changed('glassPrice', 'glassStock'), expectReport: [3, 5, 6] },
      { request: 'Tell me when The Glass Orchard costs less than $16.', decide: entered(function (e) { return e.glassPrice < 16; }), expectReport: [3] },
    ],
    stops: [{ condition: "Stop once it's under $16.", pred: function (e) { return e.glassPrice < 16; }, expect: 3 }],
    notes: ['"The Cartographer\'s Moon" has the same $18.99 price in phases 0–2.', 'Position changes of the watched book are not a change.', 'Each book card is li.book with h3.book-title, .book-author, .book-price and .book-avail.'],
  },
  // ------------------------------------------------------------------ 7
  {
    id: 'format-change',
    number: '7',
    description:
      'Harbor & Pine Home (UK) product page for a "Washed Linen Duvet Cover, King". The price is £51.77 in phases 0–4 but rendered differently each phase: "£51.77", "GBP 51.77", "51.77 GBP", "£51.770", then "£51.77" with the pence in a separate small superscript span. Phase 5 is a real change to "£46.59" (with "Was £51.77 · Save 10%"), and phase 6 re-formats the new price as "GBP 46.59".',
    examples: [
      { request: 'Tell me if the duvet cover price changes.', decide: changed('price'), expectReport: [5] },
      { request: "Let me know when it's under £50.", decide: entered(function (e) { return e.price < 50; }), expectReport: [5] },
    ],
    stops: [{ condition: "Stop once it's under £50.", pred: function (e) { return e.price < 50; }, expect: 5 }],
    notes: ['Phases 1–4 and 6 are formatting-only changes: a correct watcher reports nothing.'],
  },
  // ------------------------------------------------------------------ 8
  {
    id: 'zh-price',
    number: '8',
    description:
      'Chinese-language (zh-CN) product page of the fictional store 栖木家居 for an oak standing desk (橡木电动升降书桌 1.4m). 售价 ¥1,299.00 → ¥1,299.00 → ¥1,199.00 (有货) → ¥1,199.00 缺货 with "预计 <t0 + 8 days> 到货" → 缺货 → ¥1,099.00 有货 → ¥1,099.00 仅剩 2 件. A static 参考价 ¥1,599.00 is shown struck through in every phase.',
    examples: [
      { request: '这张书桌降价了就告诉我。 (Tell me when this desk gets cheaper.)', decide: decreased('price'), expectReport: [2, 5] },
      { request: 'Tell me when the desk costs less than ¥1,200.', decide: entered(function (e) { return e.price < 1200; }, { keys: ['price'], still: FURTHER }), expectReport: [2] },
      {
        request: '缺货或者重新有货的时候通知我。 (Notify me when it goes out of stock or comes back in stock.)',
        decide: function (c, p) {
          var co = c.stock === 'out_of_stock';
          var po = p.stock === 'out_of_stock';
          if (co !== po) return 'report';
          if (c.stock !== p.stock) return ['optional', 'Low stock (仅剩 2 件) is still in stock; mentioning it is fine.'];
          return 'skip';
        },
        expectReport: [3, 5],
      },
    ],
    stops: [{ condition: '降到 ¥1,100 以下就不用再看了。 (Stop once it is below ¥1,100.)', pred: function (e) { return e.price < 1100; }, expect: 5 }],
    notes: ['Prices use a comma thousands separator: "¥1,199.00" is one thousand one hundred ninety-nine yuan.', 'The page chrome is Chinese; the fixture footer is English.'],
  },
  // ------------------------------------------------------------------ 9
  {
    id: 'job-board',
    number: '9',
    description:
      'Quillstack Jobs "Engineering jobs in Europe" board, newest first, with title, company, location, salary, tags and "Posted … ago (<UTC time>)". Phase 1 adds a Python job in Berlin; phase 2 adds an "Embedded Rust Engineer" in Hamburg and edits a salary; phase 3 adds "Rust Systems Engineer" at Lattice Grid Energy in Berlin; phase 4 removes a Berlin frontend job and renames the Hamburg job; phase 5 adds "Staff Rust Engineer" in Berlin (Hybrid); phase 6 adds a Berlin data engineering job and adds a salary to the phase-3 Rust job. Baseline traps: a Rust job in Munich, a remote-EU Rust job, and a Berlin platform job that says "Experience with Rust is a plus".',
    examples: [
      {
        request: 'Tell me when a Rust job in Berlin appears.',
        decide: function (c, p) {
          var fresh = c.rustBerlinIds.filter(function (id) { return p.rustBerlinIds.indexOf(id) < 0; });
          if (fresh.length) return 'report';
          var edited = c.rustBerlinIds.some(function (id) { return listingOf(c, id) !== listingOf(p, id); });
          return edited ? ['optional', 'An already-reported Rust job in Berlin was edited (salary added).'] : 'skip';
        },
        expectReport: [3, 5],
      },
      {
        request: 'Tell me about any new job posted in Berlin.',
        decide: function (c, p) {
          return newIds(c, p).some(function (id) { return /Berlin/.test(listingOf(c, id)); }) ? 'report' : 'skip';
        },
        expectReport: [1, 3, 5, 6],
      },
      {
        request: 'Let me know about any new job postings.',
        decide: function (c, p) {
          return newIds(c, p).length ? 'report' : 'skip';
        },
        expectReport: [1, 2, 3, 5, 6],
      },
    ],
    stops: [{ condition: 'Stop after the first Rust job in Berlin shows up.', pred: function (e) { return e.rustBerlinIds.length > 0; }, expect: 3 }],
    notes: ['Removals (phase 4) and edits are not new postings.', '"Posted N minutes ago" and "New" badges change with the load time.', 'Each posting is li.job[data-job-id] with .job-title, .job-company, .job-location, .job-salary.'],
  },
  // ------------------------------------------------------------------ 10
  {
    id: 'status-page',
    number: '10',
    description:
      'Veltrane Cloud status page with six components (API, Dashboard, Webhooks, Object Storage, Authentication, CDN), an overall banner, 60-day uptime bars, a scheduled-maintenance notice (present in every phase, not an incident) and past incidents. Webhooks: Operational → Operational → Degraded performance → Major outage → Partial outage → Degraded performance → Operational → Operational. API is "Degraded performance" in phase 3 only. The incident "Delayed and failing webhook deliveries" gains an update each phase (Investigating, Identified, Monitoring, Monitoring, Resolved) and moves to "Past incidents" in phase 7.',
    examples: [
      { request: 'Tell me whenever the Webhooks status changes.', decide: changed('webhooks'), expectReport: [2, 3, 4, 5, 6] },
      { request: 'Let me know if the API is affected.', decide: entered(function (e) { return e.api !== 'operational'; }, { exit: ['optional', 'The API is operational again.'] }), expectReport: [3] },
      { request: 'Alert me if there is a major outage.', decide: entered(function (e) { return e.overall === 'Major System Outage'; }, { exit: ['optional', 'No longer a major outage (partial outage, recovering).'] }), expectReport: [3] },
      { request: 'Tell me when everything is fully operational again.', startPhase: 2, decide: entered(function (e) { return e.allOperational; }), expectReport: [6] },
    ],
    stops: [
      { condition: 'Stop once everything is operational again (after the incident).', pred: function (e, k, ph) { return e.allOperational && earlier(ph, k, function (x) { return !x.allOperational; }); }, expect: 6 },
    ],
    notes: ['Phase 1 is identical to phase 0.', 'Phase 7 only moves the resolved incident into "Past incidents".', 'The "Page generated …" timestamp changes on every load.', 'Each component is li.component[data-component] with .c-status.'],
  },
  // ------------------------------------------------------------------ 11
  {
    id: 'event-tickets',
    number: '11',
    description:
      'Tidewater Live page for "The Lantern Quartet — Autumn Tour" with a tour-dates table (date = t0 + 14/15/16/17 days, city, venue, price, seats left). Seats fall every phase. Portsmere: 120, 96, 71, 50, 32, 12, 5, sold out. Aldbury Cross: 45, 22, 8, sold out (phase 3) … 4 returned seats (phase 6) … sold out (7). Wrenfield: 200 → 101. A new date, Halloway Bay, is added in phase 4 with 250 seats.',
    examples: [
      {
        request: 'Tell me if the Aldbury Cross show sells out.',
        decide: entered(function (e) { return e.aldbury === 0; }, { exit: ['optional', '4 returned seats were released.'] }),
        overrides: { 7: ['optional', 'Sold out again after the returned seats; the first sell-out was already reported.'] },
        expectReport: [3],
      },
      { request: 'Let me know if they add a new tour date.', decide: function (c, p) { return c.dateCount > p.dateCount ? 'report' : 'skip'; }, expectReport: [4] },
      { request: 'Tell me if tickets for the Aldbury Cross show become available again.', startPhase: 3, decide: entered(function (e) { return e.aldbury > 0; }, { exit: ['optional', 'Sold out again.'] }), expectReport: [6] },
      {
        request: 'Tell me when fewer than 20 seats are left for Portsmere.',
        decide: entered(function (e) { return e.portsmere < 20; }),
        overrides: { 7: ['optional', 'Portsmere is now sold out.'] },
        expectReport: [5],
      },
    ],
    stops: [
      { condition: 'Stop once a new date is announced.', pred: function (e) { return e.dateCount > 3; }, expect: 4 },
      { condition: 'Stop when the Portsmere show sells out.', pred: function (e) { return e.portsmere === 0; }, expect: 7 },
    ],
    notes: ['Falling seat counts alone are not worth reporting for these requests.', 'Each tour date is tr[data-show] with .show-city and .seats.'],
  },
  // ------------------------------------------------------------------ 12
  {
    id: 'late-render',
    number: '12',
    description:
      'Kestrel Audio product page for the "Kestrel Pebble Bluetooth Speaker" whose price, stock and buy button are rendered by script 4–6 seconds after load; until then skeleton placeholders (grey shimmering bars) sit in their place. The delay is deterministic: 4000 + floor(rng(id, seed, "delay", rawPhase) × 2001) ms. Price: $79.00, $79.00, $69.00, $69.00, $64.00. Related products ($199.00, $12.00) are visible immediately.',
    examples: [
      { request: 'Tell me when the Pebble speaker gets cheaper.', decide: decreased('price'), expectReport: [2, 4] },
      { request: 'Tell me if it goes below $65.', decide: entered(function (e) { return e.price < 65; }), expectReport: [4] },
    ],
    stops: [{ condition: "Stop once it's under $65.", pred: function (e) { return e.price < 65; }, expect: 4 }],
    notes: ['A watcher that reads before the delay sees no price at all; it must wait or report that it could not read the value, never report a change.'],
  },
  // ------------------------------------------------------------------ 13a
  {
    id: 'click-to-reveal',
    number: '13a',
    description:
      'Brightfold Kitchen product page for the "Stoneheart Countertop Grain Mill". The price is only in a "Show price details" disclosure. Decision: the details panel is NOT in the DOM before the click (script inserts it on click and removes it on the next click), so reading requires clicking. Item price: $249.00, $249.00, $229.00, $229.00, $219.00, $219.00; the panel also shows $12.00 delivery and an estimated total.',
    examples: [
      { request: "Tell me if the grain mill's price changes.", decide: changed('price'), expectReport: [2, 4] },
      { request: "Tell me when it's under $225.", decide: entered(function (e) { return e.price < 225; }), expectReport: [4] },
    ],
    stops: [{ condition: "Stop once it's under $225.", pred: function (e) { return e.price < 225; }, expect: 4 }],
    notes: ['Button: #toggle-price-details (aria-expanded). Panel: #price-details, price in #product-price, total in #price-total.'],
  },
  // ------------------------------------------------------------------ 13b
  {
    id: 'tabbed-price',
    number: '13b',
    description:
      'Harbor & Pine Home product page for a "Walnut Bedside Table" whose price lives in a secondary "Price & delivery" tab. Decision: the tab panel IS in the DOM from the start but has the hidden attribute until the tab is clicked (textContent includes the price; innerText and the accessibility tree do not). Price: $189.00 (phases 0–2), $169.00 (3–4), $159.00 (5). The same panel shows a static $49.00 white-glove delivery fee.',
    examples: [
      { request: 'Tell me if the bedside table gets cheaper.', decide: decreased('price'), expectReport: [3, 5] },
      { request: "Tell me when it's under $170.", decide: entered(function (e) { return e.price < 170; }, { keys: ['price'], still: FURTHER }), expectReport: [3] },
    ],
    stops: [{ condition: "Stop once it's under $170.", pred: function (e) { return e.price < 170; }, expect: 3 }],
    notes: ['Tab: #tab-pricing. Panel: #panel-pricing, price in #product-price.'],
  },
  // ------------------------------------------------------------------ 14
  {
    id: 'page-gone',
    number: '14',
    description:
      'Northwind Books page for "Atlas of Quiet Places (Hardcover)" at s/page-gone/. Phases 0–2: normal product page ($42.00, $42.00, $38.00). Phases 3–4: "This product is no longer available". Phase 5: "This product has moved" with a "Go to the new page" link to s/page-gone/new/ (query string kept), where the revised edition costs $36.00. Phases 6–7: the original URL immediately redirects (location.replace) to the new URL; the new page shows $36.00 in phase 6 and $34.00 in phase 7. Before phase 5 the new URL shows a 404-style "We couldn\'t find that page".',
    extraPaths: ['s/page-gone/new/'],
    examples: [
      {
        request: 'Tell me if the Atlas of Quiet Places gets cheaper.',
        decide: function (c, p) {
          if (c.status === 'gone') return p.status === 'gone' ? 'skip' : ['report', 'The product was discontinued: tell the user it is no longer available (not a price).'];
          if (c.status === 'moved' && p.status === 'gone') return ['report', 'The product moved to a new page (revised edition) that costs $36.00, below the last seen $38.00.'];
          if (c.status === 'redirect' && p.status === 'moved') return c.price < p.price ? 'report' : ['optional', 'The old URL now redirects to the same new page; price unchanged.'];
          return c.price < p.price ? 'report' : 'skip';
        },
        expectReport: [2, 3, 5, 7],
      },
      { request: 'Tell me if this book stops being available.', decide: entered(function (e) { return e.status === 'gone'; }, { exit: ['optional', 'It is available again at a new URL (revised edition).'] }), expectReport: [3] },
    ],
    stops: [{ condition: 'Stop watching if the product is discontinued.', pred: function (e) { return e.status === 'gone'; }, expect: 3 }],
    notes: ['GitHub Pages returns HTTP 200 in every state; "gone" and "moved" are page content, and the redirect is client-side.', 'Reading the phase-5 price requires following the link.'],
  },
  // ------------------------------------------------------------------ 15
  {
    id: 'login-wall',
    number: '15',
    description:
      'Orrisfield Supply Co. (trade supplier) product page for a "Pre-seasoned Cast Iron Skillet, 12 in". In phases 2, 3 and 6 the buy box shows "Sign in to see prices" (no price anywhere in the DOM; related products say "Sign in for price"; the Sign in button only shows "Sign-in is disabled on this test fixture"). Otherwise the price is visible: $44.00 (0, 1, 4), $39.00 (5, 7).',
    examples: [
      { request: 'Tell me when the skillet gets cheaper.', decide: decreased('price'), expectReport: [5] },
      { request: "Tell me whenever the skillet's price changes.", decide: changed('price'), expectReport: [5] },
    ],
    stops: [{ condition: "Stop once it's under $40.", pred: function (e) { return e.price < 40; }, expect: 5 }],
    notes: ['During the wall the watcher must say it could not read the price, never report a change (and never treat "no price" as $0).', 'Phase 4 shows the same $44.00 as before the wall: no change. Phase 7 shows the same $39.00 as phase 5.'],
  },
  // ------------------------------------------------------------------ 16
  {
    id: 'intermittent-error',
    number: '16',
    description:
      'Lumen Outfitters product page for a "Summit Down Vest" that deterministically renders a styled "503 Service Temporarily Unavailable" error page instead of the product in phases 1, 4, 5 and 8 (with a changing reference number). Readable phases: $149.00 (0, 2, 3), then $129.00 (6, 7, 9) — the price changes while the page is failing.',
    examples: [
      { request: 'Tell me when the Summit Down Vest price drops.', decide: decreased('price'), expectReport: [6] },
      { request: "Tell me if the vest's price changes.", decide: changed('price'), expectReport: [6] },
    ],
    stops: [{ condition: 'Stop once it costs less than $130.', pred: function (e) { return e.price < 130; }, expect: 6 }],
    notes: ['The HTTP status is 200 even on error phases; the error is page content.', 'Phase 6 is the first readable phase after a two-phase outage and already has the new price.'],
  },
  // ------------------------------------------------------------------ 17
  {
    id: 'live-ticker',
    number: '17',
    description:
      'Fernmarket quote page for the fictional stock "Quenwick Robotics Inc. (QWKR)" that updates live every 3 seconds (the only page that re-renders on its own). price(t) = round2(LEVELS[phase(t)] + 0.40 × (2u − 1)) where u = rng("live-ticker", seed, "tick", floor(t / 3000)), so within a phase every quote stays within level ± 0.40. LEVELS = 100.00, 100.30, 99.80, 101.50, 103.60, 106.10, 104.40, 101.00, 97.60, 96.20, 98.50, 100.00. Previous close is 100.00; the page also shows change vs previous close, a 3-minute sparkline, a 10-minute range and a volume counter.',
    band: [97, 103, 105],
    examples: [
      { request: 'Tell me if QWKR goes above $105.', decide: entered(function (e) { return e.min > 105; }, { exit: ['optional', 'Back below $105.'] }), expectReport: [5] },
      { request: 'Tell me if QWKR falls below $97.', decide: entered(function (e) { return e.max < 97; }, { exit: ['optional', 'Back above $97.'] }), expectReport: [9] },
      {
        request: "Tell me if QWKR moves more than 3% away from yesterday's close of $100.00.",
        decide: entered(function (e) { return e.min > 103 || e.max < 97; }, { keys: ['level'], still: ['optional', 'Still more than 3% away, now at a different level.'], exit: ['optional', 'Back within 3% of the close.'] }),
        expectReport: [4, 9],
      },
    ],
    stops: [{ condition: 'Stop once it has gone above $105.', pred: function (e) { return e.min > 105; }, expect: 5 }],
    notes: ['Tick-to-tick jitter (±0.40) is never worth reporting for these requests.', 'Every phase band lies entirely on one side of 97, 103 and 105, so each check has one right answer.', 'With ?now= pinned, the clock starts at that value and advances in real time.'],
  },
  // ------------------------------------------------------------------ 18
  {
    id: 'threshold-approach',
    number: '18',
    description:
      'Kestrel Audio product page for the "Kestrel Dock 7-in-1 USB-C Hub" whose price creeps toward $45: $49.99 → $47.99 → $46.49 → $45.20 → $45.00 → $44.80 → $45.30 → $44.60. Phases 3 and 4 are near misses for "below $45" ($45.00 is not below $45, but is "$45 or less"). Phase 6 bounces back above $45 while the note says "Lowest price in the last 30 days: $44.80". A related product costs $44.99 in every phase.',
    examples: [
      { request: 'Tell me when the Kestrel Dock drops below $45.', decide: entered(function (e) { return e.price < 45; }, { keys: ['price'], still: FURTHER, exit: ['optional', 'Back above $45.'] }), expectReport: [5, 7] },
      { request: 'Tell me when it costs $45 or less.', decide: entered(function (e) { return e.price <= 45; }, { keys: ['price'], still: FURTHER, exit: ['optional', 'Back above $45.'] }), expectReport: [4, 7] },
      { request: 'Let me know whenever the price changes.', decide: changed('price'), expectReport: [1, 2, 3, 4, 5, 6, 7] },
    ],
    stops: [
      { condition: "Stop once it's below $45.", pred: function (e) { return e.price < 45; }, expect: 5 },
      { condition: "Stop once it's $45 or less.", pred: function (e) { return e.price <= 45; }, expect: 4 },
    ],
    notes: ['Phase 7 is a second crossing after the phase-6 bounce; a watcher that already stopped at phase 5 never sees it.'],
  },
  // ------------------------------------------------------------------ 19
  {
    id: 'consent-overlay',
    number: '19',
    description:
      'Wrenfield Garden Supply product page for a "Galvanised Watering Can, 9 L" covered on every load by a modal cookie-consent dialog ("We value your privacy") with "Accept all", "Reject non-essential" and "Save choices". The dialog\'s policy version text changes every phase. The product and its price are in the DOM underneath the whole time: $32.00 (phases 0–2), $27.50 (3–4).',
    examples: [
      { request: 'Tell me if the watering can gets cheaper.', decide: decreased('price'), expectReport: [3] },
      { request: "Tell me when it's under $30.", decide: entered(function (e) { return e.price < 30; }), expectReport: [3] },
    ],
    stops: [{ condition: "Stop once it's under $30.", pred: function (e) { return e.price < 30; }, expect: 3 }],
    notes: ['The privacy-preserving choice is "Reject non-essential"; nothing is stored, so the dialog returns on every load.', 'The dialog text change is not a change of the watched value.'],
  },
  // ------------------------------------------------------------------ 20
  {
    id: 'shrinkflation',
    number: '20',
    description:
      'Pantry Lane Grocers page for "Oat & Honey Granola Bars". Shelf price $4.99 for 12 bars ($0.42 / bar) in phases 0–1; in phase 2 the pack shrinks to 10 bars at the same $4.99 ($0.50 / bar, title changes to "10 pack"); in phase 4 the shelf price drops to $4.49 ($0.45 / bar).',
    examples: [
      {
        request: "Tell me if the granola bars' price changes.",
        decide: function (c, p) {
          if (c.price !== p.price) return 'report';
          if (c.packCount !== p.packCount) return ['optional', 'Shelf price unchanged, but the pack shrank from 12 to 10 bars (unit price up about 20%); worth a mention.'];
          return 'skip';
        },
        expectReport: [4],
      },
      { request: 'Tell me if these get more expensive per bar.', decide: function (c, p) { return c.unitPrice > p.unitPrice ? 'report' : 'skip'; }, expectReport: [2] },
      { request: 'Tell me about any change to the price or the pack size.', decide: changed('price', 'packCount'), expectReport: [2, 4] },
    ],
    stops: [{ condition: 'Stop if the pack size changes.', pred: function (e, k, ph) { return e.packCount !== ph[0].packCount; }, expect: 2 }],
    notes: ['Unit price is shown in #unit-price and pack size in #pack-size under the shelf price.'],
  },
  // ------------------------------------------------------------------ 21
  {
    id: 'release-notes',
    number: '21',
    description:
      'Releases page of the fictional open-source "Driftwood DB", newest first, with a "Latest stable" box. Baseline latest stable 2.8.1. Phase 1 adds 2.8.2; phase 2 adds 3.0.0-rc.1 (Pre-release); phase 3 only edits the rc.1 notes (adds "Known issues"); phase 4 adds 3.0.0-rc.2; phase 5 adds the final 3.0.0; phase 6 adds 3.0.1.',
    examples: [
      { request: 'Tell me when Driftwood 3.0 is released (the final version, not a preview).', decide: entered(function (e) { return /^3\./.test(e.latestStable); }, { keys: ['latestStable'], still: ['optional', 'A 3.0.1 patch release followed.'] }), expectReport: [5] },
      { request: 'Tell me about any new release.', decide: function (c, p) { return c.versions.length > p.versions.length ? 'report' : 'skip'; }, expectReport: [1, 2, 4, 5, 6] },
      {
        request: 'Let me know when a 3.0 release candidate is out.',
        decide: function (c, p) {
          var fresh = c.versions.filter(function (v) { return p.versions.indexOf(v) < 0; });
          var rc = /^3\.0\.0-rc/;
          if (fresh.some(function (v) { return rc.test(v); })) return p.versions.some(function (v) { return rc.test(v); }) ? ['optional', 'A second release candidate (rc.2).'] : 'report';
          if (fresh.indexOf('3.0.0') >= 0) return ['optional', 'The final 3.0.0 is out.'];
          return 'skip';
        },
        expectReport: [2],
      },
    ],
    stops: [{ condition: 'Stop once 3.0.0 final is out.', pred: function (e) { return e.versions.indexOf('3.0.0') >= 0; }, expect: 5 }],
    notes: ['Pre-releases never change the "Latest stable" box.', 'Each release is article.release[data-version].'],
  },
  // ------------------------------------------------------------------ 22
  {
    id: 'layout-redesign',
    number: '22',
    description:
      'Lumen Outfitters page for "Alpine Trekking Poles (pair)". Phases 0–2 use the classic product layout; from phase 3 the whole site is redesigned (new theme, new navigation, "Welcome to the new Lumen Outfitters website" bar, no #product-price, the price in a fixed bottom buy bar) with the same $79.00. The real change comes in phase 5: $72.00. The new layout also shows "Or 4 interest-free payments of $19.75" ($18.00 from phase 5).',
    examples: [
      { request: "Tell me if the trekking poles' price changes.", decide: changed('price'), expectReport: [5] },
      { request: "Tell me when they're under $75.", decide: entered(function (e) { return e.price < 75; }), expectReport: [5] },
    ],
    stops: [{ condition: "Stop once they're under $75.", pred: function (e) { return e.price < 75; }, expect: 5 }],
    notes: ['A watcher relying on remembered selectors must re-find the price after phase 3 rather than report "price missing".'],
  },
];
