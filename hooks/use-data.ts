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

  const tweetsWithData: TweetWithData[] = tweets.map((tweet, index) => {
    const tweetTrades = trades.filter((trade) => trade.tweet_process_id === tweet.tweet_process_id)
    const author = authorMap.get(tweet.author_id) || null

    // Log detailed info for first 5 tweets and any without trades
    if (index < 5 || tweetTrades.length === 0) {
      console.log(`[v0] Tweet ${index + 1}:`, {
        tweet_process_id: tweet.tweet_process_id,
        author_id: tweet.author_id,
        trades_found: tweetTrades.length,
        author_found: !!author,
        tweet_content_preview: tweet.tweet_content.substring(0, 50) + "...",
      })

      if (tweetTrades.length === 0) {
        console.warn(`[v0] NO TRADES for tweet ${tweet.tweet_process_id}`)
        // Check if any trades exist with similar IDs
        const similarTrades = trades.filter(
          (trade) =>
            trade.tweet_process_id.includes(tweet.tweet_process_id.substring(0, 8)) ||
            tweet.tweet_process_id.includes(trade.tweet_process_id.substring(0, 8)),
        )
        if (similarTrades.length > 0) {
          console.warn(
            `[v0] Found ${similarTrades.length} trades with similar IDs:`,
            similarTrades.map((t) => t.tweet_process_id),
          )
        }
      }
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
    console.warn(`[v0] ${tweetsWithoutTrades.length} tweets have NO TRADES:`)
    tweetsWithoutTrades.slice(0, 3).forEach((tweet, i) => {
      console.warn(`[v0] No trades #${i + 1}:`, {
        id: tweet.tweet_process_id,
        content: tweet.tweet_content.substring(0, 30) + "...",
      })
    })
  }

  return tweetsWithData
}
