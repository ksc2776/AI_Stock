const express = require('express');
const path = require('path');
const analyzeRoute = require('./api/analyze');

const app = express();
const PORT = process.env.PORT || 8080;

// API 라우트 연동 (기존 Vercel 서버리스 함수 코드를 Express 컨트롤러로 재사용)
app.get('/api/analyze', analyzeRoute);

// React 빌드 파일(dist 폴더) 정적 제공
app.use(express.static(path.join(__dirname, 'dist')));

// 어떤 경로로 접속하든 index.html로 리다이렉트 (React Router 지원)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
