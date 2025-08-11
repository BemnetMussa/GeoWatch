// Types for NASA FIRMS fire data
export interface FireHotspot {
  latitude: number
  longitude: number
  brightness: number
  scan: number
  track: number
  acq_date: string
  acq_time: string
  satellite: string
  instrument: string
  confidence: number
  version: string
  bright_t31: number
  frp: number // Fire Radiative Power
  daynight: "D" | "N"
}

export interface FireDataResponse {
  data: FireHotspot[]
  count: number
  source: string
  area: string
  dateRange: string
}

export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface ChangeDetectionPeriod {
  startDate: string
  endDate: string
  label: string
}

export interface FireChange {
  id: string
  latitude: number
  longitude: number
  changeType: "new" | "growing" | "diminishing" | "extinguished"
  intensity: number // 0-1 scale
  beforeFrp?: number
  afterFrp?: number
  confidence: number
  firstDetected?: string
  lastDetected?: string
}

export interface ChangeDetectionResult {
  period1: ChangeDetectionPeriod
  period2: ChangeDetectionPeriod
  changes: FireChange[]
  summary: {
    newFires: number
    growingFires: number
    diminishingFires: number
    extinguishedFires: number
    totalChanges: number
  }
}

export interface TemporalFireData {
  period: ChangeDetectionPeriod
  fires: FireHotspot[]
  bounds: MapBounds
}
