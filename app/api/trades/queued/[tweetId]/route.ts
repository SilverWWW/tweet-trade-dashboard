import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://tweet-trade-backend.vercel.app/api"

export async function GET(request: NextRequest, { params }: { params: { tweetId: string } }) {
  try {
    const { tweetId } = params
    const url = `${API_BASE_URL}/trading/trades/queued/${tweetId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.error(`[API] Queued trades by tweet fetch failed: ${response.status}`)
      return NextResponse.json({ success: false, error: `HTTP ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching queued trades by tweet:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch queued trades" }, { status: 500 })
  }
}
