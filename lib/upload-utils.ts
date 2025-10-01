export interface UploadMetadataResponse {
  ipfsUri: string
  ipfsHash: string
  gatewayUrl: string
  metadata: Record<string, unknown>
  fileUrl?: string
}

export async function uploadImageCoin(
  imageFile: File,
  name: string,
  symbol: string,
  description?: string,
): Promise<UploadMetadataResponse> {
  const formData = new FormData()
  formData.append("image", imageFile)
  formData.append("name", name)
  formData.append("symbol", symbol)
  formData.append("type", "image")
  if (description) {
    formData.append("description", description)
  }

  const response = await fetch("/api/upload-metadata", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload image coin")
  }

  return response.json()
}

export async function uploadMusicCoin(
  musicFile: File,
  name: string,
  symbol: string,
  description?: string,
): Promise<UploadMetadataResponse> {
  const formData = new FormData()
  formData.append("image", musicFile)
  formData.append("name", name)
  formData.append("symbol", symbol)
  formData.append("type", "music")
  if (description) {
    formData.append("description", description)
  }

  const response = await fetch("/api/upload-metadata", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload music coin")
  }

  return response.json()
}

export async function uploadBlogCoin(blogData: {
  title: string
  description: string
  url: string
  author?: string
  publishDate?: string
  image?: string
}): Promise<UploadMetadataResponse> {
  const response = await fetch("/api/upload-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ blogData }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload blog coin")
  }

  return response.json()
}

export async function uploadChannelCoin(
  metadata: Record<string, unknown>,
  avatarFile?: File,
): Promise<UploadMetadataResponse> {
  const formData = new FormData()
  formData.append("metadata", JSON.stringify(metadata))
  if (avatarFile) {
    formData.append("image", avatarFile)
  }

  const response = await fetch("/api/upload-metadata", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to upload channel coin")
  }

  return response.json()
}
