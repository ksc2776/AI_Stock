const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { scrapeStockData } = require('./scraper/naverFinance');
const { searchStock } = require('./scraper/stockSearch');
const { getThemes, fetchThemeMarketData, fetchThemeNews } = require('./scraper/yahooFinance');
const { calculateSRIM, generateActionPlan } = require('./calculator/srim');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0a0f1e',
    titleBarStyle: 'hiddenInset',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 개발 모드: Vite 개발 서버 로드
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// IPC 핸들러: 종목 검색
ipcMain.handle('search-stock', async (event, keyword) => {
  try {
    const result = await searchStock(keyword);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 핸들러: 종합 분석
ipcMain.handle('analyze-stock', async (event, stockCode) => {
  try {
    // 1. 네이버 증권 데이터 스크래핑
    const stockData = await scrapeStockData(stockCode);
    
    // 2. S-RIM 계산
    const srimResult = calculateSRIM({
      bps: stockData.financials.bps,
      roe: stockData.financials.roe,
      currentPrice: stockData.price.current,
      requiredReturn: 0.08, // 기본 기대수익률 8%
      isGlobalTop: false,
      consensus: stockData.financials.consensus,
    });
    srimResult.srimYear = stockData.financials.srimYear;
    
    // 3. 매매 가이드 생성
    const actionPlan = generateActionPlan({
      ...stockData,
      srim: srimResult,
    });
    
    return {
      success: true,
      data: {
        ...stockData,
        srim: srimResult,
        actionPlan: actionPlan,
        analyzedAt: new Date().toLocaleString('ko-KR'),
      },
    };
  } catch (error) {
    console.error('분석 실패:', error);
    return { success: false, error: error.message };
  }
});

// IPC 핸들러: S-RIM 재계산 (글로벌 1위 프리미엄 토글용)
ipcMain.handle('recalculate-srim', async (event, params) => {
  try {
    const srimResult = calculateSRIM({
      bps: params.bps,
      roe: params.roe,
      currentPrice: params.currentPrice,
      requiredReturn: params.requiredReturn || 0.08,
      isGlobalTop: params.isGlobalTop || false,
      consensus: params.consensus,
    });
    srimResult.srimYear = params.srimYear;
    return { success: true, data: srimResult };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 핸들러: 테마 목록 가져오기
ipcMain.handle('get-themes', () => {
  return getThemes();
});

// IPC 핸들러: 테마 데이터(지수+뉴스) 가져오기
ipcMain.handle('fetch-theme-data', async (event, themeId) => {
  try {
    const [marketData, newsData] = await Promise.all([
      fetchThemeMarketData(themeId),
      fetchThemeNews(themeId)
    ]);
    return { success: true, data: { market: marketData, news: newsData } };
  } catch (error) {
    console.error('테마 데이터 수집 실패:', error);
    return { success: false, error: error.message };
  }
});

// IPC 핸들러: 외부 링크 열기
ipcMain.handle('open-external-link', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to open external link:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
