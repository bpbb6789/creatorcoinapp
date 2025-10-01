import { type NextRequest, NextResponse } from "next/server"
import { uploadToPinata } from "@/lib/pinata"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ipfsUri = await uploadToPinata(file)

    return NextResponse.json({ ipfsUri })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
