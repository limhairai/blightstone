-- Update support ticket categories constraint
-- Remove unwanted categories: business_manager_issue, pixel_access_request, account_access_issue
-- Keep: ad_account_issue, billing_question, feature_request, bug_report, general_inquiry

-- Drop the existing constraint
ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;

-- Add the new constraint with updated categories
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_category_check 
  CHECK (category IN (
    'ad_account_issue',
    'billing_question', 
    'feature_request',
    'bug_report',
    'general_inquiry'
  ));

-- Update any existing tickets with removed categories to general_inquiry
UPDATE public.support_tickets 
SET category = 'general_inquiry'
WHERE category IN ('business_manager_issue', 'pixel_access_request', 'account_access_issue', 'technical_support', 'account_replacement', 'spending_limit_issue'); 