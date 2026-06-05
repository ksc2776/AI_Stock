import { state } from '../entities/store/appState';
import { escapeHTML } from '../shared/lib/utils';
import { showToast } from '../shared/ui/toast';

/**
 * 오늘 하루의 복약 진행률(Progress)을 계산하여 대시보드 화면에 시각적으로 렌더링하는 위젯 함수
 */
export const renderComplianceProgress = (): void => {
    // 1단계 [DOM 탐색]: 진행률 막대(Progress Bar)와 텍스트를 표시할 요소 가져오기
    const ring = document.getElementById('complianceRing') as any;
    const complianceText = document.getElementById('complianceText');
    const percentText = document.getElementById('compliancePercentText');
    
    if (!ring || !complianceText || !percentText) {
        console.warn('[UI 경고] 대시보드 진행률(Ring) 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [기준 데이터 추출]: 오늘 날짜 및 오늘 기록된 복약 완료 리스트 조회
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = state.intakeRecords[today] || [];
    
    // 3단계 [통계 계산]: 전체 복약해야 할 누적 횟수와 완료된 횟수 산출
    let totalExpected = 0;
    state.medications.forEach(med => {
        // '필요시(needed)' 복용하는 약은 진행률 계산의 전체 모수(분모)에서 제외합니다.
        if (med.frequency !== 'needed') {
            totalExpected += med.times.length;
        }
    });

    const completedCount = todayRecords.length;
    const percentage = totalExpected === 0 ? 0 : Math.round((completedCount / totalExpected) * 100);

    // 4단계 [UI 업데이트]: 계산된 비율을 바탕으로 CSS 너비 및 텍스트 갱신
    complianceText.textContent = `${completedCount} / ${totalExpected} 개 복용 완료 (${percentage}%)`;
    percentText.textContent = `${percentage}%`;
    
    // 5단계 [원형 SVG 차트 렌더링]: 테두리 둘레를 계산하여 stroke-dashoffset 애니메이션 반영
    if (ring.r && ring.r.baseVal) {
        const radius = ring.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percentage / 100) * circumference;
        ring.style.strokeDashoffset = offset.toString();
    }
};

/**
 * 오늘의 건강 일지(활력 징후 및 증상) 요약 정보를 대시보드 카드에 렌더링하는 위젯 함수
 */
export const renderHealthSummary = (): void => {
    // 1단계 [DOM 탐색]: 건강 요약을 표시할 카드 컨테이너 요소 가져오기
    const summaryContainer = document.getElementById('healthSummaryCard');
    if (!summaryContainer) return;

    const today = new Date().toISOString().split('T')[0];
    const log = state.healthLogs[today];

    // 2단계 [빈 상태 렌더링]: 오늘 기록된 건강 일지가 없는 경우의 안내(Empty State) 표시
    if (!log) {
        summaryContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
                오늘 기록된 건강 상태가 없습니다.<br>
                하단의 <strong>'건강 일지 작성'</strong> 폼을 열어 기록해주세요.
            </div>
        `;
        return;
    }

    // 3단계 [증상 평가]: 증상 슬라이더(두통, 메스꺼움, 피로도) 합산 값을 바탕으로 전반적인 컨디션 상태 도출
    const totalSymptoms = log.symptoms.headache + log.symptoms.nausea + log.symptoms.fatigue;
    let conditionText = '😊 매우 좋음 (양호)';
    if (totalSymptoms > 15) conditionText = '😫 매우 나쁨 (휴식 필요)';
    else if (totalSymptoms > 8) conditionText = '😐 약간 불편함 (주의 요망)';

    // 4단계 [HTML 조립 및 데이터 바인딩]: XSS 방어 유틸리티를 거쳐 안전하게 데이터 주입
    summaryContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            <span style="font-size: 1.1rem; font-weight: bold; color: var(--primary-color);">오늘의 컨디션: ${conditionText}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${today}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.95rem;">
            <div class="summary-item">🌡️ 체온: <strong>${escapeHTML(String(log.temp)) || '- '} °C</strong></div>
            <div class="summary-item">🩸 혈압: <strong>${escapeHTML(String(log.bp)) || '- '} mmHg</strong></div>
            <div class="summary-item">💓 심박수: <strong>${escapeHTML(String(log.hr)) || '- '} bpm</strong></div>
            <div class="summary-item">😴 수면: <strong>${log.symptoms.sleep || 0} 시간</strong></div>
        </div>
        ${log.memo ? `<div style="margin-top: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.9rem; line-height: 1.4;">📝 <strong>메모:</strong> ${escapeHTML(log.memo)}</div>` : ''}
    `;
};