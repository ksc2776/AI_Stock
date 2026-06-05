import { state, HealthLog } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

/**
 * 건강 일지 등록 폼(Form)의 제출 이벤트를 제어하고 전역 상태에 기록을 저장하는 기능 모듈
 */
export const initHealthLogForm = (): void => {
    // 1단계 [DOM 탐색]: 건강 일지 폼 요소 가져오기
    const form = document.getElementById('healthLogForm') as HTMLFormElement | null;
    if (!form) {
        console.warn('[UI 경고] healthLogForm 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [이벤트 바인딩]: 폼 제출(Submit) 이벤트 가로채기
    form.addEventListener('submit', (e: Event) => {
        e.preventDefault(); // 브라우저 기본 페이지 새로고침 방지

        // 3단계 [데이터 추출]: 사용자가 폼에 입력한 활력 징후 및 증상 슬라이더 노드 수집
        const tempInput = document.getElementById('healthTemp') as HTMLInputElement | null;
        const bpInput = document.getElementById('healthBP') as HTMLInputElement | null;
        const hrInput = document.getElementById('healthHR') as HTMLInputElement | null;
        const memoInput = document.getElementById('healthMemo') as HTMLInputElement | null;

        // 증상 기록 슬라이더 요소 (통상적으로 0~10 사이의 값을 가짐)
        const headacheInput = document.getElementById('symptomHeadache') as HTMLInputElement | null;
        const nauseaInput = document.getElementById('symptomNausea') as HTMLInputElement | null;
        const fatigueInput = document.getElementById('symptomFatigue') as HTMLInputElement | null;
        const sleepInput = document.getElementById('symptomSleep') as HTMLInputElement | null;

        const date = new Date().toISOString().split('T')[0];

        // 4단계 [유효성 검증]: 날짜 지정 여부 확인
        if (!date) {
            showToast('⚠️ 기록을 저장할 날짜를 선택해주세요.', 'error');
            return;
        }

        // 5단계 [데이터 객체 생성]: 상태 저장소(Store) 규격에 맞춘 HealthLog 객체 구성
        const logData: HealthLog = {
            temp: tempInput?.value.trim() || '',
            bp: bpInput?.value.trim() || '',
            hr: hrInput?.value.trim() || '',
            symptoms: {
                headache: Number(headacheInput?.value || 0),
                nausea: Number(nauseaInput?.value || 0),
                fatigue: Number(fatigueInput?.value || 0),
                sleep: Number(sleepInput?.value || 0)
            },
            memo: memoInput?.value.trim() || ''
        };

        // 6단계 [상태 업데이트]: 전역 상태(Store)의 해당 날짜 슬롯에 건강 일지 데이터 병합 및 저장
        state.saveHealthLog(date, logData);

        // 7단계 [UI 갱신 및 알림]: 폼 초기화는 생략(사용자가 연이어 수정할 수 있도록)하고 알림만 제공
        const logFormBody = document.getElementById('healthLogFormBody');
        const toggleBtn = document.getElementById('toggleHealthLogFormBtn');
        
        // UI 아코디언이 존재한다면 닫기 처리
        if (logFormBody && logFormBody.style.display !== 'none') {
            logFormBody.style.display = 'none';
            if (toggleBtn) toggleBtn.style.transform = 'rotate(0deg)';
        }

        showToast(`✨ ${date} 건강 기록이 성공적으로 저장되었습니다!`);
        if (memoInput) memoInput.value = ''; // 폼 초기화 시 메모만 비우고 상태 유지
    });
};