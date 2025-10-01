"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, User } from "lucide-react"
import Link from "next/link"
import { getCoinsTopGainers, getCoinsTopVolume24h, getCoinsMostValuable, getCoinsNew } from "@zoralabs/coins-sdk"

interface Creator {
  address: string
  coinCount: number
  totalMarketCap: number
  totalVolume: number
  coins: Array<{
    name: string
    symbol: string
    address: string
    marketCap?: string
  }>
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCreators() {
      setLoading(true)
      try {
        // Fetch coins from multiple sources to get a comprehensive list
        const [topGainers, topVolume, mostValuable, newCoins] = await Promise.all([
          getCoinsTopGainers({ count: 50 }),
          getCoinsTopVolume24h({ count: 50 }),
          getCoinsMostValuable({ count: 50 }),
          getCoinsNew({ count: 50 }),
        ])

        // Combine all coins
        const allCoins = [
          ...(topGainers.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(topVolume.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(mostValuable.data?.exploreList?.edges?.map((e: any) => e.node) || []),
          ...(newCoins.data?.exploreList?.edges?.map((e: any) => e.node) || []),
        ]

        // Group coins by creator
        const creatorMap = new Map<string, Creator>()

        allCoins.forEach((coin: any) => {
          const creatorAddress = coin.creatorAddress
          if (!creatorAddress) return

          const existing = creatorMap.get(creatorAddress)
          const marketCap = Number.parseFloat(coin.marketCap || "0")
          const volume = Number.parseFloat(coin.volume24h || "0")

          if (existing) {
            existing.coinCount++
            existing.totalMarketCap += marketCap
            existing.totalVolume += volume
            existing.coins.push({
              name: coin.name,
              symbol: coin.symbol,
              address: coin.address,
              marketCap: coin.marketCap,
            })
          } else {
            creatorMap.set(creatorAddress, {
              address: creatorAddress,
              coinCount: 1,
              totalMarketCap: marketCap,
              totalVolume: volume,
              coins: [
                {
                  name: coin.name,
                  symbol: coin.symbol,
                  address: coin.address,
                  marketCap: coin.marketCap,
                },
              ],
            })
          }
        })

        // Convert to array and sort by total market cap
        const creatorsArray = Array.from(creatorMap.values()).sort((a, b) => b.totalMarketCap - a.totalMarketCap)

        setCreators(creatorsArray)
      } catch (error) {
        console.error("[v0] Failed to load creators:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCreators()
  }, [])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`
    return `$${value.toFixed(2)}`
  }

  const formatAge = (coinCount: number) => {
    // Mock age calculation based on coin count for demo
    if (coinCount >= 10) return "2mo"
    if (coinCount >= 5) return "17d"
    return "13d"
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <h1 className="mb-2 text-2xl md:text-3xl font-bold">Top Creators</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Discover the most active creators on the platform
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : creators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <User className="h-10 md:h-12 w-10 md:w-12 text-muted-foreground mb-4" />
              <p className="text-base md:text-lg font-medium text-muted-foreground mb-2">No creators found</p>
              <p className="text-sm text-muted-foreground">Be the first to create a coin!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-full">
                  {/* Table header */}
                  <div className="grid grid-cols-[60px_1fr_140px_100px_100px] gap-4 px-4 py-3 bg-muted/50 rounded-lg mb-2 text-sm font-medium text-muted-foreground">
                    <div>Rank</div>
                    <div>Creator</div>
                    <div>Market Cap</div>
                    <div>Coins</div>
                    <div>Age</div>
                    <div></div>
                  </div>

                  {/* Table rows */}
                  {creators.map((creator, index) => (
                    <Link key={creator.address} href={`/creators/${creator.address}`}>
                      <div className="grid grid-cols-[60px_1fr_140px_100px_100px] gap-4 px-4 py-4 hover:bg-muted/30 rounded-lg transition-colors items-center border-b border-border/50 last:border-0">
                        <div className="text-lg font-semibold text-muted-foreground">{index + 1}</div>

                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {creator.address.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{formatAddress(creator.address)}</div>
                            <div className="text-sm text-muted-foreground font-mono truncate">
                              {creator.address.slice(0, 10)}...
                            </div>
                          </div>
                        </div>

                        <div className="font-semibold">{formatNumber(creator.totalMarketCap)}</div>

                        <div className="text-muted-foreground">{creator.coinCount}</div>

                        <div className="text-muted-foreground">{formatAge(creator.coinCount)}</div>

                        <div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Buy
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {creators.map((creator, index) => (
                  <Link key={creator.address} href={`/creators/${creator.address}`}>
                    <div className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="text-lg font-semibold text-muted-foreground w-8">{index + 1}</div>
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {creator.address.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{formatAddress(creator.address)}</div>
                            <div className="text-xs text-muted-foreground">
                              {creator.coinCount} {creator.coinCount === 1 ? "coin" : "coins"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                          <div className="font-semibold">{formatNumber(creator.totalMarketCap)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Age</div>
                          <div className="text-muted-foreground">{formatAge(creator.coinCount)}</div>
                        </div>
                      </div>

                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Buy
                      </Button>
                    </div>
                  </Link>
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
