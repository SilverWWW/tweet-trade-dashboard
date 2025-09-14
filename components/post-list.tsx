"use client"

import { useState, useEffect } from "react"
import { PostCard } from "./post-card"
import { LoadingSpinner } from "./loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"
import type { TweetProcess, Author, QueuedTrade, ExecutedTrade } from "@/lib/api"
import { fetchAuthorById } from "@/lib/api"

interface PostWithData extends TweetProcess {
  author?: Author
  queuedTrades?: QueuedTrade[]
  executedTrades?: ExecutedTrade[]
  authorLoading?: boolean
}

interface PostListProps {
  limit?: number
  className?: string
  posts?: TweetProcess[]
  queuedTrades?: QueuedTrade[]
  executedTrades?: ExecutedTrade[]
  isRefreshing?: boolean
  onRefresh?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  totalPosts?: number
}

export function PostList({
  limit = 20,
  className,
  posts = [],
  queuedTrades = [],
  executedTrades = [],
  isRefreshing = false,
  onRefresh,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  totalPosts = 0,
}: PostListProps) {
  const [postsWithData, setPostsWithData] = useState<PostWithData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPostData = async () => {
      if (posts.length === 0) {
        setPostsWithData([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const initialPostsWithData = posts.map((post): PostWithData => {
          let authorId = post.author_id || "unknown"

          if (post.tweet_process_id && typeof post.tweet_process_id === "string") {
            // Extract author ID from tweet_process_id (first UUID part)
            const parts = post.tweet_process_id.split("-")
            if (parts.length >= 5) {
              authorId = parts[0] + "-" + parts[1] + "-" + parts[2] + "-" + parts[3] + "-" + parts[4]
            }
          }

          // Filter trades for this specific post
          const postQueuedTrades = queuedTrades.filter((t) => t.tweet_process_id === post.tweet_process_id)
          const postExecutedTrades = executedTrades.filter((t) => t.tweet_process_id === post.tweet_process_id)

          return {
            ...post,
            author_id: authorId, // Set the extracted author ID
            queuedTrades: postQueuedTrades,
            executedTrades: postExecutedTrades,
            authorLoading: true, // Mark as loading
          }
        })

        setPostsWithData(initialPostsWithData)

        const authorPromises = initialPostsWithData.map(async (post) => {
          try {
            const authorResponse = await fetchAuthorById(post.author_id!)

            if (authorResponse.success && authorResponse.data) {
              return {
                ...post,
                author: authorResponse.data,
                authorLoading: false,
              }
            } else {
              // Create a fallback author if API doesn't return data
              return {
                ...post,
                author: {
                  id: post.author_id!,
                  platform_id: "unknown",
                  name: "Loading...",
                  author_context: "Author information loading...",
                  created_at: new Date().toISOString(),
                  platform: "twitter",
                },
                authorLoading: false,
              }
            }
          } catch (error) {
            // Return post with loading author on error
            return {
              ...post,
              author: {
                id: post.author_id!,
                platform_id: "unknown",
                name: "Loading...",
                author_context: "Author information loading...",
                created_at: new Date().toISOString(),
                platform: "twitter",
              },
              authorLoading: false,
            }
          }
        })

        // Wait for all author data to load
        const postsWithAuthors = await Promise.all(authorPromises)
        setPostsWithData(postsWithAuthors)
      } catch (err) {
        console.error("Error processing post data:", err)
        setError(err instanceof Error ? err.message : "Failed to process post data")
      } finally {
        setLoading(false)
      }
    }

    processPostData()
  }, [posts, queuedTrades, executedTrades])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (postsWithData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">No posts with market effect found</div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">Market-Impact Posts</h2>
          <p className="text-muted-foreground mt-1">
            {postsWithData.length} of {totalPosts > 0 ? totalPosts : postsWithData.length} post
            {totalPosts !== 1 ? "s" : ""} with trading activity
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {postsWithData.map((post) => (
          <PostCard
            key={post.tweet_process_id}
            post={post}
            author={post.author}
            queuedTrades={post.queuedTrades}
            executedTrades={post.executedTrades}
            authorLoading={post.authorLoading}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-8">
          <Button onClick={onLoadMore} disabled={loadingMore} variant="outline" size="lg" className="bg-transparent">
            {loadingMore ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading more posts...
              </>
            ) : (
              "Load More Posts"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
