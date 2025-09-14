"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Activity } from "lucide-react"
import type { QueuedTrade, ExecutedTrade } from "@/lib/api"

interface TradeSummaryProps {
  queuedTrades: QueuedTrade[]
  executedTrades: ExecutedTrade[]
  className?: string
}

export function TradeSummary({ queuedTrades, executedTrades, className }: TradeSummaryProps) {
  const totalTrades = queuedTrades.length + executedTrades.length

  const calculateTotals = (trades: (QueuedTrade | ExecutedTrade)[]) => {
    return trades.reduce(
      (acc, trade) => {
        const amount = Math.abs(trade.dollar_amount)
        acc.buyAmount += amount
        acc.buyCount += 1
        return acc
      },
      { buyAmount: 0, buyCount: 0 },
    )
  }

  const queuedTotals = calculateTotals(queuedTrades)
  const executedTotals = calculateTotals(executedTrades)

  const totalBuyAmount = queuedTotals.buyAmount + executedTotals.buyAmount
  const totalBuyCount = queuedTotals.buyCount + executedTotals.buyCount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (totalTrades === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Activity className="w-5 h-5 text-[#26a7de]" />
          Trading Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Trades */}
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalTrades}</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs"
              >
                {executedTrades.length} executed
              </Badge>
              <Badge variant="secondary" className="bg-[#26a7de]/10 text-[#26a7de] border-[#26a7de]/20 text-xs">
                {queuedTrades.length} queued
              </Badge>
            </div>
          </div>

          {/* Buy Orders */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-[#26a7de]" />
              <div className="text-2xl font-bold text-foreground">{totalBuyCount}</div>
            </div>
            <div className="text-sm text-muted-foreground">Buy Orders</div>
            <div className="text-xs text-foreground font-medium mt-1">{formatCurrency(totalBuyAmount)}</div>
          </div>

          {/* Total Volume */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-[#26a7de]" />
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBuyAmount)}</div>
            </div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
            <div className="text-xs text-muted-foreground mt-1">Combined trading value</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
