import { NextResponse } from 'next/server';

export async function GET() {
    const res = await fetch(
        `${process.env.CANVAS_URL}/api/v1/users/self/favorites/courses`,
        {
            headers: {
                Authorization: `Bearer ${process.env.CANVAS_ACCESS_TOKEN}`,
            },
        }
    );

    const data = await res.json();
    const courses = data.map((course: any) => ({
        id: course.id,
        name: course.name
    }));
    
    return NextResponse.json(courses);
}
