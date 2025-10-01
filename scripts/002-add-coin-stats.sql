-- Add stats columns to coins table
ALTER TABLE coins
ADD COLUMN IF NOT EXISTS market_cap NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_24h NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS holders_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_supply NUMERIC DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS price_change_24h NUMERIC DEFAULT 0;

-- Create index for market cap sorting
CREATE INDEX IF NOT EXISTS idx_coins_market_cap ON coins(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_coins_volume ON coins(volume_24h DESC);
