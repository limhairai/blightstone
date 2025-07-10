# 📋 Schema Changes Since July 8, 2025

## 🚨 IMPORTANT: Schema Documentation Update Required

Your `current_schema.sql` file is **2+ days behind** the actual database schema.

### **Missing Changes (4 migrations):**

## 1. **Application Status Enhancement** (July 9)
**File:** `20250120000023_add_cancelled_status_to_applications.sql`
**Changes:**
- Added `cancelled` status to application status constraint
- Applications can now be cancelled by users
- Status options: `pending`, `approved`, `processing`, `rejected`, `fulfilled`, `cancelled`

## 2. **Monthly Topup Limits** (July 9)  
**File:** `20250120000024_add_topup_limits.sql`
**Changes:**
- Added `monthly_topup_limit_cents` column to `plans` table
- **Starter Plan:** $3,000/month limit (300,000 cents)
- **Growth Plan:** $6,000/month limit (600,000 cents)  
- **Scale/Enterprise:** Unlimited (NULL)
- Added function: `get_monthly_topup_usage(org_id UUID)`
- Added function: `can_make_topup_request(org_id UUID, amount_cents INTEGER)`

## 3. **Performance Indexes** (July 10)
**File:** `20250120000025_add_performance_indexes.sql`
**Changes:**
- Added 8 performance indexes for `transactions` table
- Added 4 performance indexes for `topup_requests` table
- Added profile lookup index
- Significantly improved query performance

## 4. **Admin Performance Indexes** (July 10)
**File:** `20250120000026_comprehensive_admin_performance_indexes.sql`
**Changes:**
- Additional admin panel performance optimizations
- Enhanced query performance for admin operations

## 🎯 **RECOMMENDATION:**

### **Option A: Live with Migration-Based Documentation**
- Keep using migration files as source of truth
- Remove outdated `current_schema.sql` file
- Document that schema = sum of all migrations

### **Option B: Regenerate Schema Documentation**
- Fix the pg_dump version mismatch
- Generate fresh schema dump
- Update documentation regularly

### **Option C: Hybrid Approach (Recommended)**
- Keep migration files as source of truth
- Create summary documentation of current state
- Add automated schema validation

## 🏆 **CURRENT SCHEMA SUMMARY:**

**Tables:** 15+ core tables with semantic IDs
**Functions:** 8+ database functions
**Triggers:** 10+ automated triggers  
**Indexes:** 30+ performance indexes
**Policies:** RLS policies for all tables
**Status:** Production-ready with recent optimizations

## ✅ **NEXT STEPS:**
1. Decide on documentation strategy
2. Consider removing outdated `current_schema.sql`
3. Add schema validation to CI/CD pipeline 