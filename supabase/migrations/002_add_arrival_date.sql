-- Add arrival_date column to tickets table if it doesn't exist
-- Run this in Supabase SQL Editor if you encounter "column 'arrival_date' does not exist" errors

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS arrival_date TEXT;

-- Force schema cache refresh
-- After running the ALTER, run this to notify PostgREST to reload its schema cache:
NOTIFY pgrst, 'reload schema';

-- Alternative: you can also run:
-- SELECT pg_notify('pgrst', 'reload schema');

-- Then restart your Next.js dev server to clear any cached schema.