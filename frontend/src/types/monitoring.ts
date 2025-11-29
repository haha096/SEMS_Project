export interface OutdoorData {
    district: string
    temp: number
    humidity: number
    windSpeed: number
    windDir: string
    weather: string
}

export interface GaugeData {
    pm10: number
    pm25: number
    co2: number
    cici: number
    temp: number
    rh: number
}

export interface RawData {
    pm10: number
    pm25: number
    co2: number
    temp: number
    rh: number
}

export interface MonitoringData {
    updatedAt: string
    station: string
    deviceId: string
    location: string
    outdoor: OutdoorData
    gauges: GaugeData
    raw: RawData
}
