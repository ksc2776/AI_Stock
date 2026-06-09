import React from 'react';

function IssueNoticeCard({ data, stockName }) {
  const handleItemClick = (e, news) => {
    e.preventDefault();
    if (!news.link) return;
    
    const detailText = news.detail || `[출처: ${news.source} | 작성일: ${news.date || '최근'}]\n\n본 실시간 종목 뉴스 및 공시의 상세 요약본이 없거나 제공되지 않았습니다. 상세 원문을 확인하시려면 하단의 원본 기사 보러가기 링크를 이용해 주세요.`;
    
    // news.html로 전달할 쿼리 파라미터 구성
    const newsUrl = `/news.html?type=issue` +
      `&title=${encodeURIComponent(news.title)}` +
      `&detail=${encodeURIComponent(detailText)}` +
      `&link=${encodeURIComponent(news.link)}`;
    
    window.open(newsUrl, '_blank', 'noopener,noreferrer');
  };

  if (!data || data.length === 0) {
    return (
      <div className="card glass-card">
        <h3 className="card-title">📰 {stockName} 주요 이슈 & 공지</h3>
        <div className="news-empty">현재 등록된 주요 이슈가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="card glass-card news-card">
      <h3 className="card-title">📰 {stockName} 주요 이슈 & 공지</h3>
      <div className="news-list">
        {data.map((news, index) => (
          <div 
            key={index} 
            className="news-item animate-slide-up" 
            style={{ 
              animationDelay: `${index * 0.1}s`,
              cursor: news.link ? 'pointer' : 'default'
            }}
            onClick={(e) => handleItemClick(e, news)}
          >
            <div className="news-content">
              <p className="news-title" style={{ color: news.link ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                {news.title}
              </p>
              <div className="news-meta">
                <span className="news-source">{news.source}</span>
                <span className="news-date">{news.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IssueNoticeCard;

