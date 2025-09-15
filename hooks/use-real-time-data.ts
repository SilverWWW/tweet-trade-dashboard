"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  type TweetProcess,
  type QueuedTrade,
  type ExecutedTrade,
  fetchTweetsWithMarketEffect,
  fetchAllQueuedTrades,
  fetchAllExecutedTrades,
} from "@/lib/api"

interface UseRealTimeDataOptions {
  limit?: number
}

interface RealTimeData {
  tweets: TweetProcess[]
  queuedTrades: QueuedTrade[]
  executedTrades: ExecutedTrade[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  hasMore: boolean
  loadingMore: boolean
  totalTweets: number
}

export function useRealTimeData({ limit = 20 }: UseRealTimeDataOptions = {}) {
  const [data, setData] = useState<RealTimeData>({
    tweets: [],
    queuedTrades: [],
    executedTrades: [],
    loading: true,
    error: null,
    lastUpdated: null,
    hasMore: false,
    loadingMore: false,
    totalTweets: 0,
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const mountedRef = useRef(true)
  const offsetRef = useRef(0)

  const fetchData = useCallback(
    async (loadMore = false) => {
      try {
        console.log("[v0] Starting data fetch, loadMore:", loadMore)
        console.log("[v0] Current environment:", process.env.NODE_ENV)
        console.log("[v0] Current offset:", loadMore ? offsetRef.current : 0)

        if (loadMore) {
          setData((prev) => ({ ...prev, loadingMore: true }))
        } else {
          setIsRefreshing(true)
          if (data.tweets.length === 0) {
            setData((prev) => ({ ...prev, loading: true, error: null }))
          }
          offsetRef.current = 0
        }

        const currentOffset = loadMore ? offsetRef.current : 0

        console.log("[v0] Making API calls...")
        const [tweetsResponse, queuedResponse, executedResponse] = await Promise.all([
          fetchTweetsWithMarketEffect(limit, currentOffset),
          fetchAllQueuedTrades(),
          fetchAllExecutedTrades(),
        ])

        console.log("[v0] API responses received:")
        console.log("[v0] Tweets response:", tweetsResponse)
        console.log("[v0] Queued trades response:", queuedResponse)
        console.log("[v0] Executed trades response:", executedResponse)

        if (!mountedRef.current) return

        const newData: RealTimeData = {
          lastUpdated: new Date(),
          loading: false,
          error: null,
          tweets: [],
          queuedTrades: [],
          executedTrades: [],
          hasMore: false,
          loadingMore: false,
          totalTweets: 0,
        }

        if (tweetsResponse.success) {
          const newTweets = tweetsResponse.data || tweetsResponse.trades || []
          console.log("[v0] Processing tweets:", newTweets.length, "tweets")
          newData.tweets = loadMore ? [...data.tweets, ...newTweets] : newTweets
          if (tweetsResponse.pagination) {
            newData.hasMore = tweetsResponse.pagination.hasMore
            newData.totalTweets = tweetsResponse.pagination.total
            if (loadMore) {
              offsetRef.current = tweetsResponse.pagination.offset + tweetsResponse.pagination.limit
            } else {
              offsetRef.current = tweetsResponse.pagination.limit
            }
          }
        } else {
          console.log("[v0] Tweets fetch failed:", tweetsResponse.error)
        }

        if (queuedResponse.success) {
          newData.queuedTrades = queuedResponse.trades || queuedResponse.data || []
          console.log("[v0] Processing queued trades:", newData.queuedTrades.length, "trades")
        } else {
          console.log("[v0] Queued trades fetch failed:", queuedResponse.error)
        }

        if (executedResponse.success) {
          newData.executedTrades = executedResponse.trades || executedResponse.data || []
          console.log("[v0] Processing executed trades:", newData.executedTrades.length, "trades")
        } else {
          console.log("[v0] Executed trades fetch failed:", executedResponse.error)
        }

        console.log("[v0] Final data state:", newData)
        setData(newData)
      } catch (err) {
        if (!mountedRef.current) return

        console.error("[v0] Error fetching real-time data:", err)

        setData((prev) => ({
          ...prev,
          loading: false,
          error: `Failed to fetch data from API: ${err instanceof Error ? err.message : "Unknown error"}`,
          loadingMore: false,
        }))
      } finally {
        if (mountedRef.current) {
          setIsRefreshing(false)
          setData((prev) => ({ ...prev, loadingMore: false }))
        }
      }
    },
    [limit, data.tweets],
  )

  const manualRefresh = useCallback(() => {
    fetchData(false)
  }, [fetchData])

  const loadMore = useCallback(() => {
    if (!data.loadingMore && data.hasMore) {
      fetchData(true)
    }
  }, [fetchData, data.loadingMore, data.hasMore])

  useEffect(() => {
    fetchData(false)
  }, []) // Empty dependency array - only run on mount

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    ...data,
    isRefreshing,
    refresh: manualRefresh,
    loadMore,
  }
}
