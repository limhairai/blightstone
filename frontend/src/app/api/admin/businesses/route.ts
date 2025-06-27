import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
        const { data, error } = await supabase
            .from('businesses')
            .select(`
                id,
                name,
                organizations ( name )
            `)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching businesses:', error);
            return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
        }

        // Transform the data to include organization_name directly
        const transformedData = data.map(business => {
            // The result from Supabase gives organizations as an object if it's a to-one relationship,
            // or an array if it's to-many. Since it's to-one, it should be an object.
            const org = Array.isArray(business.organizations) ? business.organizations[0] : business.organizations;
            return {
                id: business.id,
                name: business.name,
                organization_name: org?.name || 'Unknown Organization'
            };
        });

        return NextResponse.json({ businesses: transformedData });

    } catch (error) {
        console.error('Server error fetching businesses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 