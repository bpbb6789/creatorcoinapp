import { createBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export type Database = {
  public: {
    Tables: {
      coins: {
        Row: {
          id: string
          address: string
          name: string
          symbol: string
          creator_address: string
          description: string | null
          image_url: string | null
          ipfs_uri: string | null
          content_url: string | null
          coin_type: string | null
          metadata: any | null
          transaction_hash: string | null
          chain_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          name: string
          symbol: string
          creator_address: string
          description?: string | null
          image_url?: string | null
          ipfs_uri?: string | null
          content_url?: string | null
          coin_type?: string | null
          metadata?: any | null
          transaction_hash?: string | null
          chain_id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          name?: string
          symbol?: string
          creator_address?: string
          description?: string | null
          image_url?: string | null
          ipfs_uri?: string | null
          content_url?: string | null
          coin_type?: string | null
          metadata?: any | null
          transaction_hash?: string | null
          chain_id?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Client-side Supabase client (singleton pattern)
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return browserClient
}

// Server-side Supabase client (for API routes)
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
