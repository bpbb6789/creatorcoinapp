import { DollarSign, TrendingUp, Users, Wallet } from "lucide-react"

interface CoinStatsIconsProps {
  price: string | null
  marketCap: string | null
  volume24h: string | null
  uniqueHolders: number | null
  earnings: string | null
}

export function CoinStatsIcons({ price, marketCap, volume24h, uniqueHolders, earnings }: CoinStatsIconsProps) {
  const formatNumber = (value: string | number | null) => {
    if (!value) return "N/A"
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(num)) return "N/A"
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`
    return num.toFixed(2)
  }

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {price && (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-green-500" />
          <span className="text-gray-400">Price:</span>
          <span className="font-medium">${formatNumber(price)}</span>
        </div>
      )}
      {marketCap && (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-blue-500" />
          <span className="text-gray-400">MCap:</span>
          <span className="font-medium">${formatNumber(marketCap)}</span>
        </div>
      )}
      {volume24h && (
        <div className="flex items-center gap-1">
          <Wallet className="h-3 w-3 text-purple-500" />
          <span className="text-gray-400">Vol:</span>
          <span className="font-medium">${formatNumber(volume24h)}</span>
        </div>
      )}
      {uniqueHolders !== null && (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-orange-500" />
          <span className="text-gray-400">Holders:</span>
          <span className="font-medium">{uniqueHolders}</span>
        </div>
      )}
    </div>
  )
}
