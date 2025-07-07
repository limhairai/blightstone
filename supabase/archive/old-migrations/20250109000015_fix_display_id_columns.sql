-- Manual fix for display_id columns that didn't get applied properly
-- This migration ensures the display_id columns exist and are properly configured

-- Check if display_id column exists in transactions table, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'display_id'
    ) THEN
        ALTER TABLE public.transactions ADD COLUMN display_id TEXT;
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_display_id_unique ON public.transactions(display_id);
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_display_id_unique UNIQUE USING INDEX idx_transactions_display_id_unique;
    END IF;
END $$;

-- Check if display_id column exists in topup_requests table, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'topup_requests' 
        AND column_name = 'display_id'
    ) THEN
        ALTER TABLE public.topup_requests ADD COLUMN display_id TEXT;
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_topup_requests_display_id_unique ON public.topup_requests(display_id);
        ALTER TABLE public.topup_requests ADD CONSTRAINT topup_requests_display_id_unique UNIQUE USING INDEX idx_topup_requests_display_id_unique;
    END IF;
END $$;

-- Recreate the functions (they might not exist)
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Create function to generate transaction display ID with prefix
CREATE OR REPLACE FUNCTION generate_transaction_display_id(transaction_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    short_id TEXT;
    generated_display_id TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    CASE transaction_type
        WHEN 'topup', 'topup_deduction' THEN prefix := 'TU';
        WHEN 'deposit' THEN prefix := 'DP';
        WHEN 'withdrawal' THEN prefix := 'WD';
        WHEN 'transfer' THEN prefix := 'TR';
        ELSE prefix := 'TX';
    END CASE;
    
    LOOP
        short_id := generate_short_id();
        generated_display_id := prefix || '-' || short_id;
        
        IF NOT EXISTS (SELECT 1 FROM transactions WHERE display_id = generated_display_id) THEN
            RETURN generated_display_id;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RETURN prefix || '-' || replace(gen_random_uuid()::text, '-', '')::text;
        END IF;
    END LOOP;
END;
$$;

-- Create function to generate topup request display ID
CREATE OR REPLACE FUNCTION generate_topup_display_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    short_id TEXT;
    generated_display_id TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        short_id := generate_short_id();
        generated_display_id := 'TR-' || short_id;
        
        IF NOT EXISTS (SELECT 1 FROM topup_requests WHERE display_id = generated_display_id) THEN
            RETURN generated_display_id;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RETURN 'TR-' || replace(gen_random_uuid()::text, '-', '')::text;
        END IF;
    END LOOP;
END;
$$;

-- Create trigger functions
CREATE OR REPLACE FUNCTION set_transaction_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := generate_transaction_display_id(NEW.type);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_topup_display_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := generate_topup_display_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_set_transaction_display_id'
    ) THEN
        CREATE TRIGGER trigger_set_transaction_display_id
            BEFORE INSERT ON transactions
            FOR EACH ROW
            EXECUTE FUNCTION set_transaction_display_id();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_set_topup_display_id'
    ) THEN
        CREATE TRIGGER trigger_set_topup_display_id
            BEFORE INSERT ON topup_requests
            FOR EACH ROW
            EXECUTE FUNCTION set_topup_display_id();
    END IF;
END $$;

-- Update existing records that don't have display_ids
UPDATE transactions 
SET display_id = generate_transaction_display_id(type)
WHERE display_id IS NULL;

UPDATE topup_requests 
SET display_id = generate_topup_display_id()
WHERE display_id IS NULL;

-- Add comments
COMMENT ON COLUMN transactions.display_id IS 'User-friendly transaction ID (e.g., TU-A1B2C3, DP-X9Y8Z7)';
COMMENT ON COLUMN topup_requests.display_id IS 'User-friendly topup request ID (e.g., TR-M4N5P6)'; 