// 하단 날씨 위젯 (Air365 스타일 최대한 유사)
import { codeToLabel, codeToEmoji } from "@/types/weatherMapping";
import { windDirToKorean } from "@/types/windDir";

type WeatherData = {
    location: string;      // 예: "구로4동"
    condition: string;     // 날씨 코드 (숫자 또는 문자열)
    temperature: string;   // 예: "10.6℃"
    humidity: string;      // 예: "40%"
    rainfall: string;      // 예: "-mm"
    windSpeed: string;     // 예: "4.8m/s"
    windDir: string;       // 예: "ENE"
};

export default function WeatherCard({
                                        data,
                                    }: { data: WeatherData }) {
    // 강수량 처리: -mm → 0mm
    const rainfallDisplay = data.rainfall === "-mm" ? "0mm" : data.rainfall;

    return (
        <div className="mx-3 mb-3 rounded-md shadow-sm bg-[#2F6ECF] text-white">
            <div className="p-3">
                {/* 상단: 위치 / 날씨 아이콘 */}
                <div className="flex items-center justify-between text-[13px] opacity-95">
                    <div>{data.location}</div>
                    <div className="flex items-center gap-1">
                        <span>{codeToLabel(data.condition)}</span>
                        <span className="text-[18px]">{codeToEmoji(data.condition)}</span>
                    </div>
                </div>

                {/* 온도 크게 */}
                <div className="mt-1 text-3xl font-bold tracking-tight">
                    {data.temperature}
                </div>

                {/* 상세 수치 */}
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs leading-5 opacity-95">
                    <div>습도 <b>{data.humidity}</b></div>
                    <div>강수량 <b>{rainfallDisplay}</b></div>
                    <div>풍속 <b>{data.windSpeed}</b></div>
                    <div>풍향 <b>{windDirToKorean(data.windDir)}</b></div>
                </div>
            </div>
        </div>
    );
}
