const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');

async function downloadStocks() {
  try {
    console.log('Fetching KRX corp list...');
    const url = 'https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13';
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const html = iconv.decode(response.data, 'euc-kr');
    const $ = cheerio.load(html);
    
    const stocks = [];
    
    $('table.bbs_tb tr').each((i, el) => {
      if (i === 0) return; // 헤더 스킵
      const tds = $(el).find('td');
      if (tds.length >= 2) {
        const name = $(tds[0]).text().trim();
        const code = $(tds[2]).text().trim().padStart(6, '0');
        if (name && code) {
          stocks.push({ name, code });
        }
      }
    });

    console.log(`Successfully parsed ${stocks.length} stocks.`);
    
    const targetDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFile = path.join(targetDir, 'koreaStocks.json');
    fs.writeFileSync(targetFile, JSON.stringify(stocks, null, 2), 'utf-8');
    
    console.log(`Saved to ${targetFile}`);
  } catch (error) {
    console.error('Error downloading stocks:', error);
  }
}

downloadStocks();
