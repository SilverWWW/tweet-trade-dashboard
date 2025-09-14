"use client"

import { TradeCard } from "./trade-card"
import type { QueuedTrade, ExecutedTrade } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TradeListProps {
  queuedTrades?: QueuedTrade[]
  executedTrades?: ExecutedTrade[]
  className?: string
}

export function TradeList({ queuedTrades = [], executedTrades = [], className }: TradeListProps) {
  const totalTrades = queuedTrades.length + executedTrades.length

  if (totalTrades === 0) {
    return <div className="text-center py-6 text-muted-foreground">No trades found for this post</div>
  }

  // If we only have one type of trade, show them directly
  if (queuedTrades.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {executedTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} type="executed" />
          ))}
        </div>
      </div>
    )
  }

  if (executedTrades.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-3">
          {queuedTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} type="queued" />
          ))}
        </div>
      </div>
    )
  }

  // If we have both types, show them in tabs
  return (
    <div className={className}>
      <Tabs defaultValue="queued" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queued" className="flex items-center gap-2">
            Queued Trades
            <Badge variant="secondary" className="bg-muted/20 text-foreground border border-muted/30">
              {queuedTrades.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="executed" className="flex items-center gap-2">
            Executed Trades
            <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/30">
              {executedTrades.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queued" className="mt-4">
          <div className="space-y-3">
            {queuedTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} type="queued" />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executed" className="mt-4">
          <div className="space-y-3">
            {executedTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} type="executed" />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
