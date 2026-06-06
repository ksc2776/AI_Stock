const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('fnguide.html', 'utf-8');
const $ = cheerio.load(html);

$('#highlight_D_Y table.us_table_ty1 tbody tr').each((i, el) => {
  const thText = $(el).find('th').clone().children().remove().end().text().trim();
  let fullThText = $(el).find('th').text().trim().replace(/\s+/g, ' ');
  console.log(thText + " | " + fullThText);
});
