-- Setup Admin User Script
-- Run this after creating a user through the frontend registration

-- Step 1: First, register a user through the frontend at http://localhost:3000/register
-- Step 2: Then run this script with the user's email to make them an admin

-- Replace 'your-email@example.com' with the actual email you registered with
UPDATE profiles 
SET is_superuser = true, role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, name, role, is_superuser 
FROM profiles 
WHERE email = 'your-email@example.com';

-- If no user exists, you can also create one manually (but you'll need the auth.users entry first)
-- This is just for reference - you should use the frontend registration
/*
INSERT INTO profiles (id, email, name, role, is_superuser)
VALUES (
    'your-user-id-from-auth-users',
    'your-email@example.com', 
    'Admin User',
    'admin',
    true
);
*/ 