// src/types/environment.ts
export interface EnvironmentData {
    timestamp: string;       // LocalDateTime → 문자열로 직렬화됨
    temperature: number;
    humidity: number;
    dust: number;
}
