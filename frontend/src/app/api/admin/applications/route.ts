import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all applications
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const debug = url.searchParams.get('debug')
    
    // Debug mode - just return all businesses with their statuses
    if (debug === 'true') {
      const { data: allBusinesses, error: debugError } = await supabase
        .from('businesses')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });
      
      if (debugError) {
        return NextResponse.json({ error: 'Debug query failed', details: debugError }, { status: 500 });
      }
      
      return NextResponse.json({ 
        debug: true, 
        total_businesses: allBusinesses?.length || 0,
        businesses: allBusinesses 
      });
    }

    const status = url.searchParams.get('status')

    // 0. Fetch all users from Supabase Auth to map emails (make this optional)
    let userMap = new Map();
    try {
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        console.warn('Warning: Could not fetch users for email mapping:', usersError);
      } else {
        userMap = new Map(users.map(user => [user.id, user.email]));
      }
    } catch (userError) {
      console.warn('Warning: User fetching failed, continuing without email mapping:', userError);
    }

    // 1. Fetch Ad Account Applications
    let adAccountApps = [];
    try {
      const { data, error } = await supabase
        .from('ad_account_applications')
        .select('*, organizations(name, teams(name)), businesses(name)');

      if (error) {
        console.error('Supabase error fetching ad account apps:', error);
        throw error;
      }

      adAccountApps = data.map(app => ({
        id: app.id,
        type: 'Ad Account',
        organization_name: app.organizations?.name || 'Unknown Org',
        business_name: app.businesses?.name || 'Unknown Business',
        business_id: app.business_id,
        account_count: 1, // Each ad account application is for one account
        status: app.status,
        team_name: app.organizations?.teams?.name || 'Unassigned',
        submitted_at: app.submitted_at,
        user_email: (app.user_id ? userMap.get(app.user_id) : 'N/A') || 'N/A',
      }));
    } catch (adAccountError) {
      console.error('Error fetching ad account applications:', adAccountError);
      // Continue with empty ad account apps
    }

    // 2. Fetch business applications (businesses with application statuses)
    const { data: businessAppsData, error: businessAppsError } = await supabase
        .from('businesses')
        .select('*, organizations(name, teams(name))')
        .in('status', ['pending', 'In Review', 'Processing', 'Ready', 'Active', 'Rejected']);

    if (businessAppsError) {
        console.error('Supabase error fetching business apps:', businessAppsError);
        throw businessAppsError;
    }

    console.log('Found businesses:', businessAppsData?.length || 0);
    businessAppsData?.forEach(business => {
      console.log(`Business: ${business.name}, Status: ${business.status}`);
    });

    const businessApps = businessAppsData.map(app => {
        // Normalize status for display
        let displayStatus = app.status;
        if (app.status === 'pending') {
            displayStatus = 'In Review'; // Show pending as "In Review" in the UI
        }
        
        return {
            id: `biz-app-${app.id}`,
            type: 'Business',
            organization_name: app.organizations?.name || 'Unknown Org',
            business_name: app.name,
            business_id: app.id,
            facebook_business_manager_id: app.facebook_business_manager_id,
            facebook_business_manager_name: app.facebook_business_manager_name,
            account_count: 1, // New businesses start with one application
            status: displayStatus,
            team_name: app.organizations?.teams?.name || 'Unassigned',
            submitted_at: app.created_at,
            user_email: 'N/A', // Business apps are not directly tied to a user
        };
    });

    // 3. Combine and sort
    const allApplications = [...adAccountApps, ...businessApps];
    allApplications.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    
    console.log('Total applications found:', allApplications.length);
    return NextResponse.json(allApplications);
  } catch (error) {
    console.error('Error in GET /api/admin/applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// PUT - Update application status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { application_id, action, rejection_reason } = body
    
    const isBusinessApplication = application_id.startsWith('biz-app-');

    if (isBusinessApplication) {
      const business_id = application_id.replace('biz-app-', '');
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.status = 'Processing';
      } else if (action === 'ready') {
        updateData.status = 'Ready';
      } else if (action === 'reject') {
        updateData.status = 'Rejected';
        updateData.rejected_at = new Date().toISOString();
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason;
        }
      } else {
        return NextResponse.json({ error: `Unsupported action for business: ${action}` }, { status: 400 });
      }
      
      const { data: business, error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', business_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating business application:', error);
        return NextResponse.json({ error: 'Failed to update business application' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        application_id,
        new_status: business.status,
        message: `Business application updated successfully`
      });

    } else {
      // This is an ad account application
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.status = 'Processing';
      } else if (action === 'ready') {
        updateData.status = 'Ready';
      } else if (action === 'reject') {
        updateData.status = 'Rejected';
        updateData.rejected_at = new Date().toISOString();
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason;
        }
      } else {
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
      }
      
      const { data: application, error } = await supabase
        .from('ad_account_applications')
        .update(updateData)
        .eq('id', application_id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
      }

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        application_id,
        new_status: application.status,
        message: `Application updated successfully`
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/admin/applications:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// POST - Create new application (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, organization_id } = body;
    
    if (!business_name || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ad_account_applications')
      .insert({
        business_id: null, // New business
        organization_id,
        user_id: null, // Admin created
        account_name: business_name,
        status: 'In Review',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    console.error('Error in POST /api/admin/applications:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
