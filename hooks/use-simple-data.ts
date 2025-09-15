"use client"

import { useState, useEffect } from "react"

interface Tweet {
  tweet_process_id: string
  tweet_content: string
  submitted_at: string
  status: string
  error: string | null
  market_effect: boolean
  trades: Trade[]
  author?: Author
  author_id?: string // Assuming author_id is a new field
}

interface Trade {
  id: number
  tweet_process_id: string
  ticker: string
  dollar_amount: string
  reasoning: string
  timeline: number
  queued_at: string
  executed_at?: string
}

interface Author {
  id: string
  name: string
  username: string
  profile_image_url: string
  verified: boolean
}

interface DataState {
  tweets: Tweet[]
  loading: boolean
  error: string | null
}

export function useSimpleData() {
  const [data, setData] = useState<DataState>({
    tweets: [],
    loading: true,
    error: null,
  })

  const fetchAllData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      const [tweetsResponse, queuedTradesResponse, executedTradesResponse] = await Promise.all([
        fetch("/api/tweets?market_effect=true&limit=20&offset=0&status=completed", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/trades/queued", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/trades/executed", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
      ])

      if (!tweetsResponse.ok || !queuedTradesResponse.ok || !executedTradesResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const [tweetsData, queuedTradesData, executedTradesData] = await Promise.all([
        tweetsResponse.json(),
        queuedTradesResponse.json(),
        executedTradesResponse.json(),
      ])

      if (!tweetsData.success) {
        throw new Error("Failed to fetch tweets")
      }

      const tweets = tweetsData.data || []
      const queuedTrades = queuedTradesData.trades || []
      const executedTrades = executedTradesData.trades || []
      const allTrades = [...queuedTrades, ...executedTrades]

      const tweetsWithTrades = tweets.map((tweet: Tweet) => ({
        ...tweet,
        trades: allTrades.filter((trade: Trade) => trade.tweet_process_id === tweet.tweet_process_id),
      }))

      const uniqueAuthorIds = [
        ...new Set(tweetsWithTrades.map((tweet: Tweet) => tweet.author_id || tweet.tweet_process_id).filter(Boolean)),
      ]

      console.log("[v0] Fetching authors for IDs:", uniqueAuthorIds)

      const authorPromises = uniqueAuthorIds.map(async (id) => {
        try {
          console.log("[v0] Making API call to:", `/api/authors/${id}`)
          const response = await fetch(`/api/authors/${id}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          })
          console.log("[v0] API response status:", response.status)
          if (!response.ok) {
            console.log("[v0] Author fetch failed:", response.status)
            return null
          }
          return await response.json()
        } catch (error) {
          console.log("[v0] Author fetch error:", error)
          return null
        }
      })

      const authorsData = await Promise.all(authorPromises)
      const authorsMap = new Map()
      authorsData.forEach((authorData, index) => {
        if (authorData?.success && authorData.data) {
          authorsMap.set(uniqueAuthorIds[index], authorData.data)
        }
      })

      const finalTweets = tweetsWithTrades.map((tweet: Tweet) => ({
        ...tweet,
        author: authorsMap.get(tweet.author_id || tweet.tweet_process_id),
      }))

      setData({
        tweets: finalTweets,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }))
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  return {
    ...data,
    refresh: fetchAllData,
  }
}
