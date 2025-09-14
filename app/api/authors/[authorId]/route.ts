import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://tweet-trade-backend.vercel.app/api"

export async function GET(request: NextRequest, { params }: { params: { authorId: string } }) {
  try {
    const { authorId } = params
    const url = `${API_BASE_URL}/authors/${authorId}`
    console.log(`[API] Fetching author: ${authorId}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[API] Author fetch failed: ${response.status}`)
      return NextResponse.json({ success: false, error: `HTTP ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`[API] Author response:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching author:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch author" }, { status: 500 })
  }
}
