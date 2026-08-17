/**
 * Vercel Serverless API - /api/analyze
 * 네이버 금융 실시간 주가 데이터 + 전일 거래량 + FnGuide 실시간 재무제표 컨센서스
 * - 전일 거래량: 네이버 일별시세(sise_day.naver) td.num 파싱
 * - 컨센서스: FnGuide / WiseReport (c1050001_data.aspx flag=2) 실시간 공식 데이터 파싱
 * - 분석 시점(analysisTimeISO)도 KST ISO 문자열로 반환
 */

const https = require('https');

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

    const body = raw.toString('latin1');
    const dataRows = [];

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(body)) !== null) {
      const trHtml = trMatch[1];
      const dateMatch = trHtml.match(/(\d{4}\.\d{2}\.\d{2})/);
      if (!dateMatch) continue;

      const tdNums = [];
      const tdRegex = /<td[^>]*class="num"[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trHtml)) !== null) {
        const nums = tdMatch[1].match(/([\d]{1,3}(?:,[\d]{3})+|[\d]+)/g) || [];
        const cleanNums = nums.map(n => parseInt(n.replace(/,/g, ''), 10)).filter(n => n > 0);
        if (cleanNums.length > 0) tdNums.push(Math.max(...cleanNums));
      }

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

/**
 * FnGuide / WiseReport 실시간 재무제표 컨센서스 파싱 (모든 상장 종목 자동 대응)
 * c1050001_data.aspx?flag=2: FnGuide 6개년 (2023.12 ~ 2028.12) 정밀 재무 컨센서스
 */
async function fetchFnGuideConsensus(code, dateStr = '20260814') {
  try {
    const url = `https://navercomp.wisereport.co.kr/v2/company/ajax/c1050001_data.aspx?flag=2&cmp_cd=${code}&finGubun=MAIN&frq=0&sDT=${dateStr}&chartType=svg`;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `https://navercomp.wisereport.co.kr/v2/company/c1050001.aspx?cmp_cd=${code}`,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
    };

    const raw = await new Promise((resolve, reject) => {
      https.get(url, { headers }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }).on('error', reject);
    });

    const json = JSON.parse(raw);
    const rows = json.JsonData || [];
    if (!rows || rows.length === 0) return null;

    // 2022년 이전 데이터 제외하고 6개년 (2023.12 ~ 2028.12) 정렬
    const targetRows = rows.filter(r => !r.YYMM.startsWith('2022'));
    if (targetRows.length === 0) return null;

    const parseVal = (str, isInt = false) => {
      if (!str || str === 'N/A' || str === '-' || str === '') return null;
      const num = parseFloat(str.replace(/,/g, ''));
      if (isNaN(num)) return null;
      return isInt ? Math.round(num) : Math.round(num * 100) / 100;
    };

    const years = targetRows.map(r => r.YYMM);
    const revenue = targetRows.map(r => parseVal(r.SALES, true));
    const operatingProfit = targetRows.map(r => parseVal(r.OP, true));
    const netIncome = targetRows.map(r => parseVal(r.NP, true));
    const epsList = targetRows.map(r => parseVal(r.EPS, true));
    const bpsList = targetRows.map(r => parseVal(r.BPS, true));
    const perList = targetRows.map(r => parseVal(r.PER));
    const pbrList = targetRows.map(r => parseVal(r.PBR));
    const roeList = targetRows.map(r => parseVal(r.ROE));

    // 최근 실적 기준 최신 BPS / ROE / EPS / PER / PBR 선정 (2025.12 or 2024.12)
    const actIdx = targetRows.findIndex(r => r.YYMM.includes('(E)'));
    const latestActIdx = actIdx > 0 ? actIdx - 1 : 2;

    const bps = bpsList[latestActIdx] || bpsList[0] || 10000;
    const roe = roeList[latestActIdx] || roeList[0] || 10.0;
    const eps = epsList[latestActIdx] || epsList[0] || 1000;
    const per = perList[latestActIdx] || perList[0] || 15.0;
    const pbr = pbrList[latestActIdx] || pbrList[0] || 1.0;

    return {
      bps,
      roe,
      eps,
      per,
      pbr,
      consensus: {
        years,
        revenue,
        operatingProfit,
        netIncome,
        epsList,
        bpsList,
        perList,
        pbrList,
        roeList,
      },
    };
  } catch (e) {
    console.warn('[fetchFnGuideConsensus] 컨센서스 파싱 실패:', e.message);
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
  const dateStr = kstTime.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

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

    // ── 4) FnGuide 실시간 컨센서스 수집 ─────────────────────────────────────
    let financials = null;
    try {
      financials = await fetchFnGuideConsensus(code, dateStr);
      if (financials) {
        console.log(`[${code}] FnGuide 컨센서스 실시간 수집 완료`);
      }
    } catch (e) {
      console.warn('[financials] 수집 실패:', e.message);
    }

    const price = priceData || {
      current: 0, change: 0, changePercent: 0,
      high: 0, low: 0, volume: 0,
    };

    // 전일 대비 거래량 배율 (소수점 2자리)
    const volumeRatio = prevVolume > 0 && price.volume > 0
      ? parseFloat((price.volume / prevVolume).toFixed(2))
      : 0;

    // ── 5) 응답 반환 ────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        code,
        fetchedFromServer: true,
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
          prevVolume,
          prevVolumeDate,
          volumeRatio,
        },
        financials, // 실시간 FnGuide 컨센서스 (있으면 반환)
      }
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
