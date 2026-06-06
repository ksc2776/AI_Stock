import React from 'react';

function IssueNoticeCard({ data, stockName }) {
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
            onClick={() => {
              if (news.link && window.electronAPI) {
                window.electronAPI.openExternalLink(news.link);
              }
            }}
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
