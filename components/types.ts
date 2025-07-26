export type Course = {
    id: number;
    name: string;
};

export type Assignment = {
    id: number;
    name: string;
    due_at: string | null;
    html_url: string;
    assignment_group_id: number;
    has_submitted_submissions: boolean;
    submission?: {
        workflow_state: string;
        score: number | null;
    };
};

export type Announcement = {
    id: number;
    title: string;
    posted_at: string;
    url: string;
    context_code: string;
};

export type CourseWithAssignments = Course & {
    assignments: Assignment[];
};

export type CourseWithAnnouncements = Course & {
    announcements: Announcement[];
}; 