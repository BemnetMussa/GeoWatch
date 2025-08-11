"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Flame, TrendingUp, AlertTriangle, Info } from "lucide-react"

export interface NotificationData {
  id: string
  type: "new_fire" | "fire_growth" | "system" | "info"
  title: string
  message: string
  timestamp: Date
  location?: { lat: number; lng: number }
  severity?: "low" | "medium" | "high"
}

interface NotificationSystemProps {
  notifications: NotificationData[]
  onDismiss: (id: string) => void
  onClear: () => void
  maxVisible?: number
}

export function NotificationSystem({ notifications, onDismiss, onClear, maxVisible = 3 }: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, maxVisible))
  }, [notifications, maxVisible])

  const getNotificationIcon = (type: NotificationData["type"]) => {
    switch (type) {
      case "new_fire":
        return <Flame className="h-4 w-4 text-red-500" />
      case "fire_growth":
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      case "system":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity?: NotificationData["severity"]) => {
    switch (severity) {
      case "high":
        return "border-l-red-500 bg-red-50 dark:bg-red-950"
      case "medium":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-950"
      case "low":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      default:
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
    }
  }

  if (visibleNotifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[1002] space-y-2 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <Card
          key={notification.id}
          className={`p-3 border-l-4 ${getSeverityColor(notification.severity)} animate-in slide-in-from-right duration-300`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between space-x-2">
            <div className="flex items-start space-x-2 flex-1">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                {notification.location && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {notification.location.lat.toFixed(3)}, {notification.location.lng.toFixed(3)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">{notification.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(notification.id)}
              className="h-6 w-6 p-0 shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}

      {notifications.length > maxVisible && (
        <Card className="p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">+{notifications.length - maxVisible} more notifications</span>
            <Button size="sm" variant="ghost" onClick={onClear} className="h-6 text-xs">
              Clear all
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
