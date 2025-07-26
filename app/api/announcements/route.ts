import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authorization = request.headers.get('Authorization');
    const canvasUrl = request.headers.get('Canvas-URL');
    const { searchParams } = new URL(request.url);
    const courseIds = searchParams.getAll('courseIds');

    if (!authorization || !canvasUrl) {
        return NextResponse.json({ error: 'Missing Authorization or Canvas-URL header' }, { status: 401 });
    }

    try {
        const contextCodes = courseIds.map((id) => `course_${id}`);
        const params = new URLSearchParams();
        contextCodes.forEach((code) => params.append('context_codes[]', code));

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
