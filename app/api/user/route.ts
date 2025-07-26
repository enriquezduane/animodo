import { NextResponse } from 'next/server';

export async function GET() {
    const res = await fetch(`${process.env.CANVAS_URL}/api/v1/users/self`, {
        headers: {
            Authorization: `Bearer ${process.env.CANVAS_ACCESS_TOKEN}`,
        },
    });

    const data = await res.json();
    return NextResponse.json({ name: data.name });
}
