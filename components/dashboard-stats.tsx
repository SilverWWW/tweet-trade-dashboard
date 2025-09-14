"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Activity, MessageSquare, DollarSign } from "lucide-react"
import type { QueuedTrade, ExecutedTrade } from "@/lib/api"

interface DashboardStatsProps {
  totalTweets: number
  queuedTrades: QueuedTrade[]
  executedTrades: ExecutedTrade[]
  className?: string
}

export function DashboardStats({ totalTweets, queuedTrades, executedTrades, className }: DashboardStatsProps) {
  const totalTrades = queuedTrades.length + executedTrades.length

  const calculateTotals = (trades: (QueuedTrade | ExecutedTrade)[]) => {
    return trades.reduce(
      (acc, trade) => {
        const amount = Math.abs(trade.dollar_amount)
        acc.totalVolume += amount
        acc.buyCount += 1
        acc.buyVolume += amount
        return acc
      },
      { totalVolume: 0, buyCount: 0, buyVolume: 0 },
    )
  }

  const allTrades = [...queuedTrades, ...executedTrades]
  const totals = calculateTotals(allTrades)

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    /* consolidated into single trading summary banner */
    <Card className={`border-l-4 border-l-[#26a7de] bg-gradient-to-r from-[#26a7de]/5 to-transparent ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#26a7de]" />
          Trading Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#26a7de]/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-[#26a7de]" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Market Impact Posts</div>
              <div className="text-2xl font-bold text-foreground">{totalTweets}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#26a7de]/15 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#26a7de]" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-2xl font-bold text-foreground">{totalTrades}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#26a7de]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#26a7de]" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totals.totalVolume)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#26a7de]/25 rounded-lg">
              <Activity className="w-5 h-5 text-[#26a7de]" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Execution Status</div>
              <div className="text-2xl font-bold text-foreground">
                {executedTrades.length}/{totalTrades}
              </div>
              <div className="text-xs text-muted-foreground">{queuedTrades.length} pending</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
