import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authorization = request.headers.get('Authorization');
    const canvasUrl = request.headers.get('Canvas-URL');

    if (!authorization || !canvasUrl) {
        return NextResponse.json({ error: 'Missing Authorization or Canvas-URL header' }, { status: 401 });
    }

    try {
        const res = await fetch(
            `${canvasUrl}/api/v1/users/self/favorites/courses`,
            {
                headers: {
                    Authorization: authorization,
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch courses' }, { status: res.status });
        }

        const data = await res.json();
        const courses = data.map((course: any) => ({
            id: course.id,
            name: course.name
        }));
        
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}
