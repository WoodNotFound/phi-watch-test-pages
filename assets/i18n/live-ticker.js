(function (WF) {
  'use strict';
  WF.i18n.add('live-ticker', {
    zh: {
      'QWKR — Quenwick Robotics Inc. stock quote': 'QWKR — Quenwick Robotics Inc. 股票报价',
      Markets: '市场',
      Watchlist: '自选',
      Screener: '选股器',
      News: '新闻',
      Industrials: '工业',
      'FMX: QWKR': 'FMX：QWKR',
      Live: '实时',
      'Previous close': '昨收',
      Open: '今开',
      'Range (last 10 min)': '区间（最近 10 分钟）',
      'Market cap': '市值',
      'P/E (TTM)': '市盈率（TTM）',
      Volume: '成交量',
      'Quotes update every 3 seconds. Quenwick Robotics and the FMX exchange are fictional; this is not market data.': '报价每 3 秒更新一次。Quenwick Robotics 和 FMX 交易所都是虚构的，这不是市场数据。',
      'About Quenwick Robotics': '关于 Quenwick Robotics',
      'Quenwick designs autonomous picking robots for grocery and parcel warehouses. The company employs about 2,300 people across three countries.':
        'Quenwick 为生鲜和包裹仓库设计自主拣货机器人。公司在三个国家共有约 2,300 名员工。',
      'Latest news': '最新消息',
      'Quenwick opens a new service hub in Rotterdam': 'Quenwick 在鹿特丹开设新的服务中心',
      'Analysts expect record robot shipments this quarter': '分析师预计本季度机器人出货量创新高',
      'Quenwick names a new chief operating officer': 'Quenwick 任命新任首席运营官',
    },
    zhPatterns: [[/^As of (\d{2}:\d{2}:\d{2} UTC)$/, '截至 $1']],
    zhKeep: ['QWKR', 'Quenwick Robotics Inc.', 'Quenwick Robotics', 'Quenwick', 'Fernmarket', 'FMX', 'TTM'],
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
