(function (WF) {
  'use strict';
  WF.i18n.add('shrinkflation', {
    zh: {
      'Cereal bars': '谷物棒',
      'Oat & Honey Granola Bars': '燕麦蜂蜜谷物棒',
      'Meadowgrain (fictional brand)': 'Meadowgrain（虚构品牌）',
      'Whole-grain oats with wildflower honey': '全谷物燕麦加野花蜂蜜',
      'Available for delivery and pickup.': '可配送，也可自提。',
      'Made with whole-grain oats': '使用全谷物燕麦',
      'No artificial colours or flavours': '不含人工色素和香精',
      'Individually wrapped': '独立包装',
      'Chewy oat bars sweetened with wildflower honey. Perfect for lunchboxes and hikes.': '有嚼劲的燕麦棒，用野花蜂蜜调味。适合放进午餐盒或带去徒步。',
      'Pack contents': '包装内含',
      'Net weight': '净含量',
      Allergens: '过敏原',
      'Contains oats (gluten). May contain nuts.': '含燕麦（麸质）。可能含有坚果。',
      'Kids love them': '孩子们很爱吃',
      'A lunchbox staple.': '午餐盒常备。',
      'Honey Almond Granola, 500 g': '蜂蜜杏仁格兰诺拉麦片，500 g',
      'Dark Chocolate Oat Bars': '黑巧克力燕麦棒',
    },
    zhPatterns: [
      [/^(\S+) \/ bar$/, '$1 / 根'],
      [/^(\d+) × (\d+) g bars$/, '$1 × $2 g'],
      [/^(.+), (\d+) pack$/, function (m, tr) { return tr(m[1]) + '，' + m[2] + ' 根装'; }],
    ],
    zhKeep: ['Meadowgrain', 'PLG-MG-OH12'],
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
