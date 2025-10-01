"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CoinCard } from "@/components/coin-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { CreateCoinModal } from "@/components/create-coin-modal"
import type { Coin } from "@/lib/supabase-types"

export default function HomePage() {
  const [trendingCoins, setTrendingCoins] = useState<Coin[]>([])
  const [newCoins, setNewCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCoins() {
      setLoading(true)
      try {
        const [trendingRes, newRes] = await Promise.all([fetch("/api/coins?trending=true"), fetch("/api/coins")])

        const trending = trendingRes.ok ? await trendingRes.json() : []
        const newest = newRes.ok ? await newRes.json() : []

        setTrendingCoins(trending.slice(0, 6))
        setNewCoins(newest.slice(0, 6))
      } catch (error) {
        console.error("Failed to load coins:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCoins()
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <section className="mb-8 md:mb-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-6 md:p-8">
            <div className="max-w-2xl">
              <h1 className="mb-3 md:mb-4 text-2xl md:text-4xl font-bold text-balance">Tokenize Anything</h1>
              <p className="mb-4 md:mb-6 text-sm md:text-lg leading-relaxed text-foreground/80">
                Create creator coins for your blog posts, links, content, or ideas. Build your own creator economy on
                Ethereum using Zora protocol.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <CreateCoinModal />
                <Link href="/create" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
                    Simple Form
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <section className="mb-6 md:mb-8">
                <div className="mb-4 md:mb-6 flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold">Top Gainers</h2>
                  <Link href="/trending">
                    <Button variant="ghost" className="gap-2 text-sm md:text-base">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                  {trendingCoins.length > 0 ? (
                    trendingCoins.map((coin) => <CoinCard key={coin.id} coin={coin} />)
                  ) : (
                    <p className="text-muted-foreground text-sm md:text-base col-span-full">No trending coins found</p>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-4 md:mb-6 flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold">New Coins</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
                  {newCoins.length > 0 ? (
                    newCoins.map((coin) => <CoinCard key={coin.id} coin={coin} />)
                  ) : (
                    <p className="text-muted-foreground text-sm md:text-base col-span-full">No new coins found</p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
