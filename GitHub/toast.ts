/**
 * 토스트 알림의 시각적 테마를 정의하는 유니온 타입
 */
export type ToastType = 'primary' | 'error' | 'secondary';

/**
 * 화면 하단에 일회성 팝업(Toast) 메시지를 표시하는 함수
 * @param {string} message - 사용자에게 보여줄 알림 텍스트
 * @param {ToastType} [type='primary'] - 알림의 시각적 테마 타입 (에러, 성공 등)
 */
export const showToast = (message: string, type: ToastType = 'primary'): void => {
    // 1단계 [검증]: 토스트를 렌더링할 부모 컨테이너가 DOM에 존재하는지 확인
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('[UI 경고] toastContainer 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [요소 생성]: 새로운 DOM 요소를 생성하고 상태에 따른 CSS 클래스 부여
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'secondary' ? 'toast-secondary' : ''}`;
    
    // 3단계 [아이콘 설정]: 테마 타입에 따라 삽입할 SVG 아이콘 분기 처리
    const isError = type === 'error';
    const iconSvg = isError 
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;

    // 4단계 [구조 조립]: 생성된 요소에 내부 HTML 구조 주입
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            ${iconSvg}
            <span>${message}</span>
        </div>
        <button type="button" aria-label="닫기" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:12px;font-weight:700;">×</button>
    `;

    // 5단계 [이벤트 바인딩]: 닫기 버튼 클릭 시 애니메이션 적용 후 요소 제거
    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // 6단계 [렌더링 및 자동 제거]: DOM에 부착한 뒤, 3.2초 후 자동으로 메모리에서 해제
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3200);
};