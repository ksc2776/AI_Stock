import React from 'react';

function PriceCard({ data, stockName }) {
  const isUp = data.change > 0;
  const isDown = data.change < 0;
  const changeClass = isUp ? 'up' : isDown ? 'down' : 'neutral';
  const arrow = isUp ? '▲' : isDown ? '▼' : '';

  return (
    <div className="glass-card card" id="price-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">💰</span>
          {stockName} 실시간 가격
        </span>
        <span className="card-badge" style={{
          background: isUp ? 'rgba(239,68,68,0.15)' : isDown ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.15)',
          color: isUp ? 'var(--color-up)' : isDown ? 'var(--color-down)' : 'var(--color-neutral)',
        }}>
          {isUp ? '상승' : isDown ? '하락' : '보합'}
        </span>
      </div>

      <div className="price-value">
        {data.current?.toLocaleString('ko-KR')}원
      </div>

      <div className={`price-change ${changeClass}`}>
        <span>{arrow} {Math.abs(data.change)?.toLocaleString('ko-KR')}원</span>
        <span>({data.changePercent > 0 ? '+' : ''}{data.changePercent}%)</span>
      </div>

      <div className="price-meta">
        <div className="price-meta-item">
          <div className="label">고가</div>
          <div className="value" style={{ color: 'var(--color-up)' }}>
            {data.high?.toLocaleString('ko-KR')}
          </div>
        </div>
        <div className="price-meta-item">
          <div className="label">저가</div>
          <div className="value" style={{ color: 'var(--color-down)' }}>
            {data.low?.toLocaleString('ko-KR')}
          </div>
        </div>
        <div className="price-meta-item">
          <div className="label">거래량</div>
          <div className="value">
            {(data.volume / 10000).toFixed(0)}만주
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceCard;
