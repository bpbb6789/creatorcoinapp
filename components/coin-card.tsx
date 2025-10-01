"use client"

import { useState } from "react"
import { useAccount, useWalletClient, usePublicClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, Copy, Check, User, Calendar, TrendingUp, DollarSign, Activity, Users } from "lucide-react"
import { parseEther, type WalletClient, type PublicClient, type Account } from "viem"
import { tradeCoin, type TradeParameters } from "@zoralabs/coins-sdk"
import Link from "next/link"
import type { Coin } from "@/lib/supabase-types"

interface CoinCardProps {
  coin: Coin
  isOwnCoin?: boolean
}

export function CoinCard({ coin, isOwnCoin = false }: CoinCardProps) {
  const [copied, setCopied] = useState(false)
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ethAmount, setEthAmount] = useState("0.0001")

  const account = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const CARD_WIDTH = 280
  const CARD_HEIGHT = 420

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAge = (dateString: string) => {
    const now = new Date()
    const created = new Date(dateString)
    const diff = now.getTime() - created.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 1) return "today"
    if (days < 30) return days + "d"
    if (days < 365) return Math.floor(days / 30) + "m"
    return Math.floor(days / 365) + "y"
  }

  const formatNumber = (value: number) => {
    if (!value || value === 0) return "$0.00"

    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`
    if (value >= 1) return `$${value.toFixed(2)}`
    return `$${value.toFixed(4)}`
  }

  const handleTrade = async (coinAddress: `0x${string}`) => {
    if (!account.isConnected || !account.address) {
      setError("Please connect your wallet first")
      return
    }
    if (!ethAmount || Number.parseFloat(ethAmount) <= 0) {
      setError("Please enter a valid ETH amount")
      return
    }
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const tradeParams: TradeParameters = {
        sell: { type: "eth" },
        buy: { type: "erc20", address: coinAddress },
        amountIn: parseEther(ethAmount),
        slippage: 0.05,
        sender: account.address as `0x${string}`,
      }
      const receipt = await tradeCoin({
        tradeParameters: tradeParams,
        walletClient: walletClient as WalletClient,
        publicClient: publicClient as PublicClient,
        account: walletClient?.account as Account,
      })
      setTxHash(receipt.transactionHash)
      setError(null)
    } catch (err: unknown) {
      console.error("Trade failed:", err)
      setError((err as Error).message || "Trade failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      className={`hover:shadow-lg transition-shadow ${isOwnCoin ? "border-primary/50 bg-primary/5" : ""}`}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        minWidth: CARD_WIDTH,
        minHeight: CARD_HEIGHT,
        maxWidth: CARD_WIDTH,
        maxHeight: CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold truncate">
              <Coins className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{coin.name}</span>
              {isOwnCoin && (
                <Badge variant="secondary" className="ml-1 flex-shrink-0">
                  by you
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
              <span className="truncate font-mono">{formatAddress(coin.address)}</span>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleCopy(coin.address)}
            className="ml-1 h-7 w-7 flex-shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 px-4 py-0 pb-4">
        {coin.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border" style={{ width: "100%", height: 140 }}>
            <img
              src={(() => {
                if (coin.imageUrl.startsWith("ipfs://")) {
                  const hash = coin.imageUrl.replace("ipfs://", "")
                  return `https://ipfs.zora.co/ipfs/${hash || "/placeholder.svg"}`
                }
                return coin.imageUrl
              })()}
              alt={coin.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
            <DollarSign className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-muted-foreground text-[10px]">Market Cap</div>
              <div className="font-semibold truncate">{formatNumber(coin.marketCap)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
            <Activity className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-muted-foreground text-[10px]">24h Volume</div>
              <div className="font-semibold truncate">{formatNumber(coin.volume24h)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
            <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-muted-foreground text-[10px]">Holders</div>
              <div className="font-semibold truncate">{coin.holders}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50">
            <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-muted-foreground text-[10px]">24h Change</div>
              <div
                className={`font-semibold truncate ${coin.priceChange24h > 0 ? "text-green-500" : coin.priceChange24h < 0 ? "text-red-500" : ""}`}
              >
                {coin.priceChange24h !== 0 ? `${coin.priceChange24h.toFixed(2)}%` : "0%"}
              </div>
            </div>
          </div>
        </div>

        {coin.description && (
          <div className="space-y-1 p-2 rounded-md bg-muted/30">
            <div className="text-xs text-muted-foreground line-clamp-2">{coin.description}</div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Creator</span>
          </div>
          <Link href={`/creators/${coin.creatorAddress}`} className="font-mono hover:text-primary transition-colors">
            {formatAddress(coin.creatorAddress)}
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Symbol:</span>
            <span className="font-semibold">${coin.symbol}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatAge(coin.createdAt)}</span>
          </div>
        </div>

        {/* Trade button */}
        <div className="flex gap-2 pt-2">
          {!isOwnCoin && (
            <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="flex-1 gap-1.5 h-8">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trade {coin.symbol}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Coin</span>
                      <span>{coin.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Symbol</span>
                      <span>${coin.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Address</span>
                      <span className="font-mono text-xs">{formatAddress(coin.address)}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ethAmount">ETH to Trade</Label>
                    <Input
                      id="ethAmount"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={ethAmount}
                      onChange={(e) => setEthAmount(e.target.value)}
                      placeholder="ETH amount"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>You pay:</span>
                      <span className="font-semibold">{ethAmount} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>You receive:</span>
                      <span className="font-semibold">${coin.symbol} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slippage:</span>
                      <span className="font-semibold">5%</span>
                    </div>
                  </div>
                  {!account.isConnected ? (
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Please connect your wallet to trade.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleTrade(coin.address as `0x${string}`)}
                      disabled={loading || !ethAmount || Number.parseFloat(ethAmount) <= 0}
                      className="w-full"
                    >
                      {loading ? "Trading..." : `Trade ${ethAmount} ETH`}
                    </Button>
                  )}
                  {error && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">❌ {error}</p>
                    </div>
                  )}
                  {txHash && (
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-1">✅ Success!</p>
                      <p className="text-xs font-mono break-all text-muted-foreground">{txHash}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
