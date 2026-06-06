import React, { useState, useEffect } from 'react';

function ThemeMarketCard() {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState(1);
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 테마 목록 가져오기
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        let themesList = [];
        if (window.electronAPI) {
          themesList = await window.electronAPI.getThemes();
        } else {
          // Mock 테마 (10대 테마 전체)
          themesList = [
            { id: 1, name: '반도체 및 설계', desc: 'AI 연산, 칩셋 설계 등 테크 공급망 최첨단 영역', tickers: ['NVDA', 'AVGO', 'AMD'] },
            { id: 2, name: '시스템 및 클라우드 소프트웨어', desc: '운영체제, 가상화 인프라, 전사적 자원 관리(ERP)', tickers: ['MSFT', 'ORCL', 'PLTR'] },
            { id: 3, name: '인터넷 플랫폼 및 서비스', desc: '데이터 트래픽, 검색 엔진, 디지털 광고 알고리즘', tickers: ['GOOGL', 'META', 'MTCH'] },
            { id: 4, name: '모빌리티 및 자율주행 기술', desc: 'AI 기반 FSD 및 전기차 하이테크 리더', tickers: ['TSLA', 'APTV', 'BWA'] },
            { id: 5, name: '온라인 리테일 및 테크 인프라', desc: '초거대 이커머스 및 클라우드 데이터 인프라', tickers: ['AMZN', 'EBAY', 'ETSY'] },
            { id: 6, name: '기술 하드웨어 및 스토리지', desc: '스마트 디바이스, AI 서버 및 네트워크 물리 장비', tickers: ['AAPL', 'CSCO', 'ANET'] },
            { id: 7, name: '엔터테인먼트 및 테크 스트리밍', desc: '초연결 미디어 방송 기술 및 스트리밍 알고리즘', tickers: ['NFLX', 'EA', 'TTWO'] },
            { id: 8, name: '금융 기술 및 디지털 결제', desc: '블록체인, 핀테크, 글로벌 전자결제 보안 데이터 처리', tickers: ['V', 'MA', 'PYPL'] },
            { id: 9, name: '생명공학 및 헬스케어 테크', desc: '유전자 편집, mRNA 기술, 첨단 의료기기 솔루션', tickers: ['LLY', 'VRTX', 'TMO'] },
            { id: 10, name: '반도체 공정 장비 및 부품', desc: '반도체 초미세 공정 수율 관리, 노광 및 식각 장비', tickers: ['AMAT', 'LRCX', 'KLAC'] }
          ];
        }
        setThemes(themesList);
        if (themesList.length > 0) {
          setSelectedThemeId(themesList[0].id);
        }
      } catch (error) {
        console.error('테마 목록 로딩 실패:', error);
      }
    };
    fetchThemes();
  }, []);

  // 테마 변경 시 테마 데이터(주가+뉴스) 가져오기
  useEffect(() => {
    if (!selectedThemeId) return;
    
    const fetchThemeData = async () => {
      setLoading(true);
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.fetchThemeData(selectedThemeId);
          if (result.success) {
            setThemeData(result.data);
          }
        } else {
          // Mock 데이터
          await new Promise(r => setTimeout(r, 1000));
          const selectedTheme = themes.find(t => t.id === parseInt(selectedThemeId));
          const mockStocks = selectedTheme.tickers.map(ticker => ({
            ticker: ticker,
            price: Math.floor(Math.random() * 500) + 100,
            change: (Math.random() * 10).toFixed(2),
            changePercent: ((Math.random() * 5) * (Math.random() > 0.3 ? 1 : -1))
          }));
          const avgChange = mockStocks.reduce((acc, cur) => acc + cur.changePercent, 0) / mockStocks.length;

          setThemeData({
            market: {
              theme: selectedTheme,
              avgChangePercent: avgChange,
              stocks: mockStocks
            },
            news: [
              { title: `[${selectedTheme.name}] 글로벌 선두 기업, 기대치 상회 실적 발표`, source: "Yahoo Finance", pubDate: new Date().toISOString() },
              { title: `[${selectedTheme.name}] 월가 분석가들, 관련 산업 슈퍼사이클 도래 전망`, source: "Yahoo Finance", pubDate: new Date(Date.now() - 3600000).toISOString() }
            ]
          });
        }
      } catch (error) {
        console.error('테마 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchThemeData();
  }, [selectedThemeId, themes]);

  const handleThemeChange = (e) => {
    setSelectedThemeId(Number(e.target.value));
  };

  const handleNewsClick = (e, link) => {
    e.preventDefault();
    if (link) {
      // 구글 웹페이지 번역(한국어) URL 생성
      const translatedUrl = `https://translate.google.com/translate?sl=auto&tl=ko&u=${encodeURIComponent(link)}`;
      if (window.electronAPI && window.electronAPI.openExternalLink) {
        window.electronAPI.openExternalLink(translatedUrl);
      } else {
        window.open(translatedUrl, '_blank');
      }
    }
  };

  const selectedThemeInfo = themes.find(t => t.id === selectedThemeId);

  return (
    <div className="card glass-card theme-market-card">
      <div className="theme-header">
        <h3 className="card-title">🌎 GICS 10대 테마 & 미국증시 동향</h3>
        {themes.length > 0 && (
          <select 
            className="theme-select" 
            value={selectedThemeId} 
            onChange={handleThemeChange}
          >
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.id}. {t.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {selectedThemeInfo && (
        <p className="theme-desc">{selectedThemeInfo.desc}</p>
      )}

      {loading ? (
        <div className="theme-loading">
          <div className="spinner-small"></div>
          <span>글로벌 실시간 데이터 연동 중...</span>
        </div>
      ) : themeData ? (
        <div className="theme-content animate-fade-in">
          {/* 미니 지수 (대표 3종목) */}
          <div className="theme-index">
            <div className="theme-avg">
              <span className="avg-label">테마 평균 동향</span>
              <span className={`avg-val ${themeData.market.avgChangePercent >= 0 ? 'text-up' : 'text-down'}`}>
                {themeData.market.avgChangePercent > 0 ? '+' : ''}{themeData.market.avgChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="theme-stocks">
              {themeData.market.stocks.map(s => (
                <div key={s.ticker} className={`theme-stock-item ${s.changePercent >= 0 ? 'bg-up' : 'bg-down'}`}>
                  <div className="ts-ticker">{s.ticker}</div>
                  <div className="ts-price">${s.price.toFixed(2)}</div>
                  <div className="ts-change">
                    {s.changePercent > 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 테마 타겟팅 뉴스 */}
          <div className="theme-news">
            <h4 className="theme-news-title">🌐 테마 실시간 글로벌 이슈</h4>
            {themeData.news && themeData.news.length > 0 ? (
              <div className="theme-news-list">
                {themeData.news.slice(0, 5).map((n, idx) => (
                  <div key={idx} className="theme-news-item">
                    <a 
                      href="#" 
                      onClick={(e) => handleNewsClick(e, n.link)} 
                      className="tn-title"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}
                    >
                      {n.title}
                    </a>
                    <span className="tn-date">{new Date(n.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="news-empty">현재 뉴스 피드가 없습니다.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="theme-error">데이터를 불러오지 못했습니다.</div>
      )}
    </div>
  );
}

export default ThemeMarketCard;
