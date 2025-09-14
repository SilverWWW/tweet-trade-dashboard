"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { TweetProcess, Author, QueuedTrade, ExecutedTrade } from "@/lib/api"
import { LoadingSpinner } from "./loading-spinner"
import { cn, getAuthorInitials, formatDate } from "@/lib/utils"

interface PostCardProps {
  post: TweetProcess
  author?: Author
  queuedTrades?: QueuedTrade[]
  executedTrades?: ExecutedTrade[]
  authorLoading?: boolean
  className?: string
}

export function PostCard({
  post,
  author,
  queuedTrades = [],
  executedTrades = [],
  authorLoading = false,
  className,
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAuthorTooltip, setShowAuthorTooltip] = useState(false)
  const [isManualControl, setIsManualControl] = useState(false)
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const allTrades = [...queuedTrades, ...executedTrades]
  const totalTrades = allTrades.length
  const hasMarketEffect = post.market_effect

  const getDimensions = () => {
    if (!containerRef.current) return { cardWidth: 0, containerWidth: 0, totalWidth: 0 }

    const container = containerRef.current.parentElement
    const firstCard = containerRef.current.querySelector("[data-trade-card]") as HTMLElement

    if (!container || !firstCard) return { cardWidth: 0, containerWidth: 0, totalWidth: 0 }

    const containerWidth = container.clientWidth
    const cardWidth = firstCard.offsetWidth + 16 // Include margin
    const totalWidth = totalTrades * cardWidth

    return { cardWidth, containerWidth, totalWidth }
  }

  useEffect(() => {
    if (totalTrades === 0 || isManualControl) return

    const { cardWidth, containerWidth, totalWidth } = getDimensions()
    if (cardWidth === 0) return

    const leftPadding = 16 // pl-4 = 16px
    const maxOffset = Math.max(0, totalWidth - containerWidth + leftPadding + 32)

    if (containerRef.current && maxOffset > 0) {
      const baseSpeed = 33 // pixels per second
      const duration = Math.max(4, maxOffset / baseSpeed) // minimum 4 seconds

      // Set CSS custom properties for the animation
      containerRef.current.style.setProperty("--max-offset", `${maxOffset}px`)
      containerRef.current.style.setProperty("--animation-duration", `${duration}s`)
      containerRef.current.classList.add("floating-animation")
    } else {
      if (containerRef.current) {
        containerRef.current.classList.remove("floating-animation")
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.classList.remove("floating-animation")
      }
    }
  }, [totalTrades, isManualControl])

  const handlePrevTrade = () => {
    if (!isManualControl) {
      setIsManualControl(true)
      if (containerRef.current) {
        containerRef.current.classList.remove("floating-animation")
      }
    }

    const newIndex = Math.max(0, currentTradeIndex - 1)
    setCurrentTradeIndex(newIndex)

    if (containerRef.current) {
      const { cardWidth, containerWidth } = getDimensions()

      if (cardWidth === 0) return

      const cardPosition = newIndex * cardWidth
      const centeredOffset = cardPosition - (containerWidth - cardWidth) / 2
      const clampedOffset = Math.max(0, centeredOffset)

      setCurrentOffset(clampedOffset)
      containerRef.current.style.transform = `translateX(-${clampedOffset}px)`
      containerRef.current.style.transition = "transform 0.3s ease-out"

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = "none"
        }
      }, 300)
    }
  }

  const handleNextTrade = () => {
    if (!isManualControl) {
      setIsManualControl(true)
      if (containerRef.current) {
        containerRef.current.classList.remove("floating-animation")
      }
    }

    const newIndex = Math.min(totalTrades - 1, currentTradeIndex + 1)
    setCurrentTradeIndex(newIndex)

    if (containerRef.current) {
      const { cardWidth, containerWidth, totalWidth } = getDimensions()

      if (cardWidth === 0) return

      const cardPosition = newIndex * cardWidth
      const centeredOffset = cardPosition - (containerWidth - cardWidth) / 2
      const leftPadding = 16
      const maxOffset = Math.max(0, totalWidth - containerWidth + leftPadding + 32)
      const clampedOffset = Math.max(0, Math.min(centeredOffset, maxOffset))

      setCurrentOffset(clampedOffset)
      containerRef.current.style.transform = `translateX(-${clampedOffset}px)`
      containerRef.current.style.transition = "transform 0.3s ease-out"

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = "none"
        }
      }, 300)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isTradeExecuted = (trade: QueuedTrade | ExecutedTrade): trade is ExecutedTrade => {
    return "executed_at" in trade
  }

  const TradeCard = ({ trade, index }: { trade: QueuedTrade | ExecutedTrade; index: number }) => {
    const isExecuted = isTradeExecuted(trade)
    const timestamp = isExecuted ? trade.executed_at : trade.queued_at
    const absAmount = Math.abs(trade.dollar_amount)

    return (
      <div
        data-trade-card
        className="flex-shrink-0 w-full md:w-[728px] bg-white rounded-lg p-4 border border-gray-200 shadow-sm mx-2"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#26a7de]" />
              <span className="font-mono font-semibold text-xl text-foreground">${trade.ticker}</span>
              <Badge variant="default" className="bg-[#26a7de]/10 text-[#26a7de] border-[#26a7de]/20 text-sm px-3 py-1">
                BUY
              </Badge>
            </div>
            <Badge
              variant={isExecuted ? "default" : "secondary"}
              className={cn(
                "text-sm px-3 py-1",
                isExecuted
                  ? "bg-[#26a7de]/10 text-[#26a7de] border-[#26a7de]/20"
                  : "bg-[#26a7de]/5 text-[#26a7de]/70 border-[#26a7de]/10",
              )}
            >
              {isExecuted ? "Executed" : "Queued"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-base">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground text-sm">Amount</div>
                <div className="font-medium text-foreground text-lg">{formatCurrency(absAmount)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground text-sm">Hold</div>
                <div className="font-medium text-foreground text-lg">{trade.days_to_hold}d</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground text-sm">Time</div>
                <div className="font-medium text-foreground text-base">
                  {formatDate(timestamp).split(",")[1]?.trim() || formatDate(timestamp)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#26a7de]/5 rounded-lg p-3 border border-[#26a7de]/10">
            <div className="text-sm font-medium text-foreground mb-1">Trading Reasoning:</div>
            <p className="text-base text-foreground leading-relaxed">{trade.reasoning}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-lg border-l-4 bg-gradient-to-br from-[#26a7de]/10 via-[#26a7de]/5 to-[#26a7de]/15 border-l-[#26a7de]",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="relative"
              onMouseEnter={() => setShowAuthorTooltip(true)}
              onMouseLeave={() => setShowAuthorTooltip(false)}
            >
              <Avatar className="h-12 w-12 border border-border shrink-0 mt-1 cursor-pointer">
                <AvatarFallback className="bg-muted text-foreground font-medium text-lg">
                  {authorLoading ? <LoadingSpinner size="sm" /> : getAuthorInitials(author?.name)}
                </AvatarFallback>
              </Avatar>

              {showAuthorTooltip &&
                !authorLoading &&
                author?.author_context &&
                author.author_context !== "Author information loading..." && (
                  <div className="absolute left-full top-0 ml-2 z-10 w-64 bg-background border border-border rounded-lg shadow-lg p-3">
                    <div className="text-sm font-medium text-foreground mb-1">Author Context</div>
                    <p className="text-sm text-muted-foreground">{author.author_context}</p>
                  </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold text-lg text-foreground">
                  {authorLoading ? (
                    <span className="flex items-center gap-1">
                      <LoadingSpinner size="sm" />
                      Loading...
                    </span>
                  ) : (
                    author?.name || "Unknown Author"
                  )}
                </h3>
                {!authorLoading && author?.platform && (
                  <Badge
                    variant="secondary"
                    className="text-sm px-2 py-1 bg-[#26a7de]/10 text-[#26a7de] border-[#26a7de]/20"
                  >
                    {author.platform === "bluesky" ? "Bluesky" : author.platform}
                  </Badge>
                )}
              </div>

              <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-[#26a7de]/20 shadow-sm">
                <p
                  className={cn(
                    "text-lg text-foreground leading-relaxed mb-3",
                    !isExpanded && post.tweet_content.length > 150 && "line-clamp-5",
                  )}
                >
                  {post.tweet_content}
                </p>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(post.submitted_at)}
                  </div>
                  {totalTrades > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-[#26a7de] font-medium">
                        {totalTrades} trade{totalTrades !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>

                {post.tweet_content.length > 150 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 h-auto p-0 text-sm text-[#26a7de] hover:text-[#26a7de]/80"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {totalTrades > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-medium text-foreground">Associated Trades ({totalTrades})</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevTrade}
                    className="h-8 w-8 p-0 text-[#26a7de] hover:text-[#26a7de]/80 hover:bg-[#26a7de]/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextTrade}
                    className="h-8 w-8 p-0 text-[#26a7de] hover:text-[#26a7de]/80 hover:bg-[#26a7de]/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden -mx-4">
                <div ref={containerRef} className="flex transition-none pl-4 floating-animation">
                  {allTrades.map((trade, index) => (
                    <TradeCard key={`${index}-${trade.ticker}`} trade={trade} index={index} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
