import React, { useState, useEffect } from 'react';

function SrimCard({ data: initialData, currentPrice, stockName }) {
  const [isGlobalTop, setIsGlobalTop] = useState(false);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // 상위에서 데이터가 새로 들어오면 업데이트
  useEffect(() => {
    setData(initialData);
    setIsGlobalTop(false);
  }, [initialData]);

  const handleToggle = async () => {
    const newValue = !isGlobalTop;
    setIsGlobalTop(newValue);
    setLoading(true);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.recalculateSrim({
          bps: data.inputs.bps,
          roe: data.inputs.roe,
          currentPrice: currentPrice,
          requiredReturn: data.inputs.requiredReturn / 100, // 원래 소수로
          isGlobalTop: newValue,
          consensus: data.consensus || null, // 포워드 유지
          srimYear: data.srimYear
        });
        if (result.success) {
          setData(result.data);
        }
      } else {
        // Mock 환경 재계산 시뮬레이션
        await new Promise(r => setTimeout(r, 500));
        if (newValue) {
          setData(prev => ({
            ...prev,
            fairValueConservative: prev.fairValueConservative * 1.2,
            fairValueNeutral: prev.fairValueNeutral * 1.2,
            fairValueOptimistic: prev.fairValueOptimistic * 1.2,
            safetyMargin: prev.safetyMargin + 20,
            valuation: '강력 저평가',
            inputs: { ...prev.inputs, isGlobalTop: true }
          }));
        } else {
          setData(initialData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getValuationClass = () => {
    if (data.safetyMargin > 0) return 'undervalued';
    if (data.safetyMargin > -15) return 'fair';
    return 'overvalued';
  };

  const barPercent = Math.min(100, Math.max(0, data.safetyMargin + 50));
  const barColor = data.safetyMargin > 15 ? 'var(--accent-cyan)'
    : data.safetyMargin > 0 ? 'var(--accent-blue)'
    : data.safetyMargin > -15 ? 'var(--accent-orange)'
    : 'var(--color-up)';

  return (
    <div className="glass-card card" id="srim-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">
          <span className="icon">⚖️</span>
          {stockName} S-RIM 가치평가
        </span>
        <span className={`valuation-badge ${getValuationClass()}`}>
          {data.valuation}
        </span>
      </div>

      {/* 글로벌 프리미엄 토글 */}
      <div className="premium-toggle" onClick={handleToggle}>
        <div className={`toggle-checkbox ${isGlobalTop ? 'active' : ''}`}>
          {isGlobalTop && '✔'}
        </div>
        <span className="toggle-label">👑 글로벌 1위 / 독보적 기술 보유 프리미엄 (적용)</span>
      </div>

      <div className="srim-values">
        <div className="srim-item">
          <div className="srim-label">보수적</div>
          <div className="srim-price">{Math.round(data.fairValueConservative)?.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="srim-item">
          <div className="srim-label">중립</div>
          <div className="srim-price">{Math.round(data.fairValueNeutral)?.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="srim-item">
          <div className="srim-label">낙관적</div>
          <div className="srim-price">{Math.round(data.fairValueOptimistic)?.toLocaleString('ko-KR')}원</div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
        <span>안전 마진</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{data.safetyMargin > 0 ? '+' : ''}{data.safetyMargin.toFixed(2)}%</span>
      </div>
      <div className="safety-margin-bar">
        <div
          className="safety-margin-fill"
          style={{ width: `${barPercent}%`, background: barColor, transition: 'width 0.5s ease-out, background 0.5s' }}
        />
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <span>기준년도: {data.srimYear || '최근'}</span>
        <span>BPS: {data.inputs.bps?.toLocaleString('ko-KR')}원</span>
        <span>ROE: {data.inputs.roe}%</span>
        <span>기대수익률: {data.inputs.isGlobalTop ? (data.inputs.requiredReturn * 0.8).toFixed(1) : data.inputs.requiredReturn}%</span>
      </div>
    </div>
  );
}

export default SrimCard;
