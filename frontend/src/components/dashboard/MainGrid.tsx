import React from "react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { MonitoringData } from "../../types/monitoring"
import MetricCard from "./MetricCard"
import GradeLegend from "./GradeLegend"
import { colorOf } from "@/lib/scoring"
import { Play, ListFilter, ThermometerSun, Droplets, Wind } from "lucide-react"

export default function MainGrid({
                                     data,
                                     statusForAll,
                                     deviceStopped,
                                     loading
                                 }: {
    data: MonitoringData
    statusForAll?: "missing"
    deviceStopped?: boolean
    loading?: boolean
}) {
    const g = data.gauges
    const r = data.raw

    // 카드 상태(정지 우선)
    const cardStatus = deviceStopped ? "stopped" : statusForAll

    return (
        <div className="p-4 space-y-4">

            {/* 상단 정보 카드 */}
            <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-sm text-slate-500">실내공기질청정기(IAQ)</div>
                        <div className="text-sm text-slate-700">{data.station}</div>
                        <div className="text-xs text-slate-500">기기 고유 번호 {data.deviceId || "-"}</div>
                        <div className="text-xs text-slate-500">위치 {data.location || "-"}</div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                        <span className="flex items-center gap-1"><ThermometerSun size={16}/> {r.temp || "--"}℃</span>
                        <span className="flex items-center gap-1"><Droplets size={16}/> {r.rh || "--"}%</span>
                        <span className="flex items-center gap-1"><Wind size={16}/> 실외 {data.outdoor.windSpeed || "--"} m/s</span>
                    </div>
                </CardContent>
            </Card>

            {/* 지표 카드 – 값 없으면 MetricCard가 자체적으로 ‘데이터 없음’ 출력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <MetricCard title="미세먼지 (PM10)"    value={statusForAll ? undefined : g.pm10} sub={`${r.pm10} μg/m³`} color={colorOf(g.pm10 ?? 0)} status={cardStatus}/>
                <MetricCard title="초미세먼지 (PM2.5)" value={statusForAll ? undefined : g.pm25} sub={`${r.pm25} μg/m³`} color={colorOf(g.pm25 ?? 0)} status={cardStatus}/>
                <MetricCard title="통합 실내 쾌적지수 (CICI)" value={statusForAll ? undefined : g.cici} sub="-"       color={colorOf(g.cici ?? 0)} status={cardStatus}/>
                <MetricCard title="온도 (TEMP)"       value={statusForAll ? undefined : g.temp} sub={`${r.temp} ℃`}    color={colorOf(g.temp ?? 0)} status={cardStatus}/>
                <MetricCard title="습도 (RH)"         value={statusForAll ? undefined : g.rh}   sub={`${r.rh} %`}      color={colorOf(g.rh ?? 0)} status={cardStatus}/>
            </div>

            {/* 등급 바 + 행동요령 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2"><GradeLegend/></div>
                <Card className="border-slate-200">
                    <CardContent className="p-4 text-sm text-slate-600">
                        {loading ? "데이터 수신 중..." : "실내공기가 매우 쾌적하게 유지되고 있습니다. [습도: 건조] 속도로 인해 건강이 위험받을 수 있으니, 가습/제습 장치를 작동시켜 습도를 조정해주세요."}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
