"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { PostCard } from "@/components/post-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, MessageSquare, RefreshCw, ChevronDown } from "lucide-react"
import { useData } from "@/hooks/use-data"

export default function Dashboard() {
  const { data: posts, loading, error, hasMore, totalTweets, currentPage, loadMore, refresh } = useData()

  const queuedTrades = posts.flatMap((post) => post.trades.filter((trade) => trade.action !== "executed"))
  const executedTrades = posts.flatMap((post) => post.trades.filter((trade) => trade.action === "executed"))

  if (loading && posts.length === 0) {
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

  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
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
      <DashboardHeader totalTweets={totalTweets} totalTrades={queuedTrades.length + executedTrades.length} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Real-time Status Indicator */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-card-foreground font-playfair">Trading Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <DashboardStats
          totalTweets={totalTweets}
          queuedTrades={queuedTrades}
          executedTrades={executedTrades}
          currentPage={currentPage}
          postsLoaded={posts.length}
        />

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
            <div className="space-y-6">
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.tweet_process_id} post={post} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Load More Posts
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="text-center py-6 text-muted-foreground">You've reached the end of the feed</div>
              )}

              {posts.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  No market-impact posts found. Check back later for trading activity.
                </div>
              )}
            </div>
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
                      {queuedTrades.map((trade, index) => (
                        <div
                          key={`${trade.tweet_process_id}-${index}`}
                          className="border border-border rounded-lg p-4 bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-lg">${trade.symbol}</span>
                            <span className="text-sm text-muted-foreground">{trade.action.toUpperCase()}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Math.abs(trade.price * trade.quantity).toLocaleString()} • {trade.quantity} shares
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
                      {executedTrades.map((trade, index) => (
                        <div
                          key={`${trade.tweet_process_id}-${index}`}
                          className="border border-border rounded-lg p-4 bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-lg">${trade.symbol}</span>
                            <span className="text-sm text-muted-foreground">{trade.action.toUpperCase()}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${Math.abs(trade.price * trade.quantity).toLocaleString()} • {trade.quantity} shares
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
