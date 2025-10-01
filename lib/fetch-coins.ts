import {
  getCoinsTopGainers,
  getCoinsTopVolume24h,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsLastTraded,
  setApiKey,
} from "@zoralabs/coins-sdk"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// Initialize API key (server-side only)
const apiKey = process.env.ZORA_API_KEY
if (apiKey) {
  setApiKey(apiKey)
}

export interface CoinData {
  id: string
  name: string
  symbol: string
  address: string
  creator: string
  createdAt: string
  marketCap?: string
  volume24h?: string
  marketCapDelta24h?: string
  uniqueHolders?: number
  totalSupply?: string
  totalVolume?: string
  metadata?: {
    title?: string
    description?: string
    image?: string
    originalUrl?: string
    author?: string
  }
  mediaContent?: {
    previewImage?: string
  }
  ipfsUri?: string
}

function transformCoinData(node: any): CoinData {
  console.log("[v0] Raw coin data from Zora:", {
    name: node.name,
    marketCap: node.marketCap,
    volume24h: node.volume24h,
    marketCapDelta24h: node.marketCapDelta24h,
  })

  return {
    id: node.id || node.address,
    name: node.name || "Unknown",
    symbol: node.symbol || "???",
    address: node.address,
    creator: node.creatorAddress || "0x0",
    createdAt: node.createdAt || new Date().toISOString(),
    marketCap: node.marketCap,
    volume24h: node.volume24h,
    marketCapDelta24h: node.marketCapDelta24h,
    uniqueHolders: node.uniqueHolders,
    totalSupply: node.totalSupply,
    totalVolume: node.totalVolume,
    metadata: node.metadata
      ? {
          title: node.metadata.title,
          description: node.metadata.description,
          image: node.metadata.image,
          originalUrl: node.metadata.originalUrl,
          author: node.metadata.author,
        }
      : undefined,
    mediaContent: node.mediaContent
      ? {
          previewImage: node.mediaContent.previewImage,
        }
      : undefined,
    ipfsUri: node.uri,
  }
}

export async function fetchTopGainers(count = 20): Promise<CoinData[]> {
  try {
    const response = await getCoinsTopGainers({ count })
    const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node) || []
    return tokens.map(transformCoinData)
  } catch (error) {
    console.error("[v0] Failed to fetch top gainers:", error)
    return []
  }
}

export async function fetchTopVolume(count = 20): Promise<CoinData[]> {
  try {
    const response = await getCoinsTopVolume24h({ count })
    const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node) || []
    return tokens.map(transformCoinData)
  } catch (error) {
    console.error("[v0] Failed to fetch top volume:", error)
    return []
  }
}

export async function fetchMostValuable(count = 20): Promise<CoinData[]> {
  try {
    const response = await getCoinsMostValuable({ count })
    const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node) || []
    return tokens.map(transformCoinData)
  } catch (error) {
    console.error("[v0] Failed to fetch most valuable:", error)
    return []
  }
}

export async function fetchNewCoins(count = 20): Promise<CoinData[]> {
  try {
    const response = await getCoinsNew({ count })
    const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node) || []
    return tokens.map(transformCoinData)
  } catch (error) {
    console.error("[v0] Failed to fetch new coins:", error)
    return []
  }
}

export async function fetchLastTraded(count = 20): Promise<CoinData[]> {
  try {
    const response = await getCoinsLastTraded({ count })
    const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node) || []
    return tokens.map(transformCoinData)
  } catch (error) {
    console.error("[v0] Failed to fetch last traded:", error)
    return []
  }
}

export async function fetchCoinsFromDatabase(limit = 20): Promise<CoinData[]> {
  try {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("coins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching coins from database:", error)
      return []
    }

    return (data || []).map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      address: coin.address,
      creator: coin.creator_address,
      createdAt: coin.created_at,
      metadata: coin.metadata || {
        title: coin.name,
        description: coin.description,
        image: coin.image_url,
        originalUrl: coin.content_url,
      },
      ipfsUri: coin.ipfs_uri || undefined,
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch coins from database:", error)
    return []
  }
}

export async function fetchCoinsByCreator(creatorAddress: string, limit = 20): Promise<CoinData[]> {
  try {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("coins")
      .select("*")
      .eq("creator_address", creatorAddress.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching creator coins from database:", error)
      return []
    }

    return (data || []).map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      address: coin.address,
      creator: coin.creator_address,
      createdAt: coin.created_at,
      metadata: coin.metadata || {
        title: coin.name,
        description: coin.description,
        image: coin.image_url,
        originalUrl: coin.content_url,
      },
      ipfsUri: coin.ipfs_uri || undefined,
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch creator coins from database:", error)
    return []
  }
}

export async function fetchAllNewCoins(count = 20): Promise<CoinData[]> {
  try {
    // Fetch from both sources
    const [zoraCoins, dbCoins] = await Promise.all([fetchNewCoins(count), fetchCoinsFromDatabase(count)])

    // Combine and deduplicate by address
    const coinMap = new Map<string, CoinData>()

    // Add Zora coins first (they have more market data)
    zoraCoins.forEach((coin) => {
      coinMap.set(coin.address.toLowerCase(), coin)
    })

    // Add database coins (won't overwrite if already exists)
    dbCoins.forEach((coin) => {
      if (!coinMap.has(coin.address.toLowerCase())) {
        coinMap.set(coin.address.toLowerCase(), coin)
      }
    })

    // Convert back to array and sort by creation date
    return Array.from(coinMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count)
  } catch (error) {
    console.error("[v0] Failed to fetch all new coins:", error)
    return []
  }
}
