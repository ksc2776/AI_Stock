const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// GICS 기반 혁신 10대 테마 및 대표 기업 (각 5종목) 및 고유 팩트 이슈
const GICS_THEMES = [
  {
    id: 1,
    name: "반도체 및 설계 (Semiconductors)",
    desc: "AI 연산, 칩셋 설계 및 GPU 등 테크 공급망 최첨단 하드웨어",
    stocks: ["NVIDIA (NVDA)", "AMD (AMD)", "Broadcom (AVGO)", "Qualcomm (QCOM)", "ASML (ASML)"],
    tickers: ["NVDA", "AMD", "AVGO", "QCOM", "ASML"],
    issues: [
      { title: "엔비디아 차세대 AI 가속기 대량 양산 및 인도 정상화 기조", detail: "하이엔드 가속기 시장 지배력(80% 이상)을 바탕으로 빅테크 인프라 투자의 최대 수혜 지속. 전력 효율 극대화 패키징 공정 안착." },
      { title: "온디바이스 AI 확산에 따른 에지(Edge) 칩셋 단가 상승세", detail: "스마트폰 및 AI PC용 프리미엄 칩셋 수요 회복으로 퀄컴 및 AMD의 평균 판매단가(ASP) 동반 상승 국면 진입." }
    ]
  },
  {
    id: 2,
    name: "생성형 AI 및 거대 모델 (Generative AI)",
    desc: "초거대 모델 생태계 및 빅테크 AI 인프라 투자 수혜 영역",
    stocks: ["Microsoft (MSFT)", "Alphabet (GOOGL)", "Meta (META)", "Amazon (AMZN)", "Palantir (PLTR)"],
    tickers: ["MSFT", "GOOGL", "META", "AMZN", "PLTR"],
    issues: [
      { title: "엔터프라이즈 AI 서비스 상용화에 따른 클라우드 매출 가속화", detail: "마이크로소프트 애저(Azure) 및 구글 클라우드의 가입자당 평균 매출(ARPU) 성장 추세 확인. 실적 장세 초입 진입." },
      { title: "메타의 오픈소스 거대 언어 모델 인프라 고도화 전략", detail: "오픈소스 생태계 장악을 통한 자체 광고 효율 고도화 시스템 탑재 완료. 광고 단가 회복 팩트 확인." }
    ]
  },
  {
    id: 3,
    name: "대규모 데이터센터 & 하이퍼스케일러",
    desc: "AI 연산 데이터 폭증에 따른 데이터센터 건립 및 전력 공급 인프라",
    stocks: ["Amazon (AMZN)", "Microsoft (MSFT)", "Alphabet (GOOGL)", "Oracle (ORCL)", "Equinix (EQIX)"],
    tickers: ["AMZN", "MSFT", "GOOGL", "ORCL", "EQIX"],
    issues: [
      { title: "글로벌 빅테크 자본지출(CAPEX) 규모 상향 기조 유지", detail: "AI 연산 데이터 폭증으로 오라클 및 하이퍼스케일러들의 데이터센터 가동률 물리적 상한선 도달. 신규 부지 확보 총력전." },
      { title: "데이터센터 전력 인프라 병목현상 해결을 위한 에너지 계약 체결", detail: "빅테크 중심의 소형모듈원전(SMR) 및 친환경 인프라 전력 공급망 연계 본격화로 인프라 고정비 통제 수단 마련." }
    ]
  },
  {
    id: 4,
    name: "자율주행 및 커넥티드 카 (AutoTech)",
    desc: "실시간 비전 AI 기반 무인 로보택시 및 차량용 중앙 집중형 컴퓨팅",
    stocks: ["Tesla (TSLA)", "NVIDIA (NVDA)", "Qualcomm (QCOM)", "Uber (UBER)", "Aptiv (APTV)"],
    tickers: ["TSLA", "NVDA", "QCOM", "UBER", "APTV"],
    issues: [
      { title: "실시간 비전 AI 기반 무인 로보택시 규제 승인 범위 확대", detail: "미국 주요 거점 도시 내 완전 무인 자율주행 승인 가속화로 소프트웨어 기반 플랫폼 매출 비중 증가 흐름 형성." },
      { title: "차량용 중앙 집중형 컴퓨팅 아키텍처 전환 트렌드", detail: "엔비디아 토르 및 퀄컴 스냅드래곤 디지털 섀시 채택 완성차 업체 급증. 반도체 설계 업체의 전방 시장 확장." }
    ]
  },
  {
    id: 5,
    name: "엔터프라이즈 SaaS 및 클라우드 소프트웨어",
    desc: "기업 업무 자동화 생성형 AI 에이전트 빌더 기능 이식 수혜",
    stocks: ["Salesforce (CRM)", "ServiceNow (NOW)", "Adobe (ADBE)", "Workday (WDAY)", "Snowflake (SNOW)"],
    tickers: ["CRM", "NOW", "ADBE", "WDAY", "SNOW"],
    issues: [
      { title: "소프트웨어 내 생성형 AI 에이전트 빌더 기능 전면 이식", detail: "세일즈포스 및 서비스나우의 업무 자동화 솔루션 계약 단가 인상 성공. 레거시 소프트웨어 기업의 가치 재평가 국면." },
      { title: "기업 데이터 통합 수요 증가에 따른 데이터 클라우드 활성화", detail: "정형·비정형 데이터 결합 분석 수요 급증으로 스노우플레이크 등 클라우드 기반 데이터 인프라 가입자 수 회복세." }
    ]
  },
  {
    id: 6,
    name: "차세대 사이버 보안 (Cybersecurity)",
    desc: "AI 악용 해킹 방어용 통합 단말(Endpoint) 보안 및 단일 제어 플랫폼",
    stocks: ["CrowdStrike (CRWD)", "Palo Alto Networks (PANW)", "Fortinet (FTNT)", "Zscaler (ZS)", "Cloudflare (NET)"],
    tickers: ["CRWD", "PANW", "FTNT", "ZS", "NET"],
    issues: [
      { title: "AI 악용 고도화 해킹 방어용 단말(Endpoint) 보안 수요 폭증", detail: "크라우드스트라이크 중심의 XDR 플랫폼 도입 기업 확대. 지능형 지속 위협(APT) 방어를 위한 통합 예산 우선 배정 확인." },
      { title: "플랫폼 콘솔리데이션(보안 툴 통합) 트렌드 심화", detail: "팔로알토 네트웍스의 단일 제어 플랫폼 전략이 연간 반복 매출(ARR) 증가세로 증명되며 다각화된 보안 툴 통합 가속." }
    ]
  },
  {
    id: 7,
    name: "미래형 이커머스 및 디지털 결제 인프라",
    desc: "소셜 미디어 연계 국경 없는 이커머스 거래액 성장 및 B2B 디지털 결제",
    stocks: ["Amazon (AMZN)", "Shopify (SHOP)", "Visa (V)", "Mastercard (MA)", "PayPal (PYPL)"],
    tickers: ["AMZN", "SHOP", "V", "MA", "PYPL"],
    issues: [
      { title: "소셜 미디어 연계 국경 없는 커머스 인프라 거래액 성장", detail: "쇼피파이 기반 독립 쇼핑몰들의 물류 자동화 연동 시스템 효율화. 마진율의 구조적 반등 국면 지속." },
      { title: "B2B 디지털 결제 자동화 매출 비중의 안정적 성장세", detail: "비자와 마스터카드의 글로벌 국경 간 결제 수수료 수익 견조. 매크로 소비 둔화 우려 대비 실적 방어력 입증." }
    ]
  },
  {
    id: 8,
    name: "디지털 엔터테인먼트 및 스트리밍 플랫폼",
    desc: "광고형 요금제(AVOD) 다변화 및 프리미엄 오디오 구독 모델 번들링",
    stocks: ["Netflix (NFLX)", "Disney (DIS)", "Alphabet (GOOGL)", "Spotify (SPOT)", "Roku (ROKU)"],
    tickers: ["NFLX", "DIS", "GOOGL", "SPOT", "ROKU"],
    issues: [
      { title: "광고형 요금제(AVOD) 안착에 따른 계정당 추가 매출 확보", detail: "넷플릭스의 글로벌 순증 가입자수 기대를 상회. 단순 구독료 인상 이상의 광고 모델 다변화 수익성 검증 완료." },
      { title: "오디오 프리미엄 구독 모델 고도화 및 이익 마진 개선", detail: "스포티파이의 에피소드 및 오디오북 번들링 전략 성공으로 유료 가입자 이탈 없는 이익률 극대화 단계 진입." }
    ]
  },
  {
    id: 9,
    name: "로보틱스 및 스마트 팩토리 자동화",
    desc: "공급망 자국 재배치(Reshoring) 제조 인프라 건설 및 물류 자동화",
    stocks: ["Rockwell Automation (ROK)", "Symbotic (SYM)", "Intuitive Surgical (ISRG)", "PTC (PTC)", "Emerson Electric (EMR)"],
    tickers: ["ROK", "SYM", "ISRG", "PTC", "EMR"],
    issues: [
      { title: "공급망 자국 재배치(Reshoring)로 인한 공장 자동화 수주 누적", detail: "북미 제조 인프라 건설 붐에 따른 로크웰의 산업 제어 시스템 수주 잔고 유지. 하드웨어 자동화 수요 견조." },
      { title: "물류 센터 내 AI 기반 자율 카트 인프라 도입 가속", detail: "심보틱의 대형 유통 체인향 첨단 물류 자동화 시스템 공급 계약 확대. 물류 처리 효율 향상 증명." }
    ]
  },
  {
    id: 10,
    name: "에지 컴퓨팅 및 차세대 네트워킹 인프라",
    desc: "AI 클러스터 전용 고속 이더넷 및 열관리 액체 냉각(Liquid Cooling)",
    stocks: ["Cisco Systems (CSCO)", "Arista Networks (ANET)", "Vertiv (VRT)", "Amphenol (APH)", "Coherent (COHR)"],
    tickers: ["CSCO", "ANET", "VRT", "APH", "COHR"],
    issues: [
      { title: "AI 클러스터 전용 고속 이더넷 스위치 시장 점유율 폭발", detail: "아리스타네트웍스의 초저지연 네트워킹 장비가 빅테크 표준으로 채택되며 매출 가이드라인 상향 조정 기조 유지." },
      { title: "고성능 AI 가속기 발열 해결을 위한 액체 냉각(Liquid Cooling) 수요 폭증", detail: "버티브 등 차세대 열관리 솔루션 공급 업체의 하드웨어 부품 백로그 급증. 인프라 필수재 성격 부각." }
    ]
  }
];

/**
 * 테마 목록 반환
 */
function getThemes() {
  return GICS_THEMES.map(t => ({
    id: t.id,
    name: t.name,
    desc: t.desc,
    stocks: t.stocks,
    tickers: t.tickers
  }));
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

  // 종목 정보에 회사명 매핑 (stocks 배열에서 해당 ticker 찾아서 매핑)
  const mappedStocks = prices.map(p => {
    const stockNameStr = theme.stocks.find(s => s.includes(p.ticker)) || p.ticker;
    return {
      ...p,
      nameStr: stockNameStr
    };
  });

  return {
    theme: {
      id: theme.id,
      name: theme.name,
      desc: theme.desc,
      stocks: theme.stocks,
      tickers: theme.tickers
    },
    avgChangePercent,
    stocks: mappedStocks,
  };
}

/**
 * 테마 대표 종목들의 RSS 글로벌 뉴스 수집 및 고유 팩트 이슈 연동
 */
async function fetchThemeNews(themeId) {
  const theme = GICS_THEMES.find(t => t.id === parseInt(themeId));
  if (!theme) return [];

  // 1. 고유 분석 팩트 2개 (상단 분리 노출용)
  const factIssues = theme.issues.map((issue, index) => ({
    title: `📌 [핵심 팩트] ${issue.title}`,
    detail: issue.detail,
    isFact: true,
    source: 'GICS Analyst',
    pubDate: new Date(Date.now() - index * 60000).toISOString(),
  }));

  const tickerString = theme.tickers.join(',');
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${tickerString}&region=US&lang=en-US`;

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data, { xmlMode: true });
    const rawNewsList = [];

    $('item').each((i, el) => {
      if (i >= 5) return false; // 글로벌 실시간 헤드라인 기사 5개 수집
      
      // HTML 태그 제거 및 텍스트 정리
      const rawDesc = $(el).find('description').text() || '';
      const cleanDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/&apos;/g, "'").replace(/&quot;/g, '"').trim();

      rawNewsList.push({
        title: $(el).find('title').text(),
        description: cleanDesc,
        link: $(el).find('link').text(),
        pubDate: $(el).find('pubDate').text(),
        source: 'Yahoo Finance',
        isFact: false,
      });
    });

    // 병렬 번역 수행
    const translatedNewsList = await Promise.all(
      rawNewsList.map(async (news) => {
        const translatedTitle = await translateToKorean(news.title);
        const translatedDetail = news.description 
          ? await translateToKorean(news.description)
          : `${translatedTitle} - 상세 본문 기사는 하단 링크를 통해 원문으로 확인하실 수 있습니다.`;
        return {
          ...news,
          title: translatedTitle,
          detail: translatedDetail,
        };
      })
    );

    // 팩트 이슈 2개 + 실시간 기사 5개 리스트 결합 반환
    return [...factIssues, ...translatedNewsList];
  } catch (error) {
    console.error('글로벌 뉴스 수집 실패:', error.message);
    return factIssues; // 실패 시 팩트 이슈라도 반환
  }
}

module.exports = {
  getThemes,
  fetchThemeMarketData,
  fetchThemeNews,
};
