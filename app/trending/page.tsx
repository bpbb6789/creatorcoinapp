import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CoinCard } from "@/components/coin-card"
import type { Coin } from "@/lib/supabase-types"

async function getTrendingCoins() {
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/coins?trending=true`, {
      cache: "no-store",
    })
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch trending coins:", error)
    return []
  }
}

export default async function TrendingPage() {
  const trendingCoins: Coin[] = await getTrendingCoins()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <div className="mb-6 md:mb-8">
            <h1 className="mb-2 text-2xl md:text-3xl font-bold text-foreground">Trending Coins</h1>
            <p className="text-sm md:text-base text-muted-foreground">Discover the hottest creator coins right now</p>
          </div>
          {trendingCoins.length === 0 ? (
            <div className="flex min-h-[300px] md:min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-border">
              <div className="text-center px-4">
                <p className="mb-2 text-base md:text-lg font-medium text-muted-foreground">No trending coins yet</p>
                <p className="text-sm text-muted-foreground">Be the first to create a coin!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
              {trendingCoins.map((coin) => (
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
