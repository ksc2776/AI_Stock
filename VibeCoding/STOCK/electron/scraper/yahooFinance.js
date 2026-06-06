const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// GICS 기반 혁신 10대 테마 및 대표 3종목
const GICS_THEMES = [
  { id: 1, name: '반도체 및 설계', desc: 'AI 연산, 칩셋 설계 및 GPU 등 테크 공급망 최첨단 하드웨어', tickers: ['NVDA', 'AVGO', 'AMD'] },
  { id: 2, name: '시스템 및 클라우드 소프트웨어', desc: '운영체제, 가상화 인프라, 전사적 자원 관리(ERP)', tickers: ['MSFT', 'ORCL', 'PLTR'] },
  { id: 3, name: '인터넷 플랫폼 및 서비스', desc: '데이터 트래픽, 검색 엔진, 디지털 광고 알고리즘', tickers: ['GOOGL', 'META', 'MTCH'] },
  { id: 4, name: '모빌리티 및 자율주행 기술', desc: 'AI 기반 FSD 및 전기차 하이테크 리더', tickers: ['TSLA', 'APTV', 'BWA'] },
  { id: 5, name: '온라인 리테일 및 테크 인프라', desc: '초대형 이커머스 및 클라우드 데이터 센터 인프라', tickers: ['AMZN', 'EBAY', 'ETSY'] },
  { id: 6, name: '기술 하드웨어 및 스토리지', desc: '스마트 디바이스, AI 서버 및 네트워크 물리 장비', tickers: ['AAPL', 'CSCO', 'ANET'] },
  { id: 7, name: '엔터테인먼트 및 테크 스트리밍', desc: '디지털 미디어 전송 기술 및 스트리밍 알고리즘', tickers: ['NFLX', 'EA', 'TTWO'] },
  { id: 8, name: '금융 기술 및 디지털 결제', desc: '블록체인, 핀테크, 글로벌 전자결제 보안 데이터 처리', tickers: ['V', 'MA', 'PYPL'] },
  { id: 9, name: '생명공학 및 헬스케어 테크', desc: '유전자 편집, mRNA 기술, 정밀 의료기기 솔루션', tickers: ['LLY', 'VRTX', 'TMO'] },
  { id: 10, name: '반도체 공정 장비 및 부품', desc: '반도체 초미세 공정 수율 관리, 노광 및 식각 장비', tickers: ['AMAT', 'LRCX', 'KLAC'] },
];

/**
 * 테마 목록 반환
 */
function getThemes() {
  return GICS_THEMES;
}

/**
 * 영문 텍스트 한글 번역 (Google Translate API)
 */
async function translateToKorean(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url, { timeout: 3000 });
    return res.data[0].map(s => s[0]).join('');
  } catch (error) {
    console.error('번역 실패:', error.message);
    return text; // 실패 시 원문 반환
  }
}

/**
 * Yahoo Finance API에서 주가 데이터 가져오기
 */
async function fetchTickerPrice(ticker) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d`;
    const res = await axios.get(url, { headers: HEADERS, timeout: 5000 });
    const result = res.data.chart.result[0];
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      ticker,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
    };
  } catch (error) {
    console.error(`[${ticker}] 주가 수집 실패:`, error.message);
    return { ticker, price: 0, change: 0, changePercent: 0 };
  }
}

/**
 * 특정 테마의 실시간 주가 동향 (Mini Index) 수집
 */
async function fetchThemeMarketData(themeId) {
  const theme = GICS_THEMES.find(t => t.id === parseInt(themeId));
  if (!theme) throw new Error('유효하지 않은 테마 ID입니다.');

  const promises = theme.tickers.map(ticker => fetchTickerPrice(ticker));
  const prices = await Promise.all(promises);

  // 테마 평균 등락률 계산
  const validPrices = prices.filter(p => p.price > 0);
  const avgChangePercent = validPrices.length > 0 
    ? validPrices.reduce((sum, p) => sum + p.changePercent, 0) / validPrices.length
    : 0;

  return {
    theme,
    avgChangePercent,
    stocks: prices,
  };
}

/**
 * 테마 대표 종목들의 RSS 글로벌 뉴스 수집
 */
async function fetchThemeNews(themeId) {
  const theme = GICS_THEMES.find(t => t.id === parseInt(themeId));
  if (!theme) return [];

  const tickerString = theme.tickers.join(',');
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${tickerString}&region=US&lang=en-US`;

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data, { xmlMode: true });
    const rawNewsList = [];

    $('item').each((i, el) => {
      if (i >= 5) return false; // 최대 5개로 제한 (번역 속도 고려)
      rawNewsList.push({
        title: $(el).find('title').text(),
        link: $(el).find('link').text(),
        pubDate: $(el).find('pubDate').text(),
        source: 'Yahoo Finance',
      });
    });

    // 병렬 번역 수행
    const translatedNewsList = await Promise.all(
      rawNewsList.map(async (news) => {
        const translatedTitle = await translateToKorean(news.title);
        return {
          ...news,
          title: translatedTitle,
        };
      })
    );

    return translatedNewsList;
  } catch (error) {
    console.error('글로벌 뉴스 수집 실패:', error.message);
    return [];
  }
}

module.exports = {
  getThemes,
  fetchThemeMarketData,
  fetchThemeNews,
};
