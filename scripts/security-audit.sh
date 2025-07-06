#!/bin/bash

# 🔐 AdHub Security Audit Script
# Comprehensive security checks for production deployment

set -e

echo "🔐 AdHub Security Audit"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track security issues
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Function to log security findings
log_critical() {
    echo -e "${RED}🚨 CRITICAL:${NC} $1"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
}

log_high() {
    echo -e "${RED}🔴 HIGH:${NC} $1"
    HIGH_ISSUES=$((HIGH_ISSUES + 1))
}

log_medium() {
    echo -e "${YELLOW}🟡 MEDIUM:${NC} $1"
    MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
}

log_low() {
    echo -e "${BLUE}🔵 LOW:${NC} $1"
    LOW_ISSUES=$((LOW_ISSUES + 1))
}

log_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️ INFO:${NC} $1"
}

# 1. Environment Variable Security
echo "🌍 Environment Variable Security"
echo "================================"

# Check for hardcoded secrets in code
echo "Checking for hardcoded secrets..."

# Stripe keys
stripe_test_keys=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" | grep -v node_modules | xargs grep -l "sk_test_" 2>/dev/null || echo "")
if [ -n "$stripe_test_keys" ]; then
    log_high "Stripe test keys found in code: $stripe_test_keys"
else
    log_pass "No Stripe test keys found in code"
fi

stripe_live_keys=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" | grep -v node_modules | xargs grep -l "sk_live_" 2>/dev/null || echo "")
if [ -n "$stripe_live_keys" ]; then
    log_critical "Stripe live keys found in code: $stripe_live_keys"
else
    log_pass "No Stripe live keys found in code"
fi

# Database URLs
db_urls=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" | grep -v node_modules | xargs grep -l "postgresql://\|postgres://" 2>/dev/null || echo "")
if [ -n "$db_urls" ]; then
    log_high "Database URLs found in code: $db_urls"
else
    log_pass "No database URLs found in code"
fi

# API keys
api_keys=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" | grep -v node_modules | xargs grep -E "(api_key|apikey|api-key).*=.*[\"'][^\"']{20,}[\"']" 2>/dev/null || echo "")
if [ -n "$api_keys" ]; then
    log_high "Potential API keys found in code: $api_keys"
else
    log_pass "No obvious API keys found in code"
fi

# 2. Authentication Security
echo ""
echo "🔑 Authentication Security"
echo "=========================="

# Check for proper session management
session_security=$(grep -r "httpOnly.*true\|secure.*true\|sameSite" frontend/src 2>/dev/null || echo "")
if [ -n "$session_security" ]; then
    log_pass "Session security flags found"
else
    log_medium "Review session cookie security settings"
fi

# Check for password requirements
password_validation=$(grep -r "password.*length\|password.*complexity" frontend/src backend 2>/dev/null || echo "")
if [ -n "$password_validation" ]; then
    log_pass "Password validation found"
else
    log_medium "Implement password complexity requirements"
fi

# Check for rate limiting
rate_limiting=$(grep -r "rate.*limit\|throttle" backend frontend/src 2>/dev/null || echo "")
if [ -n "$rate_limiting" ]; then
    log_pass "Rate limiting implementation found"
else
    log_high "Implement rate limiting for API endpoints"
fi

# 3. Input Validation & Sanitization
echo ""
echo "🧹 Input Validation & Sanitization"
echo "=================================="

# Check for SQL injection protection
sql_injection=$(grep -r "parameterized\|prepared.*statement\|\\$[0-9]" backend 2>/dev/null || echo "")
if [ -n "$sql_injection" ]; then
    log_pass "Parameterized queries found"
else
    log_high "Ensure all database queries use parameterized statements"
fi

# Check for XSS protection
xss_protection=$(grep -r "sanitize\|escape\|dangerouslySetInnerHTML" frontend/src 2>/dev/null || echo "")
if [ -n "$xss_protection" ]; then
    log_medium "Review XSS protection implementation"
else
    log_medium "Implement XSS protection for user inputs"
fi

# Check for CSRF protection
csrf_protection=$(grep -r "csrf\|_token" frontend/src backend 2>/dev/null || echo "")
if [ -n "$csrf_protection" ]; then
    log_pass "CSRF protection found"
else
    log_high "Implement CSRF protection"
fi

# 4. Data Protection
echo ""
echo "🔒 Data Protection"
echo "=================="

# Check for encryption at rest
encryption_at_rest=$(grep -r "encrypt\|hash\|bcrypt" backend 2>/dev/null || echo "")
if [ -n "$encryption_at_rest" ]; then
    log_pass "Encryption implementation found"
else
    log_high "Implement encryption for sensitive data"
fi

# Check for PII handling
pii_handling=$(grep -r "email\|phone\|address" frontend/src backend | grep -v "test\|mock" | head -5 || echo "")
if [ -n "$pii_handling" ]; then
    log_medium "Review PII data handling and ensure proper protection"
fi

# Check for logging sensitive data
sensitive_logging=$(grep -r "console\.log.*password\|console\.log.*token\|console\.log.*key" frontend/src backend 2>/dev/null || echo "")
if [ -n "$sensitive_logging" ]; then
    log_high "Sensitive data found in logging: $sensitive_logging"
else
    log_pass "No sensitive data found in logs"
fi

# 5. Network Security
echo ""
echo "🌐 Network Security"
echo "==================="

# Check for HTTPS enforcement
https_enforcement=$(grep -r "https\|ssl\|tls" frontend/src backend config 2>/dev/null || echo "")
if [ -n "$https_enforcement" ]; then
    log_pass "HTTPS configuration found"
else
    log_high "Ensure HTTPS is enforced in production"
fi

# Check for CORS configuration
cors_config=$(grep -r "cors\|origin" backend 2>/dev/null || echo "")
if [ -n "$cors_config" ]; then
    log_pass "CORS configuration found"
else
    log_medium "Configure CORS properly for production"
fi

# Check for security headers
security_headers=$(grep -r "helmet\|x-frame-options\|content-security-policy" frontend/src backend config 2>/dev/null || echo "")
if [ -n "$security_headers" ]; then
    log_pass "Security headers configuration found"
else
    log_high "Implement security headers (CSP, X-Frame-Options, etc.)"
fi

# 6. Database Security
echo ""
echo "🗄️  Database Security"
echo "====================="

# Check for Row Level Security
rls_config=$(grep -r "row.*level.*security\|rls\|policy" supabase 2>/dev/null || echo "")
if [ -n "$rls_config" ]; then
    log_pass "Row Level Security configuration found"
else
    log_critical "Implement Row Level Security (RLS) policies"
fi

# Check for database migrations
migrations=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l || echo "0")
if [ "$migrations" -gt 0 ]; then
    log_pass "Database migrations found ($migrations files)"
else
    log_medium "Ensure database schema is properly versioned"
fi

# 7. API Security
echo ""
echo "🔌 API Security"
echo "==============="

# Check for authentication on all endpoints
unauth_endpoints=$(find frontend/src/app/api -name "route.ts" | xargs grep -L "auth\|session\|token" 2>/dev/null || echo "")
if [ -n "$unauth_endpoints" ]; then
    log_high "Endpoints without authentication found: $unauth_endpoints"
else
    log_pass "All API endpoints have authentication"
fi

# Check for input validation
input_validation=$(grep -r "validate\|schema\|zod" frontend/src/app/api backend 2>/dev/null || echo "")
if [ -n "$input_validation" ]; then
    log_pass "Input validation found"
else
    log_high "Implement input validation for all API endpoints"
fi

# Check for error handling
error_handling=$(grep -r "try.*catch\|error.*handling" frontend/src/app/api backend 2>/dev/null || echo "")
if [ -n "$error_handling" ]; then
    log_pass "Error handling found"
else
    log_medium "Implement proper error handling"
fi

# 8. File Upload Security
echo ""
echo "📁 File Upload Security"
echo "======================="

# Check for file upload endpoints
file_uploads=$(find frontend/src/app/api -name "route.ts" | xargs grep -l "upload\|file\|multipart" 2>/dev/null || echo "")
if [ -n "$file_uploads" ]; then
    log_medium "File upload endpoints found - ensure proper validation: $file_uploads"
    
    # Check for file type validation
    file_validation=$(echo "$file_uploads" | xargs grep -l "mimetype\|extension\|file.*type" 2>/dev/null || echo "")
    if [ -n "$file_validation" ]; then
        log_pass "File type validation found"
    else
        log_high "Implement file type validation for uploads"
    fi
else
    log_pass "No file upload endpoints found"
fi

# 9. Third-party Dependencies
echo ""
echo "📦 Third-party Dependencies"
echo "==========================="

# Check for known vulnerabilities (if npm audit is available)
if command -v npm &> /dev/null; then
    cd frontend
    audit_result=$(npm audit --audit-level=high 2>/dev/null || echo "audit_failed")
    if [ "$audit_result" = "audit_failed" ] || echo "$audit_result" | grep -q "vulnerabilities"; then
        log_high "npm audit found vulnerabilities - run 'npm audit' for details"
    else
        log_pass "No high-severity npm vulnerabilities found"
    fi
    cd ..
fi

# Check for outdated dependencies
package_json_age=$(find . -name "package.json" -mtime +90 2>/dev/null || echo "")
if [ -n "$package_json_age" ]; then
    log_medium "Package.json files older than 90 days - consider updating dependencies"
fi

# 10. Monitoring & Logging
echo ""
echo "📊 Monitoring & Logging"
echo "======================="

# Check for error monitoring
error_monitoring=$(grep -r "sentry\|bugsnag\|rollbar" frontend/src backend config 2>/dev/null || echo "")
if [ -n "$error_monitoring" ]; then
    log_pass "Error monitoring found"
else
    log_medium "Implement error monitoring (Sentry, etc.)"
fi

# Check for audit logging
audit_logging=$(grep -r "audit.*log\|activity.*log" backend 2>/dev/null || echo "")
if [ -n "$audit_logging" ]; then
    log_pass "Audit logging found"
else
    log_medium "Implement audit logging for sensitive operations"
fi

# Security Score Calculation
echo ""
echo "📊 Security Audit Summary"
echo "========================="
echo "Critical Issues: $CRITICAL_ISSUES"
echo "High Issues: $HIGH_ISSUES"
echo "Medium Issues: $MEDIUM_ISSUES"
echo "Low Issues: $LOW_ISSUES"
echo ""

total_issues=$((CRITICAL_ISSUES + HIGH_ISSUES + MEDIUM_ISSUES + LOW_ISSUES))

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL SECURITY ISSUES FOUND${NC}"
    echo "❌ DO NOT DEPLOY TO PRODUCTION"
    echo ""
    echo "Required actions:"
    echo "- Fix all critical security issues"
    echo "- Review and fix high-priority issues"
    echo "- Re-run security audit"
elif [ $HIGH_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  HIGH PRIORITY SECURITY ISSUES FOUND${NC}"
    echo "🔶 REVIEW BEFORE PRODUCTION DEPLOYMENT"
    echo ""
    echo "Recommended actions:"
    echo "- Fix high-priority security issues"
    echo "- Review medium-priority issues"
    echo "- Consider security testing"
elif [ $MEDIUM_ISSUES -gt 0 ]; then
    echo -e "${BLUE}📋 MEDIUM PRIORITY SECURITY ISSUES FOUND${NC}"
    echo "✅ ACCEPTABLE FOR PRODUCTION WITH MONITORING"
    echo ""
    echo "Post-deployment actions:"
    echo "- Address medium-priority issues"
    echo "- Set up monitoring and alerting"
    echo "- Schedule regular security reviews"
else
    echo -e "${GREEN}🎉 EXCELLENT SECURITY POSTURE${NC}"
    echo "✅ READY FOR PRODUCTION DEPLOYMENT"
    echo ""
    echo "Maintenance recommendations:"
    echo "- Regular security audits"
    echo "- Dependency updates"
    echo "- Security monitoring"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Address critical and high-priority issues"
echo "2. Set up production monitoring"
echo "3. Configure security headers"
echo "4. Enable database backups"
echo "5. Set up SSL certificates"
echo "6. Configure WAF (Web Application Firewall)"
echo "7. Implement security incident response plan"
echo ""

# Exit with appropriate code
if [ $CRITICAL_ISSUES -gt 0 ]; then
    exit 2  # Critical issues
elif [ $HIGH_ISSUES -gt 0 ]; then
    exit 1  # High issues
else
    exit 0  # Safe for production
fi 