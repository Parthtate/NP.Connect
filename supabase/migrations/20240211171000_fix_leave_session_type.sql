-- Corrective Migration: Convert 'session' from ENUM to TEXT
-- This aligns the valid database state with the updated schema.sql

-- 1. Drop existing default if it relies on the enum
ALTER TABLE public.leaves ALTER COLUMN session DROP DEFAULT;

-- 2. Convert column to text
ALTER TABLE public.leaves 
ALTER COLUMN session TYPE text 
USING session::text;

-- 3. Add the check constraint for valid values (Idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leaves_session_check') THEN 
        ALTER TABLE public.leaves 
        ADD CONSTRAINT leaves_session_check 
        CHECK (session IN ('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'));
    END IF; 
END $$;

-- 4. Re-apply default 'FULL_DAY'
ALTER TABLE public.leaves ALTER COLUMN session SET DEFAULT 'FULL_DAY';
