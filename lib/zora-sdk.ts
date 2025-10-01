import { setApiKey } from "@zoralabs/coins-sdk"

// Initialize Zora SDK with API key (server-side only)
const apiKey = process.env.ZORA_API_KEY
if (apiKey) {
  setApiKey(apiKey)
}

export { setApiKey }
