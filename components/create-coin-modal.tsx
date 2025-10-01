"use client"

import { useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, ExternalLink, Coins, FileText, LinkIcon, Plus, MusicIcon, ImageIcon } from "lucide-react"
import { useAccount, useWalletClient, usePublicClient } from "wagmi"
import { base } from "viem/chains"
import { createCoinCall, CreateConstants } from "@zoralabs/coins-sdk"
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { toast } from "@/hooks/use-toast"
import { scrapeUrl, importChannel } from "@/lib/scrape-utils"
import { uploadImageCoin, uploadMusicCoin, uploadBlogCoin, uploadChannelCoin } from "@/lib/upload-utils"

interface ScrapedData {
  url: string
  title: string
  description: string
  author: string
  publishDate: string
  image: string
  content: string
  tags: string[]
  scrapedAt: string
}

interface ChannelData {
  name: string
  description: string
  avatar?: string
  platform: string
  url: string
  followers?: string
  verified?: boolean
}

export function CreateCoinModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("blog")

  // Blog tab state
  const [blogUrl, setBlogUrl] = useState("")
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [blogTokenName, setBlogTokenName] = useState("")
  const [blogTokenSymbol, setBlogTokenSymbol] = useState("")

  // Image tab state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageTokenName, setImageTokenName] = useState("")
  const [imageTokenSymbol, setImageTokenSymbol] = useState("")
  const [imageDescription, setImageDescription] = useState("")

  // Music tab state
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicPreview, setMusicPreview] = useState<string | null>(null)
  const [musicTokenName, setMusicTokenName] = useState("")
  const [musicTokenSymbol, setMusicTokenSymbol] = useState("")
  const [musicDescription, setMusicDescription] = useState("")

  // Channel tab state
  const [channelUrl, setChannelUrl] = useState("")
  const [channelData, setChannelData] = useState<ChannelData | null>(null)
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualChannelData, setManualChannelData] = useState({
    name: "",
    handle: "",
    platform: "youtube",
    description: "",
    followers: "",
    profileUrl: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [channelTokenSymbol, setChannelTokenSymbol] = useState("")
  const [channelDescription, setChannelDescription] = useState("")

  // Common state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { sendTransaction, data: hash, isPending } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Blog handlers
  const handleScrape = async () => {
    if (!blogUrl) {
      setError("Please enter a URL")
      return
    }

    setIsLoading(true)
    setError("")
    setScrapedData(null)

    try {
      const data = await scrapeUrl(blogUrl)
      setScrapedData(data)
      setBlogTokenName(data.title.substring(0, 50))
      setBlogTokenSymbol(
        data.title
          .substring(0, 10)
          .toUpperCase()
          .replace(/[^A-Z]/g, ""),
      )

      toast({
        title: "Content scraped successfully",
        description: "Review the details and create your coin",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scrape content"
      setError(errorMessage)
      toast({
        title: "Scraping failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBlogCoin = async () => {
    if (!scrapedData || !blogTokenName || !blogTokenSymbol || !address) return

    setIsLoading(true)
    setError("")

    try {
      // Upload blog metadata to IPFS
      const uploadResult = await uploadBlogCoin({
        title: blogTokenName,
        description: scrapedData.description,
        url: scrapedData.url,
        author: scrapedData.author,
        publishDate: scrapedData.publishDate,
        image: scrapedData.image,
      })

      // Create coin transaction
      const txCalls = await createCoinCall({
        creator: address,
        name: blogTokenName,
        symbol: blogTokenSymbol,
        metadata: { type: "RAW_URI" as const, uri: uploadResult.ipfsUri },
        currency: CreateConstants.ContentCoinCurrencies.ETH,
        chainId: base.id,
        startingMarketCap: CreateConstants.StartingMarketCaps.LOW,
      })

      sendTransaction({
        to: txCalls[0].to,
        data: txCalls[0].data,
        value: txCalls[0].value,
      })

      if (hash) {
        await fetch("/api/save-coin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: txCalls[0].to,
            name: blogTokenName,
            symbol: blogTokenSymbol,
            creatorAddress: address,
            description: scrapedData.description,
            imageUrl: scrapedData.image,
            ipfsUri: uploadResult.ipfsUri,
            contentUrl: scrapedData.url,
            coinType: "blog",
            metadata: {
              author: scrapedData.author,
              publishDate: scrapedData.publishDate,
              tags: scrapedData.tags,
            },
            transactionHash: hash,
            chainId: base.id,
          }),
        })
      }

      toast({
        title: "Transaction submitted",
        description: "Your blog coin is being created",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create blog coin"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Image handlers
  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleCreateImageCoin = async () => {
    if (!imageFile || !imageTokenName || !imageTokenSymbol || !address) return

    setIsLoading(true)
    setError("")

    try {
      // Upload image and metadata to IPFS
      const uploadResult = await uploadImageCoin(imageFile, imageTokenName, imageTokenSymbol, imageDescription)

      // Create coin transaction
      const txCalls = await createCoinCall({
        creator: address,
        name: imageTokenName,
        symbol: imageTokenSymbol,
        metadata: { type: "RAW_URI" as const, uri: uploadResult.ipfsUri },
        currency: CreateConstants.ContentCoinCurrencies.ETH,
        chainId: base.id,
        startingMarketCap: CreateConstants.StartingMarketCaps.LOW,
      })

      sendTransaction({
        to: txCalls[0].to,
        data: txCalls[0].data,
        value: txCalls[0].value,
      })

      if (hash) {
        await fetch("/api/save-coin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: txCalls[0].to,
            name: imageTokenName,
            symbol: imageTokenSymbol,
            creatorAddress: address,
            description: imageDescription,
            imageUrl: uploadResult.imageUri,
            ipfsUri: uploadResult.ipfsUri,
            coinType: "image",
            transactionHash: hash,
            chainId: base.id,
          }),
        })
      }

      toast({
        title: "Transaction submitted",
        description: "Your image coin is being created",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create image coin"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Music handlers
  const handleMusicFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setMusicFile(file)
    setMusicPreview(file ? file.name : null)
  }

  const handleCreateMusicCoin = async () => {
    if (!musicFile || !musicTokenName || !musicTokenSymbol || !address) return

    setIsLoading(true)
    setError("")

    try {
      // Upload music and metadata to IPFS
      const uploadResult = await uploadMusicCoin(musicFile, musicTokenName, musicTokenSymbol, musicDescription)

      // Create coin transaction
      const txCalls = await createCoinCall({
        creator: address,
        name: musicTokenName,
        symbol: musicTokenSymbol,
        metadata: { type: "RAW_URI" as const, uri: uploadResult.ipfsUri },
        currency: CreateConstants.ContentCoinCurrencies.ETH,
        chainId: base.id,
        startingMarketCap: CreateConstants.StartingMarketCaps.LOW,
      })

      sendTransaction({
        to: txCalls[0].to,
        data: txCalls[0].data,
        value: txCalls[0].value,
      })

      if (hash) {
        await fetch("/api/save-coin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: txCalls[0].to,
            name: musicTokenName,
            symbol: musicTokenSymbol,
            creatorAddress: address,
            description: musicDescription,
            imageUrl: uploadResult.imageUri,
            ipfsUri: uploadResult.ipfsUri,
            coinType: "music",
            transactionHash: hash,
            chainId: base.id,
          }),
        })
      }

      toast({
        title: "Transaction submitted",
        description: "Your music coin is being created",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create music coin"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Channel handlers
  const handleChannelImport = async () => {
    if (!channelUrl) {
      setError("Please enter a channel URL")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const data = await importChannel(channelUrl)
      setChannelData(data)

      // Generate token symbol from URL
      const generateTickerFromUrl = (url: string): string => {
        try {
          const urlObj = new URL(url)
          const pathParts = urlObj.pathname.split("/").filter((p) => p)
          let ticker = pathParts[pathParts.length - 1] || urlObj.hostname.split(".")[0]
          ticker = ticker
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .slice(0, 10)
          return ticker || "CHNL"
        } catch {
          return "CHNL"
        }
      }

      setChannelTokenSymbol(generateTickerFromUrl(data.url))
      setChannelDescription(data.description)

      toast({
        title: "Channel imported successfully",
        description: "Review the details and create your coin",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import channel"
      setError(errorMessage)
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChannelCoin = async () => {
    if (!channelData || !channelTokenSymbol || !address) return

    setIsLoading(true)
    setError("")

    try {
      // Prepare channel metadata
      const metadata = {
        name: channelData.name,
        symbol: channelTokenSymbol,
        description: channelDescription,
        type: "channel",
        channelData: {
          platform: channelData.platform,
          url: channelData.url,
          importedAt: new Date().toISOString(),
        },
        external_url: channelData.url,
        createdAt: new Date().toISOString(),
        creator: address,
      }

      // Upload channel metadata to IPFS
      const uploadResult = await uploadChannelCoin(metadata, avatarFile || undefined)

      // Create coin transaction
      const txCalls = await createCoinCall({
        creator: address,
        name: channelData.name,
        symbol: channelTokenSymbol,
        metadata: { type: "RAW_URI" as const, uri: uploadResult.ipfsUri },
        currency: CreateConstants.ContentCoinCurrencies.ETH,
        chainId: base.id,
        startingMarketCap: CreateConstants.StartingMarketCaps.LOW,
      })

      sendTransaction({
        to: txCalls[0].to,
        data: txCalls[0].data,
        value: txCalls[0].value,
      })

      if (hash) {
        await fetch("/api/save-coin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: txCalls[0].to,
            name: channelData.name,
            symbol: channelTokenSymbol,
            creatorAddress: address,
            description: channelDescription,
            imageUrl: channelData.avatar,
            ipfsUri: uploadResult.ipfsUri,
            contentUrl: channelData.url,
            coinType: "channel",
            metadata: {
              platform: channelData.platform,
              followers: channelData.followers,
              verified: channelData.verified,
            },
            transactionHash: hash,
            chainId: base.id,
          }),
        })
      }

      toast({
        title: "Transaction submitted",
        description: "Your channel coin is being created",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create channel coin"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm md:text-base px-4 md:px-6"
          >
            <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Create New Coin</span>
            <span className="sm:hidden">Create Coin</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-md">
          <Card className="border-green-500/50 bg-green-500/10">
            <CardHeader>
              <CardTitle className="text-green-500 text-lg md:text-xl">Coin Created Successfully!</CardTitle>
              <CardDescription className="text-sm">
                Your creator coin has been deployed to the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} className="w-full">
                Create Another Coin
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm md:text-base px-4 md:px-6"
        >
          <Plus className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Create New Coin</span>
          <span className="sm:hidden">Create Coin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Coins className="h-5 w-5 md:h-6 md:w-6" />
            Launch a Coin
          </DialogTitle>
          <DialogDescription className="text-sm">Choose a coin type and get started!</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="blog" className="text-xs md:text-sm px-2 py-2">
              Public Goods
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs md:text-sm px-2 py-2">
              Image
            </TabsTrigger>
            <TabsTrigger value="music" className="text-xs md:text-sm px-2 py-2">
              Music
            </TabsTrigger>
            <TabsTrigger value="channel" className="text-xs md:text-sm px-2 py-2">
              Channel
            </TabsTrigger>
          </TabsList>

          {/* Blog Tab */}
          <TabsContent value="blog">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <LinkIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Project URL
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Enter your project URL to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Project URL</label>
                  <Input
                    placeholder="https://gitcoin.com/project-link"
                    value={blogUrl}
                    onChange={(e) => setBlogUrl(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>

                <Button
                  onClick={handleScrape}
                  disabled={isLoading || !blogUrl || !isConnected}
                  className="w-full text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Submit project
                    </>
                  )}
                </Button>

                {scrapedData && (
                  <div className="space-y-4 rounded-lg border p-3 md:p-4">
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium">Token Name</label>
                      <Input
                        value={blogTokenName}
                        onChange={(e) => setBlogTokenName(e.target.value)}
                        placeholder="Enter token name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium">Token Symbol</label>
                      <Input
                        value={blogTokenSymbol}
                        onChange={(e) => setBlogTokenSymbol(e.target.value.toUpperCase())}
                        placeholder="Enter symbol"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleCreateBlogCoin}
                      disabled={isLoading || isPending || isConfirming || !blogTokenName || !blogTokenSymbol}
                      className="w-full text-sm"
                    >
                      {isPending || isConfirming ? (
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
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-2 md:p-3 text-xs md:text-sm text-red-500">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image Tab */}
          <TabsContent value="image">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ImageIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Create Coin from Image
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Upload an image and launch a new coin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Image File</label>
                  <Input type="file" accept="image/*" onChange={handleImageFileChange} className="text-sm" />
                </div>

                {imagePreview && (
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Preview</label>
                    <div className="rounded-md border p-2">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-h-32 md:max-h-40 rounded-md mx-auto"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Description</label>
                  <Textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Describe your image coin..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Token Name</label>
                    <Input
                      value={imageTokenName}
                      onChange={(e) => setImageTokenName(e.target.value)}
                      placeholder="Enter token name"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Token Symbol</label>
                    <Input
                      value={imageTokenSymbol}
                      onChange={(e) => setImageTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="Enter symbol (e.g., IMG)"
                      className="text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateImageCoin}
                  disabled={
                    isLoading ||
                    isPending ||
                    isConfirming ||
                    !imageFile ||
                    !imageTokenName ||
                    !imageTokenSymbol ||
                    !isConnected
                  }
                  className="w-full text-sm"
                >
                  {isPending || isConfirming ? (
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

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-2 md:p-3 text-xs md:text-sm text-red-500">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MusicIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Create Coin from Music
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Upload a music file and launch a coin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Music File</label>
                  <Input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/x-aiff,audio/aiff,audio/aac,audio/x-midi,audio/midi"
                    onChange={handleMusicFileChange}
                    className="text-sm"
                  />
                  {musicPreview && <div className="text-xs text-muted-foreground">Selected: {musicPreview}</div>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Description</label>
                  <Textarea
                    value={musicDescription}
                    onChange={(e) => setMusicDescription(e.target.value)}
                    placeholder="Describe your music coin..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Token Name</label>
                    <Input
                      value={musicTokenName}
                      onChange={(e) => setMusicTokenName(e.target.value)}
                      placeholder="Enter token name"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">Token Symbol</label>
                    <Input
                      value={musicTokenSymbol}
                      onChange={(e) => setMusicTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="Enter symbol (e.g., MUSIC)"
                      className="text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateMusicCoin}
                  disabled={
                    isLoading ||
                    isPending ||
                    isConfirming ||
                    !musicFile ||
                    !musicTokenName ||
                    !musicTokenSymbol ||
                    !isConnected
                  }
                  className="w-full text-sm"
                >
                  {isPending || isConfirming ? (
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

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-2 md:p-3 text-xs md:text-sm text-red-500">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channel Tab */}
          <TabsContent value="channel">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
                  Import Social Media Channel
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Turn your social media presence into a coin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Social Media URL</label>
                  <Input
                    placeholder="Paste your social media page or channel URL"
                    type="url"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Supported platforms: YouTube, Twitter, Instagram, Facebook, TikTok, Twitch, etc.
                  </p>
                </div>

                <Button
                  onClick={handleChannelImport}
                  disabled={isLoading || !channelUrl || !isConnected}
                  className="w-full text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Import Channel
                    </>
                  )}
                </Button>

                {channelData && (
                  <div className="space-y-4 rounded-lg border p-3 md:p-4">
                    <div className="flex items-center gap-3">
                      {channelData.avatar && (
                        <img
                          src={channelData.avatar || "/placeholder.svg"}
                          alt={channelData.name}
                          className="h-8 w-8 md:h-10 md:w-10 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm md:text-base truncate">{channelData.name}</h4>
                          {channelData.verified && (
                            <Badge variant="secondary" className="bg-blue-100 text-[10px] md:text-xs flex-shrink-0">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="mt-1 capitalize text-[10px] md:text-xs">
                          {channelData.platform}
                        </Badge>
                      </div>
                    </div>

                    {channelData.description && (
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">{channelData.description}</p>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium">Channel Symbol</label>
                      <Input
                        value={channelTokenSymbol}
                        onChange={(e) => setChannelTokenSymbol(e.target.value.toUpperCase())}
                        placeholder="CHNL"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium">Channel Description</label>
                      <Textarea
                        value={channelDescription}
                        onChange={(e) => setChannelDescription(e.target.value)}
                        placeholder="Description..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleCreateChannelCoin}
                      disabled={isLoading || isPending || isConfirming || !channelTokenSymbol}
                      className="w-full text-sm"
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isPending ? "Confirm in Wallet..." : "Creating Coin..."}
                        </>
                      ) : (
                        <>
                          <Coins className="mr-2 h-4 w-4" />
                          Create Channel Coin
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-2 md:p-3 text-xs md:text-sm text-red-500">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
