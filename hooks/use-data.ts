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
  tradeStatus: {
    hasValidTrades: boolean
    tradeCount: number
    queuedCount: number
    executedCount: number
    apiError: string | null
    debugInfo: string
  }
}

const globalCache = {
  tweets: null as Tweet[] | null,
  trades: null as Trade[] | null,
  authors: new Map<string, Author>(),
  isLoading: false,
  hasLoaded: false,
  authorRequests: new Map<string, Promise<Author | null>>(),
  currentPage: 0,
  pageSize: 20,
}

export function useData() {
  const [data, setData] = useState<TweetWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalTweets, setTotalTweets] = useState(0)

  const pageSize = 20

  useEffect(() => {
    fetchData(currentPage)
  }, [currentPage])

  const fetchData = async (page: number) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[v0] Fetching page ${page + 1} (offset: ${page * pageSize})`)

      const tweetsResponse = await fetch(`/api/tweets?market_effect=true&limit=${pageSize}&offset=${page * pageSize}`)
      if (!tweetsResponse.ok) {
        throw new Error(`Failed to fetch tweets: ${tweetsResponse.status}`)
      }
      const tweetsData = await tweetsResponse.json()
      const tweets: Tweet[] = Array.isArray(tweetsData) ? tweetsData : tweetsData.data || tweetsData.tweets || []

      console.log(`[v0] Fetched ${tweets.length} tweets for page ${page + 1}`)
      setTotalTweets((prev) => (page === 0 ? tweets.length : prev + tweets.length))
      setHasMore(tweets.length === pageSize)

      if (tweets.length === 0) {
        setData(page === 0 ? [] : data)
        setLoading(false)
        return
      }

      const [queuedResponse, executedResponse] = await Promise.all([
        fetch("/api/trades/queued"),
        fetch("/api/trades/executed"),
      ])

      if (!queuedResponse.ok || !executedResponse.ok) {
        throw new Error("Failed to fetch trades")
      }

      const queuedData = await queuedResponse.json()
      const executedData = await executedResponse.json()

      const queuedTrades: Trade[] = Array.isArray(queuedData) ? queuedData : queuedData.data || queuedData.trades || []
      const executedTrades: Trade[] = Array.isArray(executedData)
        ? executedData
        : executedData.data || executedData.trades || []

      const allTrades = [...queuedTrades, ...executedTrades]
      console.log(
        `[v0] Fetched ${allTrades.length} total trades (${queuedTrades.length} queued, ${executedTrades.length} executed)`,
      )

      const uniqueAuthorIds = [...new Set(tweets.map((tweet) => tweet.author_id).filter(Boolean))]
      const authorPromises = uniqueAuthorIds.map(async (authorId) => {
        try {
          const authorResponse = await fetch(`/api/authors/${authorId}`)
          if (authorResponse.ok) {
            const authorData = await authorResponse.json()
            const author = authorData.author_id ? authorData : authorData.data || authorData
            if (author && author.author_id) {
              return { authorId, author }
            }
          }
          return { authorId, author: null }
        } catch (err) {
          console.warn(`[v0] Error fetching author ${authorId}:`, err)
          return { authorId, author: null }
        }
      })

      const authorResults = await Promise.all(authorPromises)
      const authorMap = new Map<string, Author>()
      authorResults.forEach(({ authorId, author }) => {
        if (author) authorMap.set(authorId, author)
      })

      const tweetsWithData = processDataWithBulletproofTrades(tweets, allTrades, authorMap)

      if (page === 0) {
        setData(tweetsWithData)
      } else {
        setData((prev) => [...prev, ...tweetsWithData])
      }
    } catch (err) {
      console.error(`[v0] Data fetch error for page ${page + 1}:`, err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const refresh = () => {
    setCurrentPage(0)
    setData([])
    setTotalTweets(0)
    setHasMore(true)
  }

  return {
    data,
    loading,
    error,
    hasMore,
    totalTweets,
    currentPage: currentPage + 1,
    loadMore,
    refresh,
  }
}

function processDataWithBulletproofTrades(
  tweets: Tweet[],
  trades: Trade[],
  authorMap: Map<string, Author>,
): TweetWithData[] {
  console.log(
    `[v0] BULLETPROOF PROCESSING - tweets: ${tweets.length}, trades: ${trades.length}, authors: ${authorMap.size}`,
  )

  // Create trade lookup map for O(1) access
  const tradeMap = new Map<string, Trade[]>()
  trades.forEach((trade) => {
    const existing = tradeMap.get(trade.tweet_process_id) || []
    existing.push(trade)
    tradeMap.set(trade.tweet_process_id, existing)
  })

  console.log(`[v0] Trade map created with ${tradeMap.size} unique tweet IDs`)

  const tweetsWithData: TweetWithData[] = tweets.map((tweet, index) => {
    const tweetTrades = tradeMap.get(tweet.tweet_process_id) || []
    const author = authorMap.get(tweet.author_id) || null

    const queuedTrades = tweetTrades.filter((t) => t.action !== "executed")
    const executedTrades = tweetTrades.filter((t) => t.action === "executed")

    const tradeStatus = {
      hasValidTrades: tweetTrades.length > 0,
      tradeCount: tweetTrades.length,
      queuedCount: queuedTrades.length,
      executedCount: executedTrades.length,
      apiError: null as string | null,
      debugInfo: `Tweet: ${tweet.tweet_process_id.substring(0, 8)}... | Trades: ${tweetTrades.length} | Author: ${author ? "Found" : "Missing"}`,
    }

    if (tweetTrades.length === 0) {
      tradeStatus.apiError = "CRITICAL: Tweet marked as market_effect=true but no trades found in database"
      console.error(`[v0] BULLETPROOF ERROR: ${tradeStatus.apiError}`, {
        tweet_id: tweet.tweet_process_id,
        content_preview: tweet.tweet_content.substring(0, 50),
        available_trade_ids: Array.from(tradeMap.keys()).slice(0, 5),
      })
    }

    // Log first few tweets and any problematic ones
    if (index < 3 || tweetTrades.length === 0) {
      console.log(`[v0] BULLETPROOF Tweet ${index + 1}:`, tradeStatus.debugInfo)
    }

    return {
      ...tweet,
      trades: tweetTrades,
      author,
      tradeStatus,
    }
  })

  const validTweets = tweetsWithData.filter((t) => t.tradeStatus.hasValidTrades)
  const invalidTweets = tweetsWithData.filter((t) => !t.tradeStatus.hasValidTrades)

  console.log(`[v0] BULLETPROOF RESULT: ${validTweets.length}/${tweetsWithData.length} tweets have trades`)

  if (invalidTweets.length > 0) {
    console.error(`[v0] BULLETPROOF CRITICAL: ${invalidTweets.length} tweets have NO TRADES despite market_effect=true`)
    invalidTweets.forEach((tweet, i) => {
      console.error(`[v0] Invalid tweet ${i + 1}: ${tweet.tradeStatus.debugInfo}`)
    })
  }

  return tweetsWithData
}
