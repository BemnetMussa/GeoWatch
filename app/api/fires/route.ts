import { type NextRequest, NextResponse } from "next/server"
import type { FireHotspot, FireDataResponse, MapBounds } from "@/lib/types"

// NASA FIRMS API configuration
const FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
const MAP_KEY = process.env.NASA_FIRMS_MAP_KEY || "demo_key" // Users will need to get their own key
const DEFAULT_SOURCE = "VIIRS_SNPP_NRT" // VIIRS Suomi-NPP Near Real-Time

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const bounds: MapBounds = {
      west: Number.parseFloat(searchParams.get("west") || "-180"),
      south: Number.parseFloat(searchParams.get("south") || "-90"),
      east: Number.parseFloat(searchParams.get("east") || "180"),
      north: Number.parseFloat(searchParams.get("north") || "90"),
    }

    const dayRange = Number.parseInt(searchParams.get("dayRange") || "1")
    const source = searchParams.get("source") || DEFAULT_SOURCE
    const date = searchParams.get("date") // Optional, if not provided gets most recent

    // Validate bounds
    if (
      bounds.west < -180 ||
      bounds.west > 180 ||
      bounds.east < -180 ||
      bounds.east > 180 ||
      bounds.south < -90 ||
      bounds.south > 90 ||
      bounds.north < -90 ||
      bounds.north > 90
    ) {
      return NextResponse.json({ error: "Invalid coordinates. Must be within valid lat/lng bounds." }, { status: 400 })
    }

    // Validate day range
    if (dayRange < 1 || dayRange > 10) {
      return NextResponse.json({ error: "Day range must be between 1 and 10." }, { status: 400 })
    }

    // Build FIRMS API URL
    const areaCoords = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
    let firmsUrl = `${FIRMS_BASE_URL}/${MAP_KEY}/${source}/${areaCoords}/${dayRange}`

    if (date) {
      firmsUrl += `/${date}`
    }

    console.log("Fetching from FIRMS:", firmsUrl)

    // Fetch data from NASA FIRMS
    const response = await fetch(firmsUrl, {
      headers: {
        "User-Agent": "GeoWatch-App/1.0",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          data: [],
          count: 0,
          source,
          area: areaCoords,
          dateRange: `${dayRange} days`,
          message: "No fire data found for the specified area and time range.",
        })
      }

      throw new Error(`FIRMS API error: ${response.status} ${response.statusText}`)
    }

    const csvData = await response.text()

    // Parse CSV data
    const lines = csvData.trim().split("\n")
    if (lines.length <= 1) {
      return NextResponse.json({
        data: [],
        count: 0,
        source,
        area: areaCoords,
        dateRange: `${dayRange} days`,
        message: "No fire data available.",
      })
    }

    // Skip header row and parse data
    const fireData: FireHotspot[] = lines
      .slice(1)
      .map((line) => {
        const columns = line.split(",")
        return {
          latitude: Number.parseFloat(columns[0]),
          longitude: Number.parseFloat(columns[1]),
          brightness: Number.parseFloat(columns[2]),
          scan: Number.parseFloat(columns[3]),
          track: Number.parseFloat(columns[4]),
          acq_date: columns[5],
          acq_time: columns[6],
          satellite: columns[7],
          instrument: columns[8],
          confidence: Number.parseFloat(columns[9]),
          version: columns[10],
          bright_t31: Number.parseFloat(columns[11]),
          frp: Number.parseFloat(columns[12]),
          daynight: columns[13] as "D" | "N",
        }
      })
      .filter(
        (fire) =>
          // Filter out invalid coordinates
          !isNaN(fire.latitude) &&
          !isNaN(fire.longitude) &&
          fire.latitude >= -90 &&
          fire.latitude <= 90 &&
          fire.longitude >= -180 &&
          fire.longitude <= 180,
      )

    const result: FireDataResponse = {
      data: fireData,
      count: fireData.length,
      source,
      area: areaCoords,
      dateRange: `${dayRange} days`,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching fire data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch fire data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
