import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function VolumeCard({ data, stockName }) {
  const ratio = data.volumeRatio || 1;
  const isSurge = ratio >= 2;
  const isHigh = ratio >= 1.5 && ratio < 2;
  const ratioClass = isSurge ? 'surge' : isHigh ? 'high' : 'normal';

  // 거래량 바 차트 데이터
  const chartData = [
    { name: '전일', value: data.prevVolume || 0, color: '#64748b' },
    { name: '오늘', value: data.volume || 0, color: isSurge ? '#06d6a0' : isHigh ? '#ef4444' : '#60a5fa' },
  ];

  return (
    <div className="glass-card card" id="volume-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📊</span>
          {stockName} 거래량
        </span>
      </div>

      <div className="volume-main">
        <span className="volume-number">
          {(data.volume / 10000).toFixed(0)}만
        </span>
        <span className={`volume-ratio ${ratioClass}`}>
          전일 대비 {ratio.toFixed(2)}배
          {isSurge && ' 🔥'}
        </span>
      </div>

      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barSize={40}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [value.toLocaleString('ko-KR') + '주', '거래량']}
              contentStyle={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f0f4ff',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isSurge && (
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: 8, textAlign: 'center' }}>
          ⚡ 거래량 폭증! 강력한 에너지 분출 감지
        </p>
      )}
    </div>
  );
}

export default VolumeCard;
