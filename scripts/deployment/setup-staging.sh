#!/bin/bash

# Blightstone Staging Environment Setup Script
echo "🚀 Setting up Blightstone Staging Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

print_success "Supabase CLI found"

# Step 1: Login to Supabase
print_status "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    print_warning "Not logged in to Supabase. Please login:"
    echo "supabase login"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

print_success "Supabase authentication verified"

# Step 2: Link to staging project
print_status "Linking to staging Supabase project..."
if supabase link --project-ref xewhfrwuzkfbnpwtdxuf; then
    print_success "Successfully linked to staging project"
else
    print_error "Failed to link to staging project"
    exit 1
fi

# Step 3: Push migrations
print_status "Pushing database migrations to staging..."
if supabase db push; then
    print_success "Migrations applied successfully"
else
    print_error "Failed to apply migrations"
    exit 1
fi

# Step 4: Create demo user script
print_status "Creating demo user setup script..."
cat > /tmp/create_staging_user.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('Please set SUPABASE_SERVICE_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoUser() {
    console.log('Creating demo user for staging...');
    
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'demo@adhub.com',
            password: 'demo123',
            email_confirm: true,
            user_metadata: { full_name: 'Demo User' }
        });
        
        if (error && !error.message.includes('already registered')) {
            throw error;
        }
        
        console.log('✅ Demo user created/verified');
        
        // Get user ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'demo@adhub.com');
        
        if (!demoUser) {
            throw new Error('Demo user not found after creation');
        }
        
        // Create organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .upsert({
                name: 'Demo Organization',
                owner_id: demoUser.id,
                plan_id: 'growth',
                current_businesses_count: 0,
                current_ad_accounts_count: 0,
                current_team_members_count: 1,
                current_monthly_spend_cents: 0
            }, { onConflict: 'owner_id' })
            .select()
            .single();
            
        if (orgError) throw orgError;
        console.log('✅ Demo organization created');
        
        // Add user as owner
        await supabase
            .from('organization_members')
            .upsert({
                organization_id: org.id,
                user_id: demoUser.id,
                role: 'owner'
            }, { onConflict: 'organization_id,user_id' });
            
        console.log('✅ User added as organization owner');
        
        // Create wallet
        await supabase
            .from('wallets')
            .upsert({
                organization_id: org.id,
                balance_cents: 125000,
                currency: 'USD'
            }, { onConflict: 'organization_id' });
            
        console.log('✅ Demo wallet created with $1,250.00');
        console.log('\n🎉 Staging demo data setup complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createDemoUser();
EOF

print_status "Demo user script created. You'll need to run it manually with your service key."

# Step 5: Instructions for Vercel setup
print_status "Setting up Vercel staging deployment..."

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create demo user and data:"
echo "   cd frontend"
echo "   SUPABASE_SERVICE_KEY=your_staging_service_key node /tmp/create_staging_user.js"
echo ""
echo "2. Set up staging.adhub.tech domain:"
echo "   - Go to Vercel dashboard"
echo "   - Add domain: staging.adhub.tech"
echo "   - Add DNS CNAME: staging.adhub.tech → cname.vercel-dns.com"
echo ""
echo "3. Configure Vercel environment variables:"
echo "   NODE_ENV=staging"
echo "   NEXT_PUBLIC_ENVIRONMENT=staging"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjA3NDAsImV4cCI6MjA2NDYzNjc0MH0.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE"
echo ""
echo "4. Test staging environment:"
echo "   Visit: https://staging.adhub.tech"
echo "   Login: demo@adhub.com / demo123"
echo ""

print_success "Staging setup script completed!"
print_warning "Remember to complete the manual steps above." 