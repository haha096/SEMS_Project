// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { WeatherProvider } from "@/contexts/WeatherContext";
import { AuthProvider } from "@/features/auth/AuthContext";

async function bootstrap() {
    // ... (기존 MSW 부트스트랩 그대로)
    const root = document.getElementById("root")!;
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <AuthProvider>
                <WeatherProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </WeatherProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}
bootstrap();
