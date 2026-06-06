const { contextBridge, ipcRenderer } = require('electron');

// Renderer에 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 종목 검색
  searchStock: (keyword) => ipcRenderer.invoke('search-stock', keyword),
  // 종합 분석
  analyzeStock: (stockCode) => ipcRenderer.invoke('analyze-stock', stockCode),
  // S-RIM 재계산
  recalculateSrim: (params) => ipcRenderer.invoke('recalculate-srim', params),
  // 미국 테마 목록 가져오기
  getThemes: () => ipcRenderer.invoke('get-themes'),
  // 테마 동향 및 뉴스 가져오기
  fetchThemeData: (themeId) => ipcRenderer.invoke('fetch-theme-data', themeId),
  // 외부 링크 열기
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
});
