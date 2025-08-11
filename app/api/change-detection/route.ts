import { type NextRequest, NextResponse } from "next/server"
import type { FireHotspot, ChangeDetectionResult, ChangeDetectionPeriod, FireChange, MapBounds } from "@/lib/types"

// Helper function to fetch fire data for a specific period
async function fetchFireDataForPeriod(bounds: MapBounds, startDate: string, endDate: string): Promise<FireHotspot[]> {
  const params = new URLSearchParams({
    west: bounds.west.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    north: bounds.north.toString(),
    dayRange: "10", // Maximum range to get historical data
    date: startDate,
  })

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/fires?${params}`)
    const result = await response.json()
    return response.ok ? result.data : []
  } catch (error) {
    console.error("Error fetching fire data for period:", error)
    return []
  }
}

// Algorithm to detect changes between two fire datasets
function detectChanges(
  period1Fires: FireHotspot[],
  period2Fires: FireHotspot[],
  period1: ChangeDetectionPeriod,
  period2: ChangeDetectionPeriod,
): ChangeDetectionResult {
  const changes: FireChange[] = []
  const PROXIMITY_THRESHOLD = 0.01 // ~1km in degrees
  const FRP_CHANGE_THRESHOLD = 0.2 // 20% change threshold

  // Create spatial index for period1 fires
  const period1Index = new Map<string, FireHotspot[]>()
  period1Fires.forEach((fire) => {
    const gridKey = `${Math.floor(fire.latitude * 100)}_${Math.floor(fire.longitude * 100)}`
    if (!period1Index.has(gridKey)) {
      period1Index.set(gridKey, [])
    }
    period1Index.get(gridKey)!.push(fire)
  })

  // Find matching fires and detect changes
  const matchedPeriod1Fires = new Set<string>()

  period2Fires.forEach((fire2) => {
    const gridKey = `${Math.floor(fire2.latitude * 100)}_${Math.floor(fire2.longitude * 100)}`
    const nearbyFires = period1Index.get(gridKey) || []

    // Find closest fire in period1
    let closestFire: FireHotspot | null = null
    let minDistance = Number.POSITIVE_INFINITY

    nearbyFires.forEach((fire1) => {
      const distance = Math.sqrt(
        Math.pow(fire1.latitude - fire2.latitude, 2) + Math.pow(fire1.longitude - fire2.longitude, 2),
      )
      if (distance < PROXIMITY_THRESHOLD && distance < minDistance) {
        closestFire = fire1
        minDistance = distance
      }
    })

    if (closestFire) {
      // Existing fire - check for intensity changes
      matchedPeriod1Fires.add(`${closestFire.latitude}_${closestFire.longitude}`)

      const frpChange = (fire2.frp - closestFire.frp) / closestFire.frp
      if (Math.abs(frpChange) > FRP_CHANGE_THRESHOLD) {
        changes.push({
          id: `change_${fire2.latitude}_${fire2.longitude}`,
          latitude: fire2.latitude,
          longitude: fire2.longitude,
          changeType: frpChange > 0 ? "growing" : "diminishing",
          intensity: Math.min(Math.abs(frpChange), 1),
          beforeFrp: closestFire.frp,
          afterFrp: fire2.frp,
          confidence: Math.min(fire2.confidence, closestFire.confidence),
          firstDetected: closestFire.acq_date,
          lastDetected: fire2.acq_date,
        })
      }
    } else {
      // New fire
      changes.push({
        id: `new_${fire2.latitude}_${fire2.longitude}`,
        latitude: fire2.latitude,
        longitude: fire2.longitude,
        changeType: "new",
        intensity: Math.min(fire2.frp / 100, 1), // Normalize FRP to 0-1 scale
        afterFrp: fire2.frp,
        confidence: fire2.confidence,
        firstDetected: fire2.acq_date,
      })
    }
  })

  // Find extinguished fires
  period1Fires.forEach((fire1) => {
    const fireKey = `${fire1.latitude}_${fire1.longitude}`
    if (!matchedPeriod1Fires.has(fireKey)) {
      changes.push({
        id: `extinguished_${fire1.latitude}_${fire1.longitude}`,
        latitude: fire1.latitude,
        longitude: fire1.longitude,
        changeType: "extinguished",
        intensity: Math.min(fire1.frp / 100, 1),
        beforeFrp: fire1.frp,
        confidence: fire1.confidence,
        lastDetected: fire1.acq_date,
      })
    }
  })

  // Calculate summary
  const summary = {
    newFires: changes.filter((c) => c.changeType === "new").length,
    growingFires: changes.filter((c) => c.changeType === "growing").length,
    diminishingFires: changes.filter((c) => c.changeType === "diminishing").length,
    extinguishedFires: changes.filter((c) => c.changeType === "extinguished").length,
    totalChanges: changes.length,
  }

  return {
    period1,
    period2,
    changes,
    summary,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bounds, period1, period2 } = body

    // Validate input
    if (!bounds || !period1 || !period2) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Fetch fire data for both periods
    const [period1Fires, period2Fires] = await Promise.all([
      fetchFireDataForPeriod(bounds, period1.startDate, period1.endDate),
      fetchFireDataForPeriod(bounds, period2.startDate, period2.endDate),
    ])

    // Detect changes
    const result = detectChanges(period1Fires, period2Fires, period1, period2)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in change detection:", error)
    return NextResponse.json(
      {
        error: "Failed to perform change detection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
