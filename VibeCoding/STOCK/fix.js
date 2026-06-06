const fs = require('fs');
let c = fs.readFileSync('electron/scraper/naverFinance.js', 'utf8');
c = c.replace(/includes\('main.naver'\) \S* 'utf-8'/g, "includes('main.naver') ? 'utf-8'");
fs.writeFileSync('electron/scraper/naverFinance.js', c);
console.log('Fixed syntax error in naverFinance.js');
