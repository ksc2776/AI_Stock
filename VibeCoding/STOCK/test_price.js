const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://finance.naver.com/item/main.naver?code=010120';
  const response = await axios.get(url);
  const ch = cheerio.load(response.data);

  const getNum = (selector) => {
    const text = ch(selector).text().trim().replace(/[^\d.-]/g, '');
    return parseFloat(text) || 0;
  };

  const volume = getNum('table.no_info tr:eq(0) td:eq(2) em span.blind');
  const high = getNum('table.no_info tr:eq(0) td:eq(1) em:not(.no_cha) span.blind');
  const low = getNum('table.no_info tr:eq(1) td:eq(1) em:not(.no_cha) span.blind');

  console.log({ volume, high, low });
})();
