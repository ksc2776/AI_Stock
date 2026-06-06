const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('fnguide.html', 'utf-8');
const $ = cheerio.load(html);

const years = [];
$('#highlight_D_Y table.us_table_ty1 thead tr').eq(1).find('th').each((i, el) => {
  let text = $(el).find('span.txt_acd').text();
  if (!text) {
    text = $(el).find('div').clone().children().remove().end().text();
  }
  let clean = text.trim();
  // Sometimes it's like 2021/12. We want to convert to 2021.12
  clean = clean.replace('/', '.');
  years.push(clean);
});
console.log('Years:', years);
