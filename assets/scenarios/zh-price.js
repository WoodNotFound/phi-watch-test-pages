(function (WF) {
  'use strict';
  var S = WF.shop;
  var esc = WF.esc;
  var RESTOCK_DAYS = 8;

  function cny(n) {
    return WF.fmt.money(n, { symbol: '¥' });
  }

  var PHASES = [
    { price: 1299, stock: 'in_stock', stockText: '有货' },
    { price: 1299, stock: 'in_stock', stockText: '有货' },
    { price: 1199, stock: 'in_stock', stockText: '有货' },
    { price: 1199, stock: 'out_of_stock', stockText: '缺货', restockOffsetDays: RESTOCK_DAYS },
    { price: 1199, stock: 'out_of_stock', stockText: '缺货', restockOffsetDays: RESTOCK_DAYS },
    { price: 1099, stock: 'in_stock', stockText: '有货' },
    { price: 1099, stock: 'low', stockText: '仅剩 2 件' },
  ];

  var NAV = ['首页', '书房', '客厅', '卧室', '餐厨', '收纳', '特惠'];

  function chrome(main) {
    return (
      '<div class="store theme-qimu">' +
      '<div class="promo-strip">全场满 ¥699 包邮 · 大件家具送货上门并免费安装</div>' +
      '<header class="site-header"><div class="wrap header-row">' +
      '<a class="logo" href="#"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" style="fill:var(--brand)"/><text x="17" y="23" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">栖</text></svg><span>栖木家居</span></a>' +
      '<form class="search" role="search" onsubmit="return false"><input type="search" placeholder="搜索书桌、椅子、收纳…" aria-label="搜索"><button type="button">搜索</button></form>' +
      '<nav class="utility" aria-label="账户"><a href="#">客服</a><a href="#">我的订单</a><a href="#">购物车 (0)</a></nav>' +
      '</div><nav class="main-nav wrap" aria-label="分类">' +
      NAV.map(function (n, i) { return '<a href="#"' + (i === NAV.length - 1 ? ' class="sale"' : '') + '>' + n + '</a>'; }).join('') +
      '</nav></header><main class="wrap">' + main + '</main>' +
      '<footer class="store-footer"><div class="wrap"><div class="cols">' +
      '<div><h4>关于栖木</h4><ul><li><a href="#">品牌故事</a></li><li><a href="#">线下体验店</a></li></ul></div>' +
      '<div><h4>购物指南</h4><ul><li><a href="#">配送说明</a></li><li><a href="#">退换货政策</a></li><li><a href="#">安装服务</a></li></ul></div>' +
      '<div><h4>联系我们</h4><ul><li><a href="#">在线客服</a></li><li><a href="#">企业采购</a></li></ul></div>' +
      '</div><p class="legal">栖木家居为虚构品牌，本页面仅用于自动化网页监控测试，并非真实商店。</p></div></footer></div>'
    );
  }

  WF.define({
    id: 'zh-price',
    title: 'Chinese-language page with CNY prices',
    path: 's/zh-price/',
    lang: 'zh-CN',
    docTitle: '橡木电动升降书桌 1.4m - 栖木家居',
    watched: [
      { key: 'price', label: '售价 (CNY, numeric)' },
      { key: 'priceText', label: '售价 as displayed' },
      { key: 'stock', label: 'Availability (in_stock | low | out_of_stock)' },
      { key: 'stockText', label: 'Availability as displayed' },
    ],
    timeline: PHASES.map(function (p) {
      return { price: p.price, priceText: cny(p.price), stock: p.stock, stockText: p.stockText, restockOffsetDays: p.restockOffsetDays || null, listPriceText: '¥1,599.00' };
    }),
    render: function (ctx, st) {
      var kind = st.stock === 'in_stock' ? 'in' : st.stock === 'low' ? 'low' : 'out';
      var sub =
        st.stock === 'out_of_stock'
          ? '预计 ' + esc(WF.fmt.zhMonthDay(ctx.t0 + st.restockOffsetDays * WF.DAY_MS)) + ' 到货，可先加入心愿单。'
          : st.stock === 'low'
            ? '库存紧张，请尽快下单。'
            : '现在下单，预计 3 天内发货。';
      var buy =
        '<div class="price-block"><span class="muted">售价</span> <span class="price-now on-sale" id="product-price">' + esc(st.priceText) + '</span> <s class="price-was">参考价 ' + esc(st.listPriceText) + '</s></div>' +
        '<p class="price-note">支持 12 期分期付款 · 7 天无理由退货（大件商品需未安装）</p>' +
        S.stockLine(kind, st.stockText, sub) +
        '<p class="small"><strong>颜色：</strong>原木色 &nbsp; <strong>尺寸：</strong>140 × 70 cm</p>' +
        '<div class="buy-row"><span class="qty"><button type="button" aria-label="减少">−</button><input value="1" aria-label="数量"><button type="button" aria-label="增加">+</button></span>' +
        (st.stock === 'out_of_stock'
          ? '<button class="btn" type="button" disabled>暂时缺货</button><button class="btn secondary" type="button">到货通知我</button>'
          : '<button class="btn" type="button">加入购物车</button><button class="btn secondary" type="button">立即购买</button>') +
        '</div>';
      var main =
        '<nav class="breadcrumbs" aria-label="面包屑"><ol><li><a href="#">首页</a></li><li><a href="#">书房家具</a></li><li><a href="#">升降书桌</a></li><li aria-current="page">橡木电动升降书桌 1.4m</li></ol></nav>' +
        '<div class="product"><div class="gallery"><div class="hero-art">' + S.art('desk', '#c89b62', '#3b3b3b') + '</div></div>' +
        '<div class="buy"><p class="brand-line">栖木家居 · 自营</p><h1 class="product-title">橡木电动升降书桌 1.4m</h1>' +
        '<p class="subtitle">北美白橡木桌面 · 双电机静音升降 · 三档记忆高度</p>' +
        '<div class="rating">' + S.stars(4.8) + ' <a href="#reviews">4.8（1,036 条评价）</a> <span class="sku">商品编号 QM-SD140-OAK</span></div>' +
        buy +
        '<ul class="highlights"><li>桌面高度 62–127 cm 无级调节</li><li>承重 120 kg，升降速度 38 mm/秒</li><li>防夹手回弹保护</li></ul></div></div>' +
        '<section class="details"><div><h2>商品介绍</h2><p>整块北美白橡木拼接桌面，天然木纹清晰，表面采用环保木蜡油处理，触感温润。双电机驱动，升降平稳安静，适合居家办公与学习。</p><p>配有三档记忆高度按键，坐站切换一键完成。</p></div>' +
        '<div><h2>规格参数</h2><table class="specs"><tbody><tr><th scope="row">桌面尺寸</th><td>140 × 70 cm</td></tr><tr><th scope="row">高度范围</th><td>62–127 cm</td></tr><tr><th scope="row">材质</th><td>北美白橡木、冷轧钢</td></tr><tr><th scope="row">电机</th><td>双电机</td></tr><tr><th scope="row">保修</th><td>整机 5 年</td></tr></tbody></table></div></section>' +
        '<section class="reviews" id="reviews"><h2>用户评价</h2>' +
        '<article class="review">' + S.stars(5) + '<h3>做工很扎实</h3><p class="meta">林** · 2 周前</p><p>桌面木纹很漂亮，升降几乎没有声音。</p></article>' +
        '<article class="review">' + S.stars(4) + '<h3>安装师傅很专业</h3><p class="meta">周** · 1 个月前</p><p>送货上门并安装好了，就是包装有点多。</p></article>' +
        '</section>';
      return chrome(main);
    },
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
