import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

// 만 단위 약식 변환: 21,668,266 → "2167만"
function toManUnit(val) {
  if (!val || val === 0) return '0';
  const man = Math.floor(val / 10000);
  return man.toLocaleString('ko-KR') + '만';
}

function VolumeCard({ data, stockName }) {
  const today = data.volume || 0;
  const prev  = data.prevVolume || 0;
  const diff  = today - prev;  // 오늘 - 전일 (음수 가능)
  const percentage = prev > 0 ? ((today - prev) / prev) * 100 : 0;
  const ratio = prev > 0 ? today / prev : (data.volumeRatio || 1);
  const isSurge = ratio >= 2;
  const isHigh  = ratio >= 1.5 && ratio < 2;
  const ratioClass = isSurge ? 'surge' : isHigh ? 'high' : 'normal';

  // 막대 색상
  const todayColor = isSurge ? '#06d6a0' : isHigh ? '#ef4444' : '#60a5fa';

  // 차트 데이터 (전일 왼쪽, 오늘 오른쪽)
  const chartData = [
    { name: '전일', value: prev,  color: '#64748b' },
    { name: '오늘', value: today, color: todayColor },
  ];

  // 막대 위 라벨: 각 막대에 해당 거래량(전체 수) 표시
  const CustomLabel = ({ x, y, width, value, index }) => {
    const labelVal = index === 0
      ? prev.toLocaleString('ko-KR')
      : today.toLocaleString('ko-KR');
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={9}
        fontWeight="600"
      >
        ({labelVal})
      </text>
    );
  };

  return (
    <div className="glass-card card" id="volume-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">📊</span>
          {stockName} 거래량
        </span>
      </div>

      {/* 상단: 오늘 거래량(만 단위) + 전일 대비 배수 뱃지 */}
      <div className="volume-main" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          {/* 오늘 거래량 만 단위 약식 */}
          <span className="volume-number" style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
            {toManUnit(today)}
          </span>
          {/* 전일 대비 배수 뱃지 (이미지: "전일 대비 1.18배") */}
          <span className={`volume-ratio ${ratioClass}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            전일 대비 {ratio.toFixed(2)}배
            {isSurge && ' 🔥'}
          </span>
        </div>

        {/* 전일 대비 차이 및 계산식 (이미지: "-13,862,601 = 오늘 거래량 - 전일 거래량") */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{
            fontSize: '1rem',
            color: diff >= 0 ? '#ef4444' : '#3b82f6',
            fontWeight: '700'
          }}>
            {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toLocaleString('ko-KR')}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            = (오늘 거래량 - 전일 거래량)
          </span>
        </div>

        {/* 비율 계산식 상세 (이미지 괄호 안 내용: X/Y = 배수(약 Z배 / 전일 대비 ±%)) */}
        <div style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '6px',
          padding: '5px 10px',
          marginBottom: '6px',
          lineHeight: 1.6,
        }}>
          {today.toLocaleString('ko-KR')} / {prev > 0 ? prev.toLocaleString('ko-KR') : '-'}
          {' = '}{ratio.toFixed(4)}
          {' (약 '}{ratio.toFixed(2)}배 / 전일 대비 {percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
        </div>
      </div>

      {/* 바 차트: 전일(왼쪽, 회색) / 오늘(오른쪽, 컬러) */}
      <div style={{ width: '100%', height: 130 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barSize={44} margin={{ top: 22, right: 10, left: 10, bottom: 0 }}>
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
              {/* 막대 위 거래량 전체 숫자 라벨 */}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 전일/오늘 비교 요약 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>전일</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            {prev.toLocaleString('ko-KR')}주
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: todayColor, marginBottom: 2 }}>오늘</div>
          <div style={{ fontSize: '0.85rem', color: todayColor, fontWeight: 600 }}>
            {today.toLocaleString('ko-KR')}주
          </div>
        </div>
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
