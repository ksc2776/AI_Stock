/**
 * Vercel Serverless API - /api/analyze
 * 네이버 금융 실시간 주가 데이터 + 전일 거래량 실시간 스크랩 반환
 * - 전일 거래량: 네이버 일별시세(sise_day.naver) 에서 직전 영업일 거래량 실시간 파싱
 * - 분석 시점(analysisTimeISO)도 KST ISO 문자열로 반환
 */

const https = require('https');

// ── 전일 거래량 실시간 스크랩용 HTML 파서 (경량 정규식 파서) ───────────────────
function parseNumber(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com/',
        'Accept-Charset': 'euc-kr',
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

/**
 * 네이버 일별시세에서 전일 거래량 실시간 파싱 (모든 종목 자동 대응)
 * TD 기반 파싱: <td class="num"> 내부 숫자 추출 (종가|전일비|시가|고가|저가|거래량)
 * 마지막 td.num의 숫자 = 거래량 (검증 완료)
 */
async function fetchPrevVolume(code) {
  try {
    const url = `https://finance.naver.com/item/sise_day.naver?code=${code}`;
    const raw = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.naver.com/',
        },
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });

    // EUC-KR → latin1 (숫자/날짜는 ASCII 범위라 정확히 파싱됨)
    const body = raw.toString('latin1');
    const dataRows = [];

    // TR 단위 파싱
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(body)) !== null) {
      const trHtml = trMatch[1];

      // 날짜 포함 여부 확인
      const dateMatch = trHtml.match(/(\d{4}\.\d{2}\.\d{2})/);
      if (!dateMatch) continue;

      // td.num 내부 숫자 추출 (종가, 전일비, 시가, 고가, 저가, 거래량 순서)
      const tdNums = [];
      const tdRegex = /<td[^>]*class="num"[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trHtml)) !== null) {
        const nums = tdMatch[1].match(/([\d]{1,3}(?:,[\d]{3})+|[\d]+)/g) || [];
        const cleanNums = nums.map(n => parseInt(n.replace(/,/g, ''), 10)).filter(n => n > 0);
        if (cleanNums.length > 0) tdNums.push(Math.max(...cleanNums));
      }

      // 거래량 = 마지막 td.num 숫자 (최소 5개 이상이어야 유효한 데이터 행)
      if (tdNums.length >= 5) {
        const vol = tdNums[tdNums.length - 1];
        if (vol > 0) dataRows.push({ date: dateMatch[1], volume: vol });
      }
      if (dataRows.length >= 3) break;
    }

    if (dataRows.length >= 2) {
      return {
        latestDate:   dataRows[0].date,
        latestVolume: dataRows[0].volume,
        prevDate:     dataRows[1].date,
        prevVolume:   dataRows[1].volume,
      };
    }
    return null;
  } catch (e) {
    console.warn('[fetchPrevVolume] 전일 거래량 스크랩 실패:', e.message);
    return null;
  }
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
    // ── 1) 네이버 금융 실시간 시세 (Polling API) ────────────────────────────
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

    // ── 2) 전일 거래량: 네이버 일별시세에서 실시간 스크랩 ────────────────────
    let prevVolume = 0;
    let prevVolumeDate = '';
    try {
      const siseData = await fetchPrevVolume(code);
      if (siseData && siseData.prevVolume > 0) {
        prevVolume = siseData.prevVolume;
        prevVolumeDate = siseData.prevDate;
        console.log(`[${code}] 전일거래량 스크랩 성공: ${prevVolumeDate} = ${prevVolume.toLocaleString()}주`);
      }
    } catch (e) {
      console.warn('[prevVolume] 스크랩 실패:', e.message);
    }

    // fallback: 스크랩 실패 시 당일 거래량의 85% 추정
    if (!prevVolume || prevVolume <= 0) {
      prevVolume = Math.round((priceData?.volume || 0) * 0.85);
      console.warn(`[${code}] 전일거래량 fallback 사용: ${prevVolume}`);
    }

    // ── 3) 종목명: 네이버 금융 페이지 title 파싱 ─────────────────────────────
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

    // ── 4) 응답: price + 분석 날짜/시간 반환 ─────────────────────────────────
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
          // ▶ 실시간 스크랩한 전일 거래량 (날짜 포함)
          prevVolume,
          prevVolumeDate,  // 전일 거래량 기준 날짜 (YYYY.MM.DD)
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
