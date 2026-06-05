/**
 * 문자열 내의 특수 문자를 HTML 엔티티로 변환하여 XSS(크로스 사이트 스크립팅) 공격을 방지하는 함수
 * @param {string | null | undefined} str - 변환할 원본 문자열
 * @returns {string} 안전하게 이스케이프 처리된 문자열
 */
export const escapeHTML = (str: string | null | undefined): string => {
    // 1단계 [검증]: 입력값이 유효하지 않으면 빈 문자열 반환
    if (!str) return '';
    
    // 2단계 [변환]: 정규식을 사용하여 주요 특수 문자를 안전한 HTML 표기법으로 치환
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * 클라우드 동기화를 위한 고유 식별 키(UUID 유사 식별자)를 생성하는 함수
 * @returns {string} 16자리의 무작위 영문 및 숫자가 조합된 동기화 키 (예: 'MV-A1B2...')
 */
export const generateSyncKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // 1단계 [초기화 및 생성]: 접두사 'MV-'에 16글자의 난수 문자를 덧붙여 고유 식별자 생성
    const randomString = Array.from({ length: 16 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `MV-${randomString}`;
};