import { type NextRequest, NextResponse } from "next/server"

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

const mockTweets = {
  success: true,
  data: [
    {
      id: "mock-1",
      tweet_content:
        "Just announced a major breakthrough in renewable energy technology. This could revolutionize the entire sector! $TSLA $ENPH #CleanEnergy",
      submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      market_effect: true,
    },
    {
      id: "mock-2",
      tweet_content:
        "Federal Reserve hints at potential interest rate changes in upcoming meeting. Markets are already responding. $SPY $QQQ",
      submitted_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      market_effect: true,
    },
    {
      id: "mock-3",
      tweet_content:
        "New AI chip announcement from major tech company shows 40% performance improvement over previous generation. $NVDA $AMD",
      submitted_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "processing",
      market_effect: false,
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market_effect = searchParams.get("market_effect")
    const limit = searchParams.get("limit")
    const status = searchParams.get("status")
    const offset = searchParams.get("offset")

    let url = `${API_BASE_URL}/tweets/processes`
    const params = new URLSearchParams()

    if (market_effect) params.append("market_effect", market_effect)
    if (limit) params.append("limit", limit)
    if (status) params.append("status", status)
    if (offset) params.append("offset", offset)

    if (params.toString()) {
      url += `?${params.toString()}`
    }

    console.log(`[API] Fetching tweets from: ${url}`)

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[API] Tweet fetch failed: ${response.status}`)

      console.log("[API] Falling back to mock data")
      return NextResponse.json(mockTweets)
    }

    const data = await response.json()
    console.log(`[API] Tweet response:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching tweets:", error)

    console.log("[API] Falling back to mock data due to error")
    return NextResponse.json(mockTweets)
  }
}
