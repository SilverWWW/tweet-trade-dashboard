const API_BASE_URL = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api"

export interface TweetProcess {
  tweet_process_id: string
  tweet_content: string
  submitted_at: string
  status: "pending" | "completed" | "error"
  error?: string
  market_effect: boolean
  trades?: any
  completed_at?: string
  author_id: string
}

export interface QueuedTrade {
  id: string
  tweet_process_id: string
  ticker: string
  dollar_amount: number
  reasoning: string
  queued_at: string
  days_to_hold: number
}

export interface ExecutedTrade {
  id: string
  tweet_process_id: string
  ticker: string
  dollar_amount: number
  reasoning: string
  executed_at: string
  days_to_hold: number
}

export interface Author {
  id: string
  platform_id: string
  name: string
  author_context: string
  created_at: string
  platform?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  count?: number
  trades?: T // Backend returns trades array
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters?: any
  error?: string
  message?: string
}

const fetchWithErrorHandling = async (url: string): Promise<Response> => {
  console.log("[v0] Making API call to:", url)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    mode: "cors",
    cache: "no-store",
  })

  console.log("[v0] API response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.log("[v0] API error response:", errorText)

    if (response.status === 401) {
      throw new Error("Authentication failed. Please check your ADMIN_API_KEY in Project Settings.")
    } else if (response.status === 403) {
      throw new Error("Access denied. Please verify your ADMIN_API_KEY has the correct permissions.")
    } else if (response.status === 500) {
      throw new Error("Server error. The backend service may be experiencing issues.")
    }

    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
  }

  return response
}

// Fetch tweets with market effect
export async function fetchTweetsWithMarketEffect(limit = 20, offset = 0): Promise<ApiResponse<TweetProcess[]>> {
  try {
    const response = await fetchWithErrorHandling(
      `${API_BASE_URL}/tweets?market_effect=true&limit=${limit}&offset=${offset}&status=completed`,
    )
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching tweets with market effect:", error)
    throw error
  }
}

// Fetch queued trades by tweet process ID
export async function fetchQueuedTradesByTweetId(tweetProcessId: string): Promise<ApiResponse<QueuedTrade[]>> {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/trades/queued/${tweetProcessId}`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching queued trades:", error)
    throw error
  }
}

// Fetch executed trades by tweet process ID
export async function fetchExecutedTradesByTweetId(tweetProcessId: string): Promise<ApiResponse<ExecutedTrade[]>> {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/trades/executed/${tweetProcessId}`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching executed trades:", error)
    throw error
  }
}

// Fetch author by ID
export async function fetchAuthorById(authorId: string): Promise<ApiResponse<Author>> {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/authors/${authorId}`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching author:", error)
    throw error
  }
}

// Fetch all queued trades
export async function fetchAllQueuedTrades(): Promise<ApiResponse<QueuedTrade[]>> {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/trades/queued`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching all queued trades:", error)
    throw error
  }
}

// Fetch all executed trades
export async function fetchAllExecutedTrades(): Promise<ApiResponse<ExecutedTrade[]>> {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/trades/executed`)
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error fetching all executed trades:", error)
    throw error
  }
}
