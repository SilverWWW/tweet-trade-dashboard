"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, DollarSign, Calendar, Info } from "lucide-react"
import type { QueuedTrade, ExecutedTrade } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface TradeCardProps {
  trade: QueuedTrade | ExecutedTrade
  type: "queued" | "executed"
  className?: string
}

export function TradeCard({ trade, type, className }: TradeCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)

  const isExecuted = type === "executed"
  const timestamp = isExecuted ? (trade as ExecutedTrade).executed_at : (trade as QueuedTrade).queued_at

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const absAmount = Math.abs(trade.dollar_amount)

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md border-l-4",
        isExecuted
          ? "border-l-chart-1 bg-gradient-to-r from-chart-1/5 to-transparent"
          : "border-l-chart-3 bg-gradient-to-r from-chart-3/5 to-transparent",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with ticker and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-1" />
                <span className="font-mono font-bold text-lg text-foreground">${trade.ticker}</span>
              </div>
              <Badge variant="default" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                BUY
              </Badge>
            </div>
            <Badge
              variant={isExecuted ? "default" : "secondary"}
              className={cn(
                isExecuted
                  ? "bg-chart-1/10 text-chart-1 border-chart-1/20"
                  : "bg-chart-3/10 text-chart-3 border-chart-3/20",
              )}
            >
              {isExecuted ? "Executed" : "Queued"}
            </Badge>
          </div>

          {/* Trade details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-semibold text-foreground">{formatCurrency(absAmount)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground">Hold Period</div>
                <div className="font-semibold text-foreground">
                  {trade.days_to_hold} day{trade.days_to_hold !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {isExecuted ? "Executed" : "Queued"} {formatDate(timestamp)}
            </span>
          </div>

          {/* Reasoning section */}
          <div className="border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full justify-start p-0 h-auto text-left hover:bg-transparent"
            >
              <Info className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {showReasoning ? "Hide" : "Show"} Trading Reasoning
              </span>
            </Button>

            {showReasoning && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-foreground leading-relaxed">{trade.reasoning}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
