export interface ScrapedData {
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

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const response = await fetch("/api/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to scrape URL")
  }

  return response.json()
}

export async function importChannel(url: string, platform?: string) {
  const response = await fetch("/api/import-channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, platform }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to import channel")
  }

  return response.json()
}
