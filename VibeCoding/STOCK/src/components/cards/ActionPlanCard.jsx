import React, { useState } from 'react';

function ActionPlanCard({ data, currentPrice, stockName }) {
  const [customTarget, setCustomTarget] = useState('');

  const getGradeColor = () => {
    switch (data.grade) {
      case 'Strong Buy': return 'var(--grade-strong-buy)';
      case 'Buy': return 'var(--grade-buy)';
      case 'Hold': return 'var(--grade-hold)';
      case 'Wait': return 'var(--grade-wait)';
      default: return 'var(--text-secondary)';
    }
  };

  const calculateYield = () => {
    if (!customTarget || !currentPrice) return null;
    const target = parseFloat(customTarget.replace(/,/g, ''));
    if (isNaN(target)) return null;
    const yieldPercent = ((target - currentPrice) / currentPrice) * 100;
    return yieldPercent;
  };

  const yieldValue = calculateYield();

  return (
    <div className="glass-card card" id="action-plan-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🚀</span>
          {stockName} 매매 가이드 & 목표가
        </span>
      </div>

      {/* 종합 등급 */}
      <div className="action-grade">
        <div className="grade-label">종합 등급</div>
        <div className="grade-value" style={{ color: getGradeColor() }}>
          {data.grade}
        </div>
        <div className="grade-score">
          EQV Score: {data.score}/100
        </div>
      </div>

      {/* 가격 가이드 */}
      <div className="action-prices">
        <div className="action-price-item entry">
          <div className="ap-label">추천 진입가</div>
          <div className="ap-value">{data.entryPrice?.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="action-price-item target">
          <div className="ap-label">1차 목표가</div>
          <div className="ap-value">{data.targetPrice?.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="action-price-item stop">
          <div className="ap-label">손절가</div>
          <div className="ap-value">{data.stopLoss?.toLocaleString('ko-KR')}원</div>
        </div>
      </div>

      {/* 사용자 맞춤형 목표가 시뮬레이터 */}
      <div className="custom-target-sim" style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          🎯 내 목표주가 시뮬레이터
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="목표주가 입력..."
              value={customTarget}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                if (!numericValue) {
                  setCustomTarget('');
                  return;
                }
                const formattedValue = Number(numericValue).toLocaleString('ko-KR');
                setCustomTarget(formattedValue);
              }}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-primary)',
                padding: '8px 30px 8px 12px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>원</span>
          </div>
          <div style={{ width: '80px', textAlign: 'right' }}>
            {yieldValue !== null ? (
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                color: yieldValue > 0 ? 'var(--color-up)' : yieldValue < 0 ? 'var(--color-down)' : 'var(--text-primary)'
              }}>
                {yieldValue > 0 ? '+' : ''}{yieldValue.toFixed(2)}%
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>- %</span>
            )}
          </div>
        </div>
        {yieldValue !== null && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
            현재가 {currentPrice?.toLocaleString('ko-KR')}원 기준
          </div>
        )}
      </div>

      {/* 분석 코멘트 */}
      <div className="action-comment" style={{ marginTop: '16px' }}>
        <div className="comment-title">📊 추세 분석</div>
        <div className="comment-text">{data.trendComment}</div>
      </div>
      <div className="action-comment" style={{ borderLeftColor: 'var(--accent-cyan)', marginTop: 'var(--space-sm)' }}>
        <div className="comment-title" style={{ color: 'var(--accent-cyan)' }}>🧠 심리 분석</div>
        <div className="comment-text">{data.sentimentComment}</div>
      </div>
    </div>
  );
}

export default ActionPlanCard;
