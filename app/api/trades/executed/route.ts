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

const mockExecutedTrades = {
  success: true,
  data: [
    {
      id: "executed-1",
      tweet_id: "mock-1",
      ticker: "ENPH",
      dollar_amount: 4200,
      days_to_hold: 5,
      reasoning:
        "Clean energy sector momentum following renewable technology breakthrough. Strong institutional buying patterns observed.",
      executed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      execution_price: 142.5,
    },
    {
      id: "executed-2",
      tweet_id: "mock-2",
      ticker: "QQQ",
      dollar_amount: 6800,
      days_to_hold: 2,
      reasoning:
        "Tech-heavy ETF positioned well for Fed policy changes. Options flow indicates bullish sentiment among institutional traders.",
      executed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      execution_price: 398.75,
    },
    {
      id: "executed-3",
      tweet_id: "mock-3",
      ticker: "AMD",
      dollar_amount: 3500,
      days_to_hold: 10,
      reasoning:
        "Semiconductor competition heating up with new AI chip announcements. AMD positioned as value play in growing market.",
      executed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      execution_price: 156.2,
    },
  ],
}

export async function GET() {
  try {
    const url = `${API_BASE_URL}/trading/trades/executed`
    console.log(`[API] Fetching executed trades from: ${url}`)

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[API] Executed trades fetch failed: ${response.status}`)

      console.log("[API] Falling back to mock executed trades data")
      return NextResponse.json(mockExecutedTrades)
    }

    const data = await response.json()
    console.log(`[API] Executed trades response:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching executed trades:", error)

    console.log("[API] Falling back to mock executed trades data due to error")
    return NextResponse.json(mockExecutedTrades)
  }
}
