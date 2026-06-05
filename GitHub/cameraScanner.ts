import { showToast } from '../../shared/ui/toast';

// 외부 라이브러리(CDN) 타입 선언
declare const Html5Qrcode: any;
declare const Html5QrcodeSupportedFormats: any;

// ==========================================================================
// 1. 핵심 데이터 모델 타입 정의 (Entities/Types)
// ==========================================================================

/**
 * OCR 바코드 스캔 결과를 매핑하는 데이터 인터페이스
 */
export interface OCRScanResult {
    name: string;
    dosage: string;
    memo: string;
    slots: string[];
    confidence: string;
    barcode: string;
}

// ==========================================================================
// 2. 바코드 스캐너 기능 모듈 (Feature)
// ==========================================================================

/**
 * 바코드 스캐너 기능을 초기화하고 DOM 이벤트를 바인딩하는 함수
 */
export const initCameraScanner = (): void => {
    // 1단계 [DOM 요소 할당]: 스캐너 제어에 필요한 화면 요소들을 가져옵니다.
    const openBtn = document.getElementById('openScannerBtn') as HTMLButtonElement | null;
    const closeBtn = document.getElementById('closeScannerBtn') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('cancelScanBtn') as HTMLButtonElement | null;
    const captureBtn = document.getElementById('captureFrameBtn') as HTMLButtonElement | null;
    const modal = document.getElementById('cameraModal') as HTMLElement | null;
    const spinner = document.getElementById('scannerSpinner') as HTMLElement | null;
    const statusText = document.getElementById('spinnerStatusText') as HTMLElement | null;
    const laser = document.getElementById('scannerLaser') as HTMLElement | null;
    const resultCard = document.getElementById('scannedResultCard') as HTMLElement | null;
    const fallbackBanner = document.getElementById('scannerFallbackBanner') as HTMLElement | null;
    const rejectBtn = document.getElementById('rejectScanResultBtn') as HTMLButtonElement | null;
    const applyBtn = document.getElementById('applyScanResultBtn') as HTMLButtonElement | null;

    // 파일 및 수동 입력 요소
    const fileInput = document.getElementById('scannerFileInput') as HTMLInputElement | null;
    const manualSubmitBtn = document.getElementById('manualBarcodeSubmitBtn') as HTMLButtonElement | null;
    const manualInput = document.getElementById('manualBarcodeNum') as HTMLInputElement | null;
    const launchZxingAppBtn = document.getElementById('launchZxingAppBtn') as HTMLButtonElement | null;

    if (!modal) return; // 주요 모달이 없으면 실행하지 않음

    // 2단계 [가상 DB 설정]: AI 판독을 흉내 내기 위한 가상 약품 데이터베이스 설정
    const mockAIDatabase: OCRScanResult[] = [
        { name: "타이레놀 ER 서방정", dosage: "325mg 1정", memo: "두통 및 해열 시 복용, 일일 최대 6정 초과 금지", slots: ["morning", "evening"], confidence: "99.1%", barcode: "8806433022351" },
        { name: "고함량 활성 비타민 B100", dosage: "1정 (식후 즉시)", memo: "공복 섭취 시 속쓰림 유발 가능", slots: ["morning", "afternoon"], confidence: "98.4%", barcode: "8806536005313" },
        { name: "락토핏 생유산균 골드", dosage: "1포 (식전 30분)", memo: "아침 공복에 따뜻한 물과 함께 섭취 권장", slots: ["morning"], confidence: "99.5%", barcode: "8806411123456" },
        { name: "아스피린 프로텍트 정", dosage: "100mg 1정", memo: "심혈관 예방 목적 복용 시 임의 중단 금지", slots: ["morning"], confidence: "97.8%", barcode: "8806412345678" },
        { name: "초임계 알티지 오메가3", dosage: "1캡슐 (식후 즉시)", memo: "비린내가 올라올 수 있으니 찬 물과 복용", slots: ["evening"], confidence: "98.9%", barcode: "8806489012345" },
        { name: "루테인 지아잔틴 164", dosage: "1캡슐 (저녁 식후)", memo: "황반 색소 밀도 유지를 위한 영양제", slots: ["evening"], confidence: "99.2%", barcode: "8806412123412" }
    ];

    const slotKoreanMap: Record<string, string> = {
        morning: "🌅 아침",
        afternoon: "☀️ 점심",
        evening: "🌇 저녁",
        night: "🌙 취침 전"
    };

    // 스캐너 상태 관리 변수
    let currentDetected: OCRScanResult | null = null;
    let html5QrScanner: any = null;
    let scannerActive = false;
    let lastScannedCode = "";
    let lastScanTime = 0;

    /**
     * 스캔 성공 시 오디오 비프음을 재생하는 함수
     */
    const playScannerBeep = (): void => {
        try {
            // @ts-ignore: 크로스 브라우저 지원
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // 고주파 비프음
            
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.12);
        } catch (e) {
            console.warn("[오디오 경고] 비프음 재생에 실패했습니다:", e);
        }
    };

    /**
     * 실시간 카메라 스트림 및 바코드 인식 엔진을 가동하는 함수
     */
    const startCamera = async (): Promise<void> => {
        // 1단계 [UI 초기화]: 이전 스캔 결과 초기화 및 모달 노출
        if (resultCard) {
            resultCard.classList.remove('slide-up');
            resultCard.style.display = 'none';
        }
        if (fallbackBanner) fallbackBanner.style.display = 'none';
        if (manualInput) manualInput.value = '';

        modal.style.display = 'flex';
        if (laser) laser.style.display = 'block';
        if (captureBtn) captureBtn.disabled = false;

        // 2단계 [라이브러리 검증]: 엔진 탑재 여부 확인
        if (typeof Html5Qrcode === 'undefined') {
            console.warn("[시스템 경고] Html5Qrcode 라이브러리가 로드되지 않았습니다.");
            if (fallbackBanner) fallbackBanner.style.display = 'flex';
            showToast("⚠️ 실물 스캔 엔진 미장착. 번호를 입력하거나 가상 분석을 해주세요.", "secondary");
            return;
        }

        try {
            // 3단계 [성능 최적화]: EAN-13 등 필요 규격만 화이트리스트 처리하여 디코딩 속도 향상
            let formats: number[] = [];
            if (typeof Html5QrcodeSupportedFormats !== 'undefined') {
                formats = [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.QR_CODE
                ];
            }
            
            html5QrScanner = new Html5Qrcode("qr-reader", formats.length > 0 ? { formatsToSupport: formats } : undefined);
            
            const config = {
                fps: 25, 
                qrbox: (width: number, height: number) => ({ width: Math.floor(width * 0.85), height: Math.floor(height * 0.35) }),
                aspectRatio: 1.3333333333,
                experimentalFeatures: { useBarCodeDetectorIfSupported: true }
            };

            scannerActive = true;

            // 4단계 [카메라 렌즈 구동]: 고화질 후면 카메라 우선 구동
            try {
                await html5QrScanner.start(
                    { facingMode: "environment", width: { min: 640, ideal: 1280, max: 1920 }, height: { min: 480, ideal: 720, max: 1080 } },
                    config,
                    onBarcodeDetected,
                    onBarcodeScanError
                );
            } catch (err) {
                console.warn("[카메라 경고] 고화질 모드 실패, 기본 모드로 재시도합니다:", err);
                await html5QrScanner.start({ facingMode: "environment" }, config, onBarcodeDetected, onBarcodeScanError);
            }

            showToast("📷 고성능 3D HUD 바코드 카메라 리더 작동 완료!");
        } catch (err) {
            console.error("[카메라 오류] 엔진 구동 완전 실패:", err);
            if (fallbackBanner) fallbackBanner.style.display = 'flex';
            showToast("⚠️ 실물 카메라 연결 실패. 번호를 입력하거나 데모 분석을 실행하세요.", "secondary");
        }
    };

    const onBarcodeDetected = (decodedText: string): void => {
        if (!decodedText || !scannerActive) return;
        
        const now = Date.now();
        // 1단계 [중복 제어]: 3초 이내의 동일한 바코드 중복 스캔 방지
        if (decodedText === lastScannedCode && (now - lastScanTime < 3000)) return;
        
        lastScannedCode = decodedText;
        lastScanTime = now;

        playScannerBeep();
        showToast(`✨ 실물 바코드 [${decodedText}] 인식 성공! AI 분석을 시작합니다.`);

        // 2단계 [화면 동결]: 카메라 스트림을 정지하고 분석 프로세스로 전환
        stopScannerStream();
        triggerBarcodeAnalysis(decodedText);
    };

    const onBarcodeScanError = (): void => {
        // 지속적인 스캔 에러 로그 출력 억제
    };

    const stopScannerStream = async (): Promise<void> => {
        scannerActive = false;
        if (html5QrScanner && html5QrScanner.isScanning) {
            try {
                await html5QrScanner.stop();
            } catch (err) {
                console.error("[엔진 오류] 스캐너 정지 실패:", err);
            }
        }
        html5QrScanner = null;
    };

    const stopCamera = async (): Promise<void> => {
        await stopScannerStream();
        if (modal) modal.style.display = 'none';
        if (spinner) spinner.style.display = 'none';
        if (resultCard) {
            resultCard.classList.remove('slide-up');
            resultCard.style.display = 'none';
        }
    };

    /**
     * 인식된 바코드를 바탕으로 OCR 인공지능 분석을 시뮬레이션하는 함수
     * @param {string} barcodeVal - 판독된 텍스트/숫자 바코드
     */
    const triggerBarcodeAnalysis = (barcodeVal: string): void => {
        scannerActive = false;
        if (resultCard) {
            resultCard.classList.remove('slide-up');
            resultCard.style.display = 'none';
        }

        if (laser) laser.style.display = 'none';
        if (spinner) spinner.style.display = 'flex';
        if (captureBtn) captureBtn.disabled = true;

        let step = 0;
        const statusSteps = [
            `📷 바코드 [${barcodeVal}] 데이터 프레임 캡처 중...`,
            "🔍 약품 품목 데이터베이스 연동 중...",
            "📝 성분 배합비 및 OCR 식별 매칭 중...",
            "🧬 식별 정보 최종 판독 완료!",
            "✨ 판독 성공! 판독된 복약 정보를 확인하세요."
        ];

        const runAnalysis = () => {
            if (step < statusSteps.length) {
                if (statusText) statusText.textContent = statusSteps[step];
                step++;
                setTimeout(runAnalysis, 550);
            } else {
                if (spinner) spinner.style.display = 'none';
                
                // 1단계 [데이터 매칭]: 가상 데이터베이스에서 바코드 탐색
                let detected = mockAIDatabase.find(item => item.barcode === barcodeVal);
                
                if (!detected) {
                    // 미등록 약품일 경우 기본값 생성
                    detected = {
                        name: `AI 식별 미등록약품 (${barcodeVal.substring(0, 8)})`,
                        dosage: "1정 (식후 30분)",
                        memo: `바코드 [${barcodeVal}] 기반으로 신규 검출된 약품입니다.`,
                        slots: ["morning"],
                        confidence: "95.6%",
                        barcode: barcodeVal
                    };
                }

                currentDetected = detected;

                // 2단계 [화면 렌더링]: 판독 결과 카드에 데이터 주입
                const nameEl = document.getElementById('scanMedName');
                const dosageEl = document.getElementById('scanMedDosage');
                const memoEl = document.getElementById('scanMedMemo');
                const confidenceEl = document.getElementById('scanConfidence');
                const slotContainer = document.getElementById('scanRecommendedSlots');

                if (nameEl) nameEl.textContent = detected.name;
                if (dosageEl) dosageEl.textContent = detected.dosage;
                if (memoEl) memoEl.textContent = detected.memo;
                if (confidenceEl) confidenceEl.textContent = `${detected.confidence} 신뢰도`;

                if (slotContainer) {
                    slotContainer.innerHTML = '';
                    ["morning", "afternoon", "evening", "night"].forEach(timeSlot => {
                        const chip = document.createElement('span');
                        chip.className = 'slot-chip';
                        chip.textContent = slotKoreanMap[timeSlot] || timeSlot;
                        if (detected!.slots.includes(timeSlot)) {
                            chip.classList.add('recommended');
                        }
                        slotContainer.appendChild(chip);
                    });
                }

                // 3단계 [모션 반영]: 카드 슬라이드 업 애니메이션
                if (resultCard) {
                    resultCard.style.display = 'block';
                    void resultCard.offsetHeight; // reflow 강제 실행
                    resultCard.classList.add('slide-up');
                }

                showToast(`⚡ 바코드 AI 분석 완료: ${detected.name}`);
            }
        };

        runAnalysis();
    };

    const handleImageFileScan = async (file: File): Promise<void> => {
        await stopScannerStream();

        if (resultCard) {
            resultCard.classList.remove('slide-up');
            resultCard.style.display = 'none';
        }
        if (laser) laser.style.display = 'none';
        if (spinner) spinner.style.display = 'flex';
        if (statusText) statusText.textContent = "📷 촬영된 고화질 이미지 처리 중...";
        if (captureBtn) captureBtn.disabled = true;

        try {
            html5QrScanner = new Html5Qrcode("qr-reader");
            showToast("🔍 고화질 비전 엔진 분석을 진행하고 있습니다...");
            
            const decodedText = await html5QrScanner.scanFile(file, false);
            playScannerBeep();
            showToast(`✨ 사진 바코드 [${decodedText}] 판독 성공! AI 분석을 시작합니다.`);
            
            triggerBarcodeAnalysis(decodedText);
            html5QrScanner = null;
        } catch (err) {
            console.error("[엔진 오류] 이미지 정적 스캔 실패:", err);
            if (spinner) spinner.style.display = 'none';
            if (captureBtn) captureBtn.disabled = false;
            if (laser) laser.style.display = 'block';
            
            await startCamera();
            showToast("⚠️ 바코드를 인식하지 못했습니다. 선명하고 밝은 곳에서 바코드를 정중앙에 맞춰 찍어주세요.", "error");
        }
    };

    const applyScanResult = (): void => {
        if (!currentDetected) return;

        // 자동 완성 적용
        const medName = document.getElementById('medName') as HTMLInputElement | null;
        const medDosage = document.getElementById('medDosage') as HTMLInputElement | null;
        const medMemo = document.getElementById('medMemo') as HTMLInputElement | null;

        if (medName) medName.value = currentDetected.name;
        if (medDosage) medDosage.value = currentDetected.dosage;
        if (medMemo) medMemo.value = currentDetected.memo;

        const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="medTime"]');
        checkboxes.forEach(cb => {
            cb.checked = currentDetected!.slots.includes(cb.value);
        });

        const medFormBody = document.getElementById('medFormBody');
        const toggleMedFormBtn = document.getElementById('toggleMedFormBtn');
        if (medFormBody && medFormBody.style.display === 'none' && toggleMedFormBtn) {
            medFormBody.style.display = 'block';
            toggleMedFormBtn.style.transform = 'rotate(0deg)';
        }

        showToast(`⚡ '${currentDetected.name}' 정보와 시간대가 입력창에 기입되었습니다!`);
        stopCamera();
    };

    const rejectScanResult = async (): Promise<void> => {
        if (resultCard) resultCard.classList.remove('slide-up');
        setTimeout(() => {
            if (resultCard) resultCard.style.display = 'none';
        }, 400);
        if (laser) laser.style.display = 'block';
        if (captureBtn) captureBtn.disabled = false;
        
        await startCamera();
        showToast("🔄 바코드 스캔을 다시 진행합니다.", "secondary");
    };

    // ==========================================================================
    // 3. 이벤트 리스너 바인딩
    // ==========================================================================
    if (openBtn) openBtn.addEventListener('click', startCamera);
    if (closeBtn) closeBtn.addEventListener('click', stopCamera);
    if (cancelBtn) cancelBtn.addEventListener('click', stopCamera);
    if (captureBtn && fileInput) captureBtn.addEventListener('click', () => fileInput.click());
    if (applyBtn) applyBtn.addEventListener('click', applyScanResult);
    if (rejectBtn) rejectBtn.addEventListener('click', rejectScanResult);

    if (fileInput) {
        fileInput.addEventListener('change', async (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                await handleImageFileScan(target.files[0]);
            }
        });
    }

    if (manualSubmitBtn && manualInput) {
        manualSubmitBtn.addEventListener('click', () => {
            const code = manualInput.value.trim();
            if (!code) return showToast("⚠️ 바코드 숫자를 입력해주세요.", "error");
            triggerBarcodeAnalysis(code);
        });

        manualInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const code = manualInput.value.trim();
                if (code) triggerBarcodeAnalysis(code);
            }
        });
    }

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') stopCamera();
    });
    window.addEventListener('pagehide', stopCamera);
};