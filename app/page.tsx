"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { PostList } from "@/components/post-list"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, MessageSquare } from "lucide-react"
import { useSimpleData } from "@/hooks/use-simple-data"

export default function Dashboard() {
  const { tweets: posts, loading, error, refresh } = useSimpleData()

  const queuedTrades = posts.flatMap((post) => post.trades.filter((trade) => !trade.executed_at))
  const executedTrades = posts.flatMap((post) => post.trades.filter((trade) => trade.executed_at))

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader onRefresh={refresh} isRefreshing={false} />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onRefresh={refresh}
        isRefreshing={false}
        totalTweets={posts.length}
        totalTrades={queuedTrades.length + executedTrades.length}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Real-time Status Indicator */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-card-foreground font-playfair">Trading Dashboard</h1>
        </div>

        {/* Consolidated Dashboard Stats */}
        <DashboardStats totalTweets={posts.length} queuedTrades={queuedTrades} executedTrades={executedTrades} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Market Impact Feed
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              All Trades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <PostList
              limit={20}
              posts={posts}
              queuedTrades={queuedTrades}
              executedTrades={executedTrades}
              isRefreshing={false}
              hasMore={false}
              loadingMore={false}
              onLoadMore={() => {}}
              totalPosts={posts.length}
            />
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-card-foreground mb-4">All Trading Activity</h2>
                <p className="text-muted-foreground mb-6">
                  Complete overview of queued and executed trades across all market-impact posts
                </p>
              </div>

              {/* All Trades View */}
              <div className="grid gap-6">
                {queuedTrades.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                      Queued Trades ({queuedTrades.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {queuedTrades.map((trade) => (
                        <div key={trade.id} className="border border-border rounded-lg p-4 bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-lg">${trade.ticker}</span>
                            <span className="text-sm text-muted-foreground">
                              {trade.dollar_amount > 0 ? "BUY" : "SELL"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Math.abs(Number(trade.dollar_amount)).toLocaleString()} • {trade.timeline} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {executedTrades.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-chart-1 rounded-full"></div>
                      Executed Trades ({executedTrades.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {executedTrades.map((trade) => (
                        <div key={trade.id} className="border border-border rounded-lg p-4 bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-lg">${trade.ticker}</span>
                            <span className="text-sm text-muted-foreground">
                              {trade.dollar_amount > 0 ? "BUY" : "SELL"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Math.abs(Number(trade.dollar_amount)).toLocaleString()} • {trade.timeline} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {queuedTrades.length === 0 && executedTrades.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No trades found. Check back later for trading activity.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
