import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function ConsensusCard({ data, srim, analystReport, stockName }) {
  const { consensus, per, peerPer } = data;
  const hasData = consensus.years && consensus.years.length > 0;

  // 차트 데이터 변환
  const chartData = hasData ? consensus.years.map((year, i) => ({
    year: year.replace('(E)', '').replace('(P)', ''),
    매출액: consensus.revenue[i] || 0,
    영업이익: consensus.operatingProfit[i] || 0,
    순이익: consensus.netIncome[i] || 0,
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
          {stockName} 재무제표 컨센서스 (26~28년 추정)
        </span>
        {peerPer > 0 && (
          <div className="peer-per-compare">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>동일업종 PER 대비</span>
            {per > 0 ? (
              (() => {
                const diff = ((per - peerPer) / peerPer) * 100;
                const isUnder = diff < 0;
                return (
                  <span style={{ 
                    color: isUnder ? 'var(--color-up)' : 'var(--color-down)', 
                    fontWeight: 'bold', 
                    marginLeft: '8px' 
                  }}>
                    {isUnder ? '저평가' : '고평가'} ({diff > 0 ? '+' : ''}{diff.toFixed(1)}%)
                  </span>
                );
              })()
            ) : (
              <span style={{ marginLeft: '8px' }}>데이터 없음</span>
            )}
          </div>
        )}
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
                {consensus.years.map((y, i) => (
                  <th key={i}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>매출액 (억)</td>
                {consensus.revenue.map((v, i) => {
                  const growth = calcGrowth(consensus.revenue, i);
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
                {consensus.operatingProfit.map((v, i) => {
                  const growth = calcGrowth(consensus.operatingProfit, i);
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
                {consensus.netIncome.map((v, i) => {
                  const growth = calcGrowth(consensus.netIncome, i);
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
                {consensus.epsList.map((v, i) => <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v.toLocaleString('ko-KR')}</td>)}
              </tr>
              <tr>
                <td>PER (배)</td>
                {consensus.perList.map((v, i) => <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v}</td>)}
              </tr>
              <tr>
                <td>PBR (배)</td>
                {consensus.pbrList.map((v, i) => <td key={i}>{v === null || v === undefined || v === '' ? '내용 없음' : v}</td>)}
              </tr>
              <tr>
                <td>ROE (%)</td>
                {consensus.roeList.map((v, i) => (
                  <td key={i} style={{ color: v > 15 ? 'var(--accent-cyan)' : 'inherit' }}>
                    {v === null || v === undefined || v === '' ? '내용 없음' : v}
                  </td>
                ))}
              </tr>
              {srim && srim.forwardCalculations && srim.forwardCalculations.length > 0 && (
                <tr className="forward-srim-row">
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>추정 적정가 (S-RIM)</td>
                  {srim.forwardCalculations.map((f, i) => (
                    <td key={i} style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                      {f.fairValue?.toLocaleString('ko-KR') || '-'}원
                    </td>
                  ))}
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
                  tickFormatter={(v) => (v / 10000).toFixed(0) + '조'}
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
