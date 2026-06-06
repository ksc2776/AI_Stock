import React, { useState } from 'react';
import PriceCard from './cards/PriceCard';
import VolumeCard from './cards/VolumeCard';
import SupplyDemandCard from './cards/SupplyDemandCard';
import SrimCard from './cards/SrimCard';
import ConsensusCard from './cards/ConsensusCard';
import ActionPlanCard from './cards/ActionPlanCard';
import IssueNoticeCard from './cards/IssueNoticeCard';
import ThemeMarketCard from './cards/ThemeMarketCard';

function Dashboard({ data }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const rowData = {
        '분석일시': data.analyzedAt,
        '종목명': data.price.name,
        '종목코드': data.code,
        '현재가': data.price.current,
        '등락률(%)': data.price.changePercent,
        '거래량': data.price.volume,
        '적정주가(중립)': data.srim.fairValueNeutral,
        '적정주가(낙관)': data.srim.fairValueOptimistic,
        '안전마진(%)': data.srim.safetyMargin,
        '종합등급': data.actionPlan.grade,
        '추천 진입가': data.actionPlan.entryPrice,
        '1차 목표가': data.actionPlan.targetPrice,
        '외국인 추세': data.investors.summary.foreignTrend,
        '기관 추세': data.investors.summary.institutionTrend,
      };

      const res = await fetch('/api/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
      
      const result = await res.json();
      if (result.success) {
        alert('엑셀 익스포트 완료!\n파일 위치: ' + result.path);
      } else {
        alert('엑셀 익스포트 실패: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('엑셀 익스포트 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* 리포트 헤더 */}
      <div className="report-header animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="report-stock-name">
            📊 {data.price.name} 실시간 분석 리포트
          </h2>
          <p className="report-timestamp">분석 시점: {data.analyzedAt}</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--accent-blue)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: exporting ? 0.7 : 1,
            transition: 'background 0.2s'
          }}
        >
          {exporting ? '내보내는 중...' : '📥 엑셀 내보내기'}
        </button>
      </div>

      {/* 대시보드 그리드 */}
      <div className="dashboard-grid">
        {/* 1행: 종목 이슈(소창) + 미국 테마 + 가격/거래량 */}
        <div className="animate-slide-up animate-delay-1" style={{ gridColumn: 'span 1' }}>
          <IssueNoticeCard data={data.news} stockName={data.price.name} />
        </div>
        <div className="animate-slide-up animate-delay-2" style={{ gridColumn: 'span 2' }}>
          <ThemeMarketCard />
        </div>

        {/* 2행: 가격(wide) + 거래량 */}
        <div className="card-wide animate-slide-up animate-delay-3">
          <PriceCard data={data.price} stockName={data.price.name} />
        </div>
        <div className="animate-slide-up animate-delay-4">
          <VolumeCard data={data.price} stockName={data.price.name} />
        </div>

        {/* 3행: 수급 + S-RIM + 액션플랜 */}
        <div className="animate-slide-up animate-delay-5">
          <SupplyDemandCard data={data.investors} stockName={data.price.name} />
        </div>
        <div className="animate-slide-up animate-delay-6">
          <SrimCard data={data.srim} currentPrice={data.price.current} stockName={data.price.name} />
        </div>
        <div className="animate-slide-up animate-delay-7">
          <ActionPlanCard data={data.actionPlan} currentPrice={data.price.current} stockName={data.price.name} />
        </div>

        {/* 4행: 컨센서스 (full width) */}
        <div className="card-full animate-slide-up animate-delay-8">
          <ConsensusCard data={data.financials} srim={data.srim} analystReport={data.analystReport} stockName={data.price.name} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
