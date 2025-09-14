import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = "https://tweet-trade-backend.vercel.app/api"

export async function GET(request: NextRequest, { params }: { params: { authorId: string } }) {
  try {
    const { authorId } = params
    const url = `${API_BASE_URL}/authors/${authorId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.error(`[API] Author fetch failed: ${response.status}`)
      return NextResponse.json({ success: false, error: "Failed to fetch author" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Error fetching author:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
