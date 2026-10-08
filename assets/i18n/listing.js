(function (WF) {
  'use strict';
  WF.i18n.add('listing', {
    zh: {
      'New & Notable in Science Fiction': '科幻新书与热门推荐',
      'New & Notable': '新书与热门',
      "Staff-picked new releases and this season's most talked-about science fiction.": '店员精选的新书，以及本季最受关注的科幻作品。',
      Filter: '筛选',
      Filters: '筛选',
      'E-book': '电子书',
      'Under $15': '$15 以下',
      'Over $25': '$25 以上',
      'In stock only': '仅看有货',
      'Sort by': '排序',
      Bestselling: '畅销',
      Newest: '最新',
      'Price: low to high': '价格从低到高',
      by: '作者',
      'Price drop': '降价',
      'Temporarily out of stock': '暂时缺货',
    },
    zhPatterns: [[/^Showing (\d+) titles?$/, '共 $1 本']],
    // Book titles and authors are names.
    zhKeep: [
      'The Long Quiet of Europa', 'Tamsin Vey', 'The Glass Orchard Companion', 'The Glass Orchard', 'Maren Ostrova', 'Salt and Starlight', 'Idris Kallan',
      "The Cartographer's Moon", 'Priya Halden', 'Ninefold Harbor', 'Oren Blackwood', 'A Map of Falling Cities', 'Jun Aradi', 'Clockwork Tides',
      'Lina Marchetti', 'Signal Lost at Tarn', 'Ezra Moll', 'Delia Frane',
    ],
  });
})(typeof WatchFixtures !== 'undefined' ? WatchFixtures : globalThis.WatchFixtures);
