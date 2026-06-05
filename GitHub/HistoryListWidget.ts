import { state } from '../entities/store/appState';
import { escapeHTML } from '../shared/lib/utils';

// 시간대 데이터 영문 키값을 화면 표시용 한글 라벨로 매핑
const timeLabels: Record<string, string> = {
    morning: "🌅 아침",
    afternoon: "☀️ 점심",
    evening: "🌇 저녁",
    night: "🌙 취침 전"
};

/**
 * 전역 상태에 누적된 복약 완료 기록을 읽어와 날짜별 리스트 형태로 렌더링하는 위젯 함수
 */
export const renderHistoryList = (): void => {
    // 1단계 [DOM 탐색]: 히스토리 목록을 렌더링할 컨테이너 요소 가져오기
    const container = document.getElementById('historyListContainer');
    if (!container) {
        // 히스토리 탭이 화면에 존재하지 않을 수 있으므로 에러 대신 조용히 종료합니다.
        return;
    }

    // 2단계 [초기화]: 이전 렌더링 결과물(HTML) 비우기
    container.innerHTML = '';

    // 3단계 [데이터 추출 및 정렬]: 복약 기록이 존재하는 날짜 키 배열을 최신순(내림차순)으로 정렬
    const dates = Object.keys(state.intakeRecords).sort((a, b) => b.localeCompare(a));

    // 4단계 [빈 상태 처리]: 기록이 전혀 없는 경우 사용자 안내 메시지 출력 (Empty State)
    if (dates.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                아직 누적된 복약 기록이 없습니다.<br>
                복약을 완료하고 체크하시면 이곳에 기록이 쌓입니다.
            </div>
        `;
        return;
    }

    // 5단계 [반복 렌더링]: 각 날짜별로 그룹화하여 복약 히스토리 DOM 요소 동적 조립
    dates.forEach(date => {
        const records = state.intakeRecords[date];
        if (!records || records.length === 0) return; // 해당 날짜에 기록이 없으면 스킵

        // 날짜별 그룹 컨테이너 생성
        const dateGroup = document.createElement('div');
        dateGroup.className = 'history-date-group';
        dateGroup.style.marginBottom = '16px';
        dateGroup.style.padding = '16px';
        dateGroup.style.background = 'rgba(255,255,255,0.05)';
        dateGroup.style.borderRadius = '8px';

        // 날짜 헤더 조립
        const dateTitle = document.createElement('h4');
        dateTitle.style.marginTop = '0';
        dateTitle.style.marginBottom = '12px';
        dateTitle.style.color = 'var(--primary-color)';
        dateTitle.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        dateTitle.style.paddingBottom = '8px';
        dateTitle.textContent = `📅 ${date}`;
        
        dateGroup.appendChild(dateTitle);

        // 개별 복약 기록 아이템 조립
        records.forEach(recordKey => {
            // recordKey 규격: '약품ID-시간대' (예: 'med-123-morning')
            const parts = recordKey.split('-');
            const timeSlot = parts.pop() || '';
            const medId = parts.join('-');
            
            // 현재 삭제된 약품일 수도 있으므로 방어적 조회 처리
            const med = state.medications.find(m => m.id === medId);
            const medName = med ? med.name : '(삭제된 약품)';

            const recordItem = document.createElement('div');
            recordItem.style.marginBottom = '8px';
            recordItem.style.fontSize = '0.95rem';
            recordItem.innerHTML = `
                <span class="slot-chip" style="font-size: 0.75rem; padding: 2px 6px; margin-right: 8px;">
                    ${timeLabels[timeSlot] || timeSlot}
                </span>
                <strong>${escapeHTML(medName)}</strong> 복용 완료
            `;
            dateGroup.appendChild(recordItem);
        });

        // 6단계 [DOM 부착]: 완성된 날짜 그룹을 메인 컨테이너에 추가
        container.appendChild(dateGroup);
    });
};