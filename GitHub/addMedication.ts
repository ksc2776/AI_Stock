import { state, Medication } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

/**
 * 의약품 수동 등록 폼(Form)의 제출 이벤트를 제어하고 전역 상태에 데이터를 추가하는 기능 모듈
 */
export const initAddMedicationForm = (): void => {
    // 1단계 [DOM 탐색]: 의약품 등록 폼 요소 가져오기
    const form = document.getElementById('medForm') as HTMLFormElement | null;
    if (!form) {
        console.warn('[UI 경고] medForm 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [이벤트 바인딩]: 폼 제출(Submit) 이벤트 가로채기
    form.addEventListener('submit', (e: Event) => {
        e.preventDefault(); // 브라우저 기본 새로고침(페이지 이동) 액션 방지

        // 3단계 [데이터 추출]: 사용자가 폼에 입력한 데이터 노드 수집
        const nameInput = document.getElementById('medName') as HTMLInputElement | null;
        const dosageInput = document.getElementById('medDosage') as HTMLInputElement | null;
        const freqInput = document.getElementById('medFrequency') as HTMLSelectElement | null;
        const stockInput = document.getElementById('medStock') as HTMLInputElement | null;
        const memoInput = document.getElementById('medMemo') as HTMLInputElement | null;

        // 선택된 복약 시간대(체크박스) 배열 수집
        const timeCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="medTime"]:checked');
        const selectedTimes = Array.from(timeCheckboxes).map(cb => cb.value);

        const name = nameInput?.value.trim() || '';
        const dosage = dosageInput?.value.trim() || '';

        // 4단계 [유효성 검증]: 필수 입력값 무결성 확인
        if (!name) {
            showToast('⚠️ 약품 이름을 입력해주세요.', 'error');
            return;
        }
        if (!dosage) {
            showToast('⚠️ 복용량(예: 1정)을 입력해주세요.', 'error');
            return;
        }
        if (selectedTimes.length === 0) {
            showToast('⚠️ 최소 하나의 복약 시간대를 선택해주세요.', 'error');
            return;
        }

        // 5단계 [데이터 객체 생성]: 상태 저장소(Store) 규격에 맞춘 의약품 객체 구성
        const newMedication: Medication = {
            id: `med-${Date.now()}`, // 타임스탬프 기반 고유 식별자 생성
            name: name,
            dosage: dosage,
            times: selectedTimes,
            frequency: freqInput?.value || 'daily',
            stock: stockInput?.value ? Number(stockInput.value) : '',
            memo: memoInput?.value.trim() || ''
        };

        // 6단계 [상태 업데이트]: 전역 상태(Store)에 신규 의약품 데이터 저장
        state.addMedication(newMedication);

        // 7단계 [UI 초기화 및 알림]: 폼 내용 초기화, 아코디언 메뉴 닫기 및 사용자 피드백 제공
        form.reset();
        
        const medFormBody = document.getElementById('medFormBody');
        const toggleBtn = document.getElementById('toggleMedFormBtn');
        if (medFormBody) medFormBody.style.display = 'none';
        if (toggleBtn) toggleBtn.style.transform = 'rotate(0deg)';

        showToast(`✨ '${newMedication.name}'이(가) 성공적으로 등록되었습니다!`);
    });
};