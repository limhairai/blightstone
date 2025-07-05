import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '../../../../lib/api-utils';

async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    
    // Check if backend is accessible
    const backendHealthResponse = await fetch(buildApiUrl('/health'));
    
    if (!backendHealthResponse.ok) {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Backend is not responding',
        timestamp: new Date().toISOString(),
        api_configured: false,
        base_url: buildApiUrl(''),
        backend_status: 'disconnected',
        auth_status: token ? 'token_present' : 'no_token'
      }, { status: 500 });
    }

    // If we have a token, test authentication with the backend
    if (token) {
      try {
        const authTestResponse = await fetch(buildApiUrl('/api/dolphin-assets/unassigned?limit=1'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (authTestResponse.ok) {
          return NextResponse.json({
            status: 'healthy',
            message: 'Backend connected and authenticated successfully',
            timestamp: new Date().toISOString(),
            api_configured: true,
            base_url: buildApiUrl(''),
            backend_status: 'connected',
            auth_status: 'authenticated'
          });
        } else {
          return NextResponse.json({
            status: 'unhealthy',
            message: 'Backend connected but authentication failed',
            timestamp: new Date().toISOString(),
            api_configured: false,
            base_url: buildApiUrl(''),
            backend_status: 'connected',
            auth_status: 'auth_failed'
          }, { status: 401 });
        }
      } catch (authError) {
        return NextResponse.json({
          status: 'unhealthy',
          message: 'Backend connected but authentication test failed',
          timestamp: new Date().toISOString(),
          api_configured: false,
          base_url: buildApiUrl(''),
          backend_status: 'connected',
          auth_status: 'auth_error'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        status: 'partial',
        message: 'Backend connected but no authentication token provided',
        timestamp: new Date().toISOString(),
        api_configured: false,
        base_url: buildApiUrl(''),
        backend_status: 'connected',
        auth_status: 'no_token'
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Cannot connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      api_configured: false,
      base_url: buildApiUrl(''),
      backend_status: 'disconnected',
      auth_status: 'unknown'
    }, { status: 500 });
  }
} 