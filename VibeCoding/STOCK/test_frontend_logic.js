/**
 * App.jsx의 데이터 병합 및 SRIM 계산 로직 시뮬레이션 테스트
 */

const mockBase = {
  price: { name: '삼성전자', current: 75000 },
  financials: {
    bps: 55000,
    roe: 14.5,
    consensus: {
      years: ['2023', '2024'],
      revenue: [100, 110]
    }
  },
  srim: {},
  actionPlan: {}
};

const serverData = {
  price: {
    name: '삼성전자',
    current: 78000,
    change: 3000,
    changePercent: 4.0
  }
};

// ── App.jsx 병합 로직 시뮬레이션 ─────────────────
console.log('--- 1. Data Merging Test ---');

const mergedData = {
  ...mockBase,
  isMock: !serverData,
  price: serverData?.price 
    ? { ...mockBase.price, ...serverData.price }
    : mockBase.price,
  // financials는 항상 mockBase 사용 (이번 버그 수정의 핵심)
  financials: mockBase.financials,
};

console.log('Merged Price:', mergedData.price.current);
console.log('Merged Consensus Type:', typeof mergedData.financials.consensus);
console.log('Has Consensus Years:', !!mergedData.financials.consensus?.years);

// ── SRIM 계산 로직 시뮬레이션 ───────────────────
console.log('\n--- 2. SRIM Calculation Test ---');
const currentPrice = mergedData.price.current;
const bps = mergedData.financials.bps;
const roe = mergedData.financials.roe;
const requiredReturn = 8.5;

if (currentPrice > 0 && bps > 0 && roe > 0) {
  const fairValue = Math.round(bps * (roe / requiredReturn));
  const upside = ((fairValue / currentPrice) - 1) * 100;
  
  console.log('Current Price:', currentPrice);
  console.log('BPS:', bps);
  console.log('ROE:', roe);
  console.log('Calculated Fair Value:', fairValue);
  console.log('Upside:', upside.toFixed(2) + '%');
  
  const grade = upside > 15 ? 'Strong Buy' : (upside > 5 ? 'Buy' : (upside < -10 ? 'Sell' : 'Hold'));
  console.log('Decision Grade:', grade);
}

// ── ConsensusCard Fallback 테스트 ────────────────
console.log('\n--- 3. ConsensusCard Fallback Test ---');
const SAMSUNG_DEFAULT = { years: ['Fallback Year'] };
const rawConsensus = mergedData.financials.consensus; // 객체인 경우
const consensus = (rawConsensus && typeof rawConsensus === 'object' && rawConsensus.years)
  ? rawConsensus
  : SAMSUNG_DEFAULT;

console.log('Final Consensus in Card:', consensus.years[0]);

const brokenConsensus = "No Data String"; // 만약 문자열이 온다면?
const consensusFallback = (brokenConsensus && typeof brokenConsensus === 'object' && brokenConsensus.years)
  ? brokenConsensus
  : SAMSUNG_DEFAULT;
console.log('Fallback Result for String:', consensusFallback.years[0]);
