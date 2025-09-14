import type { TweetProcess, QueuedTrade, ExecutedTrade, Author } from "./api"

export const mockAuthors: Author[] = [
  {
    id: "1",
    platform_id: "elonmusk",
    name: "Elon Musk",
    author_context: "CEO of Tesla and SpaceX, known for market-moving tweets about technology and crypto",
    created_at: "2024-01-01T00:00:00Z",
    platform: "twitter",
  },
  {
    id: "2",
    platform_id: "cathiedwood",
    name: "Cathie Wood",
    author_context: "CEO of ARK Invest, focuses on disruptive innovation investments",
    created_at: "2024-01-01T00:00:00Z",
    platform: "twitter",
  },
  {
    id: "3",
    platform_id: "chamath",
    name: "Chamath Palihapitiya",
    author_context: "Venture capitalist and former Facebook executive, known for SPAC investments",
    created_at: "2024-01-01T00:00:00Z",
    platform: "twitter",
  },
]

export const mockTweets: TweetProcess[] = [
  {
    tweet_process_id: "tweet_1",
    tweet_content:
      "Tesla's new battery technology is a game changer. Production scaling faster than expected. This could revolutionize the entire EV industry. 🚗⚡",
    submitted_at: "2024-01-15T10:30:00Z",
    status: "completed",
    market_effect: true,
    completed_at: "2024-01-15T10:35:00Z",
    author_id: "1",
  },
  {
    tweet_process_id: "tweet_2",
    tweet_content:
      "ARK is doubling down on genomics. The convergence of AI and gene therapy will create trillion-dollar opportunities. $ARKG positioning for massive growth.",
    submitted_at: "2024-01-15T14:20:00Z",
    status: "completed",
    market_effect: true,
    completed_at: "2024-01-15T14:25:00Z",
    author_id: "2",
  },
  {
    tweet_process_id: "tweet_3",
    tweet_content:
      "The space economy is about to explode. Private companies are moving faster than governments. Time to invest in the final frontier. 🚀",
    submitted_at: "2024-01-15T16:45:00Z",
    status: "completed",
    market_effect: true,
    completed_at: "2024-01-15T16:50:00Z",
    author_id: "3",
  },
]

export const mockQueuedTrades: QueuedTrade[] = [
  {
    id: "trade_q_1",
    tweet_process_id: "tweet_1",
    ticker: "TSLA",
    dollar_amount: 50000,
    reasoning:
      "Positive sentiment about Tesla's battery technology breakthrough suggests strong upward momentum. Technical indicators support bullish outlook.",
    queued_at: "2024-01-15T10:35:00Z",
    days_to_hold: 7,
  },
  {
    id: "trade_q_2",
    tweet_process_id: "tweet_1",
    ticker: "PANW",
    dollar_amount: 25000,
    reasoning: "Battery technology advancement could benefit cybersecurity companies protecting EV infrastructure.",
    queued_at: "2024-01-15T10:36:00Z",
    days_to_hold: 5,
  },
  {
    id: "trade_q_3",
    tweet_process_id: "tweet_2",
    ticker: "ARKG",
    dollar_amount: 75000,
    reasoning:
      "Direct mention of ARK Genomics ETF with strong conviction from Cathie Wood. High probability of institutional follow-through.",
    queued_at: "2024-01-15T14:25:00Z",
    days_to_hold: 14,
  },
  {
    id: "trade_q_4",
    tweet_process_id: "tweet_2",
    ticker: "NVDA",
    dollar_amount: 40000,
    reasoning: "AI and genomics convergence benefits NVIDIA's GPU technology for computational biology applications.",
    queued_at: "2024-01-15T14:26:00Z",
    days_to_hold: 10,
  },
  {
    id: "trade_q_5",
    tweet_process_id: "tweet_3",
    ticker: "SPCE",
    dollar_amount: 30000,
    reasoning: "Space economy enthusiasm from influential investor could drive retail interest in space stocks.",
    queued_at: "2024-01-15T16:50:00Z",
    days_to_hold: 3,
  },
]

export const mockExecutedTrades: ExecutedTrade[] = [
  // Empty for now as mentioned by user
]
