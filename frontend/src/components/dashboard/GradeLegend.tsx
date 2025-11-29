import React from "react"
import { Card, CardContent } from "../ui/card"
import { cn } from "../../lib/utils"

export default function GradeLegend() {
    const items = [
        { label: "매우 나쁨 (0~49)", color: "from-red-400 to-red-500" },
        { label: "나쁨 (50~79)", color: "from-orange-400 to-orange-500" },
        { label: "보통 (80~89)", color: "from-yellow-400 to-yellow-500" },
        { label: "좋음 (90~100)", color: "from-emerald-400 to-emerald-500" },
    ]
    return (
        <Card className="border-slate-200">
            <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                    {items.map((it) => (
                        <div key={it.label} className="flex items-center gap-2">
                            <div className={cn("h-2 w-10 rounded-full bg-gradient-to-r", it.color)} />
                            <span className="text-xs text-slate-600">{it.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
