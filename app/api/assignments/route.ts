import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const authorization = request.headers.get('Authorization');
    const canvasUrl = request.headers.get('Canvas-URL');
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!authorization || !canvasUrl) {
        return NextResponse.json({ error: 'Missing Authorization or Canvas-URL header' }, { status: 401 });
    }

    if (!courseId) {
        return NextResponse.json({ error: 'Missing courseId parameter' }, { status: 400 });
    }

    try {
        const res = await fetch(
            `${canvasUrl}/api/v1/courses/${courseId}/assignments?include[]=submission&per_page=100`,
            {
                headers: {
                    Authorization: authorization,
                },
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: res.status });
        }

        const data = await res.json();
        const assignments = data.map((assignment: any) => ({
            id: assignment.id,
            name: assignment.name,
            due_at: assignment.due_at,
            html_url: assignment.html_url,
            points_possible: assignment.points_possible,
            assignment_group_id: assignment.assignment_group_id,
            submission: assignment.submission ? {
                workflow_state: assignment.submission.workflow_state,
                score: assignment.submission.score
            } : undefined
        }));
        
        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}
