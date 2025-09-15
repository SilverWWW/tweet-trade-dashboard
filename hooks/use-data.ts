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
  authorRequests: new Map<string, Promise<Author | null>>(),
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
        const uncachedAuthorIds = uniqueAuthorIds.filter(
          (id) => !globalCache.authors.has(id) && !globalCache.authorRequests.has(id),
        )

        console.log("[v0] Need to fetch", uncachedAuthorIds.length, "new authors")

        const authorPromises = uncachedAuthorIds.map(async (authorId) => {
          if (globalCache.authorRequests.has(authorId)) {
            return globalCache.authorRequests.get(authorId)!
          }

          const authorPromise = (async () => {
            try {
              console.log("[v0] Making API call to:", `/api/authors/${authorId}`)
              const authorResponse = await fetch(`/api/authors/${authorId}`)
              if (authorResponse.ok) {
                const authorData = await authorResponse.json()
                const author = authorData.author_id ? authorData : authorData.data || authorData
                if (author && author.author_id) {
                  globalCache.authors.set(authorId, author)
                  return author
                }
              }
              return null
            } catch (err) {
              console.warn("[v0] Error fetching author:", authorId)
              return null
            } finally {
              globalCache.authorRequests.delete(authorId)
            }
          })()

          globalCache.authorRequests.set(authorId, authorPromise)
          return authorPromise
        })

        await Promise.all(authorPromises)

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

  console.log(
    "[v0] All tweet IDs:",
    tweets.map((t) => t.tweet_process_id),
  )
  console.log("[v0] All trade IDs:", [...new Set(trades.map((t) => t.tweet_process_id))])

  // Check for ID pattern mismatches
  const tweetBaseIds = tweets.map((t) => t.tweet_process_id.split("-").slice(0, 5).join("-"))
  const tradeBaseIds = [...new Set(trades.map((t) => t.tweet_process_id.split("-").slice(0, 5).join("-")))]

  console.log("[v0] Tweet base IDs (first 5 parts):", [...new Set(tweetBaseIds)])
  console.log("[v0] Trade base IDs (first 5 parts):", tradeBaseIds)

  const tweetsWithData: TweetWithData[] = tweets.map((tweet, index) => {
    const tweetTrades = trades.filter((trade) => trade.tweet_process_id === tweet.tweet_process_id)
    const author = authorMap.get(tweet.author_id) || null

    if (tweetTrades.length === 0) {
      console.warn(`[v0] NO TRADES for tweet ${tweet.tweet_process_id}`)

      // Check for exact base UUID matches (first 36 characters)
      const baseUuid = tweet.tweet_process_id.substring(0, 36)
      const exactBaseMatches = trades.filter((trade) => trade.tweet_process_id.startsWith(baseUuid))

      if (exactBaseMatches.length > 0) {
        console.error(
          `[v0] CRITICAL: Found ${exactBaseMatches.length} trades with same base UUID but different suffixes:`,
        )
        console.error(`[v0] Tweet ID: ${tweet.tweet_process_id}`)
        console.error(
          `[v0] Trade IDs:`,
          exactBaseMatches.map((t) => t.tweet_process_id),
        )
        console.error(`[v0] This indicates a timestamp/suffix mismatch issue!`)
      }

      // Check for partial matches
      const partialMatches = trades.filter(
        (trade) =>
          trade.tweet_process_id.includes(baseUuid.substring(0, 20)) ||
          baseUuid.includes(trade.tweet_process_id.substring(0, 20)),
      )

      if (partialMatches.length > 0) {
        console.warn(`[v0] Found ${partialMatches.length} trades with partial ID matches:`)
        partialMatches.forEach((trade) => {
          console.warn(`[v0] Partial match: ${trade.tweet_process_id}`)
        })
      }
    }

    // Log detailed info for first 3 tweets and any without trades
    if (index < 3 || tweetTrades.length === 0) {
      console.log(`[v0] Tweet ${index + 1}:`, {
        tweet_process_id: tweet.tweet_process_id,
        author_id: tweet.author_id,
        trades_found: tweetTrades.length,
        author_found: !!author,
        tweet_content_preview: tweet.tweet_content.substring(0, 50) + "...",
      })
    }

    return {
      ...tweet,
      trades: tweetTrades,
      author,
    }
  })

  const tweetsWithTrades = tweetsWithData.filter((t) => t.trades.length > 0)
  const tweetsWithoutTrades = tweetsWithData.filter((t) => t.trades.length === 0)

  console.log("[v0] Final result:", tweetsWithData.length, "tweets,", tweetsWithTrades.length, "have trades")

  if (tweetsWithoutTrades.length > 0) {
    console.error(`[v0] ${tweetsWithoutTrades.length} tweets have NO TRADES - this may indicate ID mismatch issues`)
    tweetsWithoutTrades.slice(0, 5).forEach((tweet, i) => {
      console.error(`[v0] No trades #${i + 1}:`, {
        id: tweet.tweet_process_id,
        content: tweet.tweet_content.substring(0, 30) + "...",
      })
    })
  }

  return tweetsWithData
}
