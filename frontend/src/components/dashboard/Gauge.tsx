import React, { useMemo } from "react"
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts"

interface GaugeProps {
    value?: number
    color?: string
}

export default function Gauge({ value = 0, color = "#2563eb" }: GaugeProps) {
    const data = useMemo(() => [{ name: "score", value }], [value])

    return (
        <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart innerRadius="80%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} fill={color} background={{ fill: "#eef2f7" }} />
            </RadialBarChart>
        </ResponsiveContainer>
    )
}
