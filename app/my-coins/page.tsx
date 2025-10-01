"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CoinCard } from "@/components/coin-card"
import { useAccount } from "wagmi"
import { useEffect, useState } from "react"

export default function MyCoinsPage() {
  const { address, isConnected } = useAccount()
  const [coins, setCoins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMyCoins() {
      if (!address) {
        setCoins([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/coins?creator=${address}`)
        if (response.ok) {
          const data = await response.json()
          setCoins(data)
        }
      } catch (error) {
        console.error("Failed to fetch coins:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyCoins()
  }, [address])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <h1 className="mb-2 text-2xl md:text-3xl font-bold text-foreground">My Coins</h1>
            <p className="text-sm md:text-base text-muted-foreground">View and manage your created coins</p>
          </div>
          {!isConnected ? (
            <div className="flex min-h-[300px] md:min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border">
              <div className="text-center px-4">
                <p className="mb-2 text-base md:text-lg font-medium text-muted-foreground">Connect your wallet</p>
                <p className="text-sm text-muted-foreground">Connect your wallet to view your coins</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex min-h-[300px] md:min-h-[400px] items-center justify-center">
              <p className="text-sm md:text-base text-muted-foreground">Loading your coins...</p>
            </div>
          ) : coins.length === 0 ? (
            <div className="flex min-h-[300px] md:min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border">
              <div className="text-center px-4">
                <p className="mb-2 text-base md:text-lg font-medium text-muted-foreground">No coins yet</p>
                <p className="text-sm text-muted-foreground">Create your first coin to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
              {coins.map((coin) => (
                <CoinCard key={coin.id} coin={coin} />
              ))}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
