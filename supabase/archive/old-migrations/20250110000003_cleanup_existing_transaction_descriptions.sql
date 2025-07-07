-- Clean up existing transaction descriptions to remove reference numbers
-- This migration updates existing bank transfer transactions to have clean, consistent naming

-- Update bank transfer transactions that have reference numbers in the description
UPDATE public.transactions 
SET description = CASE 
  -- Bank Transfer with amount and reference - extract just "Bank Transfer - $XX.XX"
  WHEN description ~ '^Bank Transfer - \$[0-9,]+\.?[0-9]* \(Ref:.*\)$' THEN
    regexp_replace(description, '^(Bank Transfer - \$[0-9,]+\.?[0-9]*) \(Ref:.*\)$', '\1')
  
  -- Bank Transfer with just reference - change to simple "Bank Transfer"  
  WHEN description ~ '^Bank Transfer - .*(ADHUB-[A-Z0-9-]+).*$' THEN
    'Bank Transfer'
  
  -- Bank transfer (lowercase) - normalize to "Bank Transfer"
  WHEN description ~ '^bank transfer.*' THEN
    'Bank Transfer'
    
  -- Unmatched transfer with reference - change to simple "Unmatched Transfer"
  WHEN description ~ '^Unmatched transfer - .*$' THEN
    'Unmatched Transfer'
    
  -- Keep existing description if no pattern matches
  ELSE description
END,
updated_at = NOW()
WHERE description ~ '(Bank [Tt]ransfer|Unmatched transfer)' 
  AND (description ~ 'Ref:' OR description ~ 'ADHUB-' OR description ~ 'unmatched transfer');

-- Add metadata field to store reference numbers if they were extracted from description
-- First add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'reference_number'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN reference_number TEXT;
  END IF;
END $$;

-- Extract reference numbers from transaction metadata or description and store them
UPDATE public.transactions 
SET reference_number = CASE
  -- Extract from description if it contains ADHUB reference
  WHEN description ~ 'ADHUB-[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{4}' THEN
    (regexp_match(description, '(ADHUB-[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{4})'))[1]
  
  -- Extract from metadata if available
  WHEN metadata ? 'bank_reference' THEN
    metadata->>'bank_reference'
    
  -- Keep existing reference_number if already set
  ELSE reference_number
END,
updated_at = NOW()
WHERE (description ~ 'ADHUB-[A-Z0-9]{8}-[A-Z0-9]{8}-[0-9]{4}' OR metadata ? 'bank_reference')
  AND reference_number IS NULL;

-- Update transaction descriptions for consistency
UPDATE public.transactions 
SET description = CASE
  -- Standardize Stripe wallet top-ups
  WHEN description ~ '^Stripe Wallet Top-up.*' THEN
    'Wallet Top-up'
    
  -- Standardize ad account top-ups  
  WHEN description ~ '^Ad Account Top-up.*completed$' THEN
    'Ad Account Top-up'
    
  -- Standardize topup request completed messages
  WHEN description ~ '^Topup request completed:.*' THEN
    'Ad Account Top-up'
    
  -- Keep other descriptions as-is
  ELSE description
END,
updated_at = NOW()
WHERE description ~ '(Stripe Wallet Top-up|Ad Account Top-up.*completed|Topup request completed)';

-- Create index on reference_number for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_reference_number ON public.transactions(reference_number) 
WHERE reference_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.reference_number IS 'Reference number for bank transfers and external transaction tracking';

-- Log the cleanup results
DO $$
DECLARE
  bank_transfer_count INTEGER;
  updated_descriptions INTEGER;
  extracted_references INTEGER;
BEGIN
  -- Count bank transfer transactions
  SELECT COUNT(*) INTO bank_transfer_count 
  FROM public.transactions 
  WHERE description = 'Bank Transfer';
  
  -- Count transactions with reference numbers
  SELECT COUNT(*) INTO extracted_references
  FROM public.transactions 
  WHERE reference_number IS NOT NULL;
  
  RAISE NOTICE 'Transaction cleanup completed:';
  RAISE NOTICE '- Bank transfer transactions: %', bank_transfer_count;
  RAISE NOTICE '- Transactions with reference numbers: %', extracted_references;
END $$; 