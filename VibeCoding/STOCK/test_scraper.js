const { fetchInvestorTrend } = require('./electron/scraper/naverFinance.js');
fetchInvestorTrend('086520').then(res => {
  console.log(JSON.stringify(res, null, 2));
}).catch(console.error);
