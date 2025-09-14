import { NextResponse } from "next/server"

const API_BASE_URL = "https://tweet-trade-backend.vercel.app/api"

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If rate limited, wait and retry
      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error(`Rate limited after ${maxRetries} attempts`)
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        console.log(`[API] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      return response
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying on network errors
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`[API] Network error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Max retries exceeded")
}

const mockQueuedTrades = {
  success: true,
  data: [
    {
      id: "queued-1",
      tweet_id: "mock-1",
      ticker: "TSLA",
      dollar_amount: 5000,
      days_to_hold: 7,
      reasoning:
        "Strong positive sentiment around renewable energy breakthrough announcement. Technical indicators show bullish momentum with high social media engagement.",
      queued_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "queued-2",
      tweet_id: "mock-2",
      ticker: "SPY",
      dollar_amount: 3000,
      days_to_hold: 3,
      reasoning:
        "Federal Reserve policy changes typically create short-term volatility opportunities. Market positioning suggests upward movement likely.",
      queued_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "queued-3",
      tweet_id: "mock-3",
      ticker: "NVDA",
      dollar_amount: 7500,
      days_to_hold: 14,
      reasoning:
        "AI chip performance improvements drive significant market value. Historical patterns show sustained growth following major tech announcements.",
      queued_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ],
}

export async function GET() {
  try {
    const url = `${API_BASE_URL}/trading/trades/queued`
    console.log(`[API] Fetching queued trades from: ${url}`)

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[API] Queued trades fetch failed: ${response.status}`)

      console.log("[API] Falling back to mock queued trades data")
      return NextResponse.json(mockQueuedTrades)
    }

    const data = await response.json()
    console.log(`[API] Queued trades response:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching queued trades:", error)

    console.log("[API] Falling back to mock queued trades data due to error")
    return NextResponse.json(mockQueuedTrades)
  }
}
