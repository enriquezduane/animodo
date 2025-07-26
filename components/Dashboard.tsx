'use client';

import { useEffect, useState } from 'react';

type Course = {
    id: number;
    name: string;
};

type Assignment = {
    id: number;
    name: string;
    due_at: string | null;
    html_url: string;
    points_possible: number;
    assignment_group_id: number;
    submission?: {
        workflow_state: string;
        score: number | null;
    };
};

type Announcement = {
    id: number;
    title: string;
    posted_at: string;
    url: string;
    context_code: string;
};

export default function DashboardClient() {
    const [userName, setUserName] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [assignments, setAssignments] = useState<Record<number, Assignment[]>>({});
    const [announcements, setAnnouncements] = useState<Record<number, Announcement[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Fetch user name
            const userRes = await fetch('/api/user');
            const userData = await userRes.json();
            setUserName(userData.name);

            // Fetch courses
            const coursesRes = await fetch('/api/courses');
            const coursesData: Course[] = await coursesRes.json();
            setCourses(coursesData);

            // Fetch assignments and announcements
            const courseIds = coursesData.map(c => c.id);
            const assignmentsMap: Record<number, Assignment[]> = {};
            const announcementsMap: Record<number, Announcement[]> = {};

            // Fetch assignments for each course
            const assignmentPromises = coursesData.map(async (course) => {
                const assignRes = await fetch(`/api/assignments?courseId=${course.id}`);
                const assignData: Assignment[] = await assignRes.json();
                assignmentsMap[course.id] = assignData;
            });

            await Promise.all(assignmentPromises);

            // Fetch all announcements
            const annParams = courseIds.map(id => `courseIds=${id}`).join('&');
            const annRes = await fetch(`/api/announcements?${annParams}`);
            const annData: Announcement[] = await annRes.json();

            // Group announcements by course using context_code
            for (const ann of annData) {
                const courseId = parseInt(ann.context_code.replace('course_', ''));
                if (!announcementsMap[courseId]) announcementsMap[courseId] = [];
                announcementsMap[courseId].push(ann);
            }

            setAssignments(assignmentsMap);
            setAnnouncements(announcementsMap);
            setLoading(false);
        }

        fetchData();
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No due date';
        return new Date(dateString).toLocaleDateString();
    };

    const getTimeRemaining = (dueDateString: string | null) => {
        if (!dueDateString) return '';
        
        const now = new Date();
        const dueDate = new Date(dueDateString);
        const timeDiff = dueDate.getTime() - now.getTime();
        
        if (timeDiff < 0) {
            const pastDiff = Math.abs(timeDiff);
            const pastDays = Math.floor(pastDiff / (1000 * 60 * 60 * 24));
            const pastHours = Math.floor((pastDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const pastMinutes = Math.floor((pastDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (pastDays > 0) return `(${pastDays} days overdue)`;
            if (pastHours > 0) return `(${pastHours} hours overdue)`;
            return `(${pastMinutes} minutes overdue)`;
        }
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `(${days} days left)`;
        if (hours > 0) return `(${hours} hours left)`;
        return `(${minutes} minutes left)`;
    };

    const getTimeAgo = (postedDateString: string) => {
        const now = new Date();
        const postedDate = new Date(postedDateString);
        const timeDiff = now.getTime() - postedDate.getTime();
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `(${days} days ago)`;
        if (hours > 0) return `(${hours} hours ago)`;
        return `(${minutes} minutes ago)`;
    };

    const getSubmissionStatus = (assignment: Assignment) => {
        if (!assignment.submission) return 'No submission';
        
        const { workflow_state, score } = assignment.submission;
        let status = workflow_state.charAt(0).toUpperCase() + workflow_state.slice(1);
        
        if (score !== null && workflow_state === 'graded') {
            status += ` (${score}/${assignment.points_possible})`;
        }
        
        return status;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Welcome, {userName}</h1>

            {courses.map(course => (
                <div key={course.id}>
                    <h2>{course.name}</h2>

                    <div>
                        <h3>Assignments</h3>
                        {assignments[course.id]?.length ? (
                            <ul>
                                {assignments[course.id].map(assign => (
                                    <li key={assign.id}>
                                        <a href={assign.html_url} target="_blank" rel="noreferrer">
                                            {assign.name}
                                        </a>
                                        <div>
                                            Due: {formatDate(assign.due_at)} {getTimeRemaining(assign.due_at)} | 
                                            Status: {getSubmissionStatus(assign)} | 
                                            Points: {assign.points_possible}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No assignments found</p>
                        )}
                    </div>

                    <div>
                        <h3>Announcements</h3>
                        {announcements[course.id]?.length ? (
                            <ul>
                                {announcements[course.id].map(ann => (
                                    <li key={ann.id}>
                                        <a href={ann.url} target="_blank" rel="noreferrer">
                                            {ann.title}
                                        </a>
                                        <div>
                                            Posted: {new Date(ann.posted_at).toLocaleDateString()} {getTimeAgo(ann.posted_at)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No announcements found</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
