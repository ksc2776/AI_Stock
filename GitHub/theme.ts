import { showToast } from './toast';

/**
 * 애플리케이션의 다크 모드/라이트 모드 전환 기능을 초기화하는 함수
 */
export const initThemeToggle = (): void => {
    // 1단계 [DOM 탐색]: 화면의 테마 전환 버튼 요소 가져오기
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    const sunIcon = btn.querySelector('.sun-icon') as HTMLElement;
    const moonIcon = btn.querySelector('.moon-icon') as HTMLElement;

    // 2단계 [상태 반영]: 주어진 테마 문자열에 맞춰 최상위 DOM 속성 및 아이콘 가시성 변경
    const setTheme = (theme: string): void => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('medivibe_theme', theme);
        
        if (sunIcon && moonIcon) {
            if (theme === 'light') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    };

    // 3단계 [초기화]: 로컬 스토리지에서 기존 테마 설정을 불러와 렌더링 적용 (기본값: dark)
    const savedTheme = localStorage.getItem('medivibe_theme') || 'dark';
    setTheme(savedTheme);

    // 4단계 [이벤트 바인딩]: 사용자 클릭 시 테마 상태를 토글하고 알림 제공
    btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        showToast(`☀ ${nextTheme === 'light' ? '라이트' : '다크'} 모드로 테마를 변경했습니다.`, 'secondary');
    });
};