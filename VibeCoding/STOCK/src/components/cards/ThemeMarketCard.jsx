import React, { useState, useEffect } from 'react';

// 최신 GICS 기준 10대 핵심 기술 테마 및 대표 기업 구조화 데이터 (Mock 및 백업용)
const GICS_THEMES = [
  {
    id: 1,
    name: "반도체 및 설계 (Semiconductors)",
    desc: "AI 연산, 칩셋 설계 및 GPU 등 테크 공급망 최첨단 하드웨어",
    stocks: ["NVIDIA (NVDA)", "AMD (AMD)", "Broadcom (AVGO)", "Qualcomm (QCOM)", "ASML (ASML)"],
    tickers: ["NVDA", "AMD", "AVGO", "QCOM", "ASML"],
    issues: [
      { title: "엔비디아 차세대 AI 가속기 대량 양산 및 인도 정상화 기조", detail: "하이엔드 가속기 시장 지배력(80% 이상)을 바탕으로 빅테크 인프라 투자의 최대 수혜 지속. 전력 효율 극대화 패키징 공정 안착." },
      { title: "온디바이스 AI 확산에 따른 에지(Edge) 칩셋 단가 상승세", detail: "스마트폰 및 AI PC용 프리미엄 칩셋 수요 회복으로 퀄컴 및 AMD의 평균 판매단가(ASP) 동반 상승 국면 진입." }
    ]
  },
  {
    id: 2,
    name: "생성형 AI 및 거대 모델 (Generative AI)",
    desc: "초거대 모델 생태계 및 빅테크 AI 인프라 투자 수혜 영역",
    stocks: ["Microsoft (MSFT)", "Alphabet (GOOGL)", "Meta (META)", "Amazon (AMZN)", "Palantir (PLTR)"],
    tickers: ["MSFT", "GOOGL", "META", "AMZN", "PLTR"],
    issues: [
      { title: "엔터프라이즈 AI 서비스 상용화에 따른 클라우드 매출 가속화", detail: "마이크로소프트 애저(Azure) 및 구글 클라우드의 가입자당 평균 매출(ARPU) 성장 추세 확인. 실적 장세 초입 진입." },
      { title: "메타의 오픈소스 거대 언어 모델 인프라 고도화 전략", detail: "오픈소스 생태계 장악을 통한 자체 광고 효율 고도화 시스템 탑재 완료. 광고 단가 회복 팩트 확인." }
    ]
  },
  {
    id: 3,
    name: "대규모 데이터센터 & 하이퍼스케일러",
    desc: "AI 연산 데이터 폭증에 따른 데이터센터 건립 및 전력 공급 인프라",
    stocks: ["Amazon (AMZN)", "Microsoft (MSFT)", "Alphabet (GOOGL)", "Oracle (ORCL)", "Equinix (EQIX)"],
    tickers: ["AMZN", "MSFT", "GOOGL", "ORCL", "EQIX"],
    issues: [
      { title: "글로벌 빅테크 자본지출(CAPEX) 규모 상향 기조 유지", detail: "AI 연산 데이터 폭증으로 오라클 및 하이퍼스케일러들의 데이터센터 가동률 물리적 상한선 도달. 신규 부지 확보 총력전." },
      { title: "데이터센터 전력 인프라 병목현상 해결을 위한 에너지 계약 체결", detail: "빅테크 중심의 소형모듈원전(SMR) 및 친환경 인프라 전력 공급망 연계 본격화로 인프라 고정비 통제 수단 마련." }
    ]
  },
  {
    id: 4,
    name: "자율주행 및 커넥티드 카 (AutoTech)",
    desc: "실시간 비전 AI 기반 무인 로보택시 및 차량용 중앙 집중형 컴퓨팅",
    stocks: ["Tesla (TSLA)", "NVIDIA (NVDA)", "Qualcomm (QCOM)", "Uber (UBER)", "Aptiv (APTV)"],
    tickers: ["TSLA", "NVDA", "QCOM", "UBER", "APTV"],
    issues: [
      { title: "실시간 비전 AI 기반 무인 로보택시 규제 승인 범위 확대", detail: "미국 주요 거점 도시 내 완전 무인 자율주행 승인 가속화로 소프트웨어 기반 플랫폼 매출 비중 증가 흐름 형성." },
      { title: "차량용 중앙 집중형 컴퓨팅 아키텍처 전환 트렌드", detail: "엔비디아 토르 및 퀄컴 스냅드래곤 디지털 섀시 채택 완성차 업체 급증. 반도체 설계 업체의 전방 시장 확장." }
    ]
  },
  {
    id: 5,
    name: "엔터프라이즈 SaaS 및 클라우드 소프트웨어",
    desc: "기업 업무 자동화 생성형 AI 에이전트 빌더 기능 이식 수혜",
    stocks: ["Salesforce (CRM)", "ServiceNow (NOW)", "Adobe (ADBE)", "Workday (WDAY)", "Snowflake (SNOW)"],
    tickers: ["CRM", "NOW", "ADBE", "WDAY", "SNOW"],
    issues: [
      { title: "소프트웨어 내 생성형 AI 에이전트 빌더 기능 전면 이식", detail: "세일즈포스 및 서비스나우의 업무 자동화 솔루션 계약 단가 인상 성공. 레거시 소프트웨어 기업의 가치 재평가 국면." },
      { title: "기업 데이터 통합 수요 증가에 따른 데이터 클라우드 활성화", detail: "정형·비정형 데이터 결합 분석 수요 급증으로 스노우플레이크 등 클라우드 기반 데이터 인프라 가입자 수 회복세." }
    ]
  },
  {
    id: 6,
    name: "차세대 사이버 보안 (Cybersecurity)",
    desc: "AI 악용 해킹 방어용 통합 단말(Endpoint) 보안 및 단일 제어 플랫폼",
    stocks: ["CrowdStrike (CRWD)", "Palo Alto Networks (PANW)", "Fortinet (FTNT)", "Zscaler (ZS)", "Cloudflare (NET)"],
    tickers: ["CRWD", "PANW", "FTNT", "ZS", "NET"],
    issues: [
      { title: "AI 악용 고도화 해킹 방어용 단말(Endpoint) 보안 수요 폭증", detail: "크라우드스트라이크 중심의 XDR 플랫폼 도입 기업 확대. 지능형 지속 위협(APT) 방어를 위한 통합 예산 우선 배정 확인." },
      { title: "플랫폼 콘솔리데이션(보안 툴 통합) 트렌드 심화", detail: "팔로알토 네트웍스의 단일 제어 플랫폼 전략이 연간 반복 매출(ARR) 증가세로 증명되며 다각화된 보안 툴 통합 가속." }
    ]
  },
  {
    id: 7,
    name: "미래형 이커머스 및 디지털 결제 인프라",
    desc: "소셜 미디어 연계 국경 없는 이커머스 거래액 성장 및 B2B 디지털 결제",
    stocks: ["Amazon (AMZN)", "Shopify (SHOP)", "Visa (V)", "Mastercard (MA)", "PayPal (PYPL)"],
    tickers: ["AMZN", "SHOP", "V", "MA", "PYPL"],
    issues: [
      { title: "소셜 미디어 연계 국경 없는 커머스 인프라 거래액 성장", detail: "쇼피파이 기반 독립 쇼핑몰들의 물류 자동화 연동 시스템 효율화. 마진율의 구조적 반등 국면 지속." },
      { title: "B2B 디지털 결제 자동화 매출 비중의 안정적 성장세", detail: "비자와 마스터카드의 글로벌 국경 간 결제 수수료 수익 견조. 매크로 소비 둔화 우려 대비 실적 방어력 입증." }
    ]
  },
  {
    id: 8,
    name: "디지털 엔터테인먼트 및 스트리밍 플랫폼",
    desc: "광고형 요금제(AVOD) 다변화 및 프리미엄 오디오 구독 모델 번들링",
    stocks: ["Netflix (NFLX)", "Disney (DIS)", "Alphabet (GOOGL)", "Spotify (SPOT)", "Roku (ROKU)"],
    tickers: ["NFLX", "DIS", "GOOGL", "SPOT", "ROKU"],
    issues: [
      { title: "광고형 요금제(AVOD) 안착에 따른 계정당 추가 매출 확보", detail: "넷플릭스의 글로벌 순증 가입자수 기대를 상회. 단순 구독료 인상 이상의 광고 모델 다변화 수익성 검증 완료." },
      { title: "오디오 프리미엄 구독 모델 고도화 및 이익 마진 개선", detail: "스포티파이의 에피소드 및 오디오북 번들링 전략 성공으로 유료 가입자 이탈 없는 이익률 극대화 단계 진입." }
    ]
  },
  {
    id: 9,
    name: "로보틱스 및 스마트 팩토리 자동화",
    desc: "공급망 자국 재배치(Reshoring) 제조 인프라 건설 및 물류 자동화",
    stocks: ["Rockwell Automation (ROK)", "Symbotic (SYM)", "Intuitive Surgical (ISRG)", "PTC (PTC)", "Emerson Electric (EMR)"],
    tickers: ["ROK", "SYM", "ISRG", "PTC", "EMR"],
    issues: [
      { title: "공급망 자국 재배치(Reshoring)로 인한 공장 자동화 수주 누적", detail: "북미 제조 인프라 건설 붐에 따른 로크웰의 산업 제어 시스템 수주 잔고 유지. 하드웨어 자동화 수요 견조." },
      { title: "물류 센터 내 AI 기반 자율 카트 인프라 도입 가속", detail: "심보틱의 대형 유통 체인향 첨단 물류 자동화 시스템 공급 계약 확대. 물류 처리 효율 향상 증명." }
    ]
  },
  {
    id: 10,
    name: "에지 컴퓨팅 및 차세대 네트워킹 인프라",
    desc: "AI 클러스터 전용 고속 이더넷 및 열관리 액체 냉각(Liquid Cooling)",
    stocks: ["Cisco Systems (CSCO)", "Arista Networks (ANET)", "Vertiv (VRT)", "Amphenol (APH)", "Coherent (COHR)"],
    tickers: ["CSCO", "ANET", "VRT", "APH", "COHR"],
    issues: [
      { title: "AI 클러스터 전용 고속 이더넷 스위치 시장 점유율 폭발", detail: "아리스타네트웍스의 초저지연 네트워킹 장비가 빅테크 표준으로 채택되며 매출 가이드라인 상향 조정 기조 유지." },
      { title: "고성능 AI 가속기 발열 해결을 위한 액체 냉각(Liquid Cooling) 수요 폭증", detail: "버티브 등 차세대 열관리 솔루션 공급 업체의 하드웨어 부품 백로그 급증. 인프라 필수재 성격 부각." }
    ]
  }
];

function ThemeMarketCard() {
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(false);



  // 컴포넌트 마운트 시 테마 목록 가져오기
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        let themesList = [];
        if (window.electronAPI) {
          themesList = await window.electronAPI.getThemes();
        } else {
          themesList = GICS_THEMES.map(t => ({
            id: t.id,
            name: t.name,
            desc: t.desc,
            stocks: t.stocks,
            tickers: t.tickers
          }));
        }
        setThemes(themesList);
      } catch (error) {
        console.error('테마 목록 로딩 실패:', error);
      }
    };
    fetchThemes();
  }, []);

  // 테마 변경 시 테마 데이터(주가+뉴스) 가져오기
  useEffect(() => {
    if (!selectedThemeId) {
      setThemeData(null);
      setLoading(false);
      return;
    }
    
    const fetchThemeData = async () => {
      setLoading(true);
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.fetchThemeData(selectedThemeId);
          if (result.success) {
            setThemeData(result.data);
          }
        } else {
          // 브라우저 Mock 데이터 환경
          await new Promise(r => setTimeout(r, 600));
          const selectedTheme = GICS_THEMES.find(t => t.id === parseInt(selectedThemeId));
          
          const mockStocks = selectedTheme.tickers.map(ticker => {
            const stockNameStr = selectedTheme.stocks.find(s => s.includes(ticker)) || ticker;
            return {
              ticker: ticker,
              nameStr: stockNameStr,
              price: Math.floor(Math.random() * 500) + 100,
              change: (Math.random() * 10).toFixed(2),
              changePercent: ((Math.random() * 5) * (Math.random() > 0.4 ? 1 : -1))
            };
          });
          const avgChange = mockStocks.reduce((acc, cur) => acc + cur.changePercent, 0) / mockStocks.length;

          // 2개의 팩트 이슈
          const factIssues = selectedTheme.issues.map((issue, index) => ({
            title: `📌 [핵심 팩트] ${issue.title}`,
            detail: issue.detail,
            isFact: true,
            source: 'GICS Analyst',
            pubDate: new Date(Date.now() - index * 60000).toISOString()
          }));

          // 테마 번호(1~10)에 부합하는 고유 뉴스 기사 풀 (Pool)
          const THEME_NEWS_POOLS = {
            1: [
              { title: "인텔 차세대 AI 가속기 칩 양산... 대만 공급망 다각화 전격 시도", detail: "인텔이 AI 가속 칩의 가용 수율을 늘리기 위해 대만 파운드리 및 첨단 패키징(CoWoS) 파트너사들과 공급망 다각화 논의에 긴급 착수했습니다. 엔비디아의 독점 체제에 대항하여 단가를 인하하려는 포석입니다.", keyword: "Intel AI chip generation supply chain" },
              { title: "퀄컴, 프리미엄 스마트폰 수요 회복 힘입어 에지 AP 공급 단가 12% 인상 전망", detail: "온디바이스 AI 칩셋인 스냅드래곤 시리즈가 플래그십 모바일 시장에서 강력한 지배력을 고수하며 단가 상승 흐름을 이끌고 있습니다. 고사양 NPU 추가에 따른 원가 인상이 판가 상승으로 무리 없이 전이 중입니다.", keyword: "Qualcomm Snapdragon AP price hike NPU" },
              { title: "엔비디아 블랙웰 아키텍처 수율 개선... 빅테크 데이터센터 연말 대규모 인도 개시", detail: "차세대 Blackwell AI 칩셋의 공정 수율이 안정화 궤도에 올랐습니다. 이에 따라 마이크로소프트, 메타 등 하이퍼스케일러들의 클라우드 데이터센터 인프라 투자의 병목현상이 마침내 해소될 전망입니다.", keyword: "NVIDIA Blackwell yield data center delivery" },
              { title: "ASML 차세대 EUV 하이-NA 노광 장비 도입 완료... 초미세 공정 수율 극대화 전략", detail: "글로벌 파운드리 선두 기업들이 ASML의 High-NA EUV 노광 장비를 선제 도입하며 2nm 이하 초미세 공정 주도권 싸움에 돌입했습니다. 향후 반도체 미세화 수율 관리가 핵심 경쟁력으로 작용할 예정입니다.", keyword: "ASML High NA EUV lithography" },
              { title: "브로드컴, AI 네트워킹 및 커스텀 ASIC 가속기 신규 계약 역대 최대 실적 경신", detail: "구글 및 메타향 TPU와 커스텀 가속기 칩셋 설계 수주가 예상을 뛰어넘으며 매출 성장세를 견인하고 있습니다. 네트워크 스위치 칩셋과 가속기의 동반 수혜가 계속되는 국면입니다.", keyword: "Broadcom AI custom ASIC" },
              { title: "AMD 차세대 에지 AI 프로세서 탑재 울트라북 하반기 시장 점유율 급등세", detail: "AMD 라이젠 AI 탑재 랩탑 제품들이 뛰어난 전력 대 성능비로 온디바이스 비즈니스 시장에서 돌풍을 일으키고 있습니다. 경쟁사 대비 빠른 칩셋 단가 인하 방어가 실적 방어의 키로 꼽힙니다.", keyword: "AMD Ryzen AI processor notebook" }
            ],
            2: [
              { title: "마이크로소프트 애저 AI 에이전트 빌더 전면 업데이트... 업무 자동화 수익 극대화", detail: "애저(Azure)에 탑재된 신규 자율형 AI 에이전트 빌더 툴이 기업 고객들로부터 열렬한 반응을 얻고 있습니다. 클라우드 플랫폼 매출에 부가가치를 즉각 더하며 실질적인 ARPU 상승 흐름에 직결되고 있습니다.", keyword: "Microsoft Azure AI agent builder" },
              { title: "구글 딥마인드, 초경량 실시간 코딩 최적화 거대 언어 모델 벤치마크 전격 공개", detail: "개발자용 코드 생성을 돕는 초경량 NPU 맞춤형 LLM 모델이 공개되었습니다. 모바일 및 브라우저에서 대기 시간(Latency) 없이 강력한 코딩 어시스턴스를 보장해 생태계 영향력이 커지고 있습니다.", keyword: "Google DeepMind coding LLM benchmark" },
              { title: "메타 라마4 오픈소스 생태계 확장으로 자체 광고 타겟팅 정밀도 20% 상승 확인", detail: "라마4 AI 인프라가 메타의 디지털 광고 입찰 알고리즘에 전면 이식되었습니다. 소셜 광고 효율 증가에 따른 광고주당 단가 상승과 영업이익 마진 회복 팩트가 실적으로 확인되었습니다.", keyword: "Meta Llama open source advertising target" },
              { title: "팔란티어 AIP 도입 기업 수 45% 폭증... 실시간 엔터프라이즈 AI 의사결정 수혜", detail: "정부 부처 및 민간 기업용 인공지능 플랫폼 AIP 계약 건수가 사상 최대 속도로 폭증하고 있습니다. 정형/비정형 군사 정보 및 공급망 데이터를 초고속 분석하여 가치 재평가 국면을 이끌고 있습니다.", keyword: "Palantir AIP enterprise software adoption" },
              { title: "오픈AI 엔터프라이즈 구독 가입자 수 증가... 생성형 AI 수익 장세 완벽 진입", detail: "기존의 연구 개발 위주 적자 구조를 탈피하고, 유료 기업 가입자가 급격히 순증하며 수익성 골든크로스를 향해 나아가고 있습니다. 기업용 AI 인프라 구축의 필연성이 증명되었습니다.", keyword: "OpenAI Enterprise subscribers market revenue" }
            ],
            3: [
              { title: "아마존 AWS, 글로벌 하이퍼스케일 데이터센터 신규 부지 및 친환경 전력망 대거 확보", detail: "폭발하는 AI 추론/학습 트래픽을 감당하기 위해 하이퍼스케일러 AWS가 글로벌 데이터센터 투자를 강화하고 있습니다. 송전망 병목 현상에 대비해 대규모 부지와 독립 전력망 선점에 돌입했습니다.", keyword: "Amazon AWS hyperscaler data center" },
              { title: "마이크로소프트와 콘스텔레이션 에너지, 소형 원전 기반 데이터센터 전력 장기 공급 계약 체결", detail: "빅테크들이 24시간 연속 가동되는 AI 연산 센터의 전력 안정성을 위해 원자력 발전소와 장기 계약을 연계하고 있습니다. 소형모듈원전(SMR) 상용화의 신호탄이자 고정비 리스크의 통제 수단입니다.", keyword: "Microsoft Constellation energy SMR data center" },
              { title: "오라클, 자본지출(CAPEX) 규모 대폭 상향... 글로벌 하이퍼스케일 클라우드 가동률 상한선 도달", detail: "오라클 클라우드 인프라(OCI) 공급 부족 현상이 심화되며 신규 하이퍼스케일 센터 건립을 위한 투자를 늘리고 있습니다. 데이터 폭증에 따른 장비 추가 도입이 필수적인 상황입니다.", keyword: "Oracle OCI cloud CAPEX scale up" },
              { title: "에퀴닉스, 고성능 AI 가속기 서버 전용 AI 인프라 코로케이션 서비스 개시", detail: "클라우드 제공업체와 연계된 차세대 데이터 코로케이션 서비스 매출이 견조하게 증가 중입니다. AI 특화 열관리 및 냉각 설비를 조기 완비하여 백로그 물량이 급증하고 있습니다.", keyword: "Equinix AI colocation data center infrastructure" },
              { title: "구글, 글로벌 데이터센터 쿨링용 차세대 냉각 인프라 도입 가동률 극대화", detail: "구글이 AI 인프라의 과열 현상을 통제하기 위해 자체 액체 냉각 솔루션 표준을 확대 적용 중입니다. 가동 안전성 향상과 탄소 배출 절감에 탁월한 효과가 검증되었습니다.", keyword: "Google data center cooling systems scale" }
            ],
            4: [
              { title: "테슬라, 실시간 비전 FSD 자율주행 모듈 미국 거점 도시 로보택시 운행 승인 가속화", detail: "고성능 뉴럴 네트워크 비전 학습만으로 운행되는 완전 자율주행 플랫폼이 마침내 무인 차량 승인을 취득해 가고 있습니다. FSD 소프트웨어 가입 비중 증가와 플랫폼 로열티 매출이 실현되는 단계입니다.", keyword: "Tesla FSD robotaxi regulation approval" },
              { title: "엔비디아 토르 및 퀄컴 스냅드래곤 디지털 섀시 탑재한 완성차 출고량 사상 최대", detail: "완성차의 중앙 집중 컴퓨터화가 가속되며 차량 내 인포테인먼트와 자율주행을 담당하는 칩셋 공급액이 폭증하고 있습니다. 반도체 업체들의 자동차향 전방 시장 확장이 호실적으로 연결됩니다.", keyword: "Nvidia Thor Qualcomm snapdragon digital chassis automotive" },
              { title: "우버, 무인 자율주행 로보택시 플랫폼 연동 개시로 신규 호출 거래액 급등세", detail: "자율주행 제조사들의 차량을 우버의 기성 호출 시스템과 연계하는 무인 호출 서비스가 실서비스에 적용되었습니다. 하드웨어 투자 없이 소프트웨어 수수료만으로 마진율을 올리는 이상적 모델입니다.", keyword: "Uber autonomous robotaxi platform booking" },
              { title: "앱티브 차세대 차량용 중앙 집중형 컴퓨팅 아키텍처 표준 규격 글로벌 채택률 급등", detail: "완성차 제조사들이 개별 제어기에서 중앙 ECU 통합 아키텍처로 전면 리모델링 중입니다. 이를 통해 전선 간소화 및 차량 중량 절감, 중앙 소프트웨어 통제 편의성이 대폭 향상되었습니다.", keyword: "Aptiv centralized vehicle architecture ADAS" }
            ],
            5: [
              { title: "세일즈포스 아인슈타인 1 플랫폼에 AI 에이전트 빌더 전면 이식... 계약 단가 인상 성공", detail: "영업 자동화 시스템에 내장된 인공지능 비서의 라이선스 비용 인상이 성공적으로 완료되었습니다. 레거시 SaaS 소프트웨어 기업들의 성장 한계를 돌파하는 모멘텀으로 작용하고 있습니다.", keyword: "Salesforce Einstein AI agent builder price" },
              { title: "서비스나우, 생성형 AI 기반 IT 서비스 자동화 플랫폼 연간 반복 매출(ARR) 역대 최고", detail: "기업 IT 환경의 결함을 실시간 진단하고 자동 패치하는 솔루션의 ARR 매출이 견조하게 증가 중입니다. 생성형 AI 에이전트 옵션을 선택한 우량 고객사의 비중이 40%를 넘겼습니다.", keyword: "ServiceNow ITSM AI workflow ARR" },
              { title: "어도비 파이어플라이 엔터프라이즈 도입 확대로 크리에이티브 클라우드 가입자 반등세", detail: "생성형 AI 그래픽 툴 파이어플라이가 상업 저작권 이슈를 완벽 회복하며 기업 디자이너들의 러브콜을 얻고 있습니다. 우려되던 가입자 이탈율이 해소되며 이익 마진이 지지되고 있습니다.", keyword: "Adobe Firefly enterprise Creative Cloud subscriber" },
              { title: "워크데이 AI 기반 인사/재무 통합 관리 서비스 신규 서브스크립션 계약률 급등", detail: "인적자원관리(HR) 분야에 특화된 인사이트 수집 기능이 도입되며 신규 기업 가입자 성장이 우상향 곡선을 그립니다. 데이터 분석 단가의 프리미엄 추가 과금 역시 매출 성장을 서포트합니다.", keyword: "Workday AI human resource financial management subscription" },
              { title: "스노우플레이크 데이터 클라우드 활성화로 비정형 데이터 통합 분석 처리량 최고치 돌파", detail: "대규모 기업들의 텍스트, 계약서, 이미지 등 비정형 데이터를 클라우드 상에서 AI가 결합 분석하는 트래픽이 폭증했습니다. 이로 인해 스노우플레이크 데이터 보관 및 분석 매출이 동반 개선세입니다.", keyword: "Snowflake data cloud unstructured analysis consumption" }
            ],
            6: [
              { title: "크라우드스트라이크 XDR 통합 보안 플랫폼 단말(Endpoint) 방어용 AI 모듈 탑재로 계약 폭증", detail: "악성 AI를 통한 고도화된 해킹 시도를 엔드포인트 단에서 1초 만에 자동 원천 차단하는 XDR 도입이 급증했습니다. 정보보호 예산 확보 순위에서 기업들의 최우선 순위로 등극했습니다.", keyword: "Crowdstrike Falcon XDR endpoint security AI" },
              { title: "팔로알토네트웍스 단일 제어 콘솔리데이션 플랫폼 채택 기업 수 전년비 35% 급증", detail: "개별 파편화된 방화벽, 클라우드 보안, 위협 감지 시스템을 하나의 관리 대시보드로 통합 제어하려는 수요가 강세입니다. 고객 결합도 상승과 단일 솔루션 락인 효과가 뚜렷합니다.", keyword: "Palo Alto Networks consolidation platform platformization" },
              { title: "포티넷, 지능형 지속 위협(APT) 방어용 통합 하이브리드 메시 방화벽 사상 최다 판매", detail: "온프레미스 인프라와 퍼블릭 클라우드를 오가는 복잡한 네트워크 위협을 차단하는 통합 메시 방화벽의 판매고가 급성장했습니다. 엔터프라이즈의 보안 투자의 단단한 하방 경직성을 증명합니다.", keyword: "Fortinet hybrid mesh firewall APT defense" },
              { title: "지scaler, 제로 트러스트 클라우드 보안 아키텍처 기업 가입자 수 안정적 성장세 지속", detail: "원격/사내망 경계를 두지 않고 항시 신뢰 검증을 수행하는 제어 기술이 대세로 자리잡고 있습니다. 외부 접근 보안 위협을 원천 봉쇄하는 클라우드 프록시 수주가 매월 최고치를 경신합니다.", keyword: "Zscaler Zero Trust cloud security architecture ARR" },
              { title: "클라우드플레어, AI 악용 해킹 방어용 실시간 DDoS 완화 및 에지 보안 네트워크 공급 계약 체결", detail: "클라우드플레어의 에지 가상 네트워크 망이 해커들의 공격 트래픽을 원격 분산하여 메인 서비스 부하를 방지합니다. 해외 지사를 다수 둔 다국적 테크 기업들의 도입 비중이 사상 최대입니다.", keyword: "Cloudflare AI DDoS mitigation edge security network" }
            ],
            7: [
              { title: "쇼피파이 글로벌 커머스 독립 쇼핑몰 결제 수수료 속 물류망 통합 시너지로 마진 급등", keyword: "Shopify commerce merchant payment logistics margin" },
              { title: "비자 글로벌 국경 간 디지털 결제 수수료 수익, 매크로 우려에도 견고한 성장률 방어", keyword: "Visa cross border digital transaction volume" },
              { title: "마스터카드 B2B 디지털 결제 자동화 인프라 채택 금융기관 대폭 확대", keyword: "Mastercard B2B digital payment automation network" },
              { title: "페이팔 차세대 모바일 간편결제 보안 업그레이드로 글로벌 거래액 반등 성공", keyword: "PayPal mobile wallet transaction volume checkout" }
            ],
            8: [
              { title: "넷플릭스 글로벌 광고형 요금제(AVOD) 안착으로 연간 순증 가입자 수 기대치 크게 상회", keyword: "Netflix AVOD subscriber growth ad tier" },
              { title: "디즈니 플러스 오리지널 스트리밍 콘텐츠 제작 효율화 성공으로 분기 흑자 기조 안착", keyword: "Disney Plus streaming profitability subscriber volume" },
              { title: "유튜브 프리미엄 오리지널 쇼츠 크리에이터 보상 고도화로 트래픽 점유율 지속 우세", keyword: "YouTube Premium Shorts video traffic share" },
              { title: "스포티파이 오디오북 번들 서비스 유료 구독 가입자 수 급증으로 이탈률 사상 최저치 기록", keyword: "Spotify audiobook bundle paid subscriber churn rate" }
            ],
            9: [
              { title: "로크웰 오토메이션, 북미 스마트 팩토리 인프라 건설 붐으로 산업 제어 시스템 수주 누적", keyword: "Rockwell Automation smart factory industrial control orders" },
              { title: "심보틱, 대형 유통 체인향 AI 기반 자율 카트 물류 처리 효율 대폭 개선 계약 수주", keyword: "Symbotic AI autonomous cart logistics automated fulfillment" },
              { title: "인튜이티브 서지컬 차세대 다빈치 수술 로봇 글로벌 승인 가속화로 누적 시술 수 사상 최대", keyword: "Intuitive Surgical Da Vinci robotic surgery system volume" },
              { title: "PTC 차세대 스마트 팩토리 설계 CAD 소프트웨어 연간 구독 갱신율 역대 최고치 도달", keyword: "PTC CAD IoT PLM software subscription renewal rate" }
            ],
            10: [
              { title: "시스코 시스템즈, AI 엔터프라이즈 인프라용 네트워킹 장비 공급으로 수주 잔고 증가", keyword: "Cisco Systems enterprise networking hardware order backlog" },
              { title: "아리스타네트웍스, 차세대 AI 가속기 클러스터용 초저지연 이더넷 스위치 공급 사상 최대치 갱신", keyword: "Arista Networks AI cluster ethernet switch high volume" },
              { title: "버티브, 글로벌 하이퍼스케일러용 발열 해결 액체 냉각(Liquid Cooling) 부품 백로그 급증", keyword: "Vertiv liquid cooling data center heat management backlog" },
              { title: "암페놀, 고성능 AI 서버 패키징용 하이테크 커넥터 수주 폭증으로 영업이익률 최고치 달성", keyword: "Amphenol high speed connector AI server packaging profit" }
            ]
          };

          // 현재 선택된 테마의 뉴스 풀 가져오기 (없으면 1번 반도체 기본)
          const poolForCurrentTheme = THEME_NEWS_POOLS[selectedThemeId] || THEME_NEWS_POOLS[1];

          // 무작위 셔플을 통해 매번 5개의 매칭 뉴스 생성
          const shuffledPool = [...poolForCurrentTheme].sort(() => 0.5 - Math.random());
          const mockNews = [];
          const now = Date.now();
          const itemsCount = Math.min(5, shuffledPool.length);
          
          for (let i = 0; i < itemsCount; i++) {
            const item = shuffledPool[i];
            mockNews.push({
              title: item.title,
              detail: item.detail,
              source: 'Yahoo Finance',
              pubDate: new Date(now - (i + 2) * 600000).toISOString(),
              isFact: false,
              link: `https://finance.yahoo.com/lookup?s=${encodeURIComponent(item.keyword)}`
            });
          }

          setThemeData({
            market: {
              theme: selectedTheme,
              avgChangePercent: avgChange,
              stocks: mockStocks
            },
            news: [...factIssues, ...mockNews]
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
    setSelectedThemeId(e.target.value);
  };

  const handleItemClick = (e, item) => {
    e.preventDefault();
    
    const rawTitle = item.title.replace('📌 [핵심 팩트] ', '');
    const detailText = item.detail || '상세 기사 요약본을 가져오는 중이거나 제공되지 않는 기사입니다.';
    const itemType = item.isFact ? 'notice' : 'issue';
    
    // news.html로 전달할 쿼리 파라미터 구성
    const newsUrl = `/news.html?type=${itemType}` +
      `&title=${encodeURIComponent(rawTitle)}` +
      `&detail=${encodeURIComponent(detailText)}` +
      `&link=${encodeURIComponent(item.link || '')}`;
    
    window.open(newsUrl, '_blank', 'noopener,noreferrer');
  };

  const selectedThemeInfo = themes.find(t => t.id === parseInt(selectedThemeId));

  // 뉴스 분류
  const factItems = themeData ? (themeData.news || []).filter(n => n.isFact) : [];
  const realNewsItems = themeData ? (themeData.news || []).filter(n => !n.isFact) : [];

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
            <option value="">-- 테마를 선택하세요 --</option>
            {themes.map(t => (
              <option key={t.id} value={t.id}>{t.id}. {t.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {selectedThemeInfo && (
        <p className="theme-desc">{selectedThemeInfo.desc}</p>
      )}

      {!selectedThemeId ? (
        <div className="theme-empty-state">
          <div className="theme-empty-icon">🌎</div>
          <p className="theme-empty-text">테마를 선택하시면 실시간 글로벌 동향 및 이슈 요약이 표시됩니다.</p>
        </div>
      ) : loading ? (
        <div className="theme-loading">
          <div className="spinner-small"></div>
          <span>글로벌 실시간 데이터 연동 중...</span>
        </div>
      ) : themeData ? (
        <div className="theme-content animate-fade-in">
          {/* 미니 지수 (대표 5종목 가로 스크롤) */}
          <div className="theme-index">
            <div className="theme-avg">
              <span className="avg-label">테마 평균 동향</span>
              <span className={`avg-val ${themeData.market.avgChangePercent >= 0 ? 'text-up' : 'text-down'}`}>
                {themeData.market.avgChangePercent > 0 ? '+' : ''}{themeData.market.avgChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="theme-stocks-scroll">
              {themeData.market.stocks.map(s => {
                const isUp = s.changePercent >= 0;
                return (
                  <div key={s.ticker} className={`theme-stock-badge-item ${isUp ? 'badge-up' : 'badge-down'}`}>
                    <div className="ts-badge-info">
                      <span className="ts-badge-name">{s.nameStr.split(' (')[0]}</span>
                      <span className="ts-badge-ticker">{s.ticker}</span>
                    </div>
                    <div className="ts-badge-price-change">
                      <span className="ts-badge-price">${s.price > 0 ? s.price.toFixed(2) : '---'}</span>
                      <span className="ts-badge-percent">
                        {isUp ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 테마 타겟팅 글로벌 이슈 리스트 */}
          <div className="theme-news">
            {/* 1. 핵심 분석 팩트 영역 */}
            {factItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 className="theme-news-title" style={{ color: 'var(--accent-cyan)' }}>📌 테마 핵심 분석 팩트 (클릭 시 상세)</h4>
                <div className="theme-news-list">
                  {factItems.map((n, idx) => (
                    <div 
                      key={`fact-${idx}`} 
                      className="theme-news-item item-fact"
                      onClick={(e) => handleItemClick(e, n)}
                    >
                      <div className="tn-main">
                        <span className="tn-title-text">{n.title}</span>
                        <span className="tn-badge-fact">FACT SUMMARY</span>
                      </div>
                      {n.detail && (
                        <p className="tn-detail-text">{n.detail}</p>
                      )}
                      <div className="tn-meta">
                        <span className="tn-source">{n.source}</span>
                        <span className="tn-date">
                          {new Date(n.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 실시간 검색한 메인 기사 뉴스 영역 (5개 타이틀) */}
            <div>
              <h4 className="theme-news-title">💡 글로벌 실시간 검색 이슈 (최신 5개)</h4>
              <div className="theme-news-list">
                {realNewsItems.map((n, idx) => (
                  <div 
                    key={`news-${idx}`} 
                    className="theme-news-item item-news"
                    onClick={(e) => handleItemClick(e, n)}
                  >
                    <div className="tn-main">
                      <span className="tn-title-text">{n.title}</span>
                    </div>
                    {n.detail && (
                      <p className="tn-detail-text">{n.detail}</p>
                    )}
                    <div className="tn-meta">
                      <span className="tn-source">{n.source}</span>
                      <span className="tn-date">
                        {new Date(n.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
                {realNewsItems.length === 0 && (
                  <div className="theme-error" style={{ fontSize: '0.8rem', padding: '10px' }}>
                    실시간 검색 이슈 데이터를 가져오는 중입니다...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="theme-error">데이터를 불러오지 못했습니다.</div>
      )}


    </div>
  );
}

export default ThemeMarketCard;
