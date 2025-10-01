import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Providers } from "@/lib/providers"
import { Suspense } from "react"

const poppinsRounded = localFont({
  src: "../public/fonts/PoppinsRounded.ttf",
  variable: "--font-poppins-rounded",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Creator Coin Studio",
  description: "Create and deploy creator coins on Ethereum using Zora",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${poppinsRounded.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  )
}
