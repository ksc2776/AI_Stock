import { state } from '../entities/store/appState';
import { escapeHTML } from '../shared/lib/utils';
import { showToast } from '../shared/ui/toast';

// 시간대 데이터 영문 키값을 화면 표시용 한글 라벨로 매핑
const timeLabels: Record<string, string> = {
    morning: "🌅 아침",
    afternoon: "☀️ 점심",
    evening: "🌇 저녁",
    night: "🌙 취침 전"
};

/**
 * 전역 상태의 의약품 목록을 읽어와 HTML 테이블 형태로 렌더링하는 위젯 함수
 */
export const renderMedicationTable = (): void => {
    // 1단계 [DOM 탐색]: 렌더링 대상이 되는 테이블 본문(tbody) 요소 가져오기
    const tbody = document.getElementById('medicationTableBody');
    const totalCountEl = document.getElementById('totalMedCount');

    if (!tbody) {
        console.warn('[UI 경고] medicationTableBody 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [초기화]: 이전 렌더링 결과물(HTML) 비우기
    tbody.innerHTML = '';
    if (totalCountEl) totalCountEl.textContent = state.medications.length.toString();

    // 3단계 [빈 상태 처리]: 등록된 약품이 없을 경우 사용자 안내 메시지 출력 (Empty State)
    if (state.medications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    등록된 복약 일정이 없습니다.<br>
                    상단의 <strong>'+ 새 약품 등록'</strong> 버튼이나 바코드 스캐너를 이용해 추가해주세요.
                </td>
            </tr>
        `;
        return;
    }

    // 4단계 [반복 렌더링]: 상태 저장소(Store)의 의약품 배열을 순회하며 동적으로 테이블 행(tr) 요소 생성
    state.medications.forEach(med => {
        const tr = document.createElement('tr');

        // 시간대 배열을 뱃지(Badge) 형태의 HTML 문자열로 변환
        const timesHtml = med.times.map(t => `<span class="slot-chip" style="font-size: 0.8rem; padding: 2px 6px;">${timeLabels[t] || t}</span>`).join(' ');

        // 잔여 재고가 5개 미만일 경우 붉은색 경고 표시
        const stockText = (med.stock !== undefined && med.stock !== '') 
            ? `<strong style="color: ${Number(med.stock) < 5 ? '#e74c3c' : 'inherit'}">${med.stock}</strong>`
            : '-';

        // XSS 방어 유틸리티(escapeHTML)를 거쳐 안전하게 데이터 바인딩
        tr.innerHTML = `
            <td>
                <strong>${escapeHTML(med.name)}</strong>
                ${med.memo ? `<br><small style="color: var(--text-secondary);">${escapeHTML(med.memo)}</small>` : ''}
            </td>
            <td>${escapeHTML(med.dosage)}</td>
            <td>${timesHtml}</td>
            <td>${stockText}</td>
            <td class="action-cell">
                <button type="button" class="delete-btn" aria-label="삭제" title="삭제" style="background:none;border:none;cursor:pointer;color:#e74c3c;">
                    🗑️
                </button>
            </td>
        `;

        // 5단계 [이벤트 연동]: 생성된 개별 행의 삭제 버튼에 액션 리스너 부착
        const deleteBtn = tr.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm(`'${med.name}' 약품을 정말 삭제하시겠습니까?`)) {
                    // 상태 업데이트 후, 전역 렌더링 함수를 통해 화면 갱신
                    state.deleteMedication(med.id);
                    showToast(`🗑️ '${med.name}' 약품이 삭제되었습니다.`, 'secondary');
                }
            });
        }

        // 6단계 [DOM 조립]: 완성된 행을 테이블 본문에 부착
        tbody.appendChild(tr);
    });
};