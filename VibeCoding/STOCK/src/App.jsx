import React, { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import koreaStocks from './data/koreaStocks.json';

const allowMockFallback = import.meta.env.DEV;

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = useCallback(async (stockCode) => {
    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      let result;
      // Electron 환경에서 IPC 호출
      if (window.electronAPI) {
        result = await window.electronAPI.analyzeStock(stockCode);
      } else {
        // 브라우저 (Vercel 웹) 환경에서 API 호출
        try {
          const res = await fetch(`/api/analyze?code=${stockCode}`);
          result = await res.json();
        } catch (e) {
          console.warn('API fetch failed:', e);
          if (allowMockFallback) {
            const mock = await getMockData(stockCode);
            result = { success: true, data: { ...mock, isMock: true } };
          } else {
            result = { success: false, error: '분석 API에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' };
          }
        }
      }

      if (result && result.success) {
        setAnalysisData(result.data);
        setError(null);
      } else {
        console.warn('API response error:', result?.error);
        if (allowMockFallback) {
          const mock = await getMockData(stockCode);
          setAnalysisData({ ...mock, isMock: true });
          setError(null);
        } else {
          setError(result?.error || '데이터를 불러오는 중 오류가 발생했습니다.');
        }
      }
    } catch (err) {
      console.warn('Unhandled analysis error:', err);
      if (allowMockFallback) {
        const mock = await getMockData(stockCode);
        setAnalysisData({ ...mock, isMock: true });
        setError(null);
      } else {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">📊 EQV 퀀트 에이전트</h1>
        <p className="app-subtitle">실시간 수급 · 가치 · 매매 분석 시스템</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <SearchBar onSearch={handleAnalyze} />
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">실시간 데이터를 수집하고 분석 중입니다...</p>
        </div>
      )}

      {error && (
        <div className="error-container glass-card">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button className="error-retry" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && !analysisData && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">종목을 검색하세요</h2>
          <p className="empty-desc">
            종목명 또는 종목코드를 입력하면 실시간 수급·가치·매매 분석 리포트를 생성합니다.
          </p>
        </div>
      )}

      {analysisData && <Dashboard data={analysisData} />}
    </div>
  );
}

// 브라우저 개발 환경용 Mock 데이터
async function getMockData(code) {
  // 입력된 코드에 맞는 종목 이름을 찾아 동적으로 반영
  const stockInfo = koreaStocks.find(s => s.code === code) || { name: '알 수 없는 종목' };
  const stockName = stockInfo.name;

  let realPrice = 72500;
  let change = 1500;
  let changePercent = 2.11;
  let high = 73200;
  let low = 71000;
  let realVolume = 18542367;

  try {
    // Vite Proxy를 통해 네이버 금융 실시간 주가 API(Polling) 호출 (CORS 우회 및 정확한 현재가)
    let res = await fetch(`/api/naver?query=SERVICE_ITEM:${code}`);
    let json = await res.json();
    const data = json?.result?.areas?.[0]?.datas?.[0];
    
    if (data && data.nv) {
      realPrice = data.nv;
      const sign = (data.rf === '4' || data.rf === '5') ? -1 : 1;
      change = data.cv * sign;
      changePercent = data.cr * sign;
      high = data.hv || realPrice;
      low = data.lv || realPrice;
      if (data.aq) realVolume = data.aq;
    }
  } catch (e) {
    console.error('실시간 가격을 가져오는데 실패했습니다 (Mock fallback 사용):', e);
  }

  const defaultConsensus = {
    years: ['2023.12', '2024.12', '2025.12', '2026.12(E)', '2027.12(E)', '2028.12(E)'],
    revenue: [2420000, 2610000, 2750000, 2850000, 3120000, 3350000],
    operatingProfit: [350000, 385000, 410000, 425000, 520000, 580000],
    netIncome: [260000, 290000, 310000, 320000, 395000, 445000],
    perList: [16.2, 15.0, 14.1, 13.2, 11.5, 10.1],
    pbrList: [1.9, 1.8, 1.7, 1.6, 1.4, 1.3],
    epsList: [4300, 4800, 5200, 5500, 6300, 7100],
    roeList: [10.2, 11.1, 11.8, 12.5, 13.8, 14.5],
    bpsList: [34000, 37000, 40000, 43000, 48500, 55000],
  };

  const sdiConsensus = {
    years: ['2023.12', '2024.12', '2025.12', '2026.12(E)', '2027.12(E)', '2028.12(E)'],
    revenue: [214368, 165922, 132667, 155640, 185000, 210000],
    operatingProfit: [15455, 3633, -17224, -486, 12000, 18000],
    netIncome: [20660, 5755, -5849, 4943, 9500, 14000],
    perList: [16.63, 29.24, -32.37, 114.64, 59.5, 40.2],
    pbrList: [1.72, 0.84, 0.99, 2.13, 1.95, 1.75],
    epsList: [27788, 8288, -8325, 5295, 10200, 15000],
    roeList: [11.48, 3.13, -3.15, 1.98, 3.8, 5.5],
    bpsList: [248000, 260000, 272000, 284815, 305000, 330000],
  };

  const semcoConsensus = {
    years: ['2023.12', '2024.12', '2025.12', '2026.12(E)', '2027.12(E)', '2028.12(E)'],
    revenue: [89094, 99475, 103000, 112000, 123000, 135000],
    operatingProfit: [6394, 8320, 9150, 10500, 12100, 13800],
    netIncome: [4505, 6020, 6780, 7900, 9200, 10600],
    perList: [24.5, 19.8, 17.5, 15.1, 13.0, 11.3],
    pbrList: [1.55, 1.48, 1.35, 1.25, 1.15, 1.05],
    epsList: [5690, 7650, 8520, 9950, 11600, 13300],
    roeList: [6.5, 8.2, 8.8, 9.8, 10.8, 11.5],
    bpsList: [89500, 95500, 101000, 104000, 112000, 121000],
  };

  const targetConsensus = code === '006400' ? sdiConsensus : (code === '009150' ? semcoConsensus : defaultConsensus);

  const generateDynamicInvestors = (price, vol) => {
    const baseVol = vol || 1500000;
    const trendMult = changePercent >= 0 ? 1 : -1;
    
    return {
      daily: [
        { date: '2026.06.05', foreignNet: Math.round(baseVol * 0.12 * trendMult), institutionNet: Math.round(baseVol * 0.08 * trendMult), close: price, volume: baseVol },
        { date: '2026.06.04', foreignNet: Math.round(baseVol * 0.05 * -trendMult), institutionNet: Math.round(baseVol * 0.06 * trendMult), close: Math.round(price * 0.98), volume: Math.round(baseVol * 0.8) },
        { date: '2026.06.03', foreignNet: Math.round(baseVol * 0.15 * trendMult), institutionNet: Math.round(baseVol * -0.04), close: Math.round(price * 0.95), volume: Math.round(baseVol * 1.1) },
        { date: '2026.06.02', foreignNet: Math.round(baseVol * 0.08), institutionNet: Math.round(baseVol * 0.1), close: Math.round(price * 0.96), volume: Math.round(baseVol * 1.2) },
        { date: '2026.06.01', foreignNet: Math.round(baseVol * 0.1 * trendMult), institutionNet: Math.round(baseVol * 0.05), close: Math.round(price * 0.99), volume: Math.round(baseVol * 0.9) },
      ],
      summary: {
        foreignTotal: Math.round(baseVol * 0.42 * trendMult),
        institutionTotal: Math.round(baseVol * 0.25 * trendMult),
        foreignTrend: trendMult >= 0 ? '순매수' : '순매도',
        institutionTrend: trendMult >= 0 ? '순매수' : '순매도',
        isTwinBuying: trendMult >= 0,
      },
    };
  };

  const sdiInvestors = {
    daily: [
      { date: '2026.06.05', foreignNet: -41664, institutionNet: 542951, close: 568000, volume: 384502 },
      { date: '2026.06.04', foreignNet: 13783, institutionNet: 466801, close: 607000, volume: 410938 },
      { date: '2026.06.02', foreignNet: -107865, institutionNet: 1018750, close: 602000, volume: 554201 },
      { date: '2026.06.01', foreignNet: 14608, institutionNet: 854997, close: 652000, volume: 681320 },
      { date: '2026.05.29', foreignNet: 138902, institutionNet: 2040080, close: 688000, volume: 512040 },
    ],
    summary: {
      foreignTotal: 17764,
      institutionTotal: 4923579,
      foreignTrend: '순매수',
      institutionTrend: '순매수',
      isTwinBuying: true,
    },
  };

  const targetInvestors = code === '006400' ? sdiInvestors : generateDynamicInvestors(realPrice, realVolume);

  const defaultAnalystReport = {
    title: `${stockName}, 하반기 실적 턴어라운드 및 신성장 동력 확보 기대`,
    broker: '글로벌증권',
    targetPrice: Math.round(realPrice * 1.25 / 1000) * 1000,
    date: '2026.06.05'
  };

  const sdiAnalystReport = {
    title: 'AIDC향 ESS의 중장기적인 성장성 확보',
    broker: 'iM증권',
    targetPrice: 650000,
    date: '2026.05.11'
  };

  const targetAnalystReport = code === '006400' ? sdiAnalystReport : defaultAnalystReport;

  const foreignTotal = targetInvestors.summary.foreignTotal;
  const institutionTotal = targetInvestors.summary.institutionTotal;

  let sentimentComment = '';
  if (foreignTotal > 0 && institutionTotal > 0) {
    sentimentComment = '외인·기관 쌍끌이 매수 진행 중, 비중 확대 고려';
  } else if (foreignTotal > 0 && institutionTotal < 0) {
    sentimentComment = '외국인 매수세 유입 중이나, 기관 차익실현 매물 주의';
  } else if (foreignTotal < 0 && institutionTotal > 0) {
    sentimentComment = '기관 매수세로 하방 경직성 확보, 외국인 매도 진정 관건';
  } else {
    sentimentComment = '외인·기관 동반 매도세, 당분간 보수적 접근 권장';
  }

  let trendComment = '';
  if (changePercent > 3) {
    trendComment = `강한 상승세 패턴 확인, 단기 상승 모멘텀 지속 전망`;
  } else if (changePercent > 0) {
    trendComment = `완만한 우상향 추세, 주요 지지선 방어 성공`;
  } else if (changePercent > -3) {
    trendComment = `단기 조정 국면, 주요 지지선 테스트 중으로 관망 필요`;
  } else {
    trendComment = `단기 하락 추세 전환 우려, 하방 리스크 관리 필수`;
  }

  // 종목별 재무 지표 세부화 설정
  const getFinancialData = () => {
    if (code === '006400') {
      return { bps: 284815, per: 114.64, pbr: 2.13, eps: 5295, roe: 1.98, peerPer: 25.4 };
    }
    if (code === '009150') {
      return { bps: 104000, per: 19.8, pbr: 1.48, eps: 7650, roe: 8.2, peerPer: 18.5 };
    }
    return { bps: 43000, per: 12.5, pbr: 1.69, eps: 5800, roe: 13.5, peerPer: 15.2 };
  };

  const currentFinancials = getFinancialData();

  return {
    code,
    price: {
      name: stockName,
      code: code,
      current: realPrice,
      change: change,
      changePercent: changePercent,
      volume: realVolume,
      prevVolume: code === '006400' ? 410938 : 12345678,
      volumeRatio: code === '006400' ? 0.93 : 1.5,
      high: high,
      low: low,
    },
    investors: targetInvestors,
    financials: {
      ...currentFinancials,
      consensus: targetConsensus,
    },
    srim: {
      fairValueOptimistic: Math.round(realPrice * 1.3),
      fairValueConservative: Math.round(realPrice * 0.9),
      fairValueNeutral: Math.round(realPrice * 1.1),
      safetyMargin: 7.93,
      upside: 41.38,
      valuation: '소폭 저평가',
      inputs: { bps: currentFinancials.bps, roe: currentFinancials.roe, requiredReturn: 8, isGlobalTop: false },
      forwardCalculations: [
        { year: '2026.12', fairValue: Math.round(realPrice * 1.1) },
        { year: '2027.12', fairValue: Math.round(realPrice * 1.2) },
        { year: '2028.12', fairValue: Math.round(realPrice * 1.3) },
      ],
    },
    actionPlan: {
      score: 78,
      grade: changePercent > 0 ? 'Buy' : 'Wait',
      entryPrice: Math.round(realPrice * 0.98),
      targetPrice: Math.round(realPrice * 1.15),
      stopLoss: Math.round(realPrice * 0.85),
      trendComment: trendComment,
      sentimentComment: sentimentComment,
    },
    news: [
      { 
        title: `${stockName}, 하반기 실적 개선 기대감에 강세`, 
        source: '한국경제', 
        date: '2026.06.05', 
        link: 'https://finance.naver.com/item/main.naver?code=' + code,
        detail: `[서울=한국경제] ${stockName}은 고부가가치 부품 라인업 다변화 및 하반기 전방 IT 디바이스 세트 수요 회복 조짐에 힘입어 실적 개선 흐름이 가속화될 전망입니다. 특히 온디바이스 AI 시장 확대에 따른 고사양 기판 공급 단가 인상 성공 및 패키징 수주 잔고 증가가 주가 강세를 단단하게 서포트하고 있습니다. 외인 매수세 유입과 함께 하방 견조성 확보 국면입니다.`
      },
      { 
        title: `외국인 순매수 지속... ${stockName} 주가 긍정적`, 
        source: '매일경제', 
        date: '2026.06.04', 
        link: 'https://finance.naver.com/item/main.naver?code=' + code,
        detail: `[서울=매일경제] 외국인 투자자들이 ${stockName} 주식을 최근 5거래일 연속 순매수하며 수급 유입 강도를 높이고 있습니다. 글로벌 반도체 공급망 정상화 흐름 속에서 동사의 고성능 적층 부품 및 전장용 인프라 공급 성과가 재조명받고 있는 것으로 평가됩니다. 기관 역시 매수 우위로 전환하며 쌍끌이 수급 기조로 지수 방어력을 확고히 다지는 모양새입니다.`
      },
      { 
        title: `${stockName} 신규 투자 발표, 장기 성장 동력 확보`, 
        source: '조선비즈', 
        date: '2026.06.03', 
        link: 'https://finance.naver.com/item/main.naver?code=' + code,
        detail: `[서울=조선비즈] ${stockName}이 차세대 고부가 AI 전용 라인 확보를 위해 약 2,500억 원 규모의 대규모 신규 설비 투자를 단행한다고 전격 공시했습니다. 이번 투자는 글로벌 하이퍼스케일러 데이터센터향 특수 전장 부품 공급 강화를 목적으로 하며, 완공 시 연간 매출액이 약 15% 이상 추가로 증대되는 효과를 거둘 것으로 예측되어 중장기 성장 모멘텀을 확실히 장착한 것으로 관측됩니다.`
      },
    ],
    analystReport: targetAnalystReport,
    analyzedAt: new Date().toLocaleString('ko-KR'),
  };
}

export default App;
