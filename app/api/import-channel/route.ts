import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

interface ChannelData {
  name: string
  description: string
  avatar?: string
  platform: string
  url: string
  followers?: string
  verified?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { url, platform } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const channelData: ChannelData = {
      name: "",
      description: "",
      platform: platform || "unknown",
      url,
    }

    // For now, we'll do basic scraping
    // In production, you'd want to use platform-specific APIs
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 15000,
      })

      const html = response.data

      // Extract basic info from HTML
      // This is a simplified version - you'd want more robust parsing per platform
      const titleMatch = html.match(/<title>(.*?)<\/title>/i)
      const descMatch = html.match(/<meta name="description" content="(.*?)"/i)
      const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/i)

      channelData.name = titleMatch ? titleMatch[1].trim() : "Unknown Channel"
      channelData.description = descMatch ? descMatch[1].trim() : ""
      channelData.avatar = ogImageMatch ? ogImageMatch[1] : undefined

      // Platform-specific extraction
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        channelData.platform = "YouTube"
        const subsMatch = html.match(/"subscriberCountText":\{"simpleText":"(.*?)"/i)
        if (subsMatch) {
          channelData.followers = subsMatch[1]
        }
      } else if (url.includes("twitter.com") || url.includes("x.com")) {
        channelData.platform = "Twitter"
      } else if (url.includes("instagram.com")) {
        channelData.platform = "Instagram"
      } else if (url.includes("tiktok.com")) {
        channelData.platform = "TikTok"
      } else if (url.includes("twitch.tv")) {
        channelData.platform = "Twitch"
      } else if (url.includes("facebook.com")) {
        channelData.platform = "Facebook"
      }
    } catch (error) {
      console.error("Channel import error:", error)
      // Return partial data even if scraping fails
      return NextResponse.json({
        ...channelData,
        name: channelData.name || "Unknown Channel",
        description: "Unable to fetch channel details automatically. Please enter manually.",
      })
    }

    return NextResponse.json(channelData)
  } catch (error) {
    console.error("Import channel error:", error)
    return NextResponse.json({ error: "Failed to import channel" }, { status: 500 })
  }
}
