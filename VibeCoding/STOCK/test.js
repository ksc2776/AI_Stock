const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

(async () => {
  const url = 'https://finance.naver.com/item/main.naver?code=005930';
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const html = iconv.decode(response.data, 'euc-kr');
  const $ = cheerio.load(html);

  console.log('--- HEADERS ---');
  $('div.section.cop_analysis table thead tr th').each((i, th) => {
    console.log($(th).text().trim().replace(/[\r\n\t]+/g, ' '));
  });

  console.log('\n--- ROWS ---');
  $('div.section.cop_analysis table tbody tr').each((i, el) => {
    const th = $(el).find('th').text().trim().replace(/[\r\n\t]+/g, ' ');
    const tds = [];
    $(el).find('td').each((j, td) => {
        tds.push($(td).text().trim().replace(/[\r\n\t]+/g, ' '));
    });
    console.log(th + ': ' + tds.slice(0, 4).join(', '));
  });
})();
