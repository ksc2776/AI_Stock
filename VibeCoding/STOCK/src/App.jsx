import React, { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import koreaStocks from './data/koreaStocks.json';

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
        const res = await fetch(`/api/analyze?code=${stockCode}`);
        result = await res.json();
      }

      if (result && result.success) {
        setAnalysisData(result.data);
        setError(null);
      } else {
        setError(result?.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
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
    years: ['2026.12(E)', '2027.12(E)', '2028.12(E)'],
    revenue: [2850000, 3120000, 3350000],
    operatingProfit: [425000, 520000, 580000],
    netIncome: [320000, 395000, 445000],
    perList: [13.2, 11.5, 10.1],
    pbrList: [1.6, 1.4, 1.3],
    epsList: [5500, 6300, 7100],
    roeList: [12.5, 13.8, 14.5],
  };

  const sdiConsensus = {
    years: ['2023.12', '2024.12', '2025.12', '2026.12(E)'],
    revenue: [214368, 165922, 132667, 155640],
    operatingProfit: [15455, 3633, -17224, -486],
    netIncome: [20660, 5755, -5849, 4943],
    perList: [16.63, 29.24, -32.37, 114.64],
    pbrList: [1.72, 0.84, 0.99, 2.13],
    epsList: [27788, 8288, -8325, 5295],
    roeList: [11.48, 3.13, -3.15, 1.98],
  };

  const targetConsensus = code === '006400' ? sdiConsensus : defaultConsensus;

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
      bps: code === '006400' ? 284815 : 43000,
      per: code === '006400' ? 114.64 : 12.5,
      pbr: code === '006400' ? 2.13 : 1.69,
      eps: code === '006400' ? 5295 : 5800,
      roe: code === '006400' ? 1.98 : 13.5,
      peerPer: code === '006400' ? 25.4 : 15.2,
      consensus: targetConsensus,
    },
    srim: {
      fairValueOptimistic: Math.round(realPrice * 1.3),
      fairValueConservative: Math.round(realPrice * 0.9),
      fairValueNeutral: Math.round(realPrice * 1.1),
      safetyMargin: 7.93,
      upside: 41.38,
      valuation: '소폭 저평가',
      inputs: { bps: code === '006400' ? 284815 : 43000, roe: code === '006400' ? 1.98 : 13.5, requiredReturn: 8, isGlobalTop: false },
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
      { title: `${stockName}, 하반기 실적 개선 기대감에 강세`, source: '한국경제', date: '2026.06.05' },
      { title: `외국인 순매수 지속... ${stockName} 주가 긍정적`, source: '매일경제', date: '2026.06.04' },
      { title: `${stockName} 신규 투자 발표, 장기 성장 동력 확보`, source: '조선비즈', date: '2026.06.03' },
    ],
    analystReport: targetAnalystReport,
    analyzedAt: new Date().toLocaleString('ko-KR'),
  };
}

export default App;
