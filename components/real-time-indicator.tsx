"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface RealTimeIndicatorProps {
  isConnected: boolean
  lastUpdated: Date | null
  isRefreshing?: boolean
  className?: string
}

export function RealTimeIndicator({
  isConnected,
  lastUpdated,
  isRefreshing = false,
  className,
}: RealTimeIndicatorProps) {
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Never"

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className={cn(
          "flex items-center gap-1 text-xs",
          isConnected
            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        )}
      >
        {isRefreshing ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : isConnected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {isRefreshing ? "Updating..." : isConnected ? "Live" : "Offline"}
      </Badge>

      {lastUpdated && (
        <span className="text-xs text-foreground/70">
          {/* Using foreground/70 for better contrast */}Updated {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  )
}
