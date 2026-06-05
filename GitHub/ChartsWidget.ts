import { state } from '../entities/store/appState';

// 외부 라이브러리(CDN) Chart.js 타입 선언
declare const Chart: any;

// 전역 차트 인스턴스 추적용 변수 (상태 변경으로 인한 재렌더링 시 기존 차트 캔버스 파괴 목적)
let complianceChartInstance: any = null;
let symptomsChartInstance: any = null;

/**
 * 최근 7일간의 데이터를 바탕으로 복약 준수율 및 증상 추이 차트를 렌더링하는 위젯 함수
 */
export const renderCharts = (): void => {
    // 1단계 [DOM 탐색 및 라이브러리 검증]: 렌더링할 캔버스 요소 확인 및 Chart.js 탑재 여부 검증
    const complianceCanvas = document.getElementById('complianceChart') as HTMLCanvasElement | null;
    const symptomsCanvas = document.getElementById('symptomsChart') as HTMLCanvasElement | null;

    if (!complianceCanvas && !symptomsCanvas) return;

    if (typeof Chart === 'undefined') {
        console.warn('[UI 경고] Chart.js 라이브러리가 로드되지 않아 차트를 그릴 수 없습니다.');
        return;
    }

    // 2단계 [데이터 전처리 (X축)]: 최근 7일의 날짜 배열 생성 (오름차순 정렬)
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toISOString().split('T')[0]);
    }
    const shortLabels = labels.map(l => l.substring(5)); // 'MM-DD' 형식으로 축약

    // 3단계 [복약 준수율 막대 차트 렌더링]
    if (complianceCanvas) {
        // 상태 스토어에서 날짜별로 완료된 비율(%)을 계산하여 배열화
        const complianceData = labels.map(date => {
            const records = state.intakeRecords[date] || [];
            let expected = 0;
            state.medications.forEach(med => {
                if (med.frequency !== 'needed') expected += med.times.length;
            });
            return expected === 0 ? 0 : Math.round((records.length / expected) * 100);
        });

        // 메모리 누수 및 그래픽 오버랩 방지를 위해 기존 차트 인스턴스가 존재하면 완전히 파괴
        if (complianceChartInstance) complianceChartInstance.destroy();

        // 새로운 Bar Chart 생성
        complianceChartInstance = new Chart(complianceCanvas, {
            type: 'bar',
            data: {
                labels: shortLabels,
                datasets: [{
                    label: '복약 달성률 (%)',
                    data: complianceData,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    // 4단계 [건강 증상 추이 꺾은선 차트 렌더링]
    if (symptomsCanvas) {
        // 날짜별 두통 및 피로도 증상 슬라이더 수치 추출
        const headacheData = labels.map(date => state.healthLogs[date]?.symptoms?.headache || 0);
        const fatigueData = labels.map(date => state.healthLogs[date]?.symptoms?.fatigue || 0);

        if (symptomsChartInstance) symptomsChartInstance.destroy();

        symptomsChartInstance = new Chart(symptomsCanvas, {
            type: 'line',
            data: {
                labels: shortLabels,
                datasets: [
                    { label: '두통', data: headacheData, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', tension: 0.3, fill: true },
                    { label: '피로도', data: fatigueData, borderColor: '#f1c40f', backgroundColor: 'rgba(241, 196, 15, 0.1)', tension: 0.3, fill: true }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, max: 10, suggestedMax: 10 } }
            }
        });
    }
};