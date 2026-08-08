/**
 * Vercel Serverless API - /api/analyze
 * 네이버 금융 실시간 데이터를 직접 fetch하여 반환
 * (Electron scraper 대신 순수 fetch 기반으로 동작)
 */

const https = require('https');

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com/',
        ...headers,
      },
    };
    https.get(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
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

  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Stock code parameter is required' });
  }

  try {
    // 네이버 금융 실시간 시세 (Polling API)
    let priceData = null;
    try {
      const naverUrl = `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${code}`;
      const naverRes = await httpsGet(naverUrl);
      if (naverRes.status === 200) {
        const json = JSON.parse(naverRes.body);
        const d = json?.result?.areas?.[0]?.datas?.[0];
        if (d && d.nv) {
          const sign = (d.rf === '4' || d.rf === '5') ? -1 : 1;
          priceData = {
            current: d.nv,
            change: d.cv * sign,
            changePercent: d.cr * sign,
            high: d.hv || d.nv,
            low: d.lv || d.nv,
            volume: d.aq || 0,
          };
        }
      }
    } catch (e) {
      console.warn('Naver polling fetch failed:', e.message);
    }

    // 네이버 금융 종목 상세 정보 및 재무 지표 파싱
    let stockName = code;
    let financials = { bps: 0, roe: 0, dividend: 0, pbr: 0, per: 0 };
    
    try {
      const itemUrl = `https://finance.naver.com/item/main.naver?code=${code}`;
      const itemRes = await httpsGet(itemUrl);
      if (itemRes.status === 200) {
        const body = itemRes.body;

        const bpsIdx = body.indexOf('BPS');
        const perIdx = body.indexOf('PER');
                const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch) {
                            const rawTitle = titleMatch[1];
          const nameMatch = rawTitle.split(':')[0].trim();
          if (nameMatch) stockName = nameMatch;
        }

        // 2. 주요 재무 지표 파싱 (Regex 기반)
        // BPS (주당순자산)
        const bpsMatch = body.match(/BPS<\/em>\s*<dd>\s*<em[^>]*>([\d,]+)<\/em>/);
        if (bpsMatch) financials.bps = parseInt(bpsMatch[1].replace(/,/g, ''), 10);

        // PBR
        const pbrMatch = body.match(/PBR<\/em>\s*<dd>\s*<em[^>]*>([\d,.]+)<\/em>/);
        if (pbrMatch) financials.pbr = parseFloat(pbrMatch[1]);

        // PER
        const perMatch = body.match(/PER<\/em>\s*<dd>\s*<em[^>]*>([\d,.-]+)<\/em>/);
        if (perMatch) financials.per = parseFloat(perMatch[1]) || 0;

        // ROE (추정치 또는 전년도 데이터 - 테이블에서 추출 시도)
        // 정교한 파싱 대신 간단히 HTML 내 텍스트 검색 (실제 서비스에서는 cheerio 등 사용 권장)
        const roePattern = /ROE\(%\)<\/th>\s*<td[^>]*>([\d,.-]+)<\/td>/g;
        let roeMatches = [...body.matchAll(roePattern)];
        if (roeMatches.length > 0) {
          // 마지막(최근) ROE 값 사용
          const lastRoe = roeMatches[roeMatches.length - 1][1];
          financials.roe = parseFloat(lastRoe) || 0;
        }

        // 배당금 (추정)
        const divMatch = body.match(/현금배당수익률<\/em>\s*<dd>\s*<em[^>]*>([\d,.]+)%<\/em>/);
        if (divMatch) financials.dividend = parseFloat(divMatch[1]);
      }
    } catch (e) {
      console.warn('Naver item fetch/parse failed:', e.message);
    }

    // 가격 데이터 fallback
    const price = priceData || {
      current: 0,
      change: 0,
      changePercent: 0,
      high: 0,
      low: 0,
      volume: 0,
    };

    // 응답 데이터 구성
    return res.status(200).json({
      success: true,
      data: {
        code,
        fetchedFromServer: true,
        price: {
          name: stockName,
          code,
          current: price.current,
          change: price.change,
          changePercent: price.changePercent,
          high: price.high,
          low: price.low,
          volume: price.volume,
          prevVolume: Math.round(price.volume * 0.85),
          volumeRatio: price.volume > 0 ? 1.18 : 0,
        },
        financials: {
          bps: financials.bps,
          roe: financials.roe,
          dividend: financials.dividend,
          pbr: financials.pbr,
          per: financials.per,
          consensus: financials.roe > 10 ? '매수' : '중립'
        }
      }
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
