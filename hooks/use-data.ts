"use client"

import { useState, useEffect } from "react"

interface Tweet {
  tweet_process_id: string
  tweet_content: string
  author_id: string
  created_at: string
}

interface Trade {
  tweet_process_id: string
  symbol: string
  action: string
  quantity: number
  price: number
  created_at: string
}

interface Author {
  author_id: string
  username: string
  display_name: string
  profile_image_url: string
}

interface TweetWithData extends Tweet {
  trades: Trade[]
  author: Author | null
}

const globalCache = {
  tweets: null as Tweet[] | null,
  trades: null as Trade[] | null,
  authors: new Map<string, Author>(),
  isLoading: false,
  hasLoaded: false,
}

export function useData() {
  const [data, setData] = useState<TweetWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (globalCache.hasLoaded && globalCache.tweets && globalCache.trades) {
      console.log("[v0] Using cached data")
      const tweetsWithData = processData(globalCache.tweets, globalCache.trades, globalCache.authors)
      setData(tweetsWithData)
      setLoading(false)
      return
    }

    if (globalCache.isLoading) {
      console.log("[v0] Already loading, waiting...")
      const checkInterval = setInterval(() => {
        if (globalCache.hasLoaded && globalCache.tweets && globalCache.trades) {
          const tweetsWithData = processData(globalCache.tweets, globalCache.trades, globalCache.authors)
          setData(tweetsWithData)
          setLoading(false)
          clearInterval(checkInterval)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    globalCache.isLoading = true

    async function fetchAllData() {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Starting fresh data fetch...")

        const tweetsResponse = await fetch("/api/tweets?market_effect=true&limit=100")
        if (!tweetsResponse.ok) {
          throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`)
        }
        const tweetsData = await tweetsResponse.json()
        const tweets: Tweet[] = Array.isArray(tweetsData) ? tweetsData : tweetsData.data || tweetsData.tweets || []
        globalCache.tweets = tweets
        console.log("[v0] Fetched tweets:", tweets.length)

        // Fetch trades
        const [queuedResponse, executedResponse] = await Promise.all([
          fetch("/api/trades/queued"),
          fetch("/api/trades/executed"),
        ])

        if (!queuedResponse.ok || !executedResponse.ok) {
          throw new Error("Failed to fetch trades")
        }

        const queuedData = await queuedResponse.json()
        const executedData = await executedResponse.json()

        const queuedTrades: Trade[] = Array.isArray(queuedData)
          ? queuedData
          : queuedData.data || queuedData.trades || []
        const executedTrades: Trade[] = Array.isArray(executedData)
          ? executedData
          : executedData.data || executedData.trades || []

        const allTrades = [...queuedTrades, ...executedTrades]
        globalCache.trades = allTrades
        console.log("[v0] Fetched trades:", allTrades.length)

        // Fetch authors (only unique ones not already cached)
        const uniqueAuthorIds = [...new Set(tweets.map((tweet) => tweet.author_id).filter(Boolean))]
        const uncachedAuthorIds = uniqueAuthorIds.filter((id) => !globalCache.authors.has(id))

        console.log("[v0] Need to fetch", uncachedAuthorIds.length, "new authors")

        const batchSize = 5
        for (let i = 0; i < uncachedAuthorIds.length; i += batchSize) {
          const batch = uncachedAuthorIds.slice(i, i + batchSize)
          await Promise.all(
            batch.map(async (authorId) => {
              try {
                const authorResponse = await fetch(`/api/authors/${authorId}`)
                if (authorResponse.ok) {
                  const authorData = await authorResponse.json()
                  const author = authorData.author_id ? authorData : authorData.data || authorData
                  if (author && author.author_id) {
                    globalCache.authors.set(authorId, author)
                  }
                }
              } catch (err) {
                console.warn("[v0] Error fetching author:", authorId)
              }
            }),
          )
        }

        console.log("[v0] Total authors cached:", globalCache.authors.size)

        globalCache.hasLoaded = true
        globalCache.isLoading = false

        const tweetsWithData = processData(tweets, allTrades, globalCache.authors)
        setData(tweetsWithData)
      } catch (err) {
        console.error("[v0] Data fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        globalCache.isLoading = false
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  return { data, loading, error }
}

function processData(tweets: Tweet[], trades: Trade[], authorMap: Map<string, Author>): TweetWithData[] {
  console.log("[v0] Processing data - tweets:", tweets.length, "trades:", trades.length, "authors:", authorMap.size)

  const tweetsWithData: TweetWithData[] = tweets.map((tweet) => {
    const tweetTrades = trades.filter((trade) => trade.tweet_process_id === tweet.tweet_process_id)
    const author = authorMap.get(tweet.author_id) || null

    return {
      ...tweet,
      trades: tweetTrades,
      author,
    }
  })

  const tweetsWithTrades = tweetsWithData.filter((t) => t.trades.length > 0)
  console.log("[v0] Final result:", tweetsWithData.length, "tweets,", tweetsWithTrades.length, "have trades")

  return tweetsWithData
}
