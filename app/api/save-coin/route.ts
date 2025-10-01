import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      address,
      name,
      symbol,
      creatorAddress,
      description,
      imageUrl,
      ipfsUri,
      contentUrl,
      coinType,
      metadata,
      transactionHash,
      chainId,
    } = body

    // Validate required fields
    if (!address || !name || !symbol || !creatorAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Insert coin into database
    const { data, error } = await supabase
      .from("coins")
      .insert({
        address,
        name,
        symbol,
        creator_address: creatorAddress,
        description,
        image_url: imageUrl,
        ipfs_uri: ipfsUri,
        content_url: contentUrl,
        coin_type: coinType,
        metadata,
        transaction_hash: transactionHash,
        chain_id: chainId || 8453,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving coin to database:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, coin: data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in save-coin API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
