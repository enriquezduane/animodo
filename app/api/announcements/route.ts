import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const courseIds = searchParams.getAll('courseIds');

    const contextCodes = courseIds.map((id) => `course_${id}`);
    const params = new URLSearchParams();
    contextCodes.forEach((code) => params.append('context_codes[]', code));

    const res = await fetch(
        `${process.env.CANVAS_URL}/api/v1/announcements?${params.toString()}&per_page=100`,
        {
            headers: {
                Authorization: `Bearer ${process.env.CANVAS_ACCESS_TOKEN}`,
            },
        }
    );

    const data = await res.json();
    const announcements = data.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        posted_at: announcement.posted_at,
        url: announcement.url,
        context_code: announcement.context_code
    }));
    
    return NextResponse.json(announcements);
}
