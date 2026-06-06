const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://finance.naver.com/',
};

/**
 * 숫자 문자열에서 콤마/부호 제거 후 숫자형으로 변환
 */
function parseNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * 현재가 및 가격 정보 수집
 */
async function fetchPrice(code) {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    // 종목명
    const name = $('div.wrap_company h2 a').text().trim() || $('title').text().split(':')[0].trim();

    // 현재가
    const currentPriceText = $('p.no_today span.blind').first().text().trim();
    const currentPrice = parseNumber(currentPriceText);

    // 전일 대비
    const changeText = $('p.no_exday em span.blind').first().text().trim();
    const change = parseNumber(changeText);
    
    // 하락 방향 확인
    const isDown = $('p.no_exday em.no_down').length > 0 || $('p.no_exday .ico.down').length > 0;
    const actualChange = isDown ? -change : change;
    const changePercent = currentPrice > 0 ? ((actualChange / (currentPrice - actualChange)) * 100) : 0;

    // 거래량
    const volumeText = $('table.no_info tr:eq(0) td:eq(2) em span.blind').first().text().trim();
    const volume = parseNumber(volumeText);

    // 고가, 저가 (상/하한가 span 제외)
    const highText = $('table.no_info tr:eq(0) td:eq(1) em:not(.no_cha) span.blind').first().text().trim();
    const lowText = $('table.no_info tr:eq(1) td:eq(1) em:not(.no_cha) span.blind').first().text().trim();
    
    const high = parseNumber(highText);
    const low = parseNumber(lowText);

    // 전일 거래량 수집 (sise_day.naver)
    let prevVolume = volume;
    try {
      const siseUrl = `https://finance.naver.com/item/sise_day.naver?code=${code}`;
      const siseRes = await axios.get(siseUrl, { headers: HEADERS, timeout: 5000, responseType: 'arraybuffer' });
      const siseHtml = iconv.decode(siseRes.data, 'euc-kr');
      const $sise = cheerio.load(siseHtml);
      
      const prevVolumeText = $sise('table.type2 tbody tr:nth-child(4) td:nth-child(7) span').text().trim();
      if (prevVolumeText) {
        prevVolume = parseNumber(prevVolumeText);
      }
    } catch (err) {
      console.error('전일 거래량 수집 실패:', err.message);
    }

    const volumeRatio = prevVolume > 0 ? volume / prevVolume : 1;

    return {
      name,
      current: currentPrice,
      change: actualChange,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      prevVolume,
      volumeRatio: Math.round(volumeRatio * 100) / 100,
      high,
      low
    };
  } catch (error) {
    console.error('가격 정보 수집 실패:', error.message);
    throw error;
  }
}

/**
 * 투자자별 매매 동향 수집
 */
async function fetchInvestorTrend(code) {
  try {
    const url = `https://finance.naver.com/item/frgn.naver?code=${code}`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
      responseType: 'arraybuffer',
    });
    const html = iconv.decode(response.data, 'euc-kr');
    const $ = cheerio.load(html);

    const trends = [];
    $('table.type2 tbody tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length >= 6) {
        const date = $(tds[0]).find('span.tah').text().trim();
        if (date && date.includes('.')) {
          trends.push({
            date,
            foreignNet: parseNumber($(tds[6]).text().trim()),     // 6: 외국인 순매매량
            institutionNet: parseNumber($(tds[5]).text().trim()), // 5: 기관 순매매량
            close: parseNumber($(tds[1]).text().trim()),          // 1: 종가
            volume: parseNumber($(tds[4]).text().trim()),         // 4: 거래량
          });
        }
      }
    });

    const recentTrends = trends.slice(0, 5);
    
    // 최근 동향 요약
    const foreignTotal = recentTrends.reduce((sum, t) => sum + t.foreignNet, 0);
    const institutionTotal = recentTrends.reduce((sum, t) => sum + t.institutionNet, 0);

    return {
      daily: recentTrends,
      summary: {
        foreignTotal,
        institutionTotal,
        foreignTrend: foreignTotal > 0 ? '순매수' : '순매도',
        institutionTrend: institutionTotal > 0 ? '순매수' : '순매도',
        isTwinBuying: foreignTotal > 0 && institutionTotal > 0,
      },
    };
  } catch (error) {
    console.error('투자자 동향 수집 실패:', error.message);
    return {
      daily: [],
      summary: {
        foreignTotal: 0,
        institutionTotal: 0,
        foreignTrend: '데이터 없음',
        institutionTrend: '데이터 없음',
        isTwinBuying: false,
      },
    };
  }
}

/**
 * 국내 종목 최신 뉴스 수집
 */
async function fetchStockNews(code) {
  try {
    const url = `https://finance.naver.com/item/news_news.naver?code=${code}`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
      responseType: 'arraybuffer',
    });
    const html = iconv.decode(response.data, 'euc-kr');
    const $ = cheerio.load(html);

    const newsList = [];
    $('table.type5 tbody tr').each((i, el) => {
      // tr 아래에 클래스가 있는 경우는 연관 뉴스이므로 제외 (relation_lst)
      if ($(el).attr('class')) return; 

      const titleEl = $(el).find('td.title a');
      const infoEl = $(el).find('td.info');
      const dateEl = $(el).find('td.date');

      if (titleEl.length > 0) {
        const href = titleEl.attr('href');
        const link = href ? (href.startsWith('http') ? href : `https://finance.naver.com${href}`) : null;
        newsList.push({
          title: titleEl.text().trim(),
          source: infoEl.text().trim(),
          date: dateEl.text().trim(),
          link,
        });
      }
    });

    return newsList.slice(0, 10);
  } catch (error) {
    console.error('국내 종목 뉴스 수집 실패:', error.message);
    return [];
  }
}

/**
 * 최근 애널리스트 리포트 스크래핑
 */
async function fetchAnalystReport(code) {
  try {
    const url = `https://finance.naver.com/research/company_list.naver?keyword=&brokerCode=&searchType=itemCode&searchItemCode=${code}`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
      responseType: 'arraybuffer',
    });
    const html = iconv.decode(response.data, 'euc-kr');
    const $ = cheerio.load(html);

    // 첫번째 리포트 추출
    const firstRow = $('table.type_1 tbody tr').not('.first').not('.last').first();
    
    if (firstRow.length > 0) {
      const tds = firstRow.find('td');
      if (tds.length >= 6) {
        const title = $(tds[1]).find('a').text().trim();
        const broker = $(tds[2]).text().trim();
        const targetPriceText = $(tds[3]).text().trim();
        const targetPrice = parseNumber(targetPriceText);
        const date = $(tds[5]).text().trim();

        return {
          title,
          broker,
          targetPrice,
          date
        };
      }
    }
    return null;
  } catch (error) {
    console.error('애널리스트 리포트 수집 실패:', error.message);
    return null;
  }
}

/**
 * 재무 데이터 및 컨센서스 수집
 */
async function fetchFinancials(code) {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 10000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    // per_table에서 먼저 추출
    let perTableBps = 0, perTableRoe = 0, perTableEps = 0, perTablePer = 0;
    $('table.per_table tbody tr').each((i, el) => {
      const ths = $(el).find('th');
      const tds = $(el).find('td');
      ths.each((j, th) => {
        const text = $(th).text().trim();
        const emText = $(tds[j]).find('em').text().trim();
        if (text.includes('PER')) perTablePer = parseNumber(emText);
        if (text.includes('EPS')) perTableEps = parseNumber(emText);
        if (text.includes('BPS')) perTableBps = parseNumber(emText);
      });
    });

    // Fnguide에서 컨센서스(8년치) 추출
    const consensus = { years: [], revenue: [], operatingProfit: [], netIncome: [], perList: [], pbrList: [], epsList: [], roeList: [], bpsList: [] };
    try {
      const fnUrl = `https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?pGB=1&gbb=10&cID=&MenuYn=Y&ReportGB=&NewMenuID=101&stkGb=701&gdBcd=&bms=&dtyn=0&ls_md=0000&lsq_md=0000&gicode=A${code}`;
      const fnRes = await axios.get(fnUrl, { headers: HEADERS, timeout: 10000 });
      const $fn = cheerio.load(fnRes.data);

      const years = [];
      $fn('#highlight_D_Y table.us_table_ty1 thead tr').eq(1).find('th').each((i, el) => {
        let text = $fn(el).find('span.txt_acd').text();
        if (!text) {
          text = $fn(el).find('div').clone().children().remove().end().text();
        }
        let clean = text.trim().replace('/', '.');
        years.push(clean);
      });
      consensus.years = years;

      $fn('#highlight_D_Y table.us_table_ty1 tbody tr').each((i, el) => {
        const thText = $fn(el).find('th').text().trim().replace(/\s+/g, ' ');
        const tds = $fn(el).find('td');
        const rowVals = [];
        tds.each((j, td) => {
          let text = $fn(td).text().trim().replace(/,/g, '');
          rowVals.push(text === '' || text === 'N/A' || text === '완전잠식' || text === '적자전환' || text === '흑자전환' || text === '조기수각' ? null : parseFloat(text));
        });

        if (thText === '매출액') consensus.revenue = rowVals;
        else if (thText === '영업이익') consensus.operatingProfit = rowVals;
        else if (thText === '당기순이익') consensus.netIncome = rowVals;
        else if (thText.startsWith('ROE')) consensus.roeList = rowVals;
        else if (thText.startsWith('EPS')) consensus.epsList = rowVals;
        else if (thText.startsWith('PER')) consensus.perList = rowVals;
        else if (thText.startsWith('PBR')) consensus.pbrList = rowVals;
        else if (thText.startsWith('BPS')) consensus.bpsList = rowVals;
      });
    } catch (err) {
      console.error('Fnguide 수집 실패, Naver Finance로 폴백:', err.message);
      try {
        const headerRow = $('div.section.cop_analysis table thead tr th');
        const fallbackYears = [];
        headerRow.each((i, th) => {
          const text = $(th).text().trim();
          if (/^20\d{2}\.\d{2}/.test(text)) {
            fallbackYears.push(text);
          }
        });
        const annualYearsFallback = fallbackYears.slice(0, 4);
        
        let finalYears = [...annualYearsFallback];
        const lastYearStr = finalYears[finalYears.length - 1] || '2025.12';
        const match = lastYearStr.match(/^(\d{4})/);
        let lastYear = match ? parseInt(match[1]) : new Date().getFullYear();
        
        if (!finalYears.some(y => y.includes('(E)'))) {
          finalYears.push(`${lastYear + 1}.12(E)`);
          finalYears.push(`${lastYear + 2}.12(E)`);
          finalYears.push(`${lastYear + 3}.12(E)`);
        } else {
          finalYears.push(`${lastYear + 1}.12(E)`);
          finalYears.push(`${lastYear + 2}.12(E)`);
        }
        consensus.years = finalYears;

        $('div.section.cop_analysis table tbody tr').each((i, el) => {
          const th = $(el).find('th').text().trim();
          const tds = $(el).find('td');
          const allVals = [];
          tds.each((j, td) => {
            const text = $(td).text().trim();
            allVals.push(text === '' || text === '-' ? null : parseNumber(text));
          });
          const estimateVals = allVals.slice(0, 4);
          while (estimateVals.length < finalYears.length) { estimateVals.push(null); }

          if (th.includes('매출')) consensus.revenue = estimateVals;
          if (th.includes('영업이익') && !th.includes('률')) consensus.operatingProfit = estimateVals;
          if (th.includes('당기순이익') || (th.includes('순이익') && !th.includes('률'))) consensus.netIncome = estimateVals;
          if (th === 'PER' || th.includes('PER(배)')) consensus.perList = estimateVals;
          if (th === 'PBR' || th.includes('PBR(배)')) consensus.pbrList = estimateVals;
          if (th.includes('EPS')) consensus.epsList = estimateVals;
          if (th.includes('ROE')) consensus.roeList = estimateVals;
          if (th.includes('BPS')) consensus.bpsList = estimateVals;
        });
      } catch (fallbackErr) {
        console.error('Naver Finance 폴백 수집 실패:', fallbackErr.message);
      }
    }

    // S-RIM용 ROE, BPS 결정 로직 (검색 당시 년도 기준)
    let srimIndex = -1;
    const currentYearStr = new Date().getFullYear().toString();
    
    if (consensus.years.length > 0) {
      for (let i = 0; i < consensus.years.length; i++) {
        if (consensus.years[i].startsWith(currentYearStr)) {
          srimIndex = i;
          break;
        }
      }
      if (srimIndex === -1) srimIndex = consensus.years.length - 1; // 현재 년도가 없으면 가장 마지막(최신) 데이터 사용
    }
    
    const srimYear = srimIndex >= 0 ? consensus.years[srimIndex] : '최근';
    const roe = srimIndex >= 0 ? (consensus.roeList[srimIndex] || 0) : 0;
    const bps = srimIndex >= 0 ? (consensus.bpsList[srimIndex] || perTableBps) : perTableBps;
    const eps = srimIndex >= 0 ? (consensus.epsList[srimIndex] || perTableEps) : perTableEps;
    const per = srimIndex >= 0 ? (consensus.perList[srimIndex] || perTablePer) : perTablePer;
    const pbr = srimIndex >= 0 ? (consensus.pbrList[srimIndex] || 0) : 0;

    // 동일업종 PER
    const peerPerText = $('table.no_info tr:last-child td em').text().trim();
    const peerPer = parseNumber(peerPerText);

    return {
      bps,
      per,
      pbr,
      eps,
      roe,
      peerPer,
      srimYear,
      consensus,
    };
  } catch (error) {
    console.error('재무 데이터 수집 실패:', error.message);
    return {
      bps: 0, per: 0, pbr: 0, eps: 0, roe: 0, peerPer: 0,
      consensus: { years: [], revenue: [], operatingProfit: [], netIncome: [], perList: [], pbrList: [], epsList: [], roeList: [] },
    };
  }
}

/**
 * 종합 데이터 스크래핑
 */
async function scrapeStockData(code) {
  const [price, investors, financials, news, analystReport] = await Promise.all([
    fetchPrice(code),
    fetchInvestorTrend(code),
    fetchFinancials(code),
    fetchStockNews(code),
    fetchAnalystReport(code),
  ]);

  return {
    code,
    price,
    investors,
    financials,
    news,
    analystReport,
  };
}

module.exports = { scrapeStockData, fetchPrice, fetchInvestorTrend, fetchFinancials, fetchStockNews, fetchAnalystReport };
