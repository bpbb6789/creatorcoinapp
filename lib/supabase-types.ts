export interface CoinFromDB {
  id: string
  address: string
  name: string
  symbol: string
  creator_address: string
  description: string | null
  image_url: string | null
  ipfs_uri: string | null
  content_url: string | null
  coin_type: string | null
  metadata: Record<string, any> | null
  transaction_hash: string | null
  chain_id: number
  created_at: string
  updated_at: string
  // Optional stats columns (added by migration)
  market_cap?: number
  volume_24h?: number
  price?: number
  holders_count?: number
  total_supply?: number
  price_change_24h?: number
}

export interface Coin {
  id: string
  address: string
  name: string
  symbol: string
  creatorAddress: string
  description: string
  imageUrl: string
  marketCap: number
  volume24h: number
  price: number
  holders: number
  priceChange24h: number
  totalSupply: number
  createdAt: string
}

export function transformCoinFromDB(coin: CoinFromDB): Coin {
  return {
    id: coin.id,
    address: coin.address,
    name: coin.name,
    symbol: coin.symbol,
    creatorAddress: coin.creator_address,
    description: coin.description || "",
    imageUrl: coin.image_url || "/single-gold-coin.png",
    marketCap: Number(coin.market_cap) || 0,
    volume24h: Number(coin.volume_24h) || 0,
    price: Number(coin.price) || 0,
    holders: coin.holders_count || 0,
    priceChange24h: Number(coin.price_change_24h) || 0,
    totalSupply: Number(coin.total_supply) || 1000000,
    createdAt: coin.created_at,
  }
}
