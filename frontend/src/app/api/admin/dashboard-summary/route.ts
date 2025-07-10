import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // OPTIMIZATION: Fetch all admin dashboard data in a single request
    // This reduces the "API waterfall" effect that slows down admin panel loading
    
    const [
      organizationsResult,
      applicationsResult,
      topupRequestsResult,
      assetsResult
    ] = await Promise.all([
      // Organizations summary
      supabaseAdmin
        .from('organizations')
        .select('organization_id, name, plan_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Recent applications
      supabaseAdmin
        .from('application')
        .select('application_id, organization_id, status, request_type, created_at')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Recent topup requests
      supabaseAdmin
        .from('topup_requests')
        .select('request_id, organization_id, status, amount_cents, created_at')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Asset summary
      supabaseAdmin
        .from('asset')
        .select('asset_id, type, status')
        .eq('status', 'active')
    ]);

    // Calculate summary statistics
    const organizations = organizationsResult.data || [];
    const applications = applicationsResult.data || [];
    const topupRequests = topupRequestsResult.data || [];
    const assets = assetsResult.data || [];

    // Plan distribution
    const planDistribution = organizations.reduce((acc, org) => {
      const plan = org.plan_id || 'starter';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Asset counts
    const assetCounts = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity summary
    const recentActivity = [
      ...applications.map(app => ({
        type: 'application',
        id: app.application_id,
        message: `New ${app.request_type} application`,
        timestamp: app.created_at,
        status: app.status
      })),
      ...topupRequests.map(req => ({
        type: 'topup',
        id: req.request_id,
        message: `Topup request $${(req.amount_cents / 100).toFixed(2)}`,
        timestamp: req.created_at,
        status: req.status
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    const summary = {
      // Core metrics
      totalOrganizations: organizations.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      processingApplications: applications.filter(app => app.status === 'processing').length,
      pendingTopups: topupRequests.filter(req => req.status === 'pending').length,
      processingTopups: topupRequests.filter(req => req.status === 'processing').length,
      
      // Plan distribution
      planDistribution,
      
      // Asset counts
      assetCounts: {
        profiles: assetCounts.profile || 0,
        business_managers: assetCounts.business_manager || 0,
        ad_accounts: assetCounts.ad_account || 0
      },
      
      // Recent activity
      recentActivity,
      
      // Quick stats for dashboard cards
      quickStats: {
        totalApplications: applications.length,
        totalTopupRequests: topupRequests.length,
        totalTopupValue: topupRequests.reduce((sum, req) => sum + req.amount_cents, 0) / 100,
        activeOrganizations: organizations.filter(org => org.status === 'active').length
      }
    };

    const response = NextResponse.json(summary);
    
    // PERFORMANCE: Cache for 30 seconds to reduce database load
    response.headers.set('Cache-Control', 'private, max-age=30, s-maxage=30');
    
    return response;

  } catch (error) {
    console.error('Admin dashboard summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard summary' },
      { status: 500 }
    );
  }
} 