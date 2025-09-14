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

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.error(`[API] Tweet fetch failed: ${response.status}`)
      return NextResponse.json({ success: false, error: "Failed to fetch tweets" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching tweets:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
