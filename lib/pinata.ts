export interface PinataUploadResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const pinataMetadata = JSON.stringify({
    name: file.name,
  })
  formData.append("pinataMetadata", pinataMetadata)

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload to IPFS")
  }

  const data: PinataUploadResponse = await response.json()
  return `ipfs://${data.IpfsHash}`
}

export async function uploadJSONToPinata(json: object): Promise<string> {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: JSON.stringify(json),
  })

  if (!response.ok) {
    throw new Error("Failed to upload JSON to IPFS")
  }

  const data: PinataUploadResponse = await response.json()
  return `ipfs://${data.IpfsHash}`
}

export async function uploadFileWithMetadata(file: File, metadata?: Record<string, string>): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  if (metadata) {
    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: metadata,
    })
    formData.append("pinataMetadata", pinataMetadata)
  } else {
    const pinataMetadata = JSON.stringify({
      name: file.name,
    })
    formData.append("pinataMetadata", pinataMetadata)
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload to IPFS")
  }

  const data: PinataUploadResponse = await response.json()
  return `ipfs://${data.IpfsHash}`
}

export function getIPFSGatewayUrl(ipfsUri: string): string {
  if (ipfsUri.startsWith("ipfs://")) {
    const hash = ipfsUri.replace("ipfs://", "")
    return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${hash}`
  }
  return ipfsUri
}

export function getGatewayUrlFromHash(hash: string): string {
  return `${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${hash}`
}

export function getHashFromIPFSUri(ipfsUri: string): string {
  return ipfsUri.replace("ipfs://", "")
}
