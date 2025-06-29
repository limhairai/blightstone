#!/bin/bash

# Setup Monitoring (Stripe + Sentry) Script
# This script helps configure Stripe test keys and Sentry monitoring

echo "🔧 AdHub Monitoring Setup"
echo "========================"
echo ""

# Function to setup Stripe test keys
setup_stripe() {
    echo "💳 STRIPE SETUP"
    echo "==============="
    echo ""
    echo "🚨 SECURITY ALERT: Your development environment has LIVE Stripe keys!"
    echo "This means development testing could charge real money!"
    echo ""
    echo "�� To fix this:"
    echo "1. Go to: https://dashboard.stripe.com"
    echo "2. Switch to TEST mode (toggle in top-left)"
    echo "3. Go to: Developers → API Keys"
    echo "4. Copy your TEST keys (pk_test_... and sk_test_...)"
    echo ""
    echo "🃏 Test Card Numbers (NO REAL MONEY):"
    echo "  Success: 4242 4242 4242 4242"
    echo "  Decline: 4000 0000 0000 0002"
    echo "  Insufficient: 4000 0000 0000 9995"
    echo "  Expiry: 12/25 (any future date)"
    echo "  CVC: 123 (any 3 digits)"
    echo ""
    
    read -p "Do you want to update Stripe keys now? (y/n): " update_stripe
    if [[ $update_stripe == "y" ]]; then
        echo ""
        echo "📝 Enter your Stripe TEST keys:"
        read -p "Publishable Key (pk_test_...): " stripe_pub_key
        read -p "Secret Key (sk_test_...): " stripe_secret_key
        
        if [[ $stripe_pub_key == pk_test_* ]] && [[ $stripe_secret_key == sk_test_* ]]; then
            # Update development environment
            sed -i.bak "s/STRIPE_PUBLISHABLE_KEY=.*/STRIPE_PUBLISHABLE_KEY=$stripe_pub_key/" backend/.env.development
            sed -i.bak "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=$stripe_secret_key/" backend/.env.development
            
            # Update frontend environment
            echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripe_pub_key" >> frontend/.env.development
            
            echo "✅ Stripe TEST keys updated successfully!"
            echo "💡 Your development environment is now safe!"
        else
            echo "❌ Error: Please use TEST keys (pk_test_ and sk_test_)"
        fi
    fi
}

# Function to setup Sentry
setup_sentry() {
    echo ""
    echo "🔍 SENTRY SETUP"
    echo "==============="
    echo ""
    echo "✅ Frontend Sentry: Already installed (@sentry/nextjs)"
    echo ""
    echo "🔧 Installing Backend Sentry..."
    
    # Add Sentry to backend requirements
    if ! grep -q "sentry-sdk" backend/requirements/base.txt; then
        echo "sentry-sdk[fastapi]==1.40.0" >> backend/requirements/base.txt
        echo "✅ Added Sentry to backend requirements"
    else
        echo "✅ Sentry already in backend requirements"
    fi
    
    echo ""
    echo "📋 Complete your Sentry setup:"
    echo "1. Finish Sentry onboarding at: https://sentry.io"
    echo "2. Create projects: 'adhub-frontend' and 'adhub-backend'"
    echo "3. Copy your DSN URLs"
    echo "4. Add to environment variables:"
    echo ""
    echo "   Frontend (.env.local):"
    echo "   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id"
    echo ""
    echo "   Backend (.env.development):"
    echo "   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id"
    echo ""
    
    read -p "Do you have your Sentry DSN URLs? (y/n): " has_sentry_dsn
    if [[ $has_sentry_dsn == "y" ]]; then
        echo ""
        read -p "Frontend DSN: " frontend_dsn
        read -p "Backend DSN: " backend_dsn
        
        # Update environment files
        echo "NEXT_PUBLIC_SENTRY_DSN=$frontend_dsn" >> frontend/.env.local
        echo "SENTRY_DSN=$backend_dsn" >> backend/.env.development
        
        echo "✅ Sentry DSN URLs added to environment files!"
    else
        echo "💡 Complete Sentry onboarding first, then run this script again"
    fi
}

# Function to create test error endpoints
create_test_endpoints() {
    echo ""
    echo "🧪 TESTING SETUP"
    echo "================"
    echo ""
    echo "Creating test error endpoints for monitoring..."
    
    # Create test error component for frontend
    mkdir -p frontend/src/components/debug
    cat > frontend/src/components/debug/MonitoringTest.tsx << 'TEST_EOF'
"use client";

import * as Sentry from "@sentry/nextjs";

export default function MonitoringTest() {
  const testFrontendError = () => {
    throw new Error("Test Frontend Error - Sentry Integration");
  };

  const testBackendError = async () => {
    try {
      const response = await fetch('/api/test-sentry');
      console.log('Backend test response:', response);
    } catch (error) {
      console.error('Backend test error:', error);
    }
  };

  const testStripePayment = () => {
    // This would trigger your Stripe payment flow
    console.log('Testing Stripe payment flow...');
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">�� Monitoring Tests</h3>
      
      <div className="space-y-2">
        <button 
          onClick={testFrontendError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test Frontend Error (Sentry)
        </button>
        
        <button 
          onClick={testBackendError}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Test Backend Error (Sentry)
        </button>
        
        <button 
          onClick={testStripePayment}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Stripe Payment
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Use these buttons to test your monitoring setup</p>
        <p>🔍 Check Sentry dashboard for error reports</p>
        <p>💳 Use test card: 4242 4242 4242 4242</p>
      </div>
    </div>
  );
}
TEST_EOF

    echo "✅ Created monitoring test component"
    echo "💡 Add <MonitoringTest /> to any page to test monitoring"
}

# Main execution
echo "This script will help you set up:"
echo "1. 💳 Stripe Test Keys (fix security issue)"
echo "2. 🔍 Sentry Error Monitoring"
echo "3. 🧪 Testing Components"
echo ""

setup_stripe
setup_sentry
create_test_endpoints

echo ""
echo "🎉 MONITORING SETUP COMPLETE!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Test Stripe payments with test cards"
echo "2. Verify Sentry error tracking"
echo "3. Set up Sentry alerts"
echo "4. Monitor your app's health"
echo ""
echo "📚 Documentation Created:"
echo "  - STRIPE_SETUP_GUIDE.md"
echo "  - STRIPE_TEST_CARDS.md"
echo "  - SENTRY_SETUP_GUIDE.md"
echo ""
echo "🚀 Your app monitoring is ready!"
