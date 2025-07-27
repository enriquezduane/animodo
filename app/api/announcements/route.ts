import { NextResponse } from 'next/server';
import { validateCanvasUrl, validateCourseIds, validateDateString } from '../../../components/security';

export async function GET(request: Request) {
    const authorization = request.headers.get('Authorization');
    const canvasUrl = request.headers.get('Canvas-URL');
    const { searchParams } = new URL(request.url);
    const courseIds = searchParams.getAll('courseIds');
    
    // Get start and end date parameters, with default values to fetch all announcements
    const startDate = searchParams.get('start_date') || '1990-01-01';
    const endDate = searchParams.get('end_date') || '2099-12-31';

    if (!authorization || !canvasUrl) {
        return NextResponse.json({ error: 'Missing Authorization or Canvas-URL header' }, { status: 401 });
    }

    // Validate Canvas URL to prevent SSRF attacks
    if (!validateCanvasUrl(canvasUrl)) {
        return NextResponse.json({ error: 'Invalid Canvas URL' }, { status: 400 });
    }

    // Validate courseIds to prevent injection attacks
    if (courseIds.length > 0 && !validateCourseIds(courseIds)) {
        return NextResponse.json({ error: 'Invalid courseIds parameter' }, { status: 400 });
    }

    // Validate date parameters
    if (!validateDateString(startDate)) {
        return NextResponse.json({ error: 'Invalid start_date parameter. Use YYYY-MM-DD format.' }, { status: 400 });
    }

    if (!validateDateString(endDate)) {
        return NextResponse.json({ error: 'Invalid end_date parameter. Use YYYY-MM-DD format.' }, { status: 400 });
    }

    try {
        const contextCodes = courseIds.map((id) => `course_${id}`);
        const params = new URLSearchParams();
        contextCodes.forEach((code) => params.append('context_codes[]', code));
        
        // Add start and end date parameters
        params.append('start_date', startDate);
        params.append('end_date', endDate);

        const res = await fetch(
            `${canvasUrl}/api/v1/announcements?${params.toString()}&per_page=100`,
            {
                headers: {
                    Authorization: authorization,
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: res.status });
        }

        const data = await res.json();
        const announcements = data.map((announcement: any) => ({
            id: announcement.id,
            title: announcement.title,
            posted_at: announcement.posted_at,
            url: announcement.url,
            context_code: announcement.context_code
        }));
        
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}
