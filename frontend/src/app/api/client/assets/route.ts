import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config/api';

async function getAuthToken(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const businessId = searchParams.get('business_id');
    const assetType = searchParams.get('asset_type');
    const includeSpendData = searchParams.get('include_spend_data') !== 'false';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Build URL with query parameters
    let url = buildApiUrl(`/api/dolphin-assets/client/${organizationId}`);
    const params = new URLSearchParams();
    
    if (businessId) {
      params.append('business_id', businessId);
    }
    if (assetType) {
      params.append('asset_type', assetType);
    }
    if (includeSpendData) {
      params.append('include_spend_data', 'true');
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching client assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
