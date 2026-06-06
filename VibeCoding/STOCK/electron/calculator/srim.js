/**
 * S-RIM(Surplus-RIM) 적정주가 계산
 * 공식: 적정 주가 = BPS + (BPS × (ROE - 기대수익률)) / 기대수익률
 * 
 * @param {Object} params
 * @param {number} params.bps - 주당 순자산가치 (BPS)
 * @param {number} params.roe - 자기자본이익률 (%, 예: 10은 10%)
 * @param {number} params.currentPrice - 현재 주가
 * @param {number} params.requiredReturn - 기대수익률 (비율, 예: 0.08은 8%)
 * @param {boolean} params.isGlobalTop - 글로벌 1위 / 독보적 기술 보유 여부
 * @param {Object} params.consensus - 컨센서스 데이터 (포워드 계산용)
 * @returns {Object} S-RIM 분석 결과
 */
/**
 * [하이브리드 로직 1] 과거 ROE 기반 미래 ROE 추정 (지수 감소 가중치 적용)
 */
function calculateProxyRoe(pastRoes) {
  // 유효한 숫자 데이터만 추출
  const validRoes = pastRoes.filter(r => r !== null && r !== undefined && !isNaN(r));
  if (validRoes.length === 0) return 0;
  
  // 최근 데이터가 배열의 마지막에 있다고 가정하고 뒤집음
  validRoes.reverse();
  
  // 가중치 설정 (최근 년도부터 50%, 30%, 15%, 5%...)
  const baseWeights = [0.5, 0.3, 0.15, 0.05];
  const weights = baseWeights.slice(0, validRoes.length);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / weightSum);
  
  const proxyRoe = validRoes.reduce((sum, roe, i) => sum + (roe * normalizedWeights[i]), 0);
  return proxyRoe;
}

/**
 * [최종 결합] Antigravity 하이브리드 S-RIM
 */
function calculateHybridSRIM(currentBps, pastRoes, k) {
  const estRoe = calculateProxyRoe(pastRoes);
  const estRoeDecimal = estRoe / 100;
  
  // 미래 3년치 BPS 역산
  const estBpsList = [];
  let bpsTemp = currentBps;
  for (let i = 0; i < 3; i++) {
    bpsTemp = bpsTemp * (1 + estRoeDecimal);
    estBpsList.push(bpsTemp);
  }
  
  // S-RIM 공식 적용
  let excessEarningsSum = 0;
  let bpsPrev = currentBps;
  for (let i = 0; i < estBpsList.length; i++) {
    const excessReturn = estRoeDecimal - k;
    const excessEarnings = bpsPrev * excessReturn;
    excessEarningsSum += excessEarnings / Math.pow(1 + k, i + 1);
    bpsPrev = estBpsList[i];
  }
  
  // 잔여가치 (지속가정)
  const terminalValue = (bpsPrev * (estRoeDecimal - k)) / k;
  const terminalValueDiscounted = terminalValue / Math.pow(1 + k, estBpsList.length);
  
  // 최종 적정주가
  const fairValue = currentBps + excessEarningsSum + terminalValueDiscounted;
  
  return {
    estimatedRoe: estRoe,
    estimatedFairValueSrim: Math.max(0, Math.round(fairValue))
  };
}

function calculateSRIM({ bps, roe, currentPrice, requiredReturn = 0.08, isGlobalTop = false, consensus = null }) {
  
  // 글로벌 1위 프리미엄: 할인율(기대수익률)을 20% 낮춰줌 (가치 상승 효과)
  const adjustedReturn = isGlobalTop ? requiredReturn * 0.8 : requiredReturn;

  let fairValueOptimistic = 0;
  let fairValueConservative = 0;
  let fairValueNeutral = 0;
  const discountRate = 0.9;
  const neutralDiscount = 0.8;

  let isHybridApplied = false;

  // ROE 데이터가 없거나 0일 경우 과거 실적 기반 하이브리드 로직 적용
  if ((!roe || roe === 0) && consensus && consensus.roeList && consensus.years) {
    const pastRoes = [];
    for (let i = 0; i < consensus.years.length; i++) {
      if (!consensus.years[i].includes('(E)') && !consensus.years[i].includes('(P)')) {
        pastRoes.push(consensus.roeList[i]);
      }
    }
    
    if (pastRoes.filter(r => r !== null && r !== undefined && !isNaN(r)).length > 0) {
      isHybridApplied = true;
      const hybridResult = calculateHybridSRIM(bps, pastRoes, adjustedReturn);
      const estFv = hybridResult.estimatedFairValueSrim;
      
      fairValueOptimistic = estFv;
      fairValueNeutral = Math.max(0, Math.round(estFv * 0.9)); // 중립은 10% 보수적
      fairValueConservative = Math.max(0, Math.round(estFv * 0.8)); // 보수적은 20% 보수적
      roe = hybridResult.estimatedRoe; // 입력값 디스플레이 업데이트
    }
  }

  if (!isHybridApplied) {
    const roeDecimal = roe / 100;
    if (adjustedReturn > 0) {
      fairValueOptimistic = bps + (bps * (roeDecimal - adjustedReturn)) / adjustedReturn;
      fairValueConservative = bps + (bps * (roeDecimal - adjustedReturn)) / (1 + adjustedReturn - discountRate);
      fairValueNeutral = bps + (bps * (roeDecimal - adjustedReturn)) / (1 + adjustedReturn - neutralDiscount);
    }
  }

  // 안전 마진 계산 (보수적 기준)
  const safetyMargin = currentPrice > 0
    ? Math.round(((fairValueConservative - currentPrice) / currentPrice) * 10000) / 100
    : 0;

  // 상승 여력 (낙관적 기준)
  const upside = currentPrice > 0
    ? Math.round(((fairValueOptimistic - currentPrice) / currentPrice) * 10000) / 100
    : 0;

  // 가치 판단
  let valuation = '적정';
  if (safetyMargin > 30) valuation = '강력 저평가';
  else if (safetyMargin > 15) valuation = '저평가';
  else if (safetyMargin > 0) valuation = '소폭 저평가';
  else if (safetyMargin > -15) valuation = '적정';
  else if (safetyMargin > -30) valuation = '고평가';
  else valuation = '강력 고평가';

  // 포워드 컨센서스 계산 (26~28년도)
  let forwardCalculations = [];
  if (consensus && consensus.years && consensus.years.length > 0) {
    forwardCalculations = consensus.years.map((year, i) => {
      // 컨센서스에 BPS가 수집되지 않은 경우 EPS와 ROE로 역산 (BPS = EPS / ROE * 100)
      const cEps = (consensus.epsList && consensus.epsList[i]) ? consensus.epsList[i] : 0;
      const cRoe = (consensus.roeList && consensus.roeList[i]) ? consensus.roeList[i] : 0;
      let cBps = (consensus.bpsList && consensus.bpsList[i]) ? consensus.bpsList[i] : ((cEps > 0 && cRoe > 0) ? (cEps / cRoe) * 100 : bps);
      if (!cBps || cBps === 0) cBps = bps;
      
      const cRoeDecimal = (cRoe || roe) / 100;
      let fv = 0;
      if (adjustedReturn > 0) {
        fv = cBps + (cBps * (cRoeDecimal - adjustedReturn)) / (1 + adjustedReturn - discountRate);
      }
      return {
        year: year.replace('(E)', '').replace('(P)', ''),
        fairValue: Math.round(fv),
      };
    });
  }

  return {
    fairValueOptimistic: Math.round(fairValueOptimistic),
    fairValueConservative: Math.round(fairValueConservative),
    fairValueNeutral: Math.round(fairValueNeutral),
    safetyMargin,
    upside,
    valuation,
    inputs: { bps, roe, requiredReturn: requiredReturn * 100, isGlobalTop },
    forwardCalculations,
  };
}

/**
 * 종합 매매 가이드 생성
 */
function generateActionPlan(data) {
  const { price, investors, srim } = data;
  let score = 50; // 기본 점수

  // 1. S-RIM 가치 평가 점수 (최대 ±30점)
  if (srim.safetyMargin > 30) score += 30;
  else if (srim.safetyMargin > 15) score += 20;
  else if (srim.safetyMargin > 0) score += 10;
  else if (srim.safetyMargin > -15) score -= 10;
  else if (srim.safetyMargin > -30) score -= 20;
  else score -= 30;

  // 2. 거래량 점수 (최대 ±15점)
  if (price.volumeRatio >= 3) score += 15;
  else if (price.volumeRatio >= 2) score += 10;
  else if (price.volumeRatio >= 1.5) score += 5;
  else if (price.volumeRatio < 0.5) score -= 10;

  // 3. 수급 점수 (최대 ±20점)
  if (investors.summary.isTwinBuying) score += 20;
  else if (investors.summary.foreignTotal > 0) score += 10;
  else if (investors.summary.institutionTotal > 0) score += 5;
  else if (investors.summary.foreignTotal < 0 && investors.summary.institutionTotal < 0) score -= 15;

  // 4. 가격 추세 점수 (최대 ±10점)
  if (price.changePercent > 3) score += 10;
  else if (price.changePercent > 0) score += 5;
  else if (price.changePercent < -3) score -= 10;
  else if (price.changePercent < 0) score -= 5;

  // 점수 범위 제한
  score = Math.max(0, Math.min(100, score));

  // 등급 결정
  let grade = 'Hold';
  if (score >= 85) grade = 'Strong Buy';
  else if (score >= 70) grade = 'Buy';
  else if (score >= 40) grade = 'Hold';
  else grade = 'Wait';

  // 진입가 / 목표가 / 손절가
  const entryPrice = Math.round(price.current * 0.98); // 현재가 대비 2% 하락 시
  const targetPrice = srim.fairValueConservative > price.current
    ? srim.fairValueConservative
    : Math.round(price.current * 1.15);
  const stopLoss = Math.round(price.current * 0.93); // 7% 손절

  // 추세 분석 코멘트
  let trendComment = '';
  if (price.volumeRatio >= 2 && price.changePercent > 0) {
    trendComment = '거래량이 실린 돌파 구간으로 강력한 매수 신호 발생';
  } else if (price.volumeRatio >= 2 && price.changePercent < 0) {
    trendComment = '대량 거래를 동반한 하락으로 투매 가능성 주의';
  } else if (price.volumeRatio < 0.5 && price.changePercent < 0) {
    trendComment = '거래량 없는 하락으로 관망 구간';
  } else if (price.volumeRatio < 0.5 && price.changePercent > 0) {
    trendComment = '거래량 미동반 상승, 추가 매수세 확인 필요';
  } else {
    trendComment = '보합권 움직임, 방향성 확인 후 대응 필요';
  }

  // 심리 분석 코멘트
  let sentimentComment = '';
  if (investors.summary.isTwinBuying) {
    sentimentComment = '외인·기관 쌍끌이 매수 진행 중, 공격적 비중 확대 고려';
  } else if (investors.summary.foreignTotal > 0 && investors.summary.institutionTotal < 0) {
    sentimentComment = '외인 매수 vs 기관 차익 실현, 선별적 접근 필요';
  } else if (investors.summary.foreignTotal < 0 && investors.summary.institutionTotal > 0) {
    sentimentComment = '기관 매수 vs 외인 매도, 기관 수급 지속성 확인 필요';
  } else if (investors.summary.foreignTotal < 0 && investors.summary.institutionTotal < 0) {
    sentimentComment = '외인·기관 동반 매도 중, 보수적 접근 필요';
  } else {
    sentimentComment = '수급 중립 구간, 추가 확인 필요';
  }

  return {
    score,
    grade,
    entryPrice,
    targetPrice,
    stopLoss,
    trendComment,
    sentimentComment,
  };
}

module.exports = { calculateSRIM, generateActionPlan };
