(function (WF) {
  'use strict';
  WF.i18n.add('event-tickets', {
    zh: {
      'The Lantern Quartet — Autumn Tour': 'The Lantern Quartet 秋季巡演',
      Concerts: '音乐会',
      Theatre: '戏剧',
      Comedy: '喜剧',
      Venues: '场馆',
      'My tickets': '我的门票',
      'CHAMBER MUSIC': '室内乐',
      'ALL AGES': '全年龄',
      'Four strings, candlelit halls and a programme of Haydn, folk songs and new commissions.': '四把弦乐器、烛光音乐厅，曲目有海顿、民歌和新委约作品。',
      'Tour dates': '巡演日期',
      Date: '日期',
      'City & venue': '城市和场馆',
      'Select seats': '选座',
      'Seat counts are updated regularly. Maximum 6 tickets per order. All times are local.': '余票数量会定期更新。每笔订单最多 6 张票。所有时间均为当地时间。',
      'About the show': '关于演出',
      'The Lantern Quartet return with a programme built around lamplight and late evenings: two Haydn quartets, arrangements of coastal folk songs, and the premiere of a new piece written for the tour.':
        'The Lantern Quartet 再度归来，曲目围绕灯光和夜晚展开：两首海顿四重奏、改编的海滨民歌，以及为本次巡演创作的新作首演。',
      'Running time approximately 2 hours including a 20-minute interval.': '演出时长约 2 小时，含 20 分钟中场休息。',
      'Good to know': '观演须知',
      Age: '年龄',
      'All ages; under-16s with an adult': '全年龄；16 岁以下需成人陪同',
      Accessibility: '无障碍',
      'Step-free access at all venues': '所有场馆均有无台阶通道',
      Refunds: '退票',
      'Exchanges up to 48 h before the show': '演出前 48 小时可换票',
      'Tidewater Live and The Lantern Quartet are fictional. Tickets on this page cannot be bought.': 'Tidewater Live 和 The Lantern Quartet 都是虚构的。此页面上的门票无法购买。',
      'Sold out': '已售罄',
      'Join waitlist': '加入候补',
      'New date': '新增场次',
      'Returned tickets just released': '刚放出退票',
    },
    zhPatterns: [
      [/^Doors (\S+)$/, '入场 $1'],
      [/^Show (\S+)$/, '开演 $1'],
      [/^From (\S+)$/, '$1 起'],
      [/^(\d+) seats? left$/, '剩余 $1 个座位'],
    ],
    zhKeep: [
      'The Lantern Quartet', 'Tidewater Live', 'Tidewater Hall', 'Portsmere', 'Aldbury Cross', 'Linden Assembly Rooms', 'Wrenfield', 'Old Mill Theatre',
      'Halloway Bay', 'Pier Pavilion',
    ],
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
