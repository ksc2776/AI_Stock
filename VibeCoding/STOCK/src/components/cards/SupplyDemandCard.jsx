import React from 'react';

function SupplyDemandCard({ data, stockName }) {
  const { summary, daily } = data;

  const formatAmount = (val) => {
    if (Math.abs(val) >= 10000) {
      return (val / 10000).toFixed(1) + '만주';
    }
    return val.toLocaleString('ko-KR') + '주';
  };

  return (
    <div className="glass-card card" id="supply-demand-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🤝</span>
          {stockName} 투자자 수급
        </span>
        {summary.isTwinBuying && (
          <span className="twin-buying-badge">🔥 쌍끌이 매수</span>
        )}
      </div>

      <div className="supply-grid">
        <div className="supply-item">
          <div className="investor-label">외국인 (5일 누적)</div>
          <div className={`investor-value ${summary.foreignTotal >= 0 ? 'buy' : 'sell'}`}>
            {summary.foreignTotal >= 0 ? '+' : ''}{formatAmount(summary.foreignTotal)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {summary.foreignTrend}
          </div>
        </div>

        <div className="supply-item">
          <div className="investor-label">기관 (5일 누적)</div>
          <div className={`investor-value ${summary.institutionTotal >= 0 ? 'buy' : 'sell'}`}>
            {summary.institutionTotal >= 0 ? '+' : ''}{formatAmount(summary.institutionTotal)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {summary.institutionTrend}
          </div>
        </div>
      </div>

      {/* 최근 5일 동향 */}
      {daily.length > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {daily.slice(0, 3).map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span>{d.date}</span>
              <span style={{ color: d.foreignNet >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                외인 {d.foreignNet >= 0 ? '+' : ''}{formatAmount(d.foreignNet)}
              </span>
              <span style={{ color: d.institutionNet >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                기관 {d.institutionNet >= 0 ? '+' : ''}{formatAmount(d.institutionNet)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupplyDemandCard;
