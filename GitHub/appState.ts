import { generateSyncKey } from '../../shared/lib/utils';
import { showToast } from '../../shared/ui/toast';

// ==========================================================================
// 1. 핵심 데이터 모델 타입 정의 (Entities/Types)
// ==========================================================================

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    times: string[];
    frequency: 'daily' | 'weekly' | 'needed' | string;
    stock?: number | string;
    memo?: string;
}

export interface HealthSymptoms {
    headache: number;
    nausea: number;
    fatigue: number;
    sleep: number;
}

export interface HealthLog {
    temp: string | number;
    bp: number | string;
    hr: number | string;
    symptoms: HealthSymptoms;
    memo: string;
}

export interface AppDataStorage {
    medications: Medication[];
    intakeRecords: Record<string, string[]>;
    healthLogs: Record<string, HealthLog>;
}

// ==========================================================================
// 2. 전역 상태 관리 클래스 (Store)
// ==========================================================================

/**
 * 애플리케이션의 핵심 데이터(의약품, 복약 기록, 건강 일지)를 관리하는 스토어 클래스
 */
export class AppState {
    public syncKey: string;
    public medications: Medication[] = [];
    public intakeRecords: Record<string, string[]> = {};
    public healthLogs: Record<string, HealthLog> = {};
    
    public supabaseUrl: string;
    public supabaseKey: string;
    public supabase: any = null; // SDK 연동 시 타입을 구체화해야 함
    public isSyncing: boolean = false;
    
    private listeners: Array<() => void> = [];

    constructor() {
        // 1단계 [식별자 초기화]: 기기별 고유 동기화 키(Sync Key)를 발급하거나 불러옵니다.
        this.syncKey = localStorage.getItem('medivibe_sync_key') || '';
        if (!this.syncKey) {
            this.syncKey = generateSyncKey();
            localStorage.setItem('medivibe_sync_key', this.syncKey);
        }

        // 2단계 [로컬 데이터 로드]: 0ms 지연시간(Snappy)을 위해 로컬 스토리지에서 우선 캐싱된 데이터를 파싱합니다.
        const stored = localStorage.getItem('medivibe_data');
        if (stored) {
            try {
                const parsed: AppDataStorage = JSON.parse(stored);
                this.medications = parsed.medications || [];
                this.intakeRecords = parsed.intakeRecords || {};
                this.healthLogs = parsed.healthLogs || {};
            } catch (e) {
                console.error("[로컬 캐시 에러] 데이터 파싱 실패. 초기 상태로 유지합니다.", e);
            }
        }

        // 3단계 [보안 환경변수 로드]: 외부 보안 표준에 따라 API 연동 정보를 불러옵니다.
        this.supabaseUrl = localStorage.getItem('medivibe_supabase_url') || '';
        this.supabaseKey = localStorage.getItem('medivibe_supabase_key') || '';
    }

    /**
     * 상태 변경을 감지할 리스너(Listener)를 등록하는 함수 (Observer 패턴)
     * @param listener - 상태 변경 시 실행될 콜백 함수
     * @returns 구독 취소(unsubscribe) 함수
     */
    public subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * 등록된 모든 리스너에게 상태 변경을 알리는 함수
     */
    private notify(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * 로컬 스토리지에 데이터를 안전하게 동기화 저장하는 함수
     */
    public saveLocally(): void {
        const data: AppDataStorage = {
            medications: this.medications,
            intakeRecords: this.intakeRecords,
            healthLogs: this.healthLogs
        };
        localStorage.setItem('medivibe_data', JSON.stringify(data));
        
        // 상태가 저장(변경)될 때마다 구독 중인 위젯(리스너)들에게 알림(Notify)을 보냅니다.
        this.notify();
    }

    /**
     * 의약품을 새롭게 등록하는 함수
     * @param {Medication} med - 등록할 의약품 객체
     */
    public addMedication(med: Medication): void {
        this.medications.push(med);
        this.saveLocally();
        // TODO: 향후 클라우드 백그라운드 푸시 로직(pushToCloud) 연동
    }

    /**
     * 의약품을 삭제하고 관련된 오늘 복약 기록도 함께 정리하는 함수
     * @param {string} id - 삭제할 의약품 고유 ID
     */
    public deleteMedication(id: string): void {
        this.medications = this.medications.filter(m => m.id !== id);
        const today = new Date().toISOString().split('T')[0];
        
        if (this.intakeRecords[today]) {
            this.intakeRecords[today] = this.intakeRecords[today].filter(recordId => !recordId.startsWith(id));
        }
        this.saveLocally();
    }

    /**
     * 특정 날짜와 시간대의 복약 여부 상태를 토글(Toggle)하는 함수
     * @param {string} date - 복약 날짜 (예: '2024-03-24')
     * @param {string} recordKey - 복약 기록 고유키 (예: 'med-1-morning')
     * @returns {boolean} - 토글 이후 복약 완료 상태 (true: 완료, false: 취소)
     */
    public toggleIntake(date: string, recordKey: string): boolean {
        if (!this.intakeRecords[date]) {
            this.intakeRecords[date] = [];
        }

        const idx = this.intakeRecords[date].indexOf(recordKey);
        let taken = false;
        const medId = recordKey.split('-').slice(0, 2).join('-');
        const med = this.medications.find(m => m.id === medId);

        if (idx > -1) {
            // 1단계 [취소 처리]: 이미 복용했다면 기록 삭제 및 재고 복구
            this.intakeRecords[date].splice(idx, 1);
            if (med && typeof med.stock !== 'undefined' && med.stock !== '') {
                med.stock = Number(med.stock) + 1;
            }
        } else {
            // 2단계 [복용 처리]: 기록 추가 및 재고 차감 (0 이하로 내려가지 않도록 보정)
            this.intakeRecords[date].push(recordKey);
            taken = true;
            if (med && typeof med.stock !== 'undefined' && med.stock !== '') {
                med.stock = Math.max(0, Number(med.stock) - 1);
            }
        }
        
        this.saveLocally();
        return taken;
    }

    /**
     * 특정 날짜의 건강 일지(혈압, 체온, 증상 등)를 저장하는 함수
     * @param {string} date - 기록 날짜
     * @param {HealthLog} log - 저장할 건강 일지 데이터
     */
    public saveHealthLog(date: string, log: HealthLog): void {
        this.healthLogs[date] = log;
        this.saveLocally();
    }

    /**
     * 하루 복약 일정을 전부 미복용 상태로 초기화하는 함수
     * @param {string} date - 초기화할 날짜
     */
    public resetDaily(date: string): void {
        this.intakeRecords[date] = [];
        this.saveLocally();
    }
}

// 시스템 전역 상태 싱글톤(Singleton) 인스턴스 내보내기
export const state = new AppState();