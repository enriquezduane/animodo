import { NextResponse } from 'next/server';
import { validateCanvasUrl } from '../../../components/security';

export async function GET(request: Request) {
    const authorization = request.headers.get('Authorization');
    const canvasUrl = request.headers.get('Canvas-URL');

    if (!authorization || !canvasUrl) {
        return NextResponse.json({ error: 'Missing Authorization or Canvas-URL header' }, { status: 401 });
    }

    // Validate Canvas URL to prevent SSRF attacks
    if (!validateCanvasUrl(canvasUrl)) {
        return NextResponse.json({ error: 'Invalid Canvas URL' }, { status: 400 });
    }

    try {
        const res = await fetch(`${canvasUrl}/api/v1/users/self`, {
            headers: {
                Authorization: authorization,
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const data = await res.json();
        return NextResponse.json({ name: data.name });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}
