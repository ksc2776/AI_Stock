const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

/**
 * 종목명으로 종목코드 검색
 * @param {string} keyword - 종목명 (예: '삼성전자')
 * @returns {Promise<{code: string, name: string}[]>} 검색 결과 목록
 */
async function searchStock(keyword) {
  try {
    const url = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(keyword)}&q_enc=euc-kr&t_korstock=1&t_usstock=0&co_id=commonall&ie=utf-8`;
    const response = await axios.get(url, { headers: HEADERS, timeout: 5000 });
    const data = response.data;

    if (!data || !data.items || data.items.length === 0) {
      return [];
    }

    // 한국 주식 결과 파싱
    const items = data.items[0] || [];
    return items.map(item => ({
      code: item[0][0],    // 종목코드
      name: item[1][0],    // 종목명
      market: item[2][0],  // 시장 (코스피/코스닥)
    })).slice(0, 10);
  } catch (error) {
    console.error('종목 검색 실패:', error.message);
    // 직접 입력된 코드인 경우 그대로 반환
    if (/^\d{6}$/.test(keyword)) {
      return [{ code: keyword, name: keyword, market: '' }];
    }
    throw new Error(`종목 검색 실패: ${error.message}`);
  }
}

module.exports = { searchStock };
