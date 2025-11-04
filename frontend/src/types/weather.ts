// src/types/weather.ts
export type WeatherData = {
    updatedAt: string;      // ISO string
    district: string;       // 행정동/구 등
    temp: number;           // ℃
    humidity: number;       // %
    windSpeed: number;      // m/s
    windDir: string;        // N/NE/E/...
    weather: string;        // "맑음/구름/비" 등
};
