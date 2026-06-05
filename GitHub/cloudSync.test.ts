import { pushToCloud, pullFromCloud } from './cloudSync';
import { state } from '../../entities/store/appState';
import { showToast } from '../../shared/ui/toast';

// 1단계 [외부 모듈 Mocking]: UI 알림 등 부수 효과를 일으키는 외부 함수를 가짜(Mock) 함수로 대체합니다.
jest.mock('../../shared/ui/toast', () => ({
    showToast: jest.fn()
}));

/**
 * cloudSync 모듈의 pushToCloud(클라우드 동기화) 기능 단위 테스트
 */
describe('pushToCloud 기능 단위 테스트', () => {
    // 본래의 전역 fetch를 저장해두고, 테스트 간 충돌을 막기 위해 덮어씁니다.
    const originalFetch = global.fetch;
    
    beforeEach(() => {
        // 2단계 [상태 초기화]: 전역 상태 객체에 가상의 데이터 및 API 연동 키를 주입합니다.
        state.supabaseUrl = 'https://mock.supabase.co';
        state.supabaseKey = 'mock-anon-key';
        state.syncKey = 'MV-TESTKEY123';
        state.medications = [{ id: 'med-1', name: '테스트약', dosage: '1정', times: ['morning'], frequency: 'daily' }];
        state.intakeRecords = { '2023-10-01': ['med-1-morning'] };
        state.healthLogs = {};
        state.isSyncing = false;

        // Mock 초기화
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        // 3단계 [정리]: 테스트가 끝나면 원래의 fetch로 복구합니다.
        global.fetch = originalFetch;
    });

    it('[Happy Path] 올바른 환경변수와 상태가 주어졌을 때 fetch API를 통해 성공적으로 데이터를 전송해야 한다.', async () => {
        // 1단계 [Mock 설정]: fetch가 정상 응답(200 OK)을 반환하도록 설정
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200
        });

        // 2단계 [동작 트리거]: 동기화 함수 실행
        const result = await pushToCloud();

        // 3단계 [결과 검증]: fetch가 올바른 엔드포인트와 헤더, 페이로드를 가지고 호출되었는지 확인
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
        expect(fetchArgs[0]).toBe('https://mock.supabase.co/rest/v1/project_sync');
        
        const fetchOptions = fetchArgs[1];
        expect(fetchOptions.method).toBe('POST');
        expect(fetchOptions.headers['apikey']).toBe('mock-anon-key');
        expect(fetchOptions.headers['Authorization']).toBe('Bearer mock-anon-key');
        
        // 페이로드 구조 검증 (id, data 내부에 상태값들이 올바르게 담겼는지)
        const payload = JSON.parse(fetchOptions.body);
        expect(payload.id).toBe('MV-TESTKEY123');
        expect(payload.data.medications[0].name).toBe('테스트약');
        
        // 4단계 [부수 효과 검증]: 성공 토스트 알림 및 상태 플래그 복구 확인
        expect(showToast).toHaveBeenCalledWith('☁️ 클라우드 데이터 동기화가 완료되었습니다.');
        expect(state.isSyncing).toBe(false);
    });

    it('[Edge Case] API URL이나 인증 키가 누락되었을 경우, 전송을 중단하고 실패를 반환해야 한다.', async () => {
        state.supabaseUrl = ''; // 필수 값 누락
        
        const result = await pushToCloud();

        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith('⚠️ 클라우드 동기화 설정이 누락되었습니다. 연결 설정을 확인해주세요.', 'error');
    });

    it('[Edge Case] 네트워크 오류나 API 에러(상태 코드 400 등) 발생 시, 안전하게 예외를 처리하고 실패를 반환해야 한다.', async () => {
        // 1단계 [Mock 설정]: fetch가 실패 응답을 반환하도록 설정
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 401
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(); // 에러 로그 숨기기

        const result = await pushToCloud();

        // 2단계 [결과 검증]
        expect(result).toBe(false);
        expect(showToast).toHaveBeenCalledWith('⚠️ 네트워크 오류로 클라우드 동기화에 실패했습니다.', 'error');
        expect(state.isSyncing).toBe(false); // 에러 발생 시에도 플래그는 복구되어야 함

        consoleSpy.mockRestore();
    });
});

/**
 * cloudSync 모듈의 pullFromCloud(클라우드 데이터 가져오기) 기능 단위 테스트
 */
describe('pullFromCloud 기능 단위 테스트', () => {
    const originalFetch = global.fetch;
    
    beforeEach(() => {
        // 1단계 [상태 초기화]: 전역 상태 객체에 가상의 데이터 및 API 연동 키를 주입합니다.
        state.supabaseUrl = 'https://mock.supabase.co';
        state.supabaseKey = 'mock-anon-key';
        state.syncKey = 'MV-TESTKEY123';
        state.medications = [];
        state.intakeRecords = {};
        state.healthLogs = {};
        state.isSyncing = false;

        // Mock 초기화
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('[Happy Path] 올바른 환경변수와 상태가 주어졌을 때 fetch API를 통해 성공적으로 데이터를 가져와 병합해야 한다.', async () => {
        // 1단계 [Mock 설정]: fetch가 정상 응답과 가상의 클라우드 데이터를 반환하도록 설정
        const mockCloudData = {
            medications: [{ id: 'med-2', name: '새로운약', dosage: '2정', times: ['evening'], frequency: 'daily' }],
            intakeRecords: { '2023-10-02': ['med-2-evening'] },
            healthLogs: { '2023-10-02': { temp: 36.5, bp: '120/80', hr: 70, symptoms: { headache: 0, nausea: 0, fatigue: 0, sleep: 8 }, memo: '' } }
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [{ data: mockCloudData }] // Supabase REST API 응답 형태 모방
        });

        const saveSpy = jest.spyOn(state, 'saveLocally'); // Observer 패턴 트리거 검증용

        // 2단계 [동작 트리거]: 데이터 불러오기 함수 실행
        const result = await pullFromCloud();

        // 3단계 [결과 검증]: fetch 호출 경로 및 GET 메서드 검증
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
        expect(fetchArgs[0]).toBe('https://mock.supabase.co/rest/v1/project_sync?id=eq.MV-TESTKEY123&select=*');
        expect(fetchArgs[1].method).toBe('GET');

        // 4단계 [상태 병합 검증]: 로컬 상태가 클라우드 데이터로 올바르게 덮어씌워졌는지 확인
        expect(state.medications[0].name).toBe('새로운약');
        expect(state.intakeRecords['2023-10-02']).toBeDefined();
        
        // 5단계 [부수 효과 검증]: 옵저버 패턴을 깨우는 saveLocally 호출 및 토스트 알림 확인
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(showToast).toHaveBeenCalledWith('☁️ 클라우드 데이터를 성공적으로 불러왔습니다!');
    });

    it('[Edge Case] 환경 변수나 동기화 키가 누락되었을 경우, 가져오기를 중단하고 에러를 띄워야 한다.', async () => {
        state.syncKey = ''; // 동기화 키 강제 누락 처리
        
        const result = await pullFromCloud();

        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith('⚠️ 클라우드 설정 또는 동기화 키가 누락되었습니다.', 'error');
    });

    it('[Edge Case] 클라우드에 해당 키로 저장된 데이터가 비어있을 경우, 덮어쓰기를 방지하고 안내해야 한다.', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => [] });
        const result = await pullFromCloud();
        expect(result).toBe(false);
        expect(showToast).toHaveBeenCalledWith('ℹ️ 클라우드에 일치하는 데이터가 없습니다. 먼저 내보내기를 진행해주세요.', 'secondary');
    });

    it('[Edge Case] 네트워크 오류 발생 시, 시스템 다운 없이 안전하게 예외를 처리해야 한다.', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Failure'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = await pullFromCloud();
        expect(result).toBe(false);
        expect(showToast).toHaveBeenCalledWith('⚠️ 네트워크 오류로 데이터를 불러오지 못했습니다.', 'error');
        consoleSpy.mockRestore();
    });
});