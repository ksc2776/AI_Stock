/**
 * Vercel Serverless API - /api/us-stocks
 * Yahoo Finance 실시간 미국 주식 시세 조회 (v8 chart API 활용)
 * - 한국시간(KST) 기준 검색 일자 반영
 * - 복수 ticker 동시 조회 (symbols=NVDA,AMD,AVGO,...)
 * - 검증된 방법: v8 chart API (개별 ticker 병렬 요청)
 */

const https = require('https');

/**
 * Yahoo Finance v8 chart API - 단일 종목 시세 조회
 * @param {string} symbol 티커 심볼
 * @returns {Promise<object|null>}
 */
function fetchYahooChart(symbol) {
  return new Promise((resolve) => {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=5d';
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/',
      },
      timeout: 8000,
    };

    const req = https.get(url, opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const meta = json && json.chart && json.chart.result && json.chart.result[0] && json.chart.result[0].meta;
          if (!meta) {
            resolve(null);
            return;
          }

          const prev = meta.previousClose || meta.chartPreviousClose;
          const price = meta.regularMarketPrice;
          const change = prev ? (price - prev) : 0;
          const changePercent = prev ? (change / prev * 100) : 0;

          resolve({
            ticker: symbol,
            name: meta.shortName || meta.longName || symbol,
            price: price || null,
            change: prev ? change : null,
            changePercent: prev ? changePercent : null,
            prevClose: prev || null,
            volume: meta.regularMarketVolume || null,
            currency: meta.currency || 'USD',
            error: null,
          });
        } catch (e) {
          console.warn('[us-stocks] chart parse error for', symbol, e.message);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.warn('[us-stocks] chart request error for', symbol, e.message);
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn('[us-stocks] chart request timeout for', symbol);
      resolve(null);
    });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbols } = req.query;
  if (!symbols) {
    return res.status(400).json({ success: false, error: 'symbols parameter is required (e.g. ?symbols=NVDA,AMD,AVGO)' });
  }

  // 한국시간(KST) 기준 현재 시각 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstTime = new Date(now.getTime() + kstOffset);
  const kstISO = kstTime.toISOString().replace('Z', '+09:00');
  const kstDateStr = kstTime.toISOString().slice(0, 10); // YYYY-MM-DD (KST 기준)

  const tickerList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 10);

  try {
    // 모든 티커 병렬 요청
    const fetchResults = await Promise.all(
      tickerList.map(sym => fetchYahooChart(sym))
    );

    // 결과 정규화 (null이면 에러 처리)
    const stockData = tickerList.map((ticker, i) => {
      const result = fetchResults[i];
      if (!result) {
        return {
          ticker,
          name: ticker,
          price: null,
          change: null,
          changePercent: null,
          prevClose: null,
          volume: null,
          currency: 'USD',
          error: 'not_found',
        };
      }
      return result;
    });

    // 테마 평균 등락률 계산 (유효 데이터만)
    const validChanges = stockData.filter(s => s.changePercent !== null).map(s => s.changePercent);
    const avgChangePercent = validChanges.length > 0
      ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        fetchedAt: kstISO,
        fetchedDate: kstDateStr,       // KST 기준 검색 일자 (YYYY-MM-DD)
        avgChangePercent: Math.round(avgChangePercent * 100) / 100,
        stocks: stockData,
      }
    });
  } catch (error) {
    console.error('[us-stocks] API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
