"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, TrendingUp, TrendingDown, Plus, Minus, BarChart3, Play, Pause } from "lucide-react"
import type { ChangeDetectionResult, ChangeDetectionPeriod, FireChange } from "@/lib/types"

interface ChangeDetectionPanelProps {
  onPeriodChange: (period1: ChangeDetectionPeriod, period2: ChangeDetectionPeriod) => void
  changeResult: ChangeDetectionResult | null
  isAnalyzing: boolean
  onToggleAnimation: () => void
  isAnimating: boolean
}

export function ChangeDetectionPanel({
  onPeriodChange,
  changeResult,
  isAnalyzing,
  onToggleAnimation,
  isAnimating,
}: ChangeDetectionPanelProps) {
  const [selectedComparison, setSelectedComparison] = useState<"week" | "month" | "custom">("week")

  // Predefined comparison periods
  const getComparisonPeriods = (type: "week" | "month" | "custom") => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    switch (type) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        return {
          period1: { startDate: twoWeeksAgo, endDate: weekAgo, label: "2 weeks ago" },
          period2: { startDate: weekAgo, endDate: today, label: "Last week" },
        }
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        return {
          period1: { startDate: twoMonthsAgo, endDate: monthAgo, label: "2 months ago" },
          period2: { startDate: monthAgo, endDate: today, label: "Last month" },
        }
      default:
        return {
          period1: { startDate: weekAgo, endDate: weekAgo, label: "Custom period 1" },
          period2: { startDate: today, endDate: today, label: "Custom period 2" },
        }
    }
  }

  useEffect(() => {
    const periods = getComparisonPeriods(selectedComparison)
    onPeriodChange(periods.period1, periods.period2)
  }, [selectedComparison, onPeriodChange])

  const getChangeIcon = (changeType: FireChange["changeType"]) => {
    switch (changeType) {
      case "new":
        return <Plus className="h-3 w-3" />
      case "growing":
        return <TrendingUp className="h-3 w-3" />
      case "diminishing":
        return <TrendingDown className="h-3 w-3" />
      case "extinguished":
        return <Minus className="h-3 w-3" />
    }
  }

  const getChangeColor = (changeType: FireChange["changeType"]) => {
    switch (changeType) {
      case "new":
        return "bg-orange-500"
      case "growing":
        return "bg-red-500"
      case "diminishing":
        return "bg-yellow-500"
      case "extinguished":
        return "bg-green-500"
    }
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Change Detection
        </CardTitle>
        <CardDescription>Compare fire activity across time periods</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Period Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Comparison Period</label>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant={selectedComparison === "week" ? "default" : "outline"}
              onClick={() => setSelectedComparison("week")}
              className="text-xs flex-1"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={selectedComparison === "month" ? "default" : "outline"}
              onClick={() => setSelectedComparison("month")}
              className="text-xs flex-1"
            >
              Month
            </Button>
          </div>
        </div>

        <Separator />

        {/* Analysis Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Animation</span>
            <Button size="sm" variant="outline" onClick={onToggleAnimation} className="h-8 w-8 p-0 bg-transparent">
              {isAnimating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Results Summary */}
        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Analyzing changes...</span>
          </div>
        )}

        {changeResult && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Change Summary</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                <div className="text-lg font-bold text-orange-600">{changeResult.summary.newFires}</div>
                <div className="text-xs text-orange-600">New Fires</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
                <div className="text-lg font-bold text-red-600">{changeResult.summary.growingFires}</div>
                <div className="text-xs text-red-600">Growing</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                <div className="text-lg font-bold text-yellow-600">{changeResult.summary.diminishingFires}</div>
                <div className="text-xs text-yellow-600">Diminishing</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                <div className="text-lg font-bold text-green-600">{changeResult.summary.extinguishedFires}</div>
                <div className="text-xs text-green-600">Extinguished</div>
              </div>
            </div>

            {/* Recent Changes List */}
            {changeResult.changes.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Changes</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {changeResult.changes.slice(0, 5).map((change, index) => (
                    <div key={change.id} className="flex items-center space-x-2 text-xs p-2 bg-muted rounded">
                      <div className={`w-2 h-2 rounded-full ${getChangeColor(change.changeType)}`} />
                      <div className="flex-1">
                        <div className="font-medium capitalize">{change.changeType} Fire</div>
                        <div className="text-muted-foreground">
                          {change.latitude.toFixed(3)}, {change.longitude.toFixed(3)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(change.intensity * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Period Information */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Comparing {getComparisonPeriods(selectedComparison).period1.label}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>vs {getComparisonPeriods(selectedComparison).period2.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
