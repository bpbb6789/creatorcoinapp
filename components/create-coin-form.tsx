"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { createCoinCall, CreateConstants } from "@zoralabs/coins-sdk"
import { base } from "viem/chains"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, Coins } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function CreateCoinForm() {
  const { address, isConnected } = useAccount()
  const { sendTransaction, data: hash, isPending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    contentUrl: "",
    currency: "ETH" as keyof typeof CreateConstants.ContentCoinCurrencies,
    startingMarketCap: "LOW" as keyof typeof CreateConstants.StartingMarketCaps,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [pendingCoinData, setPendingCoinData] = useState<any>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    async function saveCoin() {
      if (isSuccess && hash && pendingCoinData) {
        try {
          console.log("[v0] Transaction confirmed, saving coin to database")
          const response = await fetch("/api/save-coin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...pendingCoinData,
              transactionHash: hash,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to save coin")
          }

          console.log("[v0] Coin saved successfully")
          toast({
            title: "Success!",
            description: "Your coin has been created and saved to the database",
          })
        } catch (error) {
          console.error("[v0] Error saving coin:", error)
          toast({
            title: "Warning",
            description: "Coin created on-chain but failed to save to database",
            variant: "destructive",
          })
        }
      }
    }

    saveCoin()
  }, [isSuccess, hash, pendingCoinData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a coin",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Upload image to IPFS
      let imageUri = ""
      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append("file", imageFile)
        const imageResponse = await fetch("/api/upload-image", {
          method: "POST",
          body: imageFormData,
        })
        const imageData = await imageResponse.json()
        imageUri = imageData.ipfsUri
      }

      // Create metadata object
      const metadata = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: imageUri,
        external_url: formData.contentUrl,
      }

      // Upload metadata to IPFS
      const metadataResponse = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      })
      const metadataData = await metadataResponse.json()
      const metadataUri = metadataData.ipfsUri

      setIsUploading(false)

      // Create coin transaction
      const txCalls = await createCoinCall({
        creator: address,
        name: formData.name,
        symbol: formData.symbol,
        metadata: { type: "RAW_URI" as const, uri: metadataUri },
        currency: CreateConstants.ContentCoinCurrencies[formData.currency],
        chainId: base.id,
        startingMarketCap: CreateConstants.StartingMarketCaps[formData.startingMarketCap],
      })

      setPendingCoinData({
        address: txCalls[0].to,
        name: formData.name,
        symbol: formData.symbol,
        creatorAddress: address,
        description: formData.description,
        imageUrl: imageUri,
        ipfsUri: metadataUri,
        contentUrl: formData.contentUrl,
        coinType: "general",
        chainId: base.id,
      })

      // Send transaction
      sendTransaction({
        to: txCalls[0].to,
        data: txCalls[0].data,
        value: txCalls[0].value,
      })

      toast({
        title: "Transaction submitted",
        description: "Your coin is being created on the blockchain",
      })
    } catch (error) {
      console.error("Error creating coin:", error)
      toast({
        title: "Error",
        description: "Failed to create coin. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-green-500/50 bg-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-500">Coin Created Successfully!</CardTitle>
          <CardDescription>Your creator coin has been deployed to the blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()} className="w-full">
            Create Another Coin
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Create Your Creator Coin
        </CardTitle>
        <CardDescription>Tokenize anything - blog posts, links, content, or ideas</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Coin Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Coin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              placeholder="MAC"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this coin represents..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentUrl">Content URL (Optional)</Label>
            <Input
              id="contentUrl"
              type="url"
              placeholder="https://example.com/blog-post"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Coin Image</Label>
            <div className="flex items-center gap-4">
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
              {imagePreview && (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value as typeof formData.currency })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="ZORA">ZORA</SelectItem>
                  <SelectItem value="CREATOR_COIN">Creator Coin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketCap">Starting Market Cap</Label>
              <Select
                value={formData.startingMarketCap}
                onValueChange={(value) =>
                  setFormData({ ...formData, startingMarketCap: value as typeof formData.startingMarketCap })
                }
              >
                <SelectTrigger id="marketCap">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low (Recommended)</SelectItem>
                  <SelectItem value="HIGH">High (Known Creators)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!isConnected || isPending || isConfirming || isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading to IPFS...
              </>
            ) : isPending || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? "Confirm in Wallet..." : "Creating Coin..."}
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Create Coin
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
