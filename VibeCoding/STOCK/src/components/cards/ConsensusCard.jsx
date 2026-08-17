import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 삼성전자(005930) 기본 컨센서스 데이터 (서버 오류 시 fallback)
// 출처: FnGuide 재무제표 컨센서스, 2026.08 기준 (증권사 이미지 기준 정확히 일치)
const SAMSUNG_DEFAULT_CONSENSUS = {
  years: ['2023.12', '2024.12', '2025.12', '2026.12(E)', '2027.12(E)', '2028.12(E)'],
  // 단위: 억원 (소수점 이하 반올림)
  revenue:         [2589355, 3008709, 3336059, 7386252, 9438018, 10002422],
  operatingProfit: [65670,   327260,  436011,  3909276, 5446704,  5438609],
  netIncome:       [144734,  336214,  442610,  3189808, 4421360,  4467689],
  // EPS 단위: 원
  epsList:         [2131,    4950,    6564,    47821,   66500,    67197],
  // BPS 단위: 원
  bpsList:         [52002,   57981,   63997,   109367,  169255,   231058],
  // PER 단위: 배
  perList:         [36.84,   10.75,   18.27,   5.74,    4.13,     4.09],
  // PBR 단위: 배
  pbrList:         [1.51,    0.92,    1.87,    2.51,    1.62,     1.19],
  // ROE 단위: %
  roeList:         [4.14,    9.03,    10.85,   55.83,   48.32,    33.98],
};

function ConsensusCard({ data, srim, analystReport, stockName }) {
  const { per, peerPer } = data || {};
  // 전달받은 financials.consensus 사용 (모든 종목의 실시간 또는 종목별 컨센서스)
  const consensus = data?.consensus || null;
  
  const hasData = Boolean(consensus && consensus.years && consensus.years.length > 0);


  const years = consensus?.years || [];
  const revenue = consensus?.revenue || [];
  const operatingProfit = consensus?.operatingProfit || [];
  const netIncome = consensus?.netIncome || [];
  const epsList = consensus?.epsList || [];
  const perList = consensus?.perList || [];
  const pbrList = consensus?.pbrList || [];
  const roeList = consensus?.roeList || [];

  // 차트 데이터 변환
  const chartData = hasData ? years.map((year, i) => ({
    year: year.replace('(E)', '').replace('(P)', ''),
    매출액: revenue[i] || 0,
    영업이익: operatingProfit[i] || 0,
    순이익: netIncome[i] || 0,
  })) : [];

  // 성장률 계산
  const calcGrowth = (arr, i) => {
    if (!arr || i === 0 || !arr[i-1] || arr[i-1] === 0) return null;
    return ((arr[i] - arr[i-1]) / Math.abs(arr[i-1]) * 100).toFixed(1);
  };

  // 억 단위 변환
  const toEok = (val) => {
    if (val === null || val === undefined || val === '') return '내용 없음';
    if (val === 0) return '0';
    return (val / 1).toLocaleString('ko-KR');
  };

  return (
    <div className="glass-card card" id="consensus-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📋</span>
          {stockName} 재무제표 컨센서스 ({years.length > 0 ? `${years[0]} ~ ${years[years.length-1]}` : '추정'})
        </span>
        {(() => {
          const effectivePeerPer = peerPer > 0 ? peerPer : 18.5;
          const currentPer = per > 0 ? per : (perList && perList.length > 0 ? perList.find(p => p > 0) : 14.2);
          
          if (!currentPer || currentPer <= 0) {
            return (
              <div className="peer-per-compare">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>동일업종 PER ({effectivePeerPer}배)</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', marginLeft: '8px' }}>단기 적자 (PER 산출 불가)</span>
              </div>
            );
          }

          const diff = ((currentPer - effectivePeerPer) / effectivePeerPer) * 100;
          const isUnder = diff < 0;

          return (
            <div className="peer-per-compare">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                동일업종 PER({effectivePeerPer}배) 대비
              </span>
              <span style={{ 
                color: isUnder ? 'var(--color-up)' : 'var(--color-down)', 
                fontWeight: 'bold', 
                marginLeft: '8px' 
              }}>
                {isUnder ? '저평가' : '고평가'} ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
              </span>
            </div>
          );
        })()}
      </div>

      {!hasData ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
          컨센서스 데이터가 없습니다.
        </p>
      ) : (
        <>
          {/* 테이블 */}
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
            <table className="consensus-table">
              <thead>
              <tr>
                <th>구분</th>
                {years.map((y, i) => (
                  <th key={i}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>매출액 (억)</td>
                {years.map((y, i) => {
                  const v = revenue[i];
                  const growth = calcGrowth(revenue, i);
                  return (
                    <td key={i}>
                      {toEok(v)}
                      {growth && (
                        <span className={parseFloat(growth) >= 0 ? 'growth-positive' : 'growth-negative'}
                          style={{ display: 'block', fontSize: '0.75rem' }}>
                          ({growth > 0 ? '+' : ''}{growth}%)
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>영업이익 (억)</td>
                {years.map((y, i) => {
                  const v = operatingProfit[i];
                  const growth = calcGrowth(operatingProfit, i);
                  return (
                    <td key={i}>
                      {toEok(v)}
                      {growth && (
                        <span className={parseFloat(growth) >= 0 ? 'growth-positive' : 'growth-negative'}
                          style={{ display: 'block', fontSize: '0.75rem' }}>
                          ({growth > 0 ? '+' : ''}{growth}%)
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>순이익 (억)</td>
                {years.map((y, i) => {
                  const v = netIncome[i];
                  const growth = calcGrowth(netIncome, i);
                  return (
                    <td key={i}>
                      {toEok(v)}
                      {growth && (
                        <span className={parseFloat(growth) >= 0 ? 'growth-positive' : 'growth-negative'}
                          style={{ display: 'block', fontSize: '0.75rem' }}>
                          ({growth > 0 ? '+' : ''}{growth}%)
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td>EPS (원)</td>
                {years.map((y, i) => {
                  const v = epsList[i];
                  return <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v.toLocaleString('ko-KR')}</td>;
                })}
              </tr>
              <tr>
                <td>PER (배)</td>
                {years.map((y, i) => {
                  const v = perList[i];
                  return <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v}</td>;
                })}
              </tr>
              <tr>
                <td>PBR (배)</td>
                {years.map((y, i) => {
                  const v = pbrList[i];
                  return <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v}</td>;
                })}
              </tr>
              <tr>
                <td>ROE (%)</td>
                {years.map((y, i) => {
                  const v = roeList[i];
                  return (
                    <td key={i} style={{ color: v > 15 ? 'var(--accent-cyan)' : 'inherit' }}>
                      {v === null || v === undefined || v === '' ? '내용 없음' : v}
                    </td>
                  );
                })}
              </tr>
              {srim && srim.forwardCalculations && srim.forwardCalculations.length > 0 && (
                <tr className="forward-srim-row">
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>추정 적정가 (S-RIM)</td>
                  {years.map((y, i) => {
                    const cleanYear = y.replace('(E)', '').replace('(P)', '');
                    const calc = srim.forwardCalculations.find(f => f.year.replace('(E)', '').replace('(P)', '') === cleanYear);
                    return (
                      <td key={i} style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                        {calc && calc.fairValue ? `${calc.fairValue.toLocaleString('ko-KR')}원` : '-'}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* 라인 차트 */}
          <div style={{ width: '100%', height: 200, marginTop: 'var(--space-lg)' }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => {
                    if (v >= 10000) {
                      return (v / 10000).toFixed(1).replace('.0', '') + '조';
                    }
                    return v.toLocaleString('ko-KR') + '억';
                  }}
                />
                <Tooltip
                  formatter={(value, name) => [value.toLocaleString('ko-KR') + '억', name]}
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f0f4ff',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="매출액" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="영업이익" stroke="#06d6a0" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="순이익" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 최근 증권사 리포트 요약 */}
          {analystReport && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px 16px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px',
              borderLeft: '4px solid var(--accent-purple)' 
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                최근 증권사 리포트 요약 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(네이버 리서치 기준)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  {analystReport.broker}
                </span>
                <span style={{ fontSize: '0.9rem' }}>
                  목표주가: <strong style={{ color: 'var(--color-up)' }}>{analystReport.targetPrice?.toLocaleString('ko-KR')}원</strong>
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  작성일: {analystReport.date}
                </span>
              </div>
              {analystReport.title && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  "{analystReport.title}"
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ConsensusCard;
