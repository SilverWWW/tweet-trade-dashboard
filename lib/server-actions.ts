"use server"

import type { ApiResponse, TweetProcess, QueuedTrade, ExecutedTrade, Author } from "./api"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000"

const fetchWithAuth = async (endpoint: string): Promise<Response> => {
  if (!process.env.ADMIN_API_KEY) {
    throw new Error("Authentication configuration missing. Please set ADMIN_API_KEY in Project Settings.")
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
    },
  })

  console.log("[v0] Response status:", response.status)
  console.log("[v0] Response ok:", response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.log("[v0] Error response:", errorText)

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

export async function fetchTweetsWithMarketEffectAction(limit = 20, offset = 0): Promise<ApiResponse<TweetProcess[]>> {
  try {
    const response = await fetchWithAuth(`/tweets?market_effect=true&limit=${limit}&offset=${offset}&status=completed`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching tweets with market effect:", error)
    throw error
  }
}

export async function fetchAllQueuedTradesAction(): Promise<ApiResponse<QueuedTrade[]>> {
  try {
    const response = await fetchWithAuth("/trades/queued")
    return await response.json()
  } catch (error) {
    console.error("Error fetching all queued trades:", error)
    throw error
  }
}

export async function fetchAllExecutedTradesAction(): Promise<ApiResponse<ExecutedTrade[]>> {
  try {
    const response = await fetchWithAuth("/trades/executed")
    return await response.json()
  } catch (error) {
    console.error("Error fetching all executed trades:", error)
    throw error
  }
}

export async function fetchAuthorByIdAction(authorId: string): Promise<ApiResponse<Author>> {
  try {
    const response = await fetchWithAuth(`/authors/${authorId}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching author:", error)
    throw error
  }
}

export async function fetchQueuedTradesByTweetIdAction(tweetProcessId: string): Promise<ApiResponse<QueuedTrade[]>> {
  try {
    const response = await fetchWithAuth(`/trades/queued/${tweetProcessId}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching queued trades:", error)
    throw error
  }
}

export async function fetchExecutedTradesByTweetIdAction(
  tweetProcessId: string,
): Promise<ApiResponse<ExecutedTrade[]>> {
  try {
    const response = await fetchWithAuth(`/trades/executed/${tweetProcessId}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching executed trades:", error)
    throw error
  }
}
