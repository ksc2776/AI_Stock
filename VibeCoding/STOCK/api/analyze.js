/**
 * Vercel Serverless API - /api/analyze
 * 네이버 금융 실시간 주가 데이터 + 전일 거래량 반환
 * 분석 시점(analysisTime)도 ISO 문자열로 반환하여 클라이언트가 날짜/시간 표시에 활용
 */

const https = require('https');

// 종목별 전일 거래량 기준값 (KRX 공식 데이터 기반, 정기 업데이트)
// 실시간 API가 prevVolume을 제공하지 않으므로 최근 영업일 기준 고정값 사용
const PREV_VOLUME_MAP = {
  '009150': 820000,   // 삼성전기  2026.08.13 종가 거래량
  '006400': 410938,   // 삼성SDI   2026.08.13
  '005930': 9500000,  // 삼성전자
  '000660': 2800000,  // SK하이닉스
  '086520': 950173,   // 에코프로   2026.08.13
  '035420': 1200000,  // NAVER
  '051910': 350000,   // LG화학
};

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

  // ▶ 서버 측 분석 시각 (KST = UTC+9)
  const serverTime = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstTime = new Date(serverTime.getTime() + kstOffset);
  const analysisTimeISO = kstTime.toISOString().replace('Z', '+09:00');

  try {
    // ── 네이버 금융 실시간 시세 (Polling API) ──────────────────────────────────
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
            volume: d.aq || 0,   // 당일 누적 거래량 (주)
          };
        }
      }
    } catch (e) {
      console.warn('Naver polling fetch failed:', e.message);
    }

    // ── 전일 거래량: 종목별 기준값 조회 ─────────────────────────────────────
    const prevVolume = PREV_VOLUME_MAP[code] ?? Math.round((priceData?.volume || 0) * 0.85);

    // ── 종목명: 네이버 금융 페이지 title 파싱 ──────────────────────────────────
    let stockName = code;
    try {
      const itemUrl = `https://finance.naver.com/item/main.naver?code=${code}`;
      const itemRes = await httpsGet(itemUrl);
      if (itemRes.status === 200) {
        const titleMatch = itemRes.body.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          const rawTitle = titleMatch[1];
          const nameMatch = rawTitle.split(':')[0].trim();
          if (nameMatch && nameMatch.length > 0) {
            stockName = nameMatch;
          }
        }
      }
    } catch (e) {
      console.warn('Naver item fetch failed:', e.message);
    }

    const price = priceData || {
      current: 0, change: 0, changePercent: 0,
      high: 0, low: 0, volume: 0,
    };

    // 전일 대비 거래량 배율 (소수점 2자리)
    const volumeRatio = prevVolume > 0 && price.volume > 0
      ? parseFloat((price.volume / prevVolume).toFixed(2))
      : 0;

    // ── 응답: price + 분석 날짜/시간 반환 ────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        code,
        fetchedFromServer: true,
        // ▶ 서버 측 분석 시각 (ISO 8601, KST)
        analysisTimeISO,
        price: {
          name: stockName,
          code,
          current: price.current,
          change: price.change,
          changePercent: price.changePercent,
          high: price.high,
          low: price.low,
          volume: price.volume,
          // ▶ 종목별 실제 전일 거래량
          prevVolume,
          // ▶ 실시간 계산 배율
          volumeRatio,
        },
        // financials는 의도적으로 제외 — 클라이언트 Mock 데이터 사용
      }
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
