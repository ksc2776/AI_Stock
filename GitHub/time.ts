/**
 * 복약 시간대별 데이터 구조를 엄격하게 정의하는 인터페이스
 */
export interface TimeRange {
    start: number;
    end: number;
    label: string;
    timeStr: string;
}

/**
 * 시스템 전역에서 공유하는 하루 복약 시간대 설정 객체
 */
export const timeRanges: Record<string, TimeRange> = {
    morning: { start: 7, end: 9, label: "아침 복약 (07시~09시)", timeStr: "08:00" },
    afternoon: { start: 12, end: 14, label: "점심 복약 (12시~14시)", timeStr: "13:00" },
    evening: { start: 18, end: 20, label: "저녁 복약 (18시~20시)", timeStr: "19:00" },
    night: { start: 21, end: 23, label: "취침 전 복약 (21시~23시)", timeStr: "22:00" }
};