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
  let clean = text.trim().replace('/', '.');
  years.push(clean);
});

const data = { years, revenue: [], operatingProfit: [], netIncome: [], roeList: [], epsList: [], perList: [], pbrList: [], bpsList: [] };

$('#highlight_D_Y table.us_table_ty1 tbody tr').each((i, el) => {
  const th = $(el).find('th').text().trim();
  const tds = $(el).find('td');
  const rowVals = [];
  tds.each((j, td) => {
    let text = $(td).text().trim().replace(/,/g, '');
    rowVals.push(text === '' || text === 'N/A' || text === '완전잠식' || text === '적자전환' || text === '흑자전환' ? null : parseFloat(text));
  });
  
  if (th.includes('매출액')) data.revenue = rowVals;
  else if (th.includes('영업이익')) data.operatingProfit = rowVals;
  else if (th === '당기순이익') data.netIncome = rowVals;
  else if (th === 'ROE') data.roeList = rowVals;
  else if (th === 'EPS') data.epsList = rowVals;
  else if (th === 'PER') data.perList = rowVals;
  else if (th === 'PBR') data.pbrList = rowVals;
  else if (th === 'BPS') data.bpsList = rowVals;
});

console.log(data);
