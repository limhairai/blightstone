-- Add display_id columns and generation functions for user-friendly transaction IDs
-- This allows us to show IDs like TU-A1B2C3 instead of UUIDs

-- Add display_id column to transactions table
ALTER TABLE public.transactions ADD COLUMN display_id TEXT UNIQUE;

-- Add display_id column to topup_requests table  
ALTER TABLE public.topup_requests ADD COLUMN display_id TEXT UNIQUE;

-- Create function to generate short alphanumeric IDs
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    -- Generate 6 character alphanumeric string
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
    -- Determine prefix based on transaction type
    CASE transaction_type
        WHEN 'topup', 'topup_deduction' THEN prefix := 'TU';
        WHEN 'deposit' THEN prefix := 'DP';
        WHEN 'withdrawal' THEN prefix := 'WD';
        WHEN 'transfer' THEN prefix := 'TR';
        ELSE prefix := 'TX';
    END CASE;
    
    -- Try to generate unique display_id
    LOOP
        short_id := generate_short_id();
        generated_display_id := prefix || '-' || short_id;
        
        -- Check if this display_id already exists
        IF NOT EXISTS (SELECT 1 FROM transactions WHERE display_id = generated_display_id) THEN
            RETURN generated_display_id;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            -- Fallback to UUID if we can't generate unique short ID
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
    -- Try to generate unique display_id
    LOOP
        short_id := generate_short_id();
        generated_display_id := 'TR-' || short_id;
        
        -- Check if this display_id already exists
        IF NOT EXISTS (SELECT 1 FROM topup_requests WHERE display_id = generated_display_id) THEN
            RETURN generated_display_id;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            -- Fallback to UUID if we can't generate unique short ID
            RETURN 'TR-' || replace(gen_random_uuid()::text, '-', '')::text;
        END IF;
    END LOOP;
END;
$$;

-- Create trigger function to auto-generate display_id for transactions
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

-- Create trigger function to auto-generate display_id for topup_requests
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

-- Create triggers
CREATE TRIGGER trigger_set_transaction_display_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_display_id();

CREATE TRIGGER trigger_set_topup_display_id
    BEFORE INSERT ON topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_topup_display_id();

-- Update existing transactions with display_ids (for existing data)
UPDATE transactions 
SET display_id = generate_transaction_display_id(type)
WHERE display_id IS NULL;

-- Update existing topup_requests with display_ids (for existing data)
UPDATE topup_requests 
SET display_id = generate_topup_display_id()
WHERE display_id IS NULL;

-- Add indexes for performance
CREATE INDEX idx_transactions_display_id ON transactions(display_id);
CREATE INDEX idx_topup_requests_display_id ON topup_requests(display_id);

-- Add comments
COMMENT ON COLUMN transactions.display_id IS 'User-friendly transaction ID (e.g., TU-A1B2C3, DP-X9Y8Z7)';
COMMENT ON COLUMN topup_requests.display_id IS 'User-friendly topup request ID (e.g., TR-M4N5P6)'; 