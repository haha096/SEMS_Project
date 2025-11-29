import React from "react"
import { Card, CardContent } from "../ui/card"
import Gauge from "./Gauge"

interface MetricCardProps {
    title: string
    value?: number
    sub?: string
    color?: string
    status?: "missing" | "stopped"
}

export default function MetricCard({ title, value, sub, color = "#2563eb", status }: MetricCardProps) {
    const hasValue = typeof value === "number" && !Number.isNaN(value)

    return (
        <Card className="h-full shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 line-clamp-1">{title}</div>
                    {status && (
                        <span
                            className={
                                "ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium " +
                                (status === "stopped" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700")
                            }
                        >
              {status === "stopped" ? "환기청정기 정지" : "센서 데이터 없음"}
            </span>
                    )}
                </div>

                <div className="mt-2 flex items-center gap-3">
                    <div className="w-1/2">
                        {hasValue ? (
                            <Gauge value={value!} color={color} />
                        ) : (
                            <div className="h-[140px] grid place-items-center rounded-lg border bg-slate-50 text-xs text-slate-500">
                                데이터 없음
                            </div>
                        )}
                    </div>
                    <div className="w-1/2 flex flex-col items-center justify-center">
                        <div className="text-4xl font-semibold leading-none">{hasValue ? value : "--"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                            {hasValue ? sub : status === "stopped" ? "정지 상태" : "센서 데이터 없음"}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
