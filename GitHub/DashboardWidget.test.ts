import { renderComplianceProgress, renderHealthSummary } from './DashboardWidget';
import { state } from '../entities/store/appState';

/**
 * DashboardWidget 모듈의 복약 진행률(Progress) 렌더링 기능 단위 테스트
 */
describe('renderComplianceProgress 기능 단위 테스트', () => {
    const today = new Date().toISOString().split('T')[0];

    // 각 테스트가 실행되기 전 가상 DOM 환경과 상태를 초기화합니다.
    beforeEach(() => {
        // 1단계 [DOM 구성]: 위젯이 업데이트할 진행률 바와 텍스트 요소를 가상으로 생성합니다.
        document.body.innerHTML = `
            <svg>
                <circle id="complianceRing" r="50"></circle>
            </svg>
            <div id="complianceText"></div>
            <div id="compliancePercentText"></div>
        `;

        // 2단계 [상태 초기화]: 전역 상태를 깨끗하게 리셋합니다.
        state.medications = [];
        state.intakeRecords = {};
    });

    afterEach(() => {
        // 3단계 [DOM 정리]: 테스트 종료 후 가상 DOM을 비웁니다.
        document.body.innerHTML = '';
    });

    it('[Happy Path] 일반적인 복약 일정이 있을 때 진행률을 정확하게 계산하고 렌더링해야 한다.', () => {
        // 1단계 [데이터 세팅]: 총 3번(아침, 점심, 저녁) 복용해야 하는 데이터와 2번 완료된 기록 설정
        state.medications = [
            { id: 'med-1', name: '약A', dosage: '1정', frequency: 'daily', times: ['morning', 'evening'] },
            { id: 'med-2', name: '약B', dosage: '1정', frequency: 'daily', times: ['afternoon'] }
        ];
        state.intakeRecords[today] = ['med-1-morning', 'med-2-afternoon']; // 3번 중 2번 완료 (67%)

        // 2단계 [동작 트리거]: 위젯 렌더링 함수 호출
        renderComplianceProgress();

        // 3단계 [결과 검증]: DOM 요소의 너비와 텍스트가 67%로 올바르게 갱신되었는지 확인
        const complianceText = document.getElementById('complianceText');

        expect(complianceText?.textContent).toContain('2 / 3 개 복용 완료');
        expect(complianceText?.textContent).toContain('67%');
    });

    it('[Edge Case] 등록된 약이 없거나 "필요시(needed)" 약만 있는 경우 진행률은 0%로 안전하게 처리되어야 한다.', () => {
        // 1단계 [데이터 세팅]: 분모가 0이 될 수 있는 '필요시' 약품만 등록
        state.medications = [
            { id: 'med-1', name: '타이레놀', dosage: '1정', frequency: 'needed', times: ['morning'] }
        ];
        state.intakeRecords[today] = ['med-1-morning']; 

        // 2단계 [동작 트리거]
        renderComplianceProgress();

        // 3단계 [결과 검증]: NaN(Not a Number) 에러 방어 로직이 작동하여 0%로 렌더링되는지 확인
        const complianceText = document.getElementById('complianceText');

        expect(complianceText?.textContent).toContain('0%');
    });

    it('[Edge Case] DOM 요소가 없는 경우 에러를 던지지 않고 안전하게(Graceful) 종료되어야 한다.', () => {
        document.body.innerHTML = ''; // 요소를 모두 제거
        
        // 콘솔 경고(warn)를 가로채어 의도된 경고인지 확인
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // 에러가 발생하지 않는지 검증
        expect(() => renderComplianceProgress()).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith('[UI 경고] 대시보드 진행률(Ring) 요소를 찾을 수 없습니다.');
        
        consoleSpy.mockRestore();
    });
});

/**
 * DashboardWidget 모듈의 건강 요약 정보(Health Summary) 렌더링 기능 단위 테스트
 */
describe('renderHealthSummary 기능 단위 테스트', () => {
    const today = new Date().toISOString().split('T')[0];

    beforeEach(() => {
        // 1단계 [DOM 구성]: 요약 정보를 렌더링할 카드 컨테이너를 가상으로 생성합니다.
        document.body.innerHTML = `
            <div id="healthSummaryCard"></div>
        `;
        // 2단계 [상태 초기화]
        state.healthLogs = {};
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('[Happy Path] 오늘 기록된 건강 일지가 있을 경우 요약 정보를 정확하게 렌더링해야 한다.', () => {
        // 1단계 [데이터 세팅]: 증상 합계가 3(양호)인 건강 기록 주입
        state.healthLogs[today] = {
            temp: '36.5',
            bp: '120/80',
            hr: '70',
            symptoms: { headache: 1, nausea: 0, fatigue: 2, sleep: 8 }, 
            memo: '아침 운동 후 쾌조의 컨디션'
        };

        // 2단계 [동작 트리거]
        renderHealthSummary();

        // 3단계 [결과 검증]: DOM 요소에 데이터가 정확히 바인딩되었는지 확인
        const card = document.getElementById('healthSummaryCard');
        expect(card?.innerHTML).toContain('오늘의 컨디션: 😊 매우 좋음 (양호)');
        expect(card?.innerHTML).toContain('36.5');
        expect(card?.innerHTML).toContain('120/80');
        expect(card?.innerHTML).toContain('70');
        expect(card?.innerHTML).toContain('8 시간');
        expect(card?.innerHTML).toContain('아침 운동 후 쾌조의 컨디션');
    });

    it('[Edge Case] 건강 일지가 없을 경우 빈 상태(Empty State) 안내 메시지를 렌더링해야 한다.', () => {
        renderHealthSummary();

        const card = document.getElementById('healthSummaryCard');
        expect(card?.innerHTML).toContain('오늘 기록된 건강 상태가 없습니다.');
    });

    it('[Edge Case] 증상 점수(두통+메스꺼움+피로도) 합계에 따라 컨디션 텍스트가 다르게 표시되어야 한다.', () => {
        // 1. 합계가 15 초과일 때 (매우 나쁨)
        state.healthLogs[today] = { temp: '', bp: '', hr: '', memo: '', symptoms: { headache: 8, nausea: 5, fatigue: 5, sleep: 4 } }; // 합계 18
        renderHealthSummary();
        expect(document.getElementById('healthSummaryCard')?.innerHTML).toContain('😫 매우 나쁨 (휴식 필요)');

        // 2. 합계가 8 초과 15 이하일 때 (약간 불편함)
        state.healthLogs[today] = { temp: '', bp: '', hr: '', memo: '', symptoms: { headache: 4, nausea: 2, fatigue: 4, sleep: 6 } }; // 합계 10
        renderHealthSummary();
        expect(document.getElementById('healthSummaryCard')?.innerHTML).toContain('😐 약간 불편함 (주의 요망)');
    });

    it('[Edge Case] DOM 요소가 없는 경우 에러를 던지지 않고 안전하게(Graceful) 종료되어야 한다.', () => {
        document.body.innerHTML = '';
        expect(() => renderHealthSummary()).not.toThrow();
    });
});