import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const res = await fetch(
        `${process.env.CANVAS_URL}/api/v1/courses/${courseId}/assignments?include[]=submission&per_page=100`,
        {
            headers: {
                Authorization: `Bearer ${process.env.CANVAS_ACCESS_TOKEN}`,
            },
        }
    );

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
}
