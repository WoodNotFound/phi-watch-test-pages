# Page-watching test fixtures

Static test pages for a "watch this page" feature: an agent periodically opens a page in a real browser, reads what the user cares about (a price, stock, new items, a status…), compares it with earlier checks, and decides whether to notify the user or whether a stop condition is met. Every page's state is a pure function of **(current time, URL parameters)**, so a test harness knows the right answer in advance.

Live site: https://woodnotfound.github.io/phi-watch-test-pages/

All stores, brands, products, people and services here are fictional. Every page carries the footer "Test fixture for automated page-watching tests. Not a real store." Plain HTML, CSS and vanilla JS only: no CDN, external fonts, images, analytics or trackers.

## Time model

| Parameter | Meaning | Default |
| --- | --- | --- |
| `t0` | Epoch milliseconds when the scenario timeline starts | most recent midnight UTC |
| `step` | Seconds per phase | `600` |
| `now` | Optional epoch ms that pins the current time (live pages advance from it in real time) | real clock |
| `seed` | Optional string mixed into the PRNG (noise only; also the late-render delay) | `1` |
| `debug` | `1` appends an answer-key panel (phase, timeline table, watched value now). Without it the panel is not in the DOM at all | off |
| `lang` | `en` or `zh`: the page language. Only words change; numbers, prices, currencies and the timeline are identical, so `scenarios.json` holds for both | the scenario's own (`zh` for `zh-price`, otherwise `en`) |

```
rawPhase = max(0, floor((now - t0) / (step * 1000)))
phase    = min(rawPhase, phaseCount - 1)      # every scenario holds at its last phase; none loops
phase k starts at t0 + k * step * 1000
```

Pages compute their state once, on load; there is no auto-refresh. The only exception is `live-ticker`, which is about live updates and re-renders every 3 seconds. Some deliberate noise depends on the exact load time (countdowns, "N minutes ago", "N people viewing"), never the watched values. There is no `Math.random`: noise comes from mulberry32 seeded with FNV-1a of `"<scenario id>|<seed>|<salt>|<time bucket>"`.

To drive a scenario, pick `t0` and `step`, then open `https://woodnotfound.github.io/phi-watch-test-pages/s/<id>/?t0=<t0>&step=<step>` whenever the watcher checks. With `step=60` phase *k* is live from `t0 + 60k` to `t0 + 60(k+1)` seconds. To check a specific phase directly, add `now=<t0 + k*step*1000 + 1000>`.

GitHub Pages serves every page with HTTP 200, so the "error", "gone" and "moved" states are page content (and the redirect in `page-gone` is client-side).

## Languages

Every page exists in English and Chinese. Scenario code is written in the page's own language; `?lang=` asks for the other one, and `assets/core.js` translates the page on the client with the dictionaries in `assets/i18n/` (`common.js` for the shared store chrome, one file per scenario). Every text node and the `placeholder`, `aria-label`, `alt` and `title` attributes are translated, including text a scenario inserts later (a `MutationObserver`); dates and relative times are converted first. Brand, product and people's names, SKUs, numbers, prices and currencies stay as they are. The internal links and the `page-gone` redirect keep the query string, so the language survives them.

`node tools/i18n-extract.js --lang zh --untranslated` lists rendered text that still contains Latin words after translating (names on a scenario's keep list excepted); `--lang en --only zh-price` does the same the other way. Text a scenario inserts after load is checked by `tools/validate.js`, which also loads every phase of every page in the other language.

## scenarios.json

[`scenarios.json`](scenarios.json) is the answer key, generated from the same JavaScript the pages run (`assets/core.js`, `assets/scenarios/*.js`) plus `tools/meta.js`. Per scenario it lists:

- `id`, `path`, `urlTemplate`, `description`, `watched` (keys and labels);
- `phases`: for each phase the `watched` values and other visible `context`, plus `readable: false` when the value cannot be read (login wall, error page);
- `afterLastPhase` (`holds` for every scenario) and `afterLastNotes`;
- `examples`: 1–4 natural-language watch requests, each with `expected` (one verdict per phase: `baseline`, `report`, `skip`, `optional`, `unreadable`, `n/a`), `reportPhases`, an optional `startPhase` and per-phase `notes`;
- `stopConditions`: each with the first `phase` at which it becomes true (`null` = never).

Comparisons in `expected` are always against the last readable phase. Threshold requests are edge-triggered: they report when the condition becomes true; a further move while it stays true is `optional`.

## Scenarios

| # | id | page | phases | watched keys |
| --- | --- | --- | --- | --- |
| 1 | `price-step-down` | [s/price-step-down/](https://woodnotfound.github.io/phi-watch-test-pages/s/price-step-down/) | 6 | `price`, `priceText` |
| 2 | `stock-cycle` | [s/stock-cycle/](https://woodnotfound.github.io/phi-watch-test-pages/s/stock-cycle/) | 7 | `stock`, `stockText` |
| 3 | `noise-only` | [s/noise-only/](https://woodnotfound.github.io/phi-watch-test-pages/s/noise-only/) | 8 | `price`, `priceText`, `stock`, `stockText` |
| 4 | `sale-window` | [s/sale-window/](https://woodnotfound.github.io/phi-watch-test-pages/s/sale-window/) | 9 | `price`, `priceText`, `onSale` |
| 5 | `variants` | [s/variants/](https://woodnotfound.github.io/phi-watch-test-pages/s/variants/) | 7 | `slateM_price`, `slateM_stock`, `cheapest_price`, `cheapest_variant`, `mossL_price` |
| 6 | `listing` | [s/listing/](https://woodnotfound.github.io/phi-watch-test-pages/s/listing/) | 7 | `glassPrice`, `glassPriceText`, `glassStock` |
| 7 | `format-change` | [s/format-change/](https://woodnotfound.github.io/phi-watch-test-pages/s/format-change/) | 7 | `price`, `priceText` |
| 8 | `zh-price` | [s/zh-price/](https://woodnotfound.github.io/phi-watch-test-pages/s/zh-price/) | 7 | `price`, `priceText`, `stock`, `stockText` |
| 9 | `job-board` | [s/job-board/](https://woodnotfound.github.io/phi-watch-test-pages/s/job-board/) | 7 | `listings`, `rustBerlinIds`, `count` |
| 10 | `status-page` | [s/status-page/](https://woodnotfound.github.io/phi-watch-test-pages/s/status-page/) | 8 | `overall`, `webhooks`, `api`, `allOperational`, `incidentStatus` |
| 11 | `event-tickets` | [s/event-tickets/](https://woodnotfound.github.io/phi-watch-test-pages/s/event-tickets/) | 8 | `portsmere`, `aldbury`, `wrenfield`, `halloway`, `dateCount` |
| 12 | `late-render` | [s/late-render/](https://woodnotfound.github.io/phi-watch-test-pages/s/late-render/) | 5 | `price`, `priceText` |
| 13a | `click-to-reveal` | [s/click-to-reveal/](https://woodnotfound.github.io/phi-watch-test-pages/s/click-to-reveal/) | 6 | `price`, `priceText` |
| 13b | `tabbed-price` | [s/tabbed-price/](https://woodnotfound.github.io/phi-watch-test-pages/s/tabbed-price/) | 6 | `price`, `priceText` |
| 14 | `page-gone` | [s/page-gone/](https://woodnotfound.github.io/phi-watch-test-pages/s/page-gone/) | 8 | `status`, `price`, `priceText` |
| 15 | `login-wall` | [s/login-wall/](https://woodnotfound.github.io/phi-watch-test-pages/s/login-wall/) | 8 | `access`, `price`, `priceText` |
| 16 | `intermittent-error` | [s/intermittent-error/](https://woodnotfound.github.io/phi-watch-test-pages/s/intermittent-error/) | 10 | `status`, `price`, `priceText` |
| 17 | `live-ticker` | [s/live-ticker/](https://woodnotfound.github.io/phi-watch-test-pages/s/live-ticker/) | 12 | `level`, `min`, `max` |
| 18 | `threshold-approach` | [s/threshold-approach/](https://woodnotfound.github.io/phi-watch-test-pages/s/threshold-approach/) | 8 | `price`, `priceText` |
| 19 | `consent-overlay` | [s/consent-overlay/](https://woodnotfound.github.io/phi-watch-test-pages/s/consent-overlay/) | 5 | `price`, `priceText` |
| 20 | `shrinkflation` | [s/shrinkflation/](https://woodnotfound.github.io/phi-watch-test-pages/s/shrinkflation/) | 6 | `price`, `priceText`, `packCount`, `unitPriceText` |
| 21 | `release-notes` | [s/release-notes/](https://woodnotfound.github.io/phi-watch-test-pages/s/release-notes/) | 7 | `versions`, `latest`, `latestStable` |
| 22 | `layout-redesign` | [s/layout-redesign/](https://woodnotfound.github.io/phi-watch-test-pages/s/layout-redesign/) | 7 | `price`, `priceText` |

See `scenarios.json` or open any page with `?debug=1` for the full timelines.

## Development

```
node tools/build.js            # regenerate scenarios.json, s/*/index.html, index.html, README.md
node tools/i18n-extract.js --lang zh --untranslated   # rendered text the zh dictionaries miss
node tools/build.js --check    # fail if a generated file is stale
node tools/validate.js         # logic checks + every phase of every page in headless Chromium
node tools/validate.js --base https://woodnotfound.github.io/phi-watch-test-pages/   # same checks against the live site
```

`tools/validate.js` needs Node 22+ (built-in WebSocket) and a Chromium binary (`CHROME=/path/to/chrome`, or a Playwright headless shell in the default cache).
