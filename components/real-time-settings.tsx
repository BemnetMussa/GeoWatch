"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Radio, RadioOff, Clock, Bell, BellOff, Activity, Wifi, WifiOff, Settings } from "lucide-react"

export interface RealTimeSettings {
  enabled: boolean
  interval: number // in minutes
  notifications: boolean
  autoRefreshOnFocus: boolean
  backgroundSync: boolean
}

interface RealTimeSettingsProps {
  settings: RealTimeSettings
  onSettingsChange: (settings: RealTimeSettings) => void
  connectionStatus: "connected" | "disconnected" | "error"
  lastSync: Date | null
  nextSync: Date | null
  updateCount: number
}

export function RealTimeSettingsPanel({
  settings,
  onSettingsChange,
  connectionStatus,
  lastSync,
  nextSync,
  updateCount,
}: RealTimeSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateSetting = <K extends keyof RealTimeSettings>(key: K, value: RealTimeSettings[K]) => {
    onSettingsChange({ ...settings, key: value })
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-3 w-3 text-green-500" />
      case "disconnected":
        return <WifiOff className="h-3 w-3 text-yellow-500" />
      case "error":
        return <WifiOff className="h-3 w-3 text-red-500" />
    }
  }

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "disconnected":
        return "Disconnected"
      case "error":
        return "Error"
    }
  }

  const getTimeUntilNext = () => {
    if (!nextSync) return null
    const now = new Date()
    const diff = nextSync.getTime() - now.getTime()
    if (diff <= 0) return "Updating..."

    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Real-time Updates</CardTitle>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Automatic fire data synchronization</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm font-medium">{getConnectionStatus()}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {updateCount} updates
          </Badge>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settings.enabled ? (
              <Radio className="h-4 w-4 text-green-500" />
            ) : (
              <RadioOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">Auto-sync</span>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={(enabled) => updateSetting("enabled", enabled)} />
        </div>

        {settings.enabled && (
          <>
            <Separator />

            {/* Update Interval */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Update Interval</label>
              <Select
                value={settings.interval.toString()}
                onValueChange={(value) => updateSetting("interval", Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Next Update Timer */}
            {nextSync && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Next update: {getTimeUntilNext()}</span>
              </div>
            )}

            {isExpanded && (
              <>
                <Separator />

                {/* Advanced Settings */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Advanced Settings</div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {settings.notifications ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Notifications</span>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(notifications) => updateSetting("notifications", notifications)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Refresh on focus</span>
                    <Switch
                      checked={settings.autoRefreshOnFocus}
                      onCheckedChange={(autoRefreshOnFocus) => updateSetting("autoRefreshOnFocus", autoRefreshOnFocus)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Background sync</span>
                    <Switch
                      checked={settings.backgroundSync}
                      onCheckedChange={(backgroundSync) => updateSetting("backgroundSync", backgroundSync)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Last Update Info */}
            {lastSync && (
              <div className="text-xs text-muted-foreground">Last sync: {lastSync.toLocaleTimeString()}</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
