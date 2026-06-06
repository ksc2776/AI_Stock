const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('fnguide.html', 'utf-8');
const $ = cheerio.load(html);

console.log($('#highlight_D_Y table.us_table_ty1 thead tr').eq(1).html());
