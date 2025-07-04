import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`🔧 Fixing organization membership for user: ${user.id}`);

    // 1. Get user's profile to see what organization they should belong to
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found',
        details: profileError?.message 
      }, { status: 404 });
    }

    // 2. Check current organization memberships
    const { data: currentMemberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);

    if (membershipError) {
      return NextResponse.json({ 
        error: 'Failed to check current memberships',
        details: membershipError.message 
      }, { status: 500 });
    }

    // 3. Check what organizations the user owns
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id);

    if (ownedError) {
      return NextResponse.json({ 
        error: 'Failed to check owned organizations',
        details: ownedError.message 
      }, { status: 500 });
    }

    const results = {
      user_id: user.id,
      profile_org_id: profile.organization_id,
      current_memberships: currentMemberships.length,
      owned_organizations: ownedOrgs.length,
      fixed_memberships: 0,
      errors: [] as string[]
    };

    // 4. Find organizations the user owns but isn't a member of
    const membershipOrgIds = new Set(currentMemberships.map(m => m.organization_id));
    const missingMemberships = ownedOrgs.filter(org => 
      !membershipOrgIds.has(org.organization_id)
    );

    console.log(`📊 User owns ${ownedOrgs.length} orgs but is member of ${currentMemberships.length}`);
    console.log(`🔧 Found ${missingMemberships.length} missing memberships to fix`);

    // 5. Add missing memberships
    for (const org of missingMemberships) {
      try {
        console.log(`📝 Adding membership for org: ${org.name} (${org.organization_id})`);
        
        const { error: insertError } = await supabase
          .from('organization_members')
          .insert({
            user_id: user.id,
            organization_id: org.organization_id,
            role: 'owner'
          });

        if (insertError) {
          console.error(`❌ Error adding membership for ${org.name}:`, insertError);
          results.errors.push(`Failed to add membership for ${org.name}: ${insertError.message}`);
        } else {
          console.log(`✅ Added membership for ${org.name}`);
          results.fixed_memberships++;
        }
      } catch (err) {
        const errorMsg = `Exception adding membership for ${org.name}: ${err}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    // 6. If no organizations to fix but profile has org_id, check if that org exists
    if (missingMemberships.length === 0 && profile.organization_id && currentMemberships.length === 0) {
      console.log('🔍 Profile has organization_id but user has no memberships, checking org...');
      
      const { data: profileOrg, error: profileOrgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();

      if (profileOrgError || !profileOrg) {
        results.errors.push(`Profile organization ${profile.organization_id} does not exist`);
      } else if (profileOrg.owner_id === user.id) {
        // User owns the organization but isn't a member - add them
        try {
          const { error: insertError } = await supabase
            .from('organization_members')
            .insert({
              user_id: user.id,
              organization_id: profile.organization_id,
              role: 'owner'
            });

          if (insertError) {
            results.errors.push(`Failed to add membership for profile org: ${insertError.message}`);
          } else {
            console.log(`✅ Added membership for profile organization: ${profileOrg.name}`);
            results.fixed_memberships++;
          }
        } catch (err) {
          results.errors.push(`Exception adding membership for profile org: ${err}`);
        }
      } else {
        results.errors.push(`Profile organization ${profile.organization_id} is owned by different user`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.fixed_memberships} organization memberships`,
      details: results
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('🔧 Error fixing organization membership:', msg);
    return NextResponse.json({ 
      error: 'Failed to fix organization membership', 
      details: msg 
    }, { status: 500 });
  }
} 