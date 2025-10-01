import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { transformCoinFromDB, type CoinFromDB } from "@/lib/supabase-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("[v0] API route called")

  try {
    const searchParams = request.nextUrl.searchParams
    const trending = searchParams.get("trending")
    const creator = searchParams.get("creator")

    console.log("[v0] Creating Supabase client")
    const supabase = getSupabaseServerClient()
    console.log("[v0] Supabase client created successfully")

    let query = supabase.from("coins").select("*")

    // Filter by creator address if provided
    if (creator) {
      query = query.eq("creator_address", creator)
    }

    // Once migration is run, you can uncomment the trending sort
    if (trending === "true") {
      console.log("[v0] Fetching trending coins")
      // Uncomment this line after running the migration script:
      // query = query.order("volume_24h", { ascending: false }).limit(12)

      // Temporary: sort by created_at until migration is run
      query = query.order("created_at", { ascending: false }).limit(12)
    } else {
      query = query.order("created_at", { ascending: false })
    }

    console.log("[v0] Executing query")
    const { data, error } = await query

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Query successful, transforming data")
    // Transform database records to frontend format
    const coins = (data as CoinFromDB[])?.map(transformCoinFromDB) || []
    console.log("[v0] Transformed", coins.length, "coins")

    return NextResponse.json(coins)
  } catch (error) {
    console.error("[v0] Failed to fetch coins:", error)
    return NextResponse.json({ error: "Failed to fetch coins" }, { status: 500 })
  }
}
