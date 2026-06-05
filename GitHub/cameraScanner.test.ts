import { initCameraScanner } from './cameraScanner';
import { showToast } from '../../shared/ui/toast';

// 외부 모듈(UI 알림 등)을 테스트에서 실제 실행하지 않도록 Mock 처리합니다.
jest.mock('../../shared/ui/toast', () => ({
    showToast: jest.fn()
}));

/**
 * cameraScanner Feature 모듈 (OCR 데이터 매핑 및 UI 제어) 단위 테스트
 */
describe('cameraScanner 기능 테스트', () => {
    // 각 테스트가 실행되기 전 가상 DOM 환경과 타이머를 초기화합니다.
    beforeEach(() => {
        jest.useFakeTimers(); // setTimeout 등을 즉시 실행하기 위한 가짜 타이머
        
        // 1단계 [DOM 구성]: 테스트 대상 함수가 제어하는 HTML 뼈대를 가상으로 구성합니다.
        document.body.innerHTML = `
            <button id="openScannerBtn"></button>
            <div id="cameraModal" style="display:none;"></div>
            <div id="scannerSpinner" style="display:none;"></div>
            <div id="spinnerStatusText"></div>
            <div id="scannerLaser"></div>
            <div id="scannedResultCard" style="display:none;"></div>
            
            <span id="scanMedName"></span>
            <span id="scanMedDosage"></span>
            <span id="scanMedMemo"></span>
            <span id="scanConfidence"></span>
            <div id="scanRecommendedSlots"></div>
            
            <input id="manualBarcodeNum" type="text" />
            <button id="manualBarcodeSubmitBtn"></button>
        `;
        
        // 2단계 [라이브러리 Mock]: 외부 CDN으로 주입되는 Html5Qrcode 객체를 가짜로 생성합니다.
        (global as any).Html5Qrcode = jest.fn().mockImplementation(() => ({
            start: jest.fn(),
            stop: jest.fn(),
            scanFile: jest.fn()
        }));
        (global as any).Html5QrcodeSupportedFormats = { EAN_13: 1, QR_CODE: 2 };
    });

    // 각 테스트 종료 후 DOM 및 타이머 상태를 깨끗하게 정리합니다.
    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('[Happy Path] 등록된 바코드를 입력하면 OCRScanResult 구조에 맞춰 올바르게 UI가 렌더링되어야 한다.', () => {
        initCameraScanner();
        const manualInput = document.getElementById('manualBarcodeNum') as HTMLInputElement;
        
        // 1단계 [동작 트리거]: 타이레놀 ER 서방정에 해당하는 식별 바코드(8806433022351) 입력 및 엔터
        manualInput.value = '8806433022351';
        manualInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

        // 2단계 [시간 진행]: 바코드 스캔 후의 5단계 프로그래스(setTimeout) 애니메이션을 즉시 완료
        jest.runAllTimers();

        // 3단계 [결과 검증]: OCRScanResult 인터페이스에 정의된 대로 데이터가 DOM에 정확히 매핑되었는지 확인
        expect(document.getElementById('scanMedName')?.textContent).toBe('타이레놀 ER 서방정');
        expect(document.getElementById('scanMedDosage')?.textContent).toBe('325mg 1정');
        expect(document.getElementById('scanConfidence')?.textContent).toBe('99.1% 신뢰도');
    });

    it('[Edge Case] 미등록(가상 DB에 없는) 바코드를 스캔하면 기본 예외(Fallback) 데이터로 UI가 렌더링되어야 한다.', () => {
        initCameraScanner();
        const manualInput = document.getElementById('manualBarcodeNum') as HTMLInputElement;
        
        // 1단계 [동작 트리거]: 알 수 없는 임의의 바코드 입력
        manualInput.value = '1234567890123';
        manualInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        jest.runAllTimers();

        // 2단계 [결과 검증]: 기본 식별 데이터가 생성 및 매핑되었는지 확인
        expect(document.getElementById('scanMedName')?.textContent).toContain('AI 식별 미등록약품');
    });
});