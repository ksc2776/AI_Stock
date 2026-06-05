import { initHealthLogForm } from './submitHealthLog';
import { state } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

// 1단계 [외부 모듈 Mocking]: UI 알림 등 부수 효과를 일으키는 외부 함수를 가짜(Mock) 함수로 대체합니다.
jest.mock('../../shared/ui/toast', () => ({
    showToast: jest.fn()
}));

/**
 * 건강 일지 등록 폼 제출(Feature) 로직 및 전역 상태(AppState) 업데이트 단위 테스트
 */
describe('submitHealthLog 기능 단위 테스트', () => {
    let form: HTMLFormElement;

    // 각 테스트가 실행되기 전 가상 DOM 환경과 상태를 초기화합니다.
    beforeEach(() => {
        // 2단계 [DOM 구성]: 테스트 대상 모듈이 의존하는 HTML 폼 요소 뼈대를 가상으로 렌더링합니다.
        document.body.innerHTML = `
            <form id="healthLogForm">
                <input id="healthTemp" value="" />
                <input id="healthBP" value="" />
                <input id="healthHR" value="" />
                <input id="healthMemo" value="" />
                
                <!-- 증상 슬라이더 입력 필드 (0~10) -->
                <input id="symptomHeadache" type="range" value="0" />
                <input id="symptomNausea" type="range" value="0" />
                <input id="symptomFatigue" type="range" value="0" />
                <input id="symptomSleep" type="range" value="0" />
                
                <button type="submit">기록 저장</button>
            </form>
            <div id="healthLogFormBody" style="display:block;"></div>
            <button id="toggleHealthLogFormBtn" style="transform: rotate(180deg);"></button>
        `;

        form = document.getElementById('healthLogForm') as HTMLFormElement;

        // 3단계 [상태 초기화]: 전역 상태의 건강 일지 객체를 비우고 Mock 함수 호출 기록을 리셋합니다.
        state.healthLogs = {};
        jest.clearAllMocks();

        // 4단계 [기능 초기화]: 테스트 대상 함수를 실행하여 폼 제출 이벤트 리스너를 바인딩합니다.
        initHealthLogForm();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('[Happy Path] 정상적인 활력 징후와 증상 데이터를 입력하고 제출하면 전역 상태에 올바르게 저장되어야 한다.', () => {
        // 1단계 [값 입력]: 가상 DOM 요소에 정상적인 건강 기록 데이터를 주입합니다.
        (document.getElementById('healthTemp') as HTMLInputElement).value = '36.8';
        (document.getElementById('healthBP') as HTMLInputElement).value = '120/80';
        (document.getElementById('healthHR') as HTMLInputElement).value = '75';
        (document.getElementById('healthMemo') as HTMLInputElement).value = '아침 운동 후 측정함';
        
        (document.getElementById('symptomHeadache') as HTMLInputElement).value = '2';
        (document.getElementById('symptomFatigue') as HTMLInputElement).value = '5';

        // 2단계 [동작 트리거]: 폼 제출(Submit) 이벤트를 강제로 발생시킵니다.
        form.dispatchEvent(new Event('submit'));

        // 3단계 [결과 검증]: 상태 객체 업데이트 및 데이터 무결성(타입 변환 포함)을 확인합니다.
        const today = new Date().toISOString().split('T')[0];
        const savedLog = state.healthLogs[today];
        expect(savedLog).toBeDefined();
        expect(savedLog.temp).toBe('36.8');
        expect(savedLog.memo).toBe('아침 운동 후 측정함');
        
        // 증상 데이터가 숫자로 올바르게 파싱되어 객체 형태로 묶였는지 검증
        expect(savedLog.symptoms).toEqual({ headache: 2, nausea: 0, fatigue: 5, sleep: 0 });

        // 4단계 [부수 효과 검증]: 알림 토스트 출력 및 렌더링 호출을 확인합니다.
        expect(showToast).toHaveBeenCalledWith(`✨ ${today} 건강 기록이 성공적으로 저장되었습니다!`);
    });

    it('[Edge Case] 날짜 입력을 비워둔 채 제출할 경우, 시스템의 오늘 날짜를 기준으로 자동 저장되어야 한다.', () => {
        (document.getElementById('symptomSleep') as HTMLInputElement).value = '8';

        form.dispatchEvent(new Event('submit'));

        const today = new Date().toISOString().split('T')[0];
        
        expect(state.healthLogs[today]).toBeDefined();
        expect(state.healthLogs[today].symptoms.sleep).toBe(8);
    });
});