const { scrapeStockData } = require('../electron/scraper/naverFinance');
const { calculateSRIM, generateActionPlan } = require('../electron/calculator/srim');

module.exports = async (req, res) => {
  // CORS 처리 (Vercel 환경 및 클라이언트 브라우저 직접 호출 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ success: false, error: 'Stock code parameter is required' });
  }

  try {
    const stockData = await scrapeStockData(code);
    
    const srimResult = calculateSRIM({
      bps: stockData.financials.bps,
      roe: stockData.financials.roe,
      currentPrice: stockData.price.current,
      requiredReturn: 0.08,
      isGlobalTop: false,
      consensus: stockData.financials.consensus,
    });
    srimResult.srimYear = stockData.financials.srimYear;
    
    const actionPlan = generateActionPlan({
      price: stockData.price,
      investors: stockData.investors,
      srim: srimResult,
    });
    
    return res.status(200).json({
      success: true,
      data: {
        ...stockData,
        srim: srimResult,
        actionPlan,
      }
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
