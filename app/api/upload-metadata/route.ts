import { type NextRequest, NextResponse } from "next/server"
import { uploadJSONToPinata, uploadToPinata, getIPFSGatewayUrl } from "@/lib/pinata"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const imageFile = formData.get("image") as File | null
      const metadataJson = formData.get("metadata")?.toString()
      const coinType = formData.get("type")?.toString() || "image"

      // If we have metadata JSON, this is a channel import
      if (metadataJson) {
        const metadata = JSON.parse(metadataJson)

        // If we have an avatar image, upload it first
        if (imageFile) {
          const imageIpfsUri = await uploadToPinata(imageFile)
          const imageGatewayUrl = getIPFSGatewayUrl(imageIpfsUri)

          // Update metadata with IPFS image URLs
          metadata.image = imageIpfsUri
          metadata.image_url = imageGatewayUrl
        }

        // Upload the complete metadata
        const ipfsUri = await uploadJSONToPinata(metadata)
        const gatewayUrl = getIPFSGatewayUrl(ipfsUri)

        return NextResponse.json({
          ipfsUri,
          ipfsHash: ipfsUri.replace("ipfs://", ""),
          gatewayUrl,
          metadata,
        })
      }

      // Regular image or music coin upload
      const name = formData.get("name")?.toString() || "Media Coin"
      const symbol = formData.get("symbol")?.toString() || ""
      const description = formData.get("description")?.toString() || ""

      if (!imageFile) {
        return NextResponse.json({ error: "File is required" }, { status: 400 })
      }

      // Upload file to Pinata
      const fileIpfsUri = await uploadToPinata(imageFile)
      const fileGatewayUrl = getIPFSGatewayUrl(fileIpfsUri)

      // Prepare metadata for the coin
      const metadata = {
        name,
        description: description || `A coin representing: ${name}`,
        image: fileIpfsUri,
        external_url: "",
        attributes: [
          { trait_type: "Type", value: coinType === "music" ? "Music" : "Image" },
          { trait_type: "Symbol", value: symbol },
        ],
      }

      // Upload metadata JSON to Pinata
      const ipfsUri = await uploadJSONToPinata(metadata)
      const gatewayUrl = getIPFSGatewayUrl(ipfsUri)

      return NextResponse.json({
        ipfsHash: ipfsUri.replace("ipfs://", ""),
        ipfsUri,
        gatewayUrl,
        fileUrl: fileGatewayUrl,
        metadata,
      })
    }

    const body = await request.json()
    const { blogData } = body

    if (blogData) {
      // Blog coin metadata
      const metadata = {
        name: blogData.title || "Blog Post Coin",
        description: blogData.description || `A coin representing the blog post: ${blogData.title}`,
        image: blogData.image || "",
        external_url: blogData.url,
        attributes: [
          {
            trait_type: "Author",
            value: blogData.author || "Unknown",
          },
          {
            trait_type: "Source",
            value: new URL(blogData.url).hostname,
          },
          {
            trait_type: "Type",
            value: "Blog Post",
          },
          {
            trait_type: "Original Link",
            value: blogData.url,
          },
          {
            trait_type: "Publish Date",
            value: blogData.publishDate || "Unknown",
          },
        ],
        content: {
          uri: blogData.url,
          mime: "text/html",
        },
      }

      const ipfsUri = await uploadJSONToPinata(metadata)
      const gatewayUrl = getIPFSGatewayUrl(ipfsUri)

      return NextResponse.json({
        ipfsHash: ipfsUri.replace("ipfs://", ""),
        ipfsUri,
        gatewayUrl,
        metadata,
      })
    }

    // Original simple metadata upload
    const metadata = body
    if (!metadata.name || !metadata.symbol) {
      return NextResponse.json({ error: "Name and symbol are required" }, { status: 400 })
    }

    const ipfsUri = await uploadJSONToPinata(metadata)

    return NextResponse.json({ ipfsUri })
  } catch (error) {
    console.error("Metadata upload error:", error)
    return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
  }
}
