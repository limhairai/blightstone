import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get topup requests (funding requests with topup notes)
    const { data: requests, error: requestsError } = await supabase
      .from('funding_requests')
      .select('*')
      .ilike('notes', '%Top-up request for ad account:%')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching topup requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch topup requests' }, { status: 500 });
    }

    // Transform the data to match expected format
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (request) => {
        // Get user profile info
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', request.user_id)
          .single();

        // Get organization info
        const { data: organization } = await supabase
          .from('organizations')
          .select('name')
          .eq('organization_id', request.organization_id)
          .single();

        // Parse ad account info from notes
        let adAccountName = 'Account Name Not Available';
        let adAccountId = 'Account ID Not Available';
        
        if (request.notes) {
          // Pattern 1: "Top-up request for ad account: NAME (ID)"
          let notesMatch = request.notes.match(/Top-up request for ad account: (.+?) \(([^)]+)\)/);
          if (notesMatch) {
            const parsedName = notesMatch[1].trim();
            const parsedId = notesMatch[2].trim();
            
            // Handle cases where the name or ID is literally 'undefined'
            adAccountName = (parsedName && parsedName !== 'undefined' && parsedName.toLowerCase() !== 'undefined') ? parsedName : 'Account Name Not Available';
            adAccountId = (parsedId && parsedId !== 'undefined' && parsedId.toLowerCase() !== 'undefined') ? parsedId : 'Account ID Not Available';
            
            // If we got a valid ID but invalid name, use the ID for lookup
            if (parsedId && parsedId !== 'undefined' && parsedId.length > 5) {
              adAccountId = parsedId;
            }
          } else {
            // Pattern 2: Look for any account ID in parentheses (more reliable)
            const idMatch = request.notes.match(/\(([^)]+)\)/);
            if (idMatch) {
              const parsedId = idMatch[1].trim();
              if (parsedId && parsedId !== 'undefined' && parsedId.length > 5) {
                adAccountId = parsedId;
              }
            }
            
            // Pattern 3: Look for account name after "account:" but be more specific
            const nameMatch = request.notes.match(/ad account: (.+?)(?:\s*\(|$)/i);
            if (nameMatch) {
              const parsedName = nameMatch[1].trim();
              if (parsedName && parsedName !== 'undefined') {
                adAccountName = parsedName;
              }
            }
          }
        }

        // If we couldn't get proper account info from notes, try to look it up from backend assets
        if (adAccountName === 'Account Name Not Available' || adAccountName === 'undefined' || adAccountName === 'u' || adAccountId === 'Account ID Not Available') {
          try {
            // Get user's access token for backend API call
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.access_token) {
              const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/client/${request.organization_id}?type=ad_account`;
              
              const assetsResponse = await fetch(backendUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (assetsResponse.ok) {
                const assetsData = await assetsResponse.json();
                
                // If we have a valid account ID, try to match it
                if (adAccountId && adAccountId !== 'Account ID Not Available' && adAccountId.length > 5) {
                  // Try to match by dolphin_id or ad_account_id
                  const matchingAsset = assetsData.find((asset: any) => {
                    const metadata = asset.metadata || {};
                    return asset.dolphin_id === adAccountId || 
                           metadata.ad_account_id === adAccountId ||
                           asset.id === adAccountId;
                  });
                  
                  if (matchingAsset) {
                    adAccountName = matchingAsset.name || 'Account Name Not Available';
                  }
                }
              }
            }
          } catch (lookupError) {
            console.error('Error looking up account from backend:', lookupError);
          }
        }

        // Try to get business manager info from assets
        let businessManagerName = 'BM Not Available';
        let businessManagerId = 'BM ID Not Available';
        
        // First, try to find the specific ad account asset by dolphin_id
        if (adAccountId && adAccountId !== 'Account ID Not Available') {
          const { data: specificAssets } = await supabase
            .from('asset_binding')
            .select(`
              asset!inner (
                name,
                dolphin_id,
                metadata,
                type
              )
            `)
            .eq('organization_id', request.organization_id)
            .eq('asset.dolphin_id', adAccountId)
            .eq('asset.type', 'ad_account')
            .eq('status', 'active')
            .limit(1);
          
          const specificAsset = specificAssets?.[0];
          
          if (specificAsset?.asset) {
            // If we found the asset and don't have a proper account name yet, use the asset name
            if (adAccountName === 'Account Name Not Available' && specificAsset.asset.name) {
              adAccountName = specificAsset.asset.name;
            }
            
            // Get business manager info from metadata
            const metadata = specificAsset.asset.metadata;
            if (metadata) {
              businessManagerName = metadata.business_manager_name || metadata.business_manager || 'BM Not Available';
              businessManagerId = metadata.business_manager_id || 'BM ID Not Available';
            }
          }
        }
        
        // If we couldn't find specific BM info, try to get any BM from the organization
        if (businessManagerName === 'BM Not Available') {
          const { data: bmAssets } = await supabase
            .from('asset_binding')
            .select(`
              asset!inner (
                name,
                dolphin_id,
                metadata,
                type
              )
            `)
            .eq('organization_id', request.organization_id)
            .eq('asset.type', 'business_manager')
            .eq('status', 'active')
            .limit(1);
          
          const anyBM = bmAssets?.[0];
            
          if (anyBM?.asset) {
            businessManagerName = anyBM.asset.name || 'BM Not Available';
            businessManagerId = anyBM.asset.dolphin_id || 'BM ID Not Available';
          }
        }

        return {
          id: request.request_id,
          organization_id: request.organization_id,
          requested_by: request.user_id,
          ad_account_id: adAccountId,
          ad_account_name: adAccountName,
          amount_cents: request.requested_amount_cents || 0,
          currency: 'USD',
          status: request.status,
          priority: 'normal', // Default priority since not stored in funding_requests
          notes: request.notes,
          admin_notes: request.admin_notes,
          processed_by: null, // Not tracked in funding_requests
          processed_at: null, // Not tracked in funding_requests
          created_at: request.created_at,
          updated_at: request.updated_at,
          
          // Additional fields for UI
          requested_by_user: {
            email: userProfile?.email || 'Unknown Email',
            full_name: userProfile?.name
          },
          organization: {
            name: organization?.name || 'Unknown Organization'
          },
          metadata: {
            business_manager_name: businessManagerName,
            business_manager_id: businessManagerId
          }
        };
      })
    );

    return NextResponse.json(enrichedRequests);

  } catch (error) {
    console.error('Error in topup-requests API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, approved_amount, admin_notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const requestId = url.pathname.split('/').pop();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Update the funding request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('funding_requests')
      .update({
        status,
        approved_amount_cents: status === 'approved' && approved_amount ? approved_amount * 100 : null,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating topup request:', updateError);
      return NextResponse.json({ error: 'Failed to update topup request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Topup request updated successfully',
      request: updatedRequest 
    });

  } catch (error) {
    console.error('Error in topup-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { organization_id, ad_account_id, ad_account_name, amount_cents, priority, notes } = body;

    if (!organization_id || !ad_account_id || !ad_account_name || !amount_cents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create funding request with topup-specific notes format
    const topupNotes = `Top-up request for ad account: ${ad_account_name} (${ad_account_id})\nAmount: $${amount_cents / 100}\n${notes ? `Notes: ${notes}` : ''}`;

    const { data: fundingRequest, error: insertError } = await supabase
      .from('funding_requests')
      .insert({
        organization_id,
        user_id: user.id,
        requested_amount_cents: amount_cents,
        notes: topupNotes,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating topup request:', insertError);
      
      // Check if the error is due to insufficient balance
      if (insertError.message?.includes('Insufficient available balance')) {
        return NextResponse.json({ 
          error: 'Insufficient available balance for this topup request. Please check your wallet balance and any pending requests.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Failed to create topup request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Top-up request created successfully',
      request_id: fundingRequest.request_id 
    });

  } catch (error) {
    console.error('Error in topup-requests POST API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 