import { initThemeToggle } from '../shared/ui/theme';
import { showToast } from '../shared/ui/toast';
import { state } from '../entities/store/appState';
import { initCameraScanner } from '../features/scanner/cameraScanner';
import { initAddMedicationForm } from '../features/medicationForm/addMedication';
import { initHealthLogForm } from '../features/healthLogForm/submitHealthLog';
import { initCloudSync } from '../features/sync/cloudSync';
import { renderMedicationTable } from '../widgets/MedicationTableWidget';
import { renderComplianceProgress, renderHealthSummary } from '../widgets/DashboardWidget';
import { renderCharts } from '../widgets/ChartsWidget';
import { renderHistoryList } from '../widgets/HistoryListWidget';

// ==========================================================================
// 1. 전역 브릿지 함수 정의 (Global Render Bridge)
// ==========================================================================

/**
 * 전체 UI 위젯들을 최신 상태로 갱신하는 통합 렌더링 함수
 * (현재 하위 계층인 features 모듈에서 상태 업데이트 후 화면 갱신을 위해 호출합니다.)
 */
const renderAll = (): void => {
    // 1단계 [위젯 렌더링]: 각 도메인별 시각화 컴포넌트들을 순차적으로 실행
    renderMedicationTable();
    renderComplianceProgress();
    renderHealthSummary();
    renderCharts();
    renderHistoryList();
};

// ==========================================================================
// 2. 애플리케이션 라이프사이클 기동 (Bootstrap)
// ==========================================================================

/**
 * 애플리케이션 초기화 진입점 함수
 */
const bootstrap = (): void => {
    // 1단계 [공통 설정]: 다크모드/라이트모드 테마 등 글로벌 UI 부품 초기화
    initThemeToggle();

    // 2단계 [기능 모듈 바인딩]: 카메라 스캐너 및 폼 컨트롤러의 이벤트 리스너 부착
    initCameraScanner();
    initAddMedicationForm();
    initHealthLogForm();
    initCloudSync();

    // [Observer 패턴 연동]: 상태(State)가 변경될 때마다 renderAll이 자동으로 실행되도록 구독(Subscribe)
    state.subscribe(renderAll);

    // 3단계 [초기 렌더링]: 로컬 스토리지에 캐싱된 데이터(Entities)를 기반으로 첫 화면 렌더링
    renderAll();

    // 4단계 [초기화 완료 피드백]: 시스템 기동 완료 후 사용자에게 환영 알림 제공
    showToast("👋 스마트 복약 관리 대시보드 MediVibe에 오신 것을 환영합니다!");
};

// DOM 트리가 완전히 로드된 후 애플리케이션을 안전하게 기동합니다.
document.addEventListener('DOMContentLoaded', bootstrap);