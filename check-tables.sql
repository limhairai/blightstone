-- Check if our app tables exist in production
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'businesses', 'profiles', 'ad_accounts', 'wallets', 'plans')
ORDER BY table_name; 