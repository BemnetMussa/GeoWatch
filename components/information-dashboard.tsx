"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { BarChart3, TrendingUp, Flame, Satellite, Download, Activity, Globe } from "lucide-react"
import type { FireHotspot, ChangeDetectionResult } from "@/lib/types"

interface FireAnalytics {
  totalFires: number
  highConfidenceFires: number
  averageConfidence: number
  totalFRP: number
  averageFRP: number
  dayNightRatio: { day: number; night: number }
  satelliteDistribution: Record<string, number>
  confidenceDistribution: { range: string; count: number }[]
  timeDistribution: { hour: number; count: number }[]
  geographicHotspots: { lat: number; lng: number; count: number; intensity: number }[]
  trends: { date: string; count: number; avgFRP: number }[]
}

interface InformationDashboardProps {
  fireData: FireHotspot[]
  changeResult: ChangeDetectionResult | null
  lastUpdate: Date | null
  isVisible: boolean
  onClose: () => void
}

export function InformationDashboard({
  fireData,
  changeResult,
  lastUpdate,
  isVisible,
  onClose,
}: InformationDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("overview")

  // Calculate comprehensive analytics
  const analytics = useMemo((): FireAnalytics => {
    if (!fireData.length) {
      return {
        totalFires: 0,
        highConfidenceFires: 0,
        averageConfidence: 0,
        totalFRP: 0,
        averageFRP: 0,
        dayNightRatio: { day: 0, night: 0 },
        satelliteDistribution: {},
        confidenceDistribution: [],
        timeDistribution: [],
        geographicHotspots: [],
        trends: [],
      }
    }

    const totalFires = fireData.length
    const highConfidenceFires = fireData.filter((fire) => fire.confidence >= 80).length
    const averageConfidence = fireData.reduce((sum, fire) => sum + fire.confidence, 0) / totalFires
    const totalFRP = fireData.reduce((sum, fire) => sum + fire.frp, 0)
    const averageFRP = totalFRP / totalFires

    // Day/Night distribution
    const dayFires = fireData.filter((fire) => fire.daynight === "D").length
    const nightFires = fireData.filter((fire) => fire.daynight === "N").length
    const dayNightRatio = {
      day: (dayFires / totalFires) * 100,
      night: (nightFires / totalFires) * 100,
    }

    // Satellite distribution
    const satelliteDistribution = fireData.reduce(
      (acc, fire) => {
        acc[fire.satellite] = (acc[fire.satellite] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Confidence distribution
    const confidenceRanges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ]

    const confidenceDistribution = confidenceRanges.map((range) => ({
      range: range.range,
      count: fireData.filter((fire) => fire.confidence >= range.min && fire.confidence <= range.max).length,
    }))

    // Time distribution (by hour)
    const timeDistribution = Array.from({ length: 24 }, (_, hour) => {
      const count = fireData.filter((fire) => {
        const fireHour = Number.parseInt(fire.acq_time.substring(0, 2))
        return fireHour === hour
      }).length
      return { hour, count }
    })

    // Geographic hotspots (simplified clustering)
    const gridSize = 0.5 // degrees
    const hotspotGrid = new Map<string, { lat: number; lng: number; count: number; totalFRP: number }>()

    fireData.forEach((fire) => {
      const gridLat = Math.floor(fire.latitude / gridSize) * gridSize
      const gridLng = Math.floor(fire.longitude / gridSize) * gridSize
      const key = `${gridLat}_${gridLng}`

      if (!hotspotGrid.has(key)) {
        hotspotGrid.set(key, { lat: gridLat, lng: gridLng, count: 0, totalFRP: 0 })
      }

      const hotspot = hotspotGrid.get(key)!
      hotspot.count += 1
      hotspot.totalFRP += fire.frp
    })

    const geographicHotspots = Array.from(hotspotGrid.values())
      .map((hotspot) => ({
        lat: hotspot.lat,
        lng: hotspot.lng,
        count: hotspot.count,
        intensity: hotspot.totalFRP / hotspot.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Trends (by date)
    const dateGroups = fireData.reduce(
      (acc, fire) => {
        const date = fire.acq_date
        if (!acc[date]) {
          acc[date] = { fires: [], totalFRP: 0 }
        }
        acc[date].fires.push(fire)
        acc[date].totalFRP += fire.frp
        return acc
      },
      {} as Record<string, { fires: FireHotspot[]; totalFRP: number }>,
    )

    const trends = Object.entries(dateGroups)
      .map(([date, data]) => ({
        date,
        count: data.fires.length,
        avgFRP: data.totalFRP / data.fires.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalFires,
      highConfidenceFires,
      averageConfidence,
      totalFRP,
      averageFRP,
      dayNightRatio,
      satelliteDistribution,
      confidenceDistribution,
      timeDistribution,
      geographicHotspots,
      trends,
    }
  }, [fireData])

  // Export data function
  const exportData = (format: "csv" | "json") => {
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `fire-data-${timestamp}.${format}`

    if (format === "csv") {
      const headers = [
        "latitude",
        "longitude",
        "brightness",
        "confidence",
        "frp",
        "acq_date",
        "acq_time",
        "satellite",
        "instrument",
        "daynight",
      ]
      const csvContent = [
        headers.join(","),
        ...fireData.map((fire) =>
          [
            fire.latitude,
            fire.longitude,
            fire.brightness,
            fire.confidence,
            fire.frp,
            fire.acq_date,
            fire.acq_time,
            fire.satellite,
            fire.instrument,
            fire.daynight,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify(
        {
          metadata: {
            exportDate: new Date().toISOString(),
            totalRecords: fireData.length,
            analytics,
          },
          fireData,
          changeDetection: changeResult,
        },
        null,
        2,
      )

      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[1003] flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Fire Data Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of {analytics.totalFires} fire hotspots
              {lastUpdate && ` • Last updated: ${lastUpdate.toLocaleString()}`}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => exportData("csv")}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportData("json")}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      <div className="text-2xl font-bold">{analytics.totalFires}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Fires</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <div className="text-2xl font-bold">{analytics.highConfidenceFires}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">High Confidence (≥80%)</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <div className="text-2xl font-bold">{analytics.averageFRP.toFixed(1)}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg FRP (MW)</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <div className="text-2xl font-bold">{analytics.averageConfidence.toFixed(1)}%</div>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </CardContent>
                </Card>
              </div>

              {/* Change Detection Summary */}
              {changeResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Detection Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{changeResult.summary.newFires}</div>
                        <div className="text-sm text-muted-foreground">New Fires</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{changeResult.summary.growingFires}</div>
                        <div className="text-sm text-muted-foreground">Growing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {changeResult.summary.diminishingFires}
                        </div>
                        <div className="text-sm text-muted-foreground">Diminishing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {changeResult.summary.extinguishedFires}
                        </div>
                        <div className="text-sm text-muted-foreground">Extinguished</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Day/Night and Confidence Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Day vs Night Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Day</span>
                          <span>{analytics.dayNightRatio.day.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.dayNightRatio.day} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Night</span>
                          <span>{analytics.dayNightRatio.night.toFixed(1)}%</span>
                        </div>
                        <Progress value={analytics.dayNightRatio.night} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Confidence Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.confidenceDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fire Activity Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hourly Fire Detection Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.timeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Geographic Hotspots</CardTitle>
                  <CardDescription>Top 10 areas with highest fire activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.geographicHotspots.map((hotspot, index) => (
                      <div
                        key={`${hotspot.lat}_${hotspot.lng}`}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <div className="font-medium">
                              {hotspot.lat.toFixed(2)}°, {hotspot.lng.toFixed(2)}°
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {hotspot.count} fires • Avg intensity: {hotspot.intensity.toFixed(1)} MW
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{hotspot.count}</div>
                          <div className="text-xs text-muted-foreground">fires</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Satellite Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.satelliteDistribution).map(([satellite, count]) => (
                      <div key={satellite} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Satellite className="h-4 w-4" />
                          <span>{satellite}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({((count / analytics.totalFires) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>High Confidence Detections (≥80%)</span>
                      <span className="font-medium">
                        {analytics.highConfidenceFires} / {analytics.totalFires} (
                        {((analytics.highConfidenceFires / analytics.totalFires) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Confidence Score</span>
                      <span className="font-medium">{analytics.averageConfidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Fire Radiative Power</span>
                      <span className="font-medium">{analytics.totalFRP.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average FRP per Fire</span>
                      <span className="font-medium">{analytics.averageFRP.toFixed(1)} MW</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
