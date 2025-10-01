"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CoinCard } from "@/components/coin-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getCoinsTopGainers, getCoinsTopVolume24h, getCoinsMostValuable, getCoinsNew } from "@zoralabs/coins-sdk"
import type { CoinData } from "@/lib/fetch-coins"

export default function CreatorProfilePage() {
  const params = useParams()
  const address = params.address as string
  const [coins, setCoins] = useState<CoinData[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadCreatorCoins() {
      setLoading(true)
      try {
        // Fetch coins from multiple sources
        const [topGainers, topVolume, mostValuable, newCoins] = await Promise.all([
          getCoinsTopGainers({ count: 100 }),
          getCoinsTopVolume24h({ count: 100 }),
          getCoinsMostValuable({ count: 100 }),
          getCoinsNew({ count: 100 }),
        ])

        // Combine all coins
        const allCoins = [
          ...(topGainers.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(topVolume.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(mostValuable.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(newCoins.data?.exploreList?.edges?.map((e: any) => e.node) || []),
        ]

        // Filter coins by creator and remove duplicates
        const creatorCoins = allCoins
          .filter((coin: any) => coin.creatorAddress?.toLowerCase() === address.toLowerCase())
          .reduce((acc: any[], coin: any) => {
            if (!acc.find((c) => c.address === coin.address)) {
              acc.push({
                id: coin.id || coin.address,
                name: coin.name || "Unknown",
                symbol: coin.symbol || "???",
                address: coin.address,
                creator: coin.creatorAddress || "0x0",
                createdAt: coin.createdAt || new Date().toISOString(),
                marketCap: coin.marketCap,
                volume24h: coin.volume24h,
                marketCapDelta24h: coin.marketCapDelta24h,
                uniqueHolders: coin.uniqueHolders,
                metadata: coin.metadata,
                mediaContent: coin.mediaContent,
                ipfsUri: coin.uri,
              })
            }
            return acc
          }, [])

        setCoins(creatorCoins)
      } catch (error) {
        console.error("[v0] Failed to load creator coins:", error)
      } finally {
        setLoading(false)
      }
    }
    if (address) {
      loadCreatorCoins()
    }
  }, [address])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const totalMarketCap = coins.reduce((sum, coin) => sum + Number.parseFloat(coin.marketCap || "0"), 0)
  const totalVolume = coins.reduce((sum, coin) => sum + Number.parseFloat(coin.volume24h || "0"), 0)

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <Link href="/creators">
            <Button variant="ghost" className="mb-4 md:mb-6 gap-2 text-sm md:text-base">
              <ArrowLeft className="h-4 w-4" />
              Back to Creators
            </Button>
          </Link>

          <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl md:text-2xl">
                  {address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold font-mono break-all">{formatAddress(address)}</h1>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 md:h-8 md:w-8 bg-transparent flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-4 break-all">
                  Full address: <span className="font-mono">{address}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="p-2 md:p-3 rounded-lg bg-background/50">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Coins</div>
                    <div className="text-lg md:text-2xl font-bold">{coins.length}</div>
                  </div>
                  <div className="p-2 md:p-3 rounded-lg bg-background/50">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Market Cap</div>
                    <div className="text-lg md:text-2xl font-bold truncate">{formatNumber(totalMarketCap)}</div>
                  </div>
                  <div className="p-2 md:p-3 rounded-lg bg-background/50">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Total Volume</div>
                    <div className="text-lg md:text-2xl font-bold truncate">{formatNumber(totalVolume)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-base md:text-lg font-medium text-muted-foreground mb-2">No coins found</p>
              <p className="text-sm text-muted-foreground">This creator hasn't created any coins yet</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Coins by this Creator</h2>
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {coins.map((coin) => (
                  <div key={coin.id} className="flex justify-center">
                    <CoinCard coin={coin} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
