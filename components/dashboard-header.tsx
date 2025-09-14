"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Activity, RefreshCw } from "lucide-react"

interface DashboardHeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  totalTweets?: number
  totalTrades?: number
}

export function DashboardHeader({
  onRefresh,
  isRefreshing = false,
  totalTweets = 0,
  totalTrades = 0,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#26a7de] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#26a7de] font-playfair">Tweet Trade 🐤</h1>
                <p className="text-sm text-muted-foreground font-medium">Social Media Trading Dashboard</p>
              </div>
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{totalTweets} posts</span>
                <Badge variant="secondary" className="bg-muted/20 text-foreground border border-muted/30">
                  {totalTrades} trades
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
