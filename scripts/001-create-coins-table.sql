-- Create coins table to store all created coins
CREATE TABLE IF NOT EXISTS coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ipfs_uri TEXT,
  content_url TEXT,
  coin_type TEXT,
  metadata JSONB,
  transaction_hash TEXT,
  chain_id INTEGER DEFAULT 8453,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coins_creator ON coins(creator_address);
CREATE INDEX IF NOT EXISTS idx_coins_address ON coins(address);
CREATE INDEX IF NOT EXISTS idx_coins_created_at ON coins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coins_coin_type ON coins(coin_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coins_updated_at
  BEFORE UPDATE ON coins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read coins
CREATE POLICY "Anyone can view coins"
  ON coins FOR SELECT
  USING (true);

-- Allow authenticated users to insert coins
CREATE POLICY "Authenticated users can insert coins"
  ON coins FOR INSERT
  WITH CHECK (true);

-- Allow creators to update their own coins
CREATE POLICY "Creators can update their own coins"
  ON coins FOR UPDATE
  USING (creator_address = current_setting('request.jwt.claim.sub', true));
