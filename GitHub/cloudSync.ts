import { state } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

/**
 * 로컬 상태 데이터를 클라우드 데이터베이스(Supabase)로 동기화(Push)하는 함수
 * @returns {Promise<boolean>} 동기화 성공 여부
 */
export const pushToCloud = async (): Promise<boolean> => {
    // 1단계 [검증]: 클라우드 연동을 위한 환경 변수 및 인증 키 존재 여부 확인
    if (!state.supabaseUrl || !state.supabaseKey) {
        showToast('⚠️ 클라우드 동기화 설정이 누락되었습니다. 연결 설정을 확인해주세요.', 'error');
        return false;
    }

    try {
        // 상태 객체의 플래그를 변경하여 중복 동기화 요청 방지
        state.isSyncing = true;
        
        // 2단계 [데이터 매핑]: 전역 상태의 핵심 데이터를 JSONB 단일 레코드 규격으로 패키징
        const payload = {
            id: state.syncKey,
            data: {
                medications: state.medications,
                intakeRecords: state.intakeRecords,
                healthLogs: state.healthLogs
            },
            updated_at: new Date().toISOString()
        };

        // 3단계 [전송]: Supabase REST API를 활용하여 project_sync 테이블에 Upsert(삽입/갱신) 요청
        const response = await fetch(`${state.supabaseUrl}/rest/v1/project_sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': state.supabaseKey,
                'Authorization': `Bearer ${state.supabaseKey}`,
                'Prefer': 'resolution=merge-duplicates' // PK(id) 충돌 시 덮어쓰기 옵션
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP 통신 에러: 상태 코드 ${response.status}`);
        }

        // 4단계 [결과 처리]: 동기화 성공 시 알림 제공
        showToast('☁️ 클라우드 데이터 동기화가 완료되었습니다.');
        return true;
    } catch (error) {
        // 5단계 [예외 처리]: 네트워크 오류 등 시스템 실패 시 로깅 및 안전한 결함 격리
        console.error('[서버 오류] 클라우드 동기화 실패:', (error as Error).message);
        showToast('⚠️ 네트워크 오류로 클라우드 동기화에 실패했습니다.', 'error');
        return false;
    } finally {
        state.isSyncing = false;
    }
};

/**
 * 클라우드 데이터베이스(Supabase)에서 로컬로 데이터를 가져와 병합(Pull)하는 함수
 * @returns {Promise<boolean>} 불러오기 성공 여부
 */
export const pullFromCloud = async (): Promise<boolean> => {
    // 1단계 [검증]: 클라우드 연동을 위한 환경 변수 및 동기화 키 존재 여부 확인
    if (!state.supabaseUrl || !state.supabaseKey || !state.syncKey) {
        showToast('⚠️ 클라우드 설정 또는 동기화 키가 누락되었습니다.', 'error');
        return false;
    }

    try {
        state.isSyncing = true;
        
        // 2단계 [조회]: Supabase REST API를 통해 특정 id(syncKey)의 데이터 요청
        const response = await fetch(`${state.supabaseUrl}/rest/v1/project_sync?id=eq.${state.syncKey}&select=*`, {
            method: 'GET',
            headers: {
                'apikey': state.supabaseKey,
                'Authorization': `Bearer ${state.supabaseKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP 통신 에러: 상태 코드 ${response.status}`);

        const result = await response.json();

        // 3단계 [결과 확인]: 해당 키로 저장된 클라우드 데이터가 없는 경우 방어 처리
        if (!result || result.length === 0) {
            showToast('ℹ️ 클라우드에 일치하는 데이터가 없습니다. 먼저 내보내기를 진행해주세요.', 'secondary');
            return false;
        }

        // 4단계 [병합 및 저장]: 클라우드 데이터 추출 후 로컬 상태 덮어쓰기
        const cloudData = result[0].data;
        if (cloudData) {
            state.medications = cloudData.medications || [];
            state.intakeRecords = cloudData.intakeRecords || {};
            state.healthLogs = cloudData.healthLogs || {};
            
            // saveLocally() 호출 시, 내부 Observer 패턴에 의해 등록된 모든 위젯이 자동으로 화면을 다시 그립니다.
            state.saveLocally();
            showToast('☁️ 클라우드 데이터를 성공적으로 불러왔습니다!');
            return true;
        }
        return false;
    } catch (error) {
        // 5단계 [예외 처리]
        console.error('[서버 오류] 클라우드 데이터 가져오기 실패:', (error as Error).message);
        showToast('⚠️ 네트워크 오류로 데이터를 불러오지 못했습니다.', 'error');
        return false;
    } finally {
        state.isSyncing = false;
    }
};

/**
 * 클라우드 동기화 기능을 제어하는 DOM 이벤트를 초기화하는 함수
 */
export const initCloudSync = (): void => {
    // 1단계 [DOM 탐색]: 동기화 실행(Push) 및 가져오기(Pull) 버튼 요소 가져오기
    const syncBtn = document.getElementById('syncCloudBtn');
    const pullBtn = document.getElementById('pullCloudBtn'); // 가져오기 버튼 추가
    const syncKeyDisplay = document.getElementById('syncKeyDisplay');

    // 화면에 현재 기기의 고유 동기화 키 표시
    if (syncKeyDisplay) {
        syncKeyDisplay.textContent = state.syncKey;
    }

    if (!syncBtn) {
        console.warn('[UI 경고] syncCloudBtn 요소를 찾을 수 없습니다.');
        return;
    }

    // 2단계 [이벤트 바인딩]: 클릭 시 클라우드 데이터 푸시 로직 실행
    syncBtn.addEventListener('click', async () => {
        // 중복 실행 방지 방어 코드 (Throttling 개념)
        if (state.isSyncing) {
            showToast('🔄 현재 데이터 동기화가 진행 중입니다. 잠시만 기다려주세요.', 'secondary');
            return;
        }
        
        // 3단계 [UI 피드백]: 버튼 시각적 피드백 제공 후 비동기 호출 처리
        const originalText = syncBtn.textContent || '동기화';
        syncBtn.textContent = '🔄 동기화 중...';
        syncBtn.setAttribute('disabled', 'true');

        await pushToCloud();

        // 4단계 [복구]: 처리 완료 후 버튼 원상복구
        syncBtn.textContent = originalText;
        syncBtn.removeAttribute('disabled');
    });

    // 5단계 [가져오기 이벤트 바인딩]: 클라우드에서 데이터 불러오기 로직
    if (pullBtn) {
        pullBtn.addEventListener('click', async () => {
            if (state.isSyncing) {
                showToast('🔄 현재 데이터 동기화가 진행 중입니다.', 'secondary');
                return;
            }
            const originalText = pullBtn.textContent || '가져오기';
            pullBtn.textContent = '🔄 불러오는 중...';
            pullBtn.setAttribute('disabled', 'true');

            await pullFromCloud();

            pullBtn.textContent = originalText;
            pullBtn.removeAttribute('disabled');
        });
    }
};