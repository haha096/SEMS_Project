// src/contexts/WeatherContext.tsx
import React, { createContext, useContext, useState } from "react";
import type { WeatherData } from "@/api/weather";

type WeatherCtx = {
    weather: WeatherData | null;
    setWeather: (w: WeatherData | null) => void;
    district: string;
    setDistrict: (d: string) => void;
};

const WeatherContext = createContext<WeatherCtx | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    // 기본 지역은 니 상황에 맞게 세팅
    const [district, setDistrict] = useState<string>("서초구");

    return (
        <WeatherContext.Provider value={{ weather, setWeather, district, setDistrict }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const ctx = useContext(WeatherContext);
    if (!ctx) throw new Error("useWeather must be used within WeatherProvider");
    return ctx;
}
