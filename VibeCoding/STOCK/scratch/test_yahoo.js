const { getThemes, fetchThemeMarketData, fetchThemeNews } = require('./electron/scraper/yahooFinance');

async function test() {
  try {
    console.log('--- 1. Testing getThemes() ---');
    const themes = getThemes();
    console.log(`Successfully fetched ${themes.length} GICS themes.`);
    console.log('First theme sample:', themes[0]);

    console.log('\n--- 2. Testing fetchThemeMarketData(1) ---');
    console.log('Fetching market prices for semiconductors...');
    const marketData = await fetchThemeMarketData(1);
    console.log(`Average change percent: ${marketData.avgChangePercent.toFixed(2)}%`);
    console.log('Stocks:', marketData.stocks);

    console.log('\n--- 3. Testing fetchThemeNews(1) ---');
    console.log('Fetching news feed (fact issues + RSS)...');
    const news = await fetchThemeNews(1);
    console.log(`Fetched ${news.length} news items.`);
    news.forEach((n, idx) => {
      console.log(`[${idx + 1}] isFact: ${n.isFact} | Title: ${n.title} (Source: ${n.source})`);
    });
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

test();
