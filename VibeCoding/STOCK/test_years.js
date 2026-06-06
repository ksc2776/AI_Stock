const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://finance.naver.com/item/main.naver?code=010120';
  const response = await axios.get(url);
  const ch = cheerio.load(response.data);

  const allYears = [];
  ch('div.section.cop_analysis table thead tr th').each((i, th) => {
    const text = ch(th).text().trim();
    if (/^20\d{2}\.\d{2}/.test(text)) {
      allYears.push(text);
    }
  });

  console.log(allYears);
})();
