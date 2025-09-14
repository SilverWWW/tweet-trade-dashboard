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
  const cacheRef = useRef<{ data: RealTimeData; timestamp: number } | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  const offsetRef = useRef(0)

  const fetchData = useCallback(
    async (forceRefresh = false, loadMore = false) => {
      try {
        if (!forceRefresh && !loadMore && cacheRef.current) {
          const cacheAge = Date.now() - cacheRef.current.timestamp
          if (cacheAge < CACHE_DURATION) {
            setData(cacheRef.current.data)
            return
          }
        }

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
        const [tweetsResponse, queuedResponse, executedResponse] = await Promise.all([
          fetchTweetsWithMarketEffect(limit, currentOffset),
          loadMore ? Promise.resolve({ success: true, data: data.queuedTrades }) : fetchAllQueuedTrades(),
          loadMore ? Promise.resolve({ success: true, data: data.executedTrades }) : fetchAllExecutedTrades(),
        ])

        if (!mountedRef.current) return

        const newData: RealTimeData = {
          lastUpdated: new Date(),
          loading: false,
          error: null,
          tweets: [],
          queuedTrades: loadMore ? data.queuedTrades : [],
          executedTrades: loadMore ? data.executedTrades : [],
          hasMore: false,
          loadingMore: false,
          totalTweets: 0,
        }

        if (tweetsResponse.success) {
          const newTweets = tweetsResponse.data || tweetsResponse.trades || []
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
        }

        if (!loadMore && queuedResponse.success) {
          newData.queuedTrades = queuedResponse.trades || queuedResponse.data || []
        }

        if (!loadMore && executedResponse.success) {
          newData.executedTrades = executedResponse.trades || executedResponse.data || []
        }

        setData(newData)
        cacheRef.current = { data: newData, timestamp: Date.now() }
      } catch (err) {
        if (!mountedRef.current) return

        console.error("Error fetching real-time data:", err)

        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch data from API",
          loadingMore: false,
        }))
      } finally {
        if (mountedRef.current) {
          setIsRefreshing(false)
          setData((prev) => ({ ...prev, loadingMore: false }))
        }
      }
    },
    [limit, data.tweets, data.queuedTrades, data.executedTrades],
  )

  const manualRefresh = useCallback(() => {
    fetchData(true, false)
  }, [fetchData])

  const loadMore = useCallback(() => {
    if (!data.loadingMore && data.hasMore) {
      fetchData(false, true)
    }
  }, [fetchData, data.loadingMore, data.hasMore])

  useEffect(() => {
    fetchData(false, false)
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
