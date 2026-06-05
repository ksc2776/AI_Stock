import { escapeHTML, generateSyncKey } from './utils';

/**
 * 공통 유틸리티 모듈(utils.ts) 기능 검증 테스트 스위트
 */
describe('Utils 공통 모듈 검증', () => {
    
    // 1단계 [고유 키 생성 검증]
    describe('generateSyncKey', () => {
        it('접두사 MV- 를 포함하여 총 19자리의 문자열을 반환해야 한다.', () => {
            const key = generateSyncKey();
            expect(key.startsWith('MV-')).toBe(true);
            // 'MV-' (3글자) + 난수 16글자 = 19글자
            expect(key.length).toBe(19); 
        });

        it('생성된 키는 매번 고유한 난수 값을 가져야 한다.', () => {
            const key1 = generateSyncKey();
            const key2 = generateSyncKey();
            expect(key1).not.toBe(key2);
        });
    });

    // 2단계 [XSS 보안 변환 검증]
    describe('escapeHTML', () => {
        it('XSS 공격을 유발할 수 있는 특수문자를 안전한 HTML 엔티티로 변환해야 한다.', () => {
            const maliciousStr = '<script>alert("hack & slash\'s")</script>';
            const escaped = escapeHTML(maliciousStr);
            expect(escaped).toBe('&lt;script&gt;alert(&quot;hack &amp; slash&#039;s&quot;)&lt;/script&gt;');
        });

        it('null이나 undefined가 입력되면 빈 문자열을 반환해야 한다.', () => {
            expect(escapeHTML(null)).toBe('');
            expect(escapeHTML(undefined)).toBe('');
        });
    });
});