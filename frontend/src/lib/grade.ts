export function gradeLabel(score: number) {
    if (score >= 90) return "좋음"
    if (score >= 80) return "보통"
    if (score >= 50) return "나쁨"
    return "매우 나쁨"
}

export function scoreToColor(score: number) {
    if (score >= 90) return "text-emerald-500"
    if (score >= 80) return "text-yellow-500"
    if (score >= 50) return "text-orange-500"
    return "text-red-500"
}

export function scoreToBar(score: number) {
    if (score >= 90) return "from-emerald-400 to-emerald-500"
    if (score >= 80) return "from-yellow-400 to-yellow-500"
    if (score >= 50) return "from-orange-400 to-orange-500"
    return "from-red-400 to-red-500"
}
