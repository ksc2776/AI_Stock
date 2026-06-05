import { initAddMedicationForm } from './addMedication';
import { state } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

// 1단계 [외부 모듈 Mocking]: UI 알림 등 부수 효과를 일으키는 외부 함수를 가짜(Mock) 함수로 대체합니다.
jest.mock('../../shared/ui/toast', () => ({
    showToast: jest.fn()
}));

/**
 * 의약품 폼 제출(Feature) 로직 및 전역 상태(AppState) 업데이트 단위 테스트
 */
describe('addMedication 기능 단위 테스트', () => {
    let form: HTMLFormElement;

    // 각 테스트가 실행되기 전 가상 DOM 환경과 상태를 초기화합니다.
    beforeEach(() => {
        // 2단계 [DOM 구성]: 테스트 대상 모듈이 의존하는 HTML 폼 요소 뼈대를 가상으로 렌더링합니다.
        document.body.innerHTML = `
            <form id="medForm">
                <input id="medName" value="" />
                <input id="medDosage" value="" />
                <select id="medFrequency">
                    <option value="daily">매일</option>
                    <option value="needed">필요시</option>
                </select>
                <input id="medStock" value="" />
                <input id="medMemo" value="" />
                
                <input type="checkbox" name="medTime" value="morning" />
                <input type="checkbox" name="medTime" value="evening" />
                
                <button type="submit">등록</button>
            </form>
            <div id="medFormBody" style="display:block;"></div>
            <button id="toggleMedFormBtn" style="transform: rotate(180deg);"></button>
        `;

        form = document.getElementById('medForm') as HTMLFormElement;

        // 3단계 [상태 초기화]: 전역 상태의 의약품 배열을 비우고 Mock 함수 호출 기록을 리셋합니다.
        state.medications = [];
        jest.clearAllMocks();

        // 4단계 [기능 초기화]: 테스트 대상 함수 실행하여 이벤트 리스너 바인딩
        initAddMedicationForm();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('[Happy Path] 필수 입력값을 모두 채우고 폼 제출 시, 전역 상태에 약품이 성공적으로 추가되어야 한다.', () => {
        // 1단계 [값 입력]: 가상 DOM 요소에 정상적인 약품 데이터를 주입합니다.
        (document.getElementById('medName') as HTMLInputElement).value = '타이레놀';
        (document.getElementById('medDosage') as HTMLInputElement).value = '1정';
        (document.getElementById('medFrequency') as HTMLSelectElement).value = 'needed';
        (document.getElementById('medStock') as HTMLInputElement).value = '10';
        
        const morningCheck = document.querySelector('input[value="morning"]') as HTMLInputElement;
        morningCheck.checked = true;

        // 2단계 [동작 트리거]: 폼 제출(Submit) 이벤트를 강제로 발생시킵니다.
        form.dispatchEvent(new Event('submit'));

        // 3단계 [결과 검증]: 상태 객체 업데이트 및 부수 효과(UI 상태/렌더링 호출)를 확인합니다.
        expect(state.medications.length).toBe(1);
        expect(state.medications[0].name).toBe('타이레놀');
        expect(state.medications[0].dosage).toBe('1정');
        expect(state.medications[0].stock).toBe(10);
        expect(state.medications[0].times).toEqual(['morning']);
        
        expect(showToast).toHaveBeenCalledWith("✨ '타이레놀'이(가) 성공적으로 등록되었습니다!");
    });

    it('[Edge Case] 약품 이름이 누락된 경우, 상태에 추가되지 않고 에러 토스트를 띄워야 한다.', () => {
        (document.getElementById('medDosage') as HTMLInputElement).value = '1정';
        (document.querySelector('input[value="morning"]') as HTMLInputElement).checked = true;

        form.dispatchEvent(new Event('submit'));

        expect(state.medications.length).toBe(0);
        expect(showToast).toHaveBeenCalledWith('⚠️ 약품 이름을 입력해주세요.', 'error');
    });

    it('[Edge Case] 복약 시간대를 선택하지 않은 경우, 상태에 추가되지 않고 에러 토스트를 띄워야 한다.', () => {
        (document.getElementById('medName') as HTMLInputElement).value = '아스피린';
        (document.getElementById('medDosage') as HTMLInputElement).value = '1정';
        // 시간대 체크박스는 아무것도 체크하지 않은 상태 유지

        form.dispatchEvent(new Event('submit'));

        expect(state.medications.length).toBe(0);
        expect(showToast).toHaveBeenCalledWith('⚠️ 최소 하나의 복약 시간대를 선택해주세요.', 'error');
    });
});